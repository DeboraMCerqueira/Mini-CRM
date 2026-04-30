require('dotenv').config();
const customerRoutes = require('./routes/customers.routes');
const express = require('express');
const cors = require('cors');
require('./database/database');

// ✅ IMPORTA ANTES DE USAR
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/customers', customerRoutes);

// ✅ AGORA PODE USAR
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Mini CRM rodando 🚀');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});