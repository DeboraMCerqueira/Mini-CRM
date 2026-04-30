const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/database');

const router = express.Router();

// 🔹 Cadastro de usuário
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: 'Nome, email e senha são obrigatórios.'
    });
  }

  const hashedPassword = await bcrypt.hash(password, 8);

  db.run(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hashedPassword],
    function (error) {
      if (error) {
        return res.status(400).json({
          message: 'Erro ao cadastrar usuário.',
          error: error.message
        });
      }

      return res.status(201).json({
        message: 'Usuário cadastrado com sucesso.',
        userId: this.lastID
      });
    }
  );
});

// 🔹 Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email e senha são obrigatórios.'
    });
  }

  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (error, user) => {
      if (error) {
        return res.status(500).json({
          message: 'Erro no servidor.'
        });
      }

      if (!user) {
        return res.status(404).json({
          message: 'Usuário não encontrado.'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          message: 'Senha inválida.'
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        'segredo_super_secreto',
        { expiresIn: '1d' }
      );

      return res.json({
        message: 'Login realizado com sucesso',
        token
      });
    }
  );
});

module.exports = router;