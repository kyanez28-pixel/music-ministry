// Este archivo es generado automáticamente. No editar directamente.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validar variables de entorno en desarrollo
if (import.meta.env.DEV) {
  if (!SUPABASE_URL) {
    console.warn('⚠️ VITE_SUPABASE_URL no está configurado. Las funciones de Melodías no funcionarán.');
  }
  if (!SUPABASE_PUBLISHABLE_KEY) {
    console.warn('⚠️ VITE_SUPABASE_PUBLISHABLE_KEY no está configurado. Las funciones de Melodías no funcionarán.');
  }
}

// Usar valores vacíos como fallback para que la app no crashee si no hay Supabase
export const supabase = createClient<Database>(
  SUPABASE_URL ?? 'https://placeholder.supabase.co',
  SUPABASE_PUBLISHABLE_KEY ?? 'placeholder-key',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
