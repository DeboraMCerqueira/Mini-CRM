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

  try {
    const hashedPassword = await bcrypt.hash(password, 8);

    const result = await db.query(
      `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [name, email, hashedPassword]
    );

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso.',
      userId: result.rows[0].id
    });

  } catch (error) {
    return res.status(400).json({
      message: 'Erro ao cadastrar usuário.',
      error: error.message
    });
  }
});

// 🔹 Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email e senha são obrigatórios.'
    });
  }

  try {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

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
      process.env.JWT_SECRET || 'segredo_super_secreto',
      { expiresIn: '1d' }
    );

    return res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Erro no servidor.',
      error: error.message
    });
  }
});

module.exports = router;