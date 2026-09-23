// routes/orders.js
// Gère la création et la consultation des commandes.
const express = require('express');
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders → passer une commande (utilisateur connecté)
router.post('/', requireAuth, async (req, res) => {
  const { beat_id } = req.body;
  if (!beat_id) return res.status(400).json({ error: 'beat_id est requis.' });

  try {
    const beat = await pool.query('SELECT price FROM beats WHERE id = $1', [beat_id]);
    if (beat.rows.length === 0) return res.status(404).json({ error: 'Beat introuvable.' });

    const amount = beat.rows[0].price;
    const result = await pool.query(
      `INSERT INTO orders (user_id, beat_id, amount)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, beat_id, amount]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la commande.' });
  }
});

// GET /api/orders/mine → commandes de l'utilisateur connecté
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT orders.*, beats.title, beats.file_url
       FROM orders
       JOIN beats ON beats.id = orders.beat_id
       WHERE orders.user_id = $1
       ORDER BY order_date DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/orders → toutes les commandes (admin uniquement)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT orders.*, users.username, beats.title
       FROM orders
       JOIN users ON users.id = orders.user_id
       JOIN beats ON beats.id = orders.beat_id
       ORDER BY order_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/orders/:id/status → changer le statut d'une commande (admin uniquement)
router.put('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'paid', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide.' });
  }
  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Commande introuvable.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
