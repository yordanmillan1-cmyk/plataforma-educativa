const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { leerDB, guardarDB } = require('./lib/db');
const { enviarCorreo } = require('./lib/mailer');

const PUBLIC_DIR = path.join(__dirname, 'public');
const PUERTO = process.env.PORT || 3000;

// TODO: cuando tengan el equipo legal definido, ajustar este umbral.
const EDAD_MINIMA_AUTORIZACION = 18;
const DIAS_EXPIRACION_TOKEN = 7;
const VERSION_TEXTO_AUTORIZACION = 'v1-2026-07';

const TIPOS_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verificarPassword(password, almacenado) {
  const [salt, hash] = almacenado.split(':');
  const hashIntento = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === hashIntento;
}

function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}

function tieneAccesoAdmin(url) {
  const claveEsperada = process.env.CLAVE_ADMIN || 'cambia-esta-clave';
  return url.searchParams.get('clave') === claveEsperada;
}

function enviarJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    let cuerpo = '';
    req.on('data', (chunk) => (cuerpo += chunk));
    req.on('end', () => {
      if (!cuerpo) return resolve({});
      try {
        resolve(JSON.parse(cuerpo));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function servirArchivoEstatico(res, rutaArchivo) {
  fs.readFile(rutaArchivo, (err, contenido) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('No encontrado');
      return;
    }
    const ext = path.extname(rutaArchivo);
    res.writeHead(200, { 'Content-Type': TIPOS_MIME[ext] || 'application/octet-stream' });
    res.end(contenido);
  });
}

async function manejarRegistro(req, res) {
  let cuerpo;
  try {
    cuerpo = await leerCuerpo(req);
  } catch {
    return enviarJSON(res, 400, { error: 'Cuerpo inválido.' });
  }

  const {
    nombreCompleto,
    correo,
    contrasena,
    fechaNacimiento,
    nombreRepresentante,
    correoRepresentante,
  } = cuerpo;

  if (!nombreCompleto || !correo || !contrasena || !fechaNacimiento) {
    return enviarJSON(res, 400, { error: 'Faltan campos obligatorios.' });
  }

  const db = leerDB();

  if (db.usuarios.some((u) => u.correo === correo)) {
    return enviarJSON(res, 400, { error: 'Ya existe una cuenta con ese correo.' });
  }

  const edad = calcularEdad(fechaNacimiento);
  const esMenorDeEdad = edad < EDAD_MINIMA_AUTORIZACION;

  if (esMenorDeEdad && (!nombreRepresentante || !correoRepresentante)) {
    return enviarJSON(res, 400, {
      error: 'Para menores de edad se requiere el nombre y correo del representante legal.',
      requiereAutorizacionParental: true,
    });
  }

  const usuario = {
    id: crypto.randomUUID(),
    nombreCompleto,
    correo,
    contrasenaHash: hashPassword(contrasena),
    fechaNacimiento,
    estadoCuenta: esMenorDeEdad ? 'pendiente_autorizacion_parental' : 'activa',
    creadoEn: new Date().toISOString(),
  };
  db.usuarios.push(usuario);
  guardarDB(db);

  if (esMenorDeEdad) {
    await crearYEnviarAutorizacion({ usuario, nombreRepresentante, correoRepresentante });
    return enviarJSON(res, 201, {
      estado: 'pendiente_autorizacion_parental',
      mensaje: 'Enviamos un correo a tu representante legal para confirmar la autorización.',
    });
  }

  return enviarJSON(res, 201, { estado: 'activa', mensaje: 'Cuenta creada.' });
}

async function crearYEnviarAutorizacion({ usuario, nombreRepresentante, correoRepresentante }) {
  const db = leerDB();
  const token = crypto.randomBytes(24).toString('hex');
  const expiraEn = new Date();
  expiraEn.setDate(expiraEn.getDate() + DIAS_EXPIRACION_TOKEN);

  db.autorizaciones = db.autorizaciones.filter(
    (a) => !(a.usuarioId === usuario.id && a.estado === 'enviada')
  );

  db.autorizaciones.push({
    id: crypto.randomUUID(),
    usuarioId: usuario.id,
    nombreRepresentanteLegal: nombreRepresentante,
    correoRepresentanteLegal: correoRepresentante,
    token,
    expiraEn: expiraEn.toISOString(),
    estado: 'enviada',
    versionTexto: VERSION_TEXTO_AUTORIZACION,
    confirmadaEn: null,
  });
  guardarDB(db);

  const enlace = `http://localhost:${PUERTO}/autorizacion?token=${token}`;

  await enviarCorreo({
    para: correoRepresentante,
    asunto: `Autorización requerida para la cuenta de ${usuario.nombreCompleto}`,
    html: `
      <p>Hola ${nombreRepresentante},</p>
      <p>${usuario.nombreCompleto} está creando una cuenta en la plataforma y necesitamos tu autorización.</p>
      <p><a href="${enlace}">Revisar y autorizar</a></p>
      <p>Este enlace vence en ${DIAS_EXPIRACION_TOKEN} días.</p>
    `,
  });
}

function manejarObtenerConsentimiento(res, token) {
  const db = leerDB();
  const autorizacion = db.autorizaciones.find((a) => a.token === token);

  if (!autorizacion) return enviarJSON(res, 404, { error: 'Enlace inválido.' });

  if (autorizacion.estado === 'confirmada') {
    const usuario = db.usuarios.find((u) => u.id === autorizacion.usuarioId);
    return enviarJSON(res, 200, {
      estado: 'confirmada',
      primerNombreMenor: usuario ? usuario.nombreCompleto.split(' ')[0] : '',
    });
  }
  if (autorizacion.estado === 'revocada') {
    return enviarJSON(res, 410, { error: 'Esta autorización fue revocada.' });
  }
  if (new Date(autorizacion.expiraEn) < new Date()) {
    return enviarJSON(res, 410, { error: 'Este enlace expiró. Pide que te reenvíen el correo.' });
  }

  const usuario = db.usuarios.find((u) => u.id === autorizacion.usuarioId);
  return enviarJSON(res, 200, {
    estado: 'enviada',
    primerNombreMenor: usuario.nombreCompleto.split(' ')[0],
    nombreRepresentante: autorizacion.nombreRepresentanteLegal,
    versionTexto: autorizacion.versionTexto,
  });
}

function manejarConfirmarConsentimiento(res, token) {
  const db = leerDB();
  const autorizacion = db.autorizaciones.find((a) => a.token === token);

  if (!autorizacion || autorizacion.estado !== 'enviada') {
    return enviarJSON(res, 400, { error: 'Esta solicitud ya no es válida.' });
  }
  if (new Date(autorizacion.expiraEn) < new Date()) {
    return enviarJSON(res, 410, { error: 'Este enlace expiró.' });
  }

  autorizacion.estado = 'confirmada';
  autorizacion.confirmadaEn = new Date().toISOString();

  const usuario = db.usuarios.find((u) => u.id === autorizacion.usuarioId);
  if (usuario) usuario.estadoCuenta = 'activa';

  guardarDB(db);
  return enviarJSON(res, 200, { mensaje: 'Autorización confirmada. La cuenta ya está activa.' });
}

async function manejarReenviarConsentimiento(res, token) {
  const db = leerDB();
  const autorizacionAnterior = db.autorizaciones.find((a) => a.token === token);
  if (!autorizacionAnterior) return enviarJSON(res, 404, { error: 'Solicitud no encontrada.' });

  const usuario = db.usuarios.find((u) => u.id === autorizacionAnterior.usuarioId);
  await crearYEnviarAutorizacion({
    usuario,
    nombreRepresentante: autorizacionAnterior.nombreRepresentanteLegal,
    correoRepresentante: autorizacionAnterior.correoRepresentanteLegal,
  });
  return enviarJSON(res, 200, { mensaje: 'Reenviamos el correo de autorización.' });
}

async function manejarLogin(req, res) {
  let cuerpo;
  try {
    cuerpo = await leerCuerpo(req);
  } catch {
    return enviarJSON(res, 400, { error: 'Cuerpo inválido.' });
  }

  const { correo, contrasena } = cuerpo;
  if (!correo || !contrasena) {
    return enviarJSON(res, 400, { error: 'Faltan correo o contraseña.' });
  }

  const db = leerDB();
  const usuario = db.usuarios.find((u) => u.correo === correo);

  if (!usuario || !verificarPassword(contrasena, usuario.contrasenaHash)) {
    return enviarJSON(res, 401, { error: 'Correo o contraseña incorrectos.' });
  }

  if (usuario.estadoCuenta === 'pendiente_autorizacion_parental') {
    return enviarJSON(res, 403, {
      error: 'Tu cuenta todavía espera la autorización de tu representante legal.',
    });
  }

  // Nota: esto es un login de demostración. No genera una sesión segura
  // (cookie firmada / JWT) todavía — solo confirma la identidad y devuelve
  // el perfil básico para que el panel lo muestre. Antes de tener usuarios
  // reales hay que añadir manejo de sesión de verdad.
  return enviarJSON(res, 200, {
    id: usuario.id,
    nombreCompleto: usuario.nombreCompleto,
    estadoCuenta: usuario.estadoCuenta,
  });
}

function manejarObtenerUsuario(res, id) {
  const db = leerDB();
  const usuario = db.usuarios.find((u) => u.id === id);
  if (!usuario) return enviarJSON(res, 404, { error: 'Usuario no encontrado.' });

  return enviarJSON(res, 200, {
    id: usuario.id,
    nombreCompleto: usuario.nombreCompleto,
    estadoCuenta: usuario.estadoCuenta,
  });
}

function manejarListarCorreos(res) {
  const db = leerDB();
  enviarJSON(res, 200, { correos: db.correosEnviados.slice().reverse() });
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`);
  const partes = url.pathname.split('/').filter(Boolean);

  try {
    if (req.method === 'GET' && url.pathname === '/') {
      return servirArchivoEstatico(res, path.join(PUBLIC_DIR, 'index.html'));
    }
    if (req.method === 'GET' && url.pathname === '/registro') {
      return servirArchivoEstatico(res, path.join(PUBLIC_DIR, 'registro.html'));
    }
    if (req.method === 'GET' && url.pathname === '/autorizacion') {
      return servirArchivoEstatico(res, path.join(PUBLIC_DIR, 'autorizacion.html'));
    }
    if (req.method === 'GET' && url.pathname === '/admin/correos') {
      if (!tieneAccesoAdmin(url)) {
        res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('No autorizado. Agrega ?clave=TU_CLAVE a la URL.');
      }
      return servirArchivoEstatico(res, path.join(PUBLIC_DIR, 'admin-correos.html'));
    }
    if (req.method === 'GET' && url.pathname === '/iniciar-sesion') {
      return servirArchivoEstatico(res, path.join(PUBLIC_DIR, 'iniciar-sesion.html'));
    }
    if (req.method === 'GET' && url.pathname === '/panel') {
      return servirArchivoEstatico(res, path.join(PUBLIC_DIR, 'panel.html'));
    }
    if (req.method === 'GET' && (url.pathname.endsWith('.css') || url.pathname.endsWith('.js'))) {
      return servirArchivoEstatico(res, path.join(PUBLIC_DIR, url.pathname));
    }

    if (req.method === 'POST' && url.pathname === '/api/registro') {
      return await manejarRegistro(req, res);
    }
    if (req.method === 'POST' && url.pathname === '/api/login') {
      return await manejarLogin(req, res);
    }
    if (req.method === 'GET' && partes[0] === 'api' && partes[1] === 'usuario' && partes.length === 3) {
      return manejarObtenerUsuario(res, partes[2]);
    }
    if (req.method === 'GET' && partes[0] === 'api' && partes[1] === 'consentimiento' && partes.length === 3) {
      return manejarObtenerConsentimiento(res, partes[2]);
    }
    if (req.method === 'POST' && partes[0] === 'api' && partes[1] === 'consentimiento' && partes[3] === 'confirmar') {
      return manejarConfirmarConsentimiento(res, partes[2]);
    }
    if (req.method === 'POST' && partes[0] === 'api' && partes[1] === 'consentimiento' && partes[3] === 'reenviar') {
      return await manejarReenviarConsentimiento(res, partes[2]);
    }
    if (req.method === 'GET' && url.pathname === '/api/admin/correos') {
      if (!tieneAccesoAdmin(url)) {
        return enviarJSON(res, 401, { error: 'No autorizado.' });
      }
      return manejarListarCorreos(res);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('No encontrado');
  } catch (err) {
    console.error(err);
    enviarJSON(res, 500, { error: 'Error interno del servidor.' });
  }
});

servidor.listen(PUERTO, () => {
  console.log(`\nServidor corriendo. Abre tu navegador en http://localhost:${PUERTO}\n`);
});
