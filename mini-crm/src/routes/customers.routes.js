const express = require('express');
const db = require('../database/database');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

// Criar cliente
router.post('/', async (req, res) => {
  const userId = req.userId;
  const { name, email, phone, company, status, is_public } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Nome do cliente é obrigatório.' });
  }

  try {
    const result = await db.query(
      `
      INSERT INTO customers 
      (name, email, phone, company, status, is_public, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
      `,
      [
        name,
        email || '',
        phone || '',
        company || '',
        status || 'lead',
        is_public ? 1 : 0,
        userId
      ]
    );

    return res.status(201).json({
      message: 'Cliente cadastrado com sucesso.',
      customerId: result.rows[0].id
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao cadastrar cliente.',
      error: error.message
    });
  }
});

// Listar clientes
router.get('/', async (req, res) => {
  const userId = req.userId;

  try {
    const result = await db.query(
      `
      SELECT 
        customers.*,
        last_interaction.created_at AS last_contact_date,
        users.name AS last_contact_user
      FROM customers

      LEFT JOIN (
        SELECT DISTINCT ON (customer_id)
          customer_id,
          user_id,
          created_at
        FROM interactions
        ORDER BY customer_id, created_at DESC
      ) AS last_interaction
      ON last_interaction.customer_id = customers.id

      LEFT JOIN users
      ON users.id = last_interaction.user_id

      WHERE customers.user_id = $1
      OR customers.is_public = 1

      ORDER BY customers.created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);

  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao buscar clientes.',
      error: error.message
    });
  }
});

// Criar interação
router.post('/:id/interactions', async (req, res) => {
  const customerId = req.params.id;
  const userId = req.userId;
  const { note } = req.body;

  if (!note) {
    return res.status(400).json({
      message: 'A observação é obrigatória.'
    });
  }

  try {
    await db.query(
      `
      INSERT INTO interactions (customer_id, user_id, note)
      VALUES ($1, $2, $3)
      `,
      [customerId, userId, note]
    );

    res.status(201).json({
      message: 'Interação registrada com sucesso.'
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao salvar interação.',
      error: error.message
    });
  }
});

// Listar interações
router.get('/:id/interactions', async (req, res) => {
  const customerId = req.params.id;

  try {
    const result = await db.query(
      `
      SELECT interactions.*, users.name AS user_name
      FROM interactions
      LEFT JOIN users ON users.id = interactions.user_id
      WHERE interactions.customer_id = $1
      ORDER BY interactions.created_at DESC
      `,
      [customerId]
    );

    res.json(result.rows);

  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao buscar interações.',
      error: error.message
    });
  }
});

// Atualizar cliente
router.put('/:id', async (req, res) => {
  const customerId = req.params.id;
  const userId = req.userId;

  const {
    name,
    email,
    phone,
    company,
    status,
    is_public
  } = req.body;

  try {
    const customerResult = await db.query(
      `SELECT * FROM customers WHERE id = $1`,
      [customerId]
    );

    const customer = customerResult.rows[0];

    if (!customer) {
      return res.status(404).json({
        message: 'Cliente não encontrado.'
      });
    }

    if (customer.is_public !== 1 && customer.user_id !== userId) {
      return res.status(403).json({
        message: 'Você não tem permissão para editar este cliente.'
      });
    }

    await db.query(
      `
      UPDATE customers
      SET
        name = $1,
        email = $2,
        phone = $3,
        company = $4,
        status = $5,
        is_public = $6
      WHERE id = $7
      `,
      [
        name,
        email || '',
        phone || '',
        company || '',
        status || 'lead',
        is_public ? 1 : 0,
        customerId
      ]
    );

    await db.query(
      `
      INSERT INTO interactions
      (customer_id, user_id, note)
      VALUES ($1, $2, $3)
      `,
      [
        customerId,
        userId,
        `Cliente atualizado (${status || 'lead'})`
      ]
    );

    res.json({
      message: 'Cliente atualizado com sucesso.'
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao atualizar cliente.',
      error: error.message
    });
  }
});

// Excluir cliente
router.delete('/:id', async (req, res) => {
  const customerId = req.params.id;
  const userId = req.userId;

  try {
    const result = await db.query(
      `
      DELETE FROM customers
      WHERE id = $1
      AND user_id = $2
      RETURNING id
      `,
      [customerId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        message: 'Você não tem permissão para excluir este cliente.'
      });
    }

    res.json({
      message: 'Cliente excluído com sucesso.'
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao excluir cliente.',
      error: error.message
    });
  }
});

module.exports = router;