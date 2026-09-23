// routes/beats.js
// Gère la liste, l'ajout, la modification et la suppression des beats.
const express = require('express');
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/beats → liste publique de tous les beats
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM beats ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/beats/:id → détail d'un beat
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM beats WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Beat introuvable.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/beats → ajouter un beat (admin uniquement)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { title, file_url, cover_url, genre, price } = req.body;
  if (!title || !file_url || price === undefined) {
    return res.status(400).json({ error: 'title, file_url et price sont requis.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO beats (title, file_url, cover_url, genre, price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, file_url, cover_url || null, genre || null, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de l\'ajout du beat.' });
  }
});

// PUT /api/beats/:id → modifier un beat (admin uniquement)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { title, file_url, cover_url, genre, price } = req.body;
  try {
    const result = await pool.query(
      `UPDATE beats SET
         title = COALESCE($1, title),
         file_url = COALESCE($2, file_url),
         cover_url = COALESCE($3, cover_url),
         genre = COALESCE($4, genre),
         price = COALESCE($5, price)
       WHERE id = $6
       RETURNING *`,
      [title, file_url, cover_url, genre, price, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Beat introuvable.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/beats/:id → supprimer un beat (admin uniquement)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM beats WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
