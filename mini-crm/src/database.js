require('dotenv').config();

const { Pool } = require('pg');

const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

db.connect()
  .then(() => {
    console.log('Banco de dados conectado com sucesso.');
  })
  .catch((error) => {
    console.error('Erro ao conectar no PostgreSQL:', error.message);
  });

module.exports = db;