const express = require('express');
const db = require('../database/database');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// 🔒 Todas as rotas abaixo exigem login
router.use(authMiddleware);

// Criar cliente
router.post('/', authMiddleware, (req, res) => {
  const userId = req.userId;

  const { name, email, phone, company, notes, status, is_public } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Nome do cliente é obrigatório.' });
  }

  db.run(
    `
    INSERT INTO customers 
    (name, email, phone, company, status, is_public, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      name,
      email || '',
      phone || '',
      company || '',
      status || 'lead',
      is_public ? 1 : 0,
      userId
    ],
    function (error) {
      if (error) {
        return res.status(500).json({
          message: 'Erro ao cadastrar cliente.',
          error: error.message
        });
      }

      return res.status(201).json({
        message: 'Cliente cadastrado com sucesso.',
        customerId: this.lastID
      });
    }
  );
});

// Listar clientes
router.get('/', authMiddleware, (req, res) => {
  const userId = req.userId;

  db.all(
    `
    SELECT * FROM customers
    WHERE user_id = ?
    OR is_public = 1
    ORDER BY created_at DESC
    `,
    [userId],
    (error, rows) => {
      if (error) {
        return res.status(500).json({ message: 'Erro ao buscar clientes.' });
      }

      res.json(rows);
    }
  );
});

module.exports = router;

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone, company, notes } = req.body;

  db.run(
    `UPDATE customers 
     SET name = ?, email = ?, phone = ?, company = ?, notes = ?
     WHERE id = ?`,
    [name, email, phone, company, notes, id],
    function (error) {
      if (error) {
        return res.status(500).json({ message: 'Erro ao atualizar cliente.' });
      }

      return res.json({ message: 'Cliente atualizado com sucesso' });
    }
  );
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM customers WHERE id = ?', [id], function (error) {
    if (error) {
      return res.status(500).json({ message: 'Erro ao deletar cliente.' });
    }

    return res.json({ message: 'Cliente deletado com sucesso' });
  });
});

router.post('/:id/interactions', authMiddleware, (req, res) => {
  const customerId = req.params.id;
  const userId = req.userId;
  const { note } = req.body;

  if (!note) {
    return res.status(400).json({
      message: 'A observação é obrigatória.'
    });
  }

  db.run(
    `
    INSERT INTO interactions (customer_id, user_id, note)
    VALUES (?, ?, ?)
    `,
    [customerId, userId, note],
    function (error) {
      if (error) {
        return res.status(500).json({
          message: 'Erro ao salvar interação.',
          error: error.message
        });
      }

      res.status(201).json({
        message: 'Interação registrada com sucesso.'
      });
    }
  );
});

router.get('/:id/interactions', authMiddleware, (req, res) => {
  const customerId = req.params.id;

  db.all(
    `
    SELECT interactions.*, users.name AS user_name
    FROM interactions
    LEFT JOIN users ON users.id = interactions.user_id
    WHERE interactions.customer_id = ?
    ORDER BY interactions.created_at DESC
    `,
    [customerId],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          message: 'Erro ao buscar interações.',
          error: error.message
        });
      }

      res.json(rows);
    }
  );
});

router.put('/:id', authMiddleware, (req, res) => {
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

  db.run(
    `
    UPDATE customers
    SET 
      name = ?,
      email = ?,
      phone = ?,
      company = ?,
      status = ?,
      is_public = ?
    WHERE id = ?
    AND user_id = ?
    `,
    [
      name,
      email || '',
      phone || '',
      company || '',
      status || 'lead',
      is_public ? 1 : 0,
      customerId,
      userId
    ],
    function (error) {
      if (error) {
        return res.status(500).json({
          message: 'Erro ao atualizar cliente.',
          error: error.message
        });
      }

      if (this.changes === 0) {
        return res.status(403).json({
          message: 'Você não tem permissão para editar este cliente.'
        });
      }

      res.json({
        message: 'Cliente atualizado com sucesso.'
      });
    }
  );
});

router.delete('/:id', authMiddleware, (req, res) => {
  const customerId = req.params.id;
  const userId = req.userId;

  db.run(
    `
    DELETE FROM customers
    WHERE id = ?
    AND user_id = ?
    `,
    [customerId, userId],
    function (error) {
      if (error) {
        return res.status(500).json({
          message: 'Erro ao excluir cliente.',
          error: error.message
        });
      }

      if (this.changes === 0) {
        return res.status(403).json({
          message: 'Você não tem permissão para excluir este cliente.'
        });
      }

      res.json({
        message: 'Cliente excluído com sucesso.'
      });
    }
  );
});

