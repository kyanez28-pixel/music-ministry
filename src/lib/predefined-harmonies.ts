export const HARMONY_CATEGORIES = [
  { key: 'progresiones', label: 'Progresiones' },
  { key: 'cadencias', label: 'Cadencias' },
  { key: 'voicings', label: 'Voicings / Inversiones' },
  { key: 'acordes_extendidos', label: 'Acordes Extendidos' },
  { key: 'modulaciones', label: 'Modulaciones' },
] as const;

export type HarmonyCategoryKey = typeof HARMONY_CATEGORIES[number]['key'];

export interface PredefinedHarmony {
  id: string;
  category: HarmonyCategoryKey;
  name: string;
  description: string;
}

export const PREDEFINED_HARMONIES: PredefinedHarmony[] = [
  // Progresiones
  { id: 'prog-I-IV-V-I', category: 'progresiones', name: 'I - IV - V - I', description: 'Progresión clásica mayor' },
  { id: 'prog-I-V-vi-IV', category: 'progresiones', name: 'I - V - vi - IV', description: 'Pop / Adoración moderna' },
  { id: 'prog-vi-IV-I-V', category: 'progresiones', name: 'vi - IV - I - V', description: 'Progresión emotiva / balada' },
  { id: 'prog-I-vi-IV-V', category: 'progresiones', name: 'I - vi - IV - V', description: 'Doo-wop / 50s' },
  { id: 'prog-ii-V-I', category: 'progresiones', name: 'ii - V - I', description: 'Jazz esencial mayor' },
  { id: 'prog-ii-V-i-menor', category: 'progresiones', name: 'ii° - V7 - i (menor)', description: 'Jazz esencial menor' },
  { id: 'prog-I-IV-vi-V', category: 'progresiones', name: 'I - IV - vi - V', description: 'Variación pop/worship' },
  { id: 'prog-I-iii-vi-IV', category: 'progresiones', name: 'I - iii - vi - IV', description: 'Círculo descendente' },
  { id: 'prog-12bar-blues', category: 'progresiones', name: 'Blues 12 compases', description: 'I-I-I-I / IV-IV-I-I / V-IV-I-V' },
  { id: 'prog-i-bVII-bVI-V', category: 'progresiones', name: 'i - ♭VII - ♭VI - V', description: 'Progresión andaluza / flamenco' },
  { id: 'prog-I-bVII-IV', category: 'progresiones', name: 'I - ♭VII - IV', description: 'Rock clásico' },
  { id: 'prog-vi-ii-V-I', category: 'progresiones', name: 'vi - ii - V - I', description: 'Círculo de quintas' },
  { id: 'prog-I-V-IV-V', category: 'progresiones', name: 'I - V - IV - V', description: 'Country / folk' },
  { id: 'prog-i-iv-v', category: 'progresiones', name: 'i - iv - v', description: 'Menor natural básica' },
  { id: 'prog-I-ii-iii-IV', category: 'progresiones', name: 'I - ii - iii - IV', description: 'Ascendente stepwise' },

  // Cadencias
  { id: 'cad-autentica', category: 'cadencias', name: 'Cadencia auténtica (V - I)', description: 'Resolución fuerte y conclusiva' },
  { id: 'cad-plagal', category: 'cadencias', name: 'Cadencia plagal (IV - I)', description: 'Cadencia "Amén"' },
  { id: 'cad-semicadencia', category: 'cadencias', name: 'Semicadencia (? - V)', description: 'Cadencia suspensiva' },
  { id: 'cad-rota', category: 'cadencias', name: 'Cadencia rota (V - vi)', description: 'Cadencia deceptiva / engañosa' },
  { id: 'cad-frigia', category: 'cadencias', name: 'Cadencia frigia (♭II - I)', description: 'Sonido flamenco / modal' },
  { id: 'cad-picarda', category: 'cadencias', name: 'Tercera de Picardía (iv - I)', description: 'Menor resuelve a mayor' },

  // Voicings / Inversiones
  { id: 'voic-triada-raiz', category: 'voicings', name: 'Tríadas en posición raíz', description: 'Fundamental en el bajo' },
  { id: 'voic-1ra-inv', category: 'voicings', name: 'Tríadas 1ª inversión', description: '3ra en el bajo' },
  { id: 'voic-2da-inv', category: 'voicings', name: 'Tríadas 2ª inversión', description: '5ta en el bajo' },
  { id: 'voic-septima-raiz', category: 'voicings', name: 'Acordes 7ma posición raíz', description: 'Cuatríadas fundamentales' },
  { id: 'voic-drop2', category: 'voicings', name: 'Voicings Drop 2', description: 'Segunda nota más aguda baja una octava' },
  { id: 'voic-drop3', category: 'voicings', name: 'Voicings Drop 3', description: 'Tercera nota más aguda baja una octava' },
  { id: 'voic-shell', category: 'voicings', name: 'Shell voicings (3ra + 7ma)', description: 'Voicings mínimos jazz' },
  { id: 'voic-spread', category: 'voicings', name: 'Voicings abiertos', description: 'Notas separadas por más de una octava' },
  { id: 'voic-close', category: 'voicings', name: 'Voicings cerrados', description: 'Todas las notas dentro de una octava' },

  // Acordes Extendidos
  { id: 'ext-maj7', category: 'acordes_extendidos', name: 'Acorde Maj7', description: 'Mayor con séptima mayor' },
  { id: 'ext-min7', category: 'acordes_extendidos', name: 'Acorde min7', description: 'Menor con séptima menor' },
  { id: 'ext-dom7', category: 'acordes_extendidos', name: 'Acorde 7 (dominante)', description: 'Mayor con séptima menor' },
  { id: 'ext-dim7', category: 'acordes_extendidos', name: 'Acorde dim7', description: 'Disminuido con séptima disminuida' },
  { id: 'ext-m7b5', category: 'acordes_extendidos', name: 'Acorde m7♭5 (semidim)', description: 'Medio disminuido' },
  { id: 'ext-9', category: 'acordes_extendidos', name: 'Acorde 9', description: 'Dominante con novena' },
  { id: 'ext-maj9', category: 'acordes_extendidos', name: 'Acorde Maj9', description: 'Mayor 7 con novena' },
  { id: 'ext-min9', category: 'acordes_extendidos', name: 'Acorde min9', description: 'Menor 7 con novena' },
  { id: 'ext-11', category: 'acordes_extendidos', name: 'Acorde 11', description: 'Con oncena' },
  { id: 'ext-13', category: 'acordes_extendidos', name: 'Acorde 13', description: 'Con trecena' },
  { id: 'ext-sus2', category: 'acordes_extendidos', name: 'Acorde sus2', description: 'Suspendido en segunda' },
  { id: 'ext-sus4', category: 'acordes_extendidos', name: 'Acorde sus4', description: 'Suspendido en cuarta' },
  { id: 'ext-add9', category: 'acordes_extendidos', name: 'Acorde add9', description: 'Tríada con novena agregada' },
  { id: 'ext-6', category: 'acordes_extendidos', name: 'Acorde 6', description: 'Mayor con sexta' },
  { id: 'ext-min6', category: 'acordes_extendidos', name: 'Acorde min6', description: 'Menor con sexta' },

  // Modulaciones
  { id: 'mod-medio-tono', category: 'modulaciones', name: 'Modulación ½ tono arriba', description: 'Ascenso cromático clásico' },
  { id: 'mod-tono-arriba', category: 'modulaciones', name: 'Modulación 1 tono arriba', description: 'Cambio de tonalidad por tono entero' },
  { id: 'mod-relativo-menor', category: 'modulaciones', name: 'Mayor → relativo menor', description: 'Usando acorde pivote' },
  { id: 'mod-relativo-mayor', category: 'modulaciones', name: 'Menor → relativo mayor', description: 'Usando acorde pivote' },
  { id: 'mod-dominante-sec', category: 'modulaciones', name: 'Dominante secundaria (V/V)', description: 'Tonicización temporal' },
  { id: 'mod-directa', category: 'modulaciones', name: 'Modulación directa', description: 'Cambio abrupto sin preparación' },
];
