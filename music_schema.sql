-- ESQUEMA COMPLETO PARA MUSIC-MINISTRY --
-- Cópialo y pégalo en el SQL Editor del nuevo proyecto exclusivo de MusicMinistry

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tablas de Carpetas
CREATE TABLE IF NOT EXISTS scale_folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  name text NOT NULL,
  color text DEFAULT '#4f46e5',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS harmony_folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  name text NOT NULL,
  color text DEFAULT '#4f46e5',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS rhythm_folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  name text NOT NULL,
  color text DEFAULT '#4f46e5',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS melody_folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  name text NOT NULL,
  color text DEFAULT '#4f46e5',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS exercise_folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  name text NOT NULL,
  color text DEFAULT '#4f46e5',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tablas Principales de Práctica
CREATE TABLE IF NOT EXISTS scales (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  name text NOT NULL,
  type text NOT NULL,
  folder_id uuid REFERENCES scale_folders(id) ON DELETE SET NULL,
  video_url text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS harmonies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  name text NOT NULL,
  type text NOT NULL,
  description text,
  folder_id uuid REFERENCES harmony_folders(id) ON DELETE SET NULL,
  video_url text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS rhythms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  name text NOT NULL,
  type text NOT NULL,
  bpm integer,
  description text,
  folder_id uuid REFERENCES rhythm_folders(id) ON DELETE SET NULL,
  video_url text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS melodies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  name text NOT NULL,
  instrument text NOT NULL,
  status text DEFAULT 'pending',
  bpm integer,
  key text,
  time_signature text,
  description text,
  folder_id uuid REFERENCES melody_folders(id) ON DELETE SET NULL,
  video_url text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  title text NOT NULL,
  artist text NOT NULL,
  key text,
  genre text,
  instrument text,
  notes text,
  reference_url text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  title text NOT NULL,
  category text NOT NULL,
  instrument text NOT NULL,
  difficulty text DEFAULT 'medium',
  status text DEFAULT 'pending',
  bpm integer,
  key text,
  description text,
  video_url text,
  progress integer DEFAULT 0,
  last_practiced timestamptz,
  related_scale_id text,
  related_harmony_id text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Logs y Registro de Práctica
CREATE TABLE IF NOT EXISTS scale_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  date date NOT NULL,
  instrument text NOT NULL,
  scale_id text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS harmony_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  date date NOT NULL,
  instrument text NOT NULL,
  harmony_id text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS rhythm_practice_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  date date NOT NULL,
  instrument text NOT NULL,
  rhythm_id text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS melody_practice_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  date date NOT NULL,
  instrument text NOT NULL,
  melody_id text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS weekly_setlists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  "weekStart" text NOT NULL,
  "songIds" text[] DEFAULT '{}',
  "rehearsalNotes" text,
  "practicedSongIds" text[] DEFAULT '{}',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tablas para Referencias a Imágenes / Anexos
CREATE TABLE IF NOT EXISTS scale_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  scale_id text,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS harmony_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  harmony_id text,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS rhythm_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  rhythm_id text,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS melody_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  melody_id uuid,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS exercise_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL DEFAULT 'public_user',
  exercise_id uuid,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Habilitar RLS en todas las tablas y dar acceso público
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Permitir_todo_%I" ON %I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Permitir_todo_%I" ON %I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;
