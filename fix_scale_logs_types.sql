-- ==============================================================================
-- CORRECCIÓN DE TIPO DE DATOS: UUID -> TEXT
-- Soluciona: invalid input syntax for type uuid: "Sol-mayor"
-- ==============================================================================
-- Las escalas, armonías y ritmos predefinidos usan identificadores de texto
-- legibles como "Sol-mayor", "prog-I-IV-V-I", "bas-negras".
-- Al tener la columna como UUID en PostgreSQL, cualquier registro de práctica
-- de una escala predefinida falla con error 22P02.
-- Este script convierte de forma segura las columnas a TEXT preservando los datos existentes.
-- ==============================================================================

-- 1. Logs de práctica
ALTER TABLE IF EXISTS public.scale_logs 
  ALTER COLUMN scale_id TYPE text USING scale_id::text;

ALTER TABLE IF EXISTS public.harmony_logs 
  ALTER COLUMN harmony_id TYPE text USING harmony_id::text;

ALTER TABLE IF EXISTS public.rhythm_practice_logs 
  ALTER COLUMN rhythm_id TYPE text USING rhythm_id::text;

ALTER TABLE IF EXISTS public.melody_practice_logs 
  ALTER COLUMN melody_id TYPE text USING melody_id::text;

-- 2. Imágenes vinculadas
ALTER TABLE IF EXISTS public.scale_images 
  ALTER COLUMN scale_id TYPE text USING scale_id::text;

ALTER TABLE IF EXISTS public.harmony_images 
  ALTER COLUMN harmony_id TYPE text USING harmony_id::text;

ALTER TABLE IF EXISTS public.rhythm_images 
  ALTER COLUMN rhythm_id TYPE text USING rhythm_id::text;

ALTER TABLE IF EXISTS public.melody_images 
  ALTER COLUMN melody_id TYPE text USING melody_id::text;

-- 3. Ejercicios con escalas o armonías vinculadas
ALTER TABLE IF EXISTS public.exercises 
  ALTER COLUMN related_scale_id TYPE text USING related_scale_id::text;

ALTER TABLE IF EXISTS public.exercises 
  ALTER COLUMN related_harmony_id TYPE text USING related_harmony_id::text;
