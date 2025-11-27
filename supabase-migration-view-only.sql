-- Migration pour ajouter le champ view_only à la table users
-- Exécutez ce script dans Supabase SQL Editor si vous avez déjà créé la base de données

-- Ajouter la colonne view_only si elle n'existe pas
ALTER TABLE users ADD COLUMN IF NOT EXISTS view_only BOOLEAN DEFAULT FALSE;

-- Mettre à jour tous les utilisateurs existants pour qu'ils ne soient pas en mode lecture seule par défaut
UPDATE users SET view_only = FALSE WHERE view_only IS NULL;