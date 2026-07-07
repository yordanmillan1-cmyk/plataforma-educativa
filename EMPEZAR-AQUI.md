# Empieza aquí

Esto es un sitio web que ya funciona: la página de inicio, el registro con
detección de menores de edad, y la autorización de padres. No necesitas
instalar nada raro — solo Node.js, que es gratis.

No necesitas ejecutar `npm install`. Este proyecto no usa ninguna librería
externa a propósito, para que no haya nada que pueda fallar al instalar.

---

## Parte 1: verlo funcionar en tu computador (5 minutos)

### Paso 1 — Instalar Node.js (una sola vez)

1. Ve a **https://nodejs.org**
2. Descarga la versión que dice **"LTS"** (es la recomendada, no la otra).
3. Ábrelo e instálalo como cualquier programa (Siguiente, Siguiente, Instalar).

### Paso 2 — Abrir la carpeta del proyecto en la terminal

- **En Mac**: busca la app "Terminal" (con la lupa de Spotlight, escribe "Terminal").
- **En Windows**: busca "PowerShell" o "Símbolo del sistema".

Escribe `cd ` (con un espacio después), luego arrastra la carpeta de este
proyecto (`sitio-web`) hacia la ventana de la terminal, y presiona Enter.
Eso te deja "parado" dentro de la carpeta correcta.

### Paso 3 — Arrancar el sitio

Escribe esto y presiona Enter:

```
node server.js
```

Vas a ver un mensaje como:

```
Servidor corriendo. Abre tu navegador en http://localhost:3000
```

### Paso 4 — Abrir el sitio

Abre tu navegador (Chrome, Safari, el que uses) y entra a:

```
http://localhost:3000
```

Ya deberías ver la página de inicio.

### Paso 5 — Probar el flujo de menor de edad

1. Haz clic en "Empezar ahora".
2. Regístrate con una fecha de nacimiento que dé menos de 18 años.
3. El sitio te va a pedir el nombre y correo de un "representante legal" — pon cualquier dato de prueba.
4. Ahora ve a **http://localhost:3000/admin/correos** — ahí vas a ver el
   correo simulado que se "envió". Haz clic en el enlace de "Revisar y autorizar".
5. Marca la casilla y confirma. Listo — la cuenta quedó activa.

Para detener el sitio, vuelve a la terminal y presiona `Ctrl + C`.

---

## Parte 2: publicarlo en internet gratis, sin saber programar

La forma más simple es usar **Replit** (replit.com), que además de alojar
tu código te da una dirección pública sin que tengas que configurar nada.

1. Entra a **https://replit.com** y crea una cuenta gratis.
2. Haz clic en "Create App" o "+ Create Repl".
3. Elige la plantilla **Node.js**.
4. Dentro del proyecto que se abre, borra los archivos de ejemplo que trae
   por defecto.
5. Sube tus archivos: hay un ícono de "subir archivo" o puedes arrastrar
   toda la carpeta `sitio-web` directamente sobre la ventana de Replit.
6. Presiona el botón verde **"Run"**.
7. A la derecha va a aparecer una ventana con una dirección web — esa ya
   es pública. Puedes compartirla con quien quieras.

Nota: en Replit gratis, el sitio se "duerme" si nadie lo visita por un
rato, y se despierta solo cuando alguien entra. Para algo más serio (que
esté siempre encendido, con un dominio propio como
`www.tuplataforma.com`), el siguiente paso normalmente es un servicio como
Railway o Render — pero para probar la idea con las primeras personas,
Replit es suficiente y gratis.

---

## Qué es real aquí y qué es una simulación

- **Real**: toda la lógica de detección de edad, el flujo de autorización,
  el guardado de datos, las páginas.
- **Simulado (para poder probar sin gastar dinero todavía)**:
  - Los correos no se envían de verdad — se guardan y los ves en
    `/admin/correos`. Esa página **debe desaparecer o protegerse con
    contraseña** antes de tener usuarios reales, porque ahí se ven los
    enlaces de autorización de cualquier persona.
  - La base de datos es un archivo (`data/db.json`), no una base de datos
    de verdad. Sirve perfecto para probar la idea y hasta unos cientos de
    usuarios, pero no aguanta miles de personas usándolo al mismo tiempo.
    El esquema de Postgres que ya diseñamos antes es el reemplazo natural
    cuando llegue ese momento.

## Cuándo pedir ayuda de un programador

Este sitio te sirve para: mostrarle la idea a inversionistas, probarlo con
las primeras familias, y validar que el flujo tiene sentido. Cuando
quieras conectar un correo de verdad, una base de datos de verdad, y
empezar a construir el mentor de inteligencia artificial y todo lo demás
que diseñamos, ahí sí conviene traer a un desarrollador — o seguir
conmigo usando Claude Code, que está hecho justo para ir construyendo un
proyecto de este tamaño paso a paso.
