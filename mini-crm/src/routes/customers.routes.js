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
    SELECT 
      customers.*,
      last_interaction.created_at AS last_contact_date,
      users.name AS last_contact_user
    FROM customers

    LEFT JOIN (
      SELECT 
        customer_id,
        user_id,
        MAX(created_at) AS created_at
      FROM interactions
      GROUP BY customer_id
    ) AS last_interaction
    ON last_interaction.customer_id = customers.id

    LEFT JOIN users
    ON users.id = last_interaction.user_id

    WHERE customers.user_id = ?
    OR customers.is_public = 1

    ORDER BY customers.created_at DESC
    `,
    [userId],
    (error, rows) => {

      if (error) {
        return res.status(500).json({
          message: 'Erro ao buscar clientes.',
          error: error.message
        });
      }

      res.json(rows);
    }
  );
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

  // Primeiro busca o cliente
  db.get(
    `SELECT * FROM customers WHERE id = ?`,
    [customerId],
    (error, customer) => {

      if (error || !customer) {
        return res.status(404).json({
          message: 'Cliente não encontrado.'
        });
      }

      // Regra:
      // privado -> só dono
      // público -> equipe pode editar

      if (
        customer.is_public !== 1 &&
        customer.user_id !== userId
      ) {
        return res.status(403).json({
          message: 'Você não tem permissão para editar este cliente.'
        });
      }

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
        `,
        [
          name,
          email || '',
          phone || '',
          company || '',
          status || 'lead',
          is_public ? 1 : 0,
          customerId
        ],
        function (error) {

          if (error) {
            return res.status(500).json({
              message: 'Erro ao atualizar cliente.',
              error: error.message
            });
          }

          // salva histórico automático
          db.run(
            `
            INSERT INTO interactions
            (customer_id, user_id, note)
            VALUES (?, ?, ?)
            `,
            [
              customerId,
              userId,
              `Cliente atualizado (${status})`
            ]
          );

          res.json({
            message: 'Cliente atualizado com sucesso.'
          });
        }
      );
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

module.exports = router;
