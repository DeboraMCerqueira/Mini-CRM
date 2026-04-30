const express = require('express');
const db = require('../database/database');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// 🔒 Todas as rotas abaixo exigem login
router.use(authMiddleware);

// Criar cliente
router.post('/', (req, res) => {
  const { name, email, phone, company, notes } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Nome é obrigatório.' });
  }

  db.run(
    `INSERT INTO customers (name, email, phone, company, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email, phone, company, notes],
    function (error) {
      if (error) {
        return res.status(500).json({ message: 'Erro ao cadastrar cliente.' });
      }

      return res.status(201).json({
        message: 'Cliente cadastrado com sucesso',
        customerId: this.lastID
      });
    }
  );
});

// Listar clientes
router.get('/', (req, res) => {
  db.all('SELECT * FROM customers', [], (error, rows) => {
    if (error) {
      return res.status(500).json({ message: 'Erro ao buscar clientes.' });
    }

    return res.json(rows);
  });
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