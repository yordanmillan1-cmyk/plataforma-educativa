# Publicar tu plataforma en internet — guía real, gratis, hoy

Esto ya no es una demostración local: vamos a dejarlo con una dirección
web de verdad, con HTTPS (el candado de seguridad), para que se lo puedas
mostrar a cualquier persona con solo enviarle un enlace.

Todo lo de aquí abajo es gratis. No necesitas tarjeta de crédito para
ninguno de estos servicios en su plan gratuito.

---

## Paso 1 — Subir el código a GitHub (sin usar comandos)

GitHub es donde va a "vivir" tu código para que el servicio de hosting lo
pueda leer. No necesitas saber usar Git ni la terminal para esto.

1. Ve a **https://github.com** y crea una cuenta gratis.
2. Haz clic en el botón verde **"New"** (o el símbolo "+" arriba a la
   derecha → "New repository").
3. Ponle un nombre, por ejemplo `plataforma-educativa`. Déjalo en
   **Public** (o Private si prefieres, ambos funcionan igual para esto).
4. Haz clic en **"Create repository"**.
5. En la página que se abre, busca el enlace que dice **"uploading an
   existing file"**.
6. Arrastra ahí TODOS los archivos y carpetas que están dentro de la
   carpeta `sitio-web` (no la carpeta en sí, su contenido: `server.js`,
   `package.json`, las carpetas `public/`, `lib/`, `data/`, y el archivo
   `EMPEZAR-AQUI.md`).
7. Haz clic en **"Commit changes"** (o "Commit directly to the main
   branch").

Ya tienes tu código en GitHub.

---

## Paso 2 — Conectarlo a Render (el servicio que lo pone en línea)

**Render** es un servicio de hosting con un plan gratuito que corre tu
código de verdad, con su propia dirección web pública y HTTPS incluido.

1. Ve a **https://render.com** y crea una cuenta gratis (puedes usar tu
   cuenta de GitHub para entrar más rápido — botón "Sign up with GitHub").
2. En el panel, haz clic en **"New +"** → **"Web Service"**.
3. Conecta tu cuenta de GitHub si te lo pide, y selecciona el repositorio
   `plataforma-educativa` que acabas de crear.
4. Render va a detectar automáticamente que es un proyecto de Node.js
   (gracias al archivo `package.json` que ya incluimos). Deja los valores
   que proponga por defecto:
   - **Build Command**: puede quedar vacío o `npm install` (no pasa nada
     aunque diga eso, no tenemos dependencias que instalar).
   - **Start Command**: `node server.js` (debería auto-completarse solo).
5. Elige el plan **Free**.
6. Haz clic en **"Create Web Service"**.

En unos 2-3 minutos vas a ver un mensaje de "Live" y una dirección como:

```
https://plataforma-educativa.onrender.com
```

Esa ya es tu página real, pública, con HTTPS. Puedes compartirla ya
mismo.

---

## Paso 3 — Activar el envío real de correos (recomendado antes de compartirlo con gente de verdad)

Ahora mismo, si nadie configura nada, los correos de autorización parental
se siguen "simulando" (se guardan para verlos en `/admin/correos`, que ya
dejamos protegida con una clave). Para que el correo le llegue de verdad
al representante legal:

1. Ve a **https://resend.com** y crea una cuenta gratis (da 3.000 correos
   gratis al mes, más que suficiente para empezar).
2. Copia tu **API Key** (la encuentras en el panel, sección "API Keys").
3. Vuelve a Render, entra a tu servicio, ve a la pestaña **"Environment"**.
4. Agrega estas variables:
   - `RESEND_API_KEY` → pega tu clave de Resend.
   - `CLAVE_ADMIN` → inventa una clave secreta tuya (para poder entrar a
     `/admin/correos` mientras aún no tengas correo real conectado, o para
     revisar cualquier problema).
5. Guarda. Render va a reiniciar el servicio solo.

**Importante sobre Resend en su plan gratuito**: hasta que no verifiques
un dominio propio (por ejemplo `tuplataforma.com`), Resend solo te deja
enviar correos a la dirección con la que creaste tu cuenta — es su modo
de pruebas. Para enviarle correos a cualquier padre de familia real,
vas a necesitar comprar un dominio (unos $10-15 USD al año en Namecheap
o Google Domains) y seguir los pasos de Resend para verificarlo — el
mismo proceso te sirve para que tu página se vea en
`www.tuplataforma.com` en vez de `onrender.com`.

Mientras tanto, puedes seguir enseñándole la plataforma a compradores
potenciales usando `/admin/correos?clave=TU_CLAVE` para mostrar cómo
funciona el correo, sin que esto bloquee la demostración.

---

## Una aclaración importante sobre "empezar a facturar"

Construir esto gratis y dejarlo en línea para mostrárselo a compradores
potenciales es completamente razonable como siguiente paso — y ya está
hecho. Pero antes de cobrarle a un solo usuario real, hay unas piezas que
no son de código y que no puedo resolver por ti en este chat, pero sí
puedo ayudarte a preparar cuando quieras:

- **Términos y condiciones y política de privacidad** publicados en el
  sitio (obligatorio en Colombia para cualquier plataforma que trate
  datos personales, y más aún tratándose de menores de edad).
- **Una figura legal para facturar** (empresa constituida, RUT, y si
  vas a facturar, resolución de facturación electrónica ante la DIAN).
- **Una pasarela de pagos** (Wompi, PayU o Mercado Pago son las más
  usadas en Colombia y tienen integración relativamente simple).

Ninguna de estas bloquea que la página esté en línea hoy mostrándose a
posibles compradores o inversionistas — pero sí bloquean el momento en
que le cobres a la primera persona real.

---

## Qué sigue siendo una limitación técnica (y por qué no es grave todavía)

La base de datos sigue siendo un archivo (`data/db.json`), no una base de
datos real. En el plan gratuito de Render, ese archivo se puede borrar
cada vez que el servicio se reinicia o se "duerme" por inactividad. Esto
significa que, en este momento, no deberías confiar en que los registros
de usuarios de prueba se mantengan para siempre.

Para una demostración a compradores esto no es un problema. Pero apenas
empieces a tener las primeras cuentas reales que te importe conservar, el
siguiente paso técnico prioritario es conectar la base de datos real de
Postgres que ya diseñamos (tienes el archivo
`schema-consentimiento-parental.sql` de nuestra conversación anterior).
Puedo ayudarte a hacer ese cambio en cuanto lo necesites — es más rápido
hacerlo antes de tener usuarios reales que después.
