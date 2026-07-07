const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function leerDB() {
  if (!fs.existsSync(DB_PATH)) {
    return { usuarios: [], autorizaciones: [], correosEnviados: [] };
  }
  const contenido = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(contenido);
}

function guardarDB(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = { leerDB, guardarDB };
