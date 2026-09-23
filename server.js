// server.js
// Point d'entrée du back-end BelerZone (API REST Express + PostgreSQL/Supabase).
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const usersRoutes = require('./routes/users');
const beatsRoutes = require('./routes/beats');
const ordersRoutes = require('./routes/orders');

const app = express();

// Middlewares globaux
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Route de santé (utile pour vérifier que le serveur tourne sur Railway)
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API BelerZone en ligne 🎵' });
});

// Montage des routes
app.use('/api/users', usersRoutes);
app.use('/api/beats', beatsRoutes);
app.use('/api/orders', ordersRoutes);

// Gestion des routes inconnues
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur BelerZone démarré sur le port ${PORT}`);
});
