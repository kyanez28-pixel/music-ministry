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
    label: `${note} ${type.label}`,
    labelEN: `${CHROMATIC_DISPLAY[idx]} ${type.labelEN}`,
  }))
);

// ─── Scale theory data ────────────────────────────────────────────────────────

export const SCALE_THEORY: Record<string, {
  steps: string[]; semitones: number[]; degrees: string[];
  description: string; color: string; labelEN: string;
}> = {
  mayor: {
    steps: ['T','T','S','T','T','T','S'], semitones: [2,2,1,2,2,2,1],
    degrees: ['1','2','3','4','5','6','7'],
    description: 'Foundation of Western music. Bright, happy, uplifting. Used across all genres.',
    color: '#4ade80', labelEN: 'Major',
  },
  menor_natural: {
    steps: ['T','S','T','T','S','T','T'], semitones: [2,1,2,2,1,2,2],
    degrees: ['1','2','♭3','4','5','♭6','♭7'],
    description: 'Dark, emotional, melancholic. The relative minor. Core of classical, rock and pop.',
    color: '#60a5fa', labelEN: 'Natural Minor',
  },
  menor_armonica: {
    steps: ['T','S','T','T','S','A','S'], semitones: [2,1,2,2,1,3,1],
    degrees: ['1','2','♭3','4','5','♭6','7'],
    description: 'Raised 7th creates dramatic tension. Used in classical, flamenco and metal.',
    color: '#a78bfa', labelEN: 'Harmonic Minor',
  },
  menor_melodica: {
    steps: ['T','S','T','T','T','T','S'], semitones: [2,1,2,2,2,2,1],
    degrees: ['1','2','♭3','4','5','6','7'],
    description: 'Jazz minor: dark yet smooth. Foundation of modern jazz improvisation.',
    color: '#e879f9', labelEN: 'Melodic Minor',
  },
  pentatonica_mayor: {
    steps: ['T','T','A','T','A'], semitones: [2,2,3,2,3],
    degrees: ['1','2','3','5','6'],
    description: '5 notes, no tension. Extremely versatile across folk, gospel, country and pop.',
    color: '#fb923c', labelEN: 'Major Pentatonic',
  },
  pentatonica_menor: {
    steps: ['A','T','T','A','T'], semitones: [3,2,2,3,2],
    degrees: ['1','♭3','4','5','♭7'],
    description: 'Go-to for blues and rock solos. Easy to learn, powerful to express.',
    color: '#f472b6', labelEN: 'Minor Pentatonic',
  },
  blues: {
    steps: ['A','T','S','S','A','T'], semitones: [3,2,1,1,3,2],
    degrees: ['1','♭3','4','♭5','5','♭7'],
    description: 'Minor pentatonic + blue note (♭5). Raw, expressive tension. Essential for blues.',
    color: '#34d399', labelEN: 'Blues',
  },
  dorica: {
    steps: ['T','S','T','T','T','S','T'], semitones: [2,1,2,2,2,1,2],
    degrees: ['1','2','♭3','4','5','6','♭7'],
    description: 'Minor with natural 6th. Warm yet dark. Foundation of jazz and funk.',
    color: '#fbbf24', labelEN: 'Dorian',
  },
  frigia: {
    steps: ['S','T','T','T','S','T','T'], semitones: [1,2,2,2,1,2,2],
    degrees: ['1','♭2','♭3','4','5','♭6','♭7'],
    description: 'Flamenco and metal favorite. The ♭2 gives a Spanish/Arabic flavor.',
    color: '#f87171', labelEN: 'Phrygian',
  },
  lidia: {
    steps: ['T','T','T','S','T','T','S'], semitones: [2,2,2,1,2,2,1],
    degrees: ['1','2','3','#4','5','6','7'],
    description: 'Major with raised 4th. Dreamy, floating quality. Loved by film composers.',
    color: '#67e8f9', labelEN: 'Lydian',
  },
  mixolidia: {
    steps: ['T','T','S','T','T','S','T'], semitones: [2,2,1,2,2,1,2],
    degrees: ['1','2','3','4','5','6','♭7'],
    description: 'Major with flat 7th. Blues-rock workhorse. Core of gospel and classic rock.',
    color: '#d4a843', labelEN: 'Mixolydian',
  },
  locria: {
    steps: ['S','T','T','S','T','T','T'], semitones: [1,2,2,1,2,2,2],
    degrees: ['1','♭2','♭3','4','♭5','♭6','♭7'],
    description: 'Most unstable mode. Diminished quality. Theoretical importance exceeds practical use.',
    color: '#9ca3af', labelEN: 'Locrian',
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
