export const NOTES = ['Do', 'Do#/Re♭', 'Re', 'Re#/Mi♭', 'Mi', 'Fa', 'Fa#/Sol♭', 'Sol', 'Sol#/La♭', 'La', 'La#/Si♭', 'Si'] as const;
export type NoteName = typeof NOTES[number];

/** Spanish → English note mapping (keeps IDs stable) */
export const NOTE_EN: Record<string, string> = {
  'Do': 'C', 'Do#/Re♭': 'C#/D♭', 'Re': 'D', 'Re#/Mi♭': 'D#/E♭',
  'Mi': 'E', 'Fa': 'F', 'Fa#/Sol♭': 'F#/G♭', 'Sol': 'G',
  'Sol#/La♭': 'G#/A♭', 'La': 'A', 'La#/Si♭': 'A#/B♭', 'Si': 'B',
};

const CHROMATIC_DISPLAY = ['C','C#/D♭','D','D#/E♭','E','F','F#/G♭','G','G#/A♭','A','A#/B♭','B'];
const CHROMATIC_SHARP   = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

export const NOTES_EN = CHROMATIC_DISPLAY as readonly string[];

export interface PredefinedScale {
  id: string;
  note: NoteName;
  noteEN: string;
  scaleType: string;
  label: string;
  labelEN: string;
}

const SCALE_TYPES_DEF = [
  { key: 'mayor',             label: 'Mayor',             labelEN: 'Major' },
  { key: 'menor_natural',     label: 'Menor Natural',     labelEN: 'Natural Minor' },
  { key: 'menor_armonica',    label: 'Menor Armónica',    labelEN: 'Harmonic Minor' },
  { key: 'menor_melodica',    label: 'Menor Melódica',    labelEN: 'Melodic Minor' },
  { key: 'pentatonica_mayor', label: 'Pentatónica Mayor', labelEN: 'Major Pentatonic' },
  { key: 'pentatonica_menor', label: 'Pentatónica Menor', labelEN: 'Minor Pentatonic' },
  { key: 'blues',             label: 'Blues',             labelEN: 'Blues' },
  { key: 'dorica',            label: 'Dórica',            labelEN: 'Dorian' },
  { key: 'frigia',            label: 'Frigia',            labelEN: 'Phrygian' },
  { key: 'lidia',             label: 'Lidia',             labelEN: 'Lydian' },
  { key: 'mixolidia',         label: 'Mixolidia',         labelEN: 'Mixolydian' },
  { key: 'locria',            label: 'Locria',            labelEN: 'Locrian' },
] as const;

export const SCALE_TYPE_OPTIONS = SCALE_TYPES_DEF.map(t => ({ value: t.key, label: t.label, labelEN: t.labelEN }));

export const PREDEFINED_SCALES: PredefinedScale[] = NOTES.flatMap((note, idx) =>
  SCALE_TYPES_DEF.map(type => ({
    id: `${note}-${type.key}`,
    note,
    noteEN: CHROMATIC_DISPLAY[idx],
    scaleType: type.key,
    label: `${CHROMATIC_DISPLAY[idx]} ${type.label}`,
    labelEN: `${CHROMATIC_DISPLAY[idx]} ${type.labelEN}`,
  }))
);

// ─── Scale theory data ────────────────────────────────────────────────────────

export const SCALE_THEORY: Record<string, {
  steps: string[]; semitones: number[]; degrees: string[]; chords?: string[];
  description: string; color: string; label: string;
}> = {
  mayor: {
    steps: ['T','T','S','T','T','T','S'], semitones: [2,2,1,2,2,2,1],
    degrees: ['1','2','3','4','5','6','7'], chords: ['','m','m','','','m','dim'],
    description: 'Base de la música occidental. Brillante, feliz, inspiradora. Usada en todos los géneros.',
    color: '#4ade80', label: 'Mayor',
  },
  menor_natural: {
    steps: ['T','S','T','T','S','T','T'], semitones: [2,1,2,2,1,2,2],
    degrees: ['1','2','♭3','4','5','♭6','♭7'], chords: ['m','dim','','m','m','',''],
    description: 'Oscura, emocional, melancólica. La menor relativa. Base del clásico, rock y pop.',
    color: '#60a5fa', label: 'Menor Natural',
  },
  menor_armonica: {
    steps: ['T','S','T','T','S','A','S'], semitones: [2,1,2,2,1,3,1],
    degrees: ['1','2','♭3','4','5','♭6','7'], chords: ['m','dim','aug','m','','','dim'],
    description: 'La séptima mayor crea tensión dramática. Usada en clásico, flamenco y metal.',
    color: '#a78bfa', label: 'Menor Armónica',
  },
  menor_melodica: {
    steps: ['T','S','T','T','T','T','S'], semitones: [2,1,2,2,2,2,1],
    degrees: ['1','2','♭3','4','5','6','7'], chords: ['m','m','aug','','','dim','dim'],
    description: 'Menor de jazz: oscura pero suave. Base de la improvisación en el jazz moderno.',
    color: '#e879f9', label: 'Menor Melódica',
  },
  pentatonica_mayor: {
    steps: ['T','T','A','T','A'], semitones: [2,2,3,2,3],
    degrees: ['1','2','3','5','6'],
    description: '5 notas, sin tensión. Extremadamente versátil en folk, gospel, country y pop.',
    color: '#fb923c', label: 'Pentatónica Mayor',
  },
  pentatonica_menor: {
    steps: ['A','T','T','A','T'], semitones: [3,2,2,3,2],
    degrees: ['1','♭3','4','5','♭7'],
    description: 'Ideal para solos de blues y rock. Fácil de aprender, poderosa para expresarse.',
    color: '#f472b6', label: 'Pentatónica Menor',
  },
  blues: {
    steps: ['A','T','S','S','A','T'], semitones: [3,2,1,1,3,2],
    degrees: ['1','♭3','4','♭5','5','♭7'],
    description: 'Pentatónica menor + nota blue (♭5). Tensión cruda y expresiva. Esencial para blues.',
    color: '#34d399', label: 'Blues',
  },
  dorica: {
    steps: ['T','S','T','T','T','S','T'], semitones: [2,1,2,2,2,1,2],
    degrees: ['1','2','♭3','4','5','6','♭7'], chords: ['m','m','','','m','dim',''],
    description: 'Modo menor con sexta mayor. Dulce pero misteriosa. Común en funk y jazz modal.',
    color: '#fbbf24', label: 'Dórica',
  },
  frigia: {
    steps: ['S','T','T','T','S','T','T'], semitones: [1,2,2,2,1,2,2],
    degrees: ['1','♭2','♭3','4','5','♭6','♭7'], chords: ['m','','','m','dim','','m'],
    description: 'Modo menor con segunda menor. Tensión oscura y exótica. Sonido característico del metal y flamenco.',
    color: '#f87171', label: 'Frigia',
  },
  lidia: {
    steps: ['T','T','T','S','T','T','S'], semitones: [2,2,2,1,2,2,1],
    degrees: ['1','2','3','#4','5','6','7'], chords: ['','','m','dim','','m','m'],
    description: 'Modo mayor con cuarta aumentada. Soñadora, mágica y flotante. Usada en cine y jazz.',
    color: '#67e8f9', label: 'Lidia',
  },
  mixolidia: {
    steps: ['T','T','S','T','T','S','T'], semitones: [2,2,1,2,2,1,2],
    degrees: ['1','2','3','4','5','6','♭7'], chords: ['','m','dim','','m','m',''],
    description: 'Modo mayor con séptima menor. Bluesy y rockera. Fundamental para dominantes.',
    color: '#d4a843', label: 'Mixolidia',
  },
  locria: {
    steps: ['S','T','T','S','T','T','T'], semitones: [1,2,2,1,2,2,2],
    degrees: ['1','♭2','♭3','4','♭5','♭6','♭7'], chords: ['dim','','m','m','','','m'],
    description: 'El modo más inestable y oscuro. Tensión pura, rara vez usada como escala principal.',
    color: '#9ca3af', label: 'Locria',
  },
};

/** Returns the note names of a scale given an English root note and scale type key */
export function getScaleNotes(rootEN: string, scaleType: string): string[] {
  const theory = SCALE_THEORY[scaleType];
  if (!theory) return [rootEN];
  const simple = rootEN.split('/')[0].replace('♭', 'b');
  const flatMap: Record<string,string> = { Db:'C#', Eb:'D#', Gb:'F#', Ab:'G#', Bb:'A#' };
  let idx = CHROMATIC_SHARP.indexOf(flatMap[simple] ?? simple);
  if (idx === -1) idx = 0;
  const notes: string[] = [CHROMATIC_SHARP[idx]];
  for (const s of theory.semitones) { idx = (idx + s) % 12; notes.push(CHROMATIC_SHARP[idx]); }
  return notes;
}

/** Heatmap: 8 representative types shown in columns */
export const HEATMAP_TYPES = [
  'mayor','menor_natural','menor_armonica','pentatonica_menor','blues','dorica','mixolidia','frigia',
] as const;
