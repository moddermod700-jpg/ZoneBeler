-- ============================================
-- BelerZone - Schéma PostgreSQL (Supabase)
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- Extension pour générer des UUID (optionnel, on utilise SERIAL ici pour simplicité)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,       -- mot de passe hashé (bcrypt)
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des beats (instrumentales)
CREATE TABLE IF NOT EXISTS beats (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    file_url TEXT NOT NULL,               -- lien vers le fichier audio (Supabase Storage, Cloudinary, etc.)
    cover_url TEXT,                       -- image de couverture (optionnel)
    genre VARCHAR(50),
    price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    beat_id INTEGER NOT NULL REFERENCES beats(id) ON DELETE CASCADE,
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'  -- pending, paid, cancelled
);

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_beat_id ON orders(beat_id);

-- Compte admin de départ (mot de passe à changer après hash — voir README)
-- INSERT INTO users (username, email, password, is_admin)
-- VALUES ('admin', 'admin@belerzone.com', '<hash_bcrypt_ici>', TRUE);
