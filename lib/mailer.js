const crypto = require('crypto');
const { leerDB, guardarDB } = require('./db');

// Si hay una variable de entorno RESEND_API_KEY configurada, se envía un
// correo REAL usando el servicio Resend (https://resend.com, tiene un
// plan gratuito). Si no está configurada, se guarda el correo en la base
// de datos local para poder probarlo desde /admin/correos.
async function enviarCorreo({ para, asunto, html }) {
  if (process.env.RESEND_API_KEY) {
    try {
      const respuesta = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.CORREO_REMITENTE || 'onboarding@resend.dev',
          to: para,
          subject: asunto,
          html,
        }),
      });

      if (respuesta.ok) {
        console.log(`Correo real enviado a ${para} vía Resend.`);
        return;
      }
      console.error('Resend respondió con error, se guarda como simulado:', await respuesta.text());
    } catch (err) {
      console.error('No se pudo enviar el correo real, se guarda como simulado:', err.message);
    }
  }

  const db = leerDB();
  db.correosEnviados.push({
    id: crypto.randomUUID(),
    para,
    asunto,
    html,
    enviadoEn: new Date().toISOString(),
  });
  guardarDB(db);
  console.log(`Correo simulado guardado para ${para} (revisa /admin/correos)`);
}

module.exports = { enviarCorreo };
