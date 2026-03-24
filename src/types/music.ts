export type Instrument = string;

export interface InstrumentDef {
  id: string;
  name: string;
  emoji: string;
}

export const DEFAULT_INSTRUMENTS: InstrumentDef[] = [
  { id: 'piano', name: 'Piano', emoji: '🎹' },
  { id: 'guitarra', name: 'Guitarra', emoji: '🎸' },
  { id: 'ukelele', name: 'Ukelele', emoji: '🪗' },
];

export const INSTRUMENT_LABELS: Record<string, string> = {
  piano: '🎹 Piano',
  guitarra: '🎸 Guitarra',
  ukelele: '🪗 Ukelele',
};

export type PracticeCategory =
  | 'escalas' | 'armonias' | 'melodias' | 'ritmos'
  | 'ministerio' | 'acordes' | 'lectura' | 'improvisacion'
  | 'calentamiento' | 'tecnica';

export const CATEGORY_LABELS: Record<PracticeCategory, string> = {
  escalas: '🎼 Escalas',
  armonias: '🎶 Armonías',
  melodias: '🎵 Melodías',
  ritmos: '🥁 Ritmos',
  ministerio: '✝ Ministerio',
  acordes: '🤙 Acordes',
  lectura: '📄 Lectura',
  improvisacion: '✨ Improvisación',
  calentamiento: '🤸 Calentamiento',
  tecnica: '💪 Técnica',
};

export const ALL_CATEGORIES: PracticeCategory[] = Object.keys(CATEGORY_LABELS) as PracticeCategory[];

export interface PracticeSession {
  id: string;
  date: string;
  instrument: Instrument;
  durationMinutes: number;
  categories: PracticeCategory[];
  notes: string;
  rating: number;
  goal: string;
}

export type ScaleType = 'mayor' | 'menor' | 'pentatonica' | 'blues' | 'modo' | 'otro';
export type MasteryLevel = 'no_iniciado' | 'basico' | 'en_progreso' | 'avanzado' | 'dominado';

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  no_iniciado: '🔴 No iniciado',
  basico: '🟠 Básico',
  en_progreso: '🟡 En progreso',
  avanzado: '🔵 Avanzado',
  dominado: '🟢 Dominado',
};

export interface ScaleFolder { id: string; name: string; color: string; }
export interface HarmonyFolder { id: string; name: string; color: string; }
export interface RhythmFolder { id: string; name: string; color: string; }
export interface ExerciseFolder { id: string; name: string; color: string; }

export interface Scale {
  id: string;
  folder_id?: string | null;
  name: string;
  type: ScaleType;
  subtype: string;
  instrument: Instrument | 'ambos';
  mastery: MasteryLevel;
  bpm_current: number;
  bpm_target: number;
  notes: string;
  reference_url: string;
  progress: number;
}

export type HarmonyType = 'progresion' | 'acorde' | 'voicing' | 'cadencia' | 'otro';

export interface Harmony {
  id: string;
  folder_id?: string | null;
  name: string;
  type: HarmonyType;
  description: string;
  notes: string;
}

export type MelodyStatus = 'aprendiendo' | 'practicando' | 'dominada';

export interface Melody {
  id: string;
  folder_id?: string | null;
  name: string;
  instrument: Instrument | 'ambos';
  status: MelodyStatus;
  bpm: number;
  key: string;
  time_signature: string;
  description: string;
  progress: number;
}

export type RhythmType = 'balada' | 'vals' | 'pop' | 'gospel' | 'latino' | 'otro';

export interface Rhythm {
  id: string;
  folder_id?: string | null;
  name: string;
  type: RhythmType;
  description: string;
  bpm: number;
  time_signature: string;
  video_url?: string;
}

export type SongGenre = 'adoracion' | 'alabanza' | 'himno' | 'contemporaneo' | 'instrumental';

export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  genre: SongGenre;
  instrument: Instrument | 'ambos';
  notes: string;
  reference_url: string;
}

export interface MelodyImage {
  id: string;
  melody_id: string;
  storage_path: string;
  file_name: string;
}

export interface RhythmImage {
  id: string;
  rhythm_id: string;
  storage_path: string;
  file_name: string;
}

export interface ScaleImage {
  id: string;
  scale_id: string;
  storage_path: string;
  file_name: string;
}

export interface HarmonyImage {
  id: string;
  harmony_id: string;
  storage_path: string;
  file_name: string;
}

export interface WeeklySetlist {
  id?: string;
  weekStart: string;
  songIds: string[];
  rehearsalNotes: string;
  practicedSongIds?: string[]; // IDs de canciones marcadas como 'repasadas' esta semana
}

export interface ScalePracticeLog {
  scaleId: string;
  date: string;
  instrument: Instrument;
}

export interface HarmonyPracticeLog {
  harmonyId: string;
  date: string;
  instrument: Instrument;
}

export interface RhythmPracticeLog {
  rhythmItemId: string;
  date: string;
  instrument: Instrument;
}

// ─── Exercise Types ────────────────────────────────────────────────────────────

export type ExerciseDifficulty = 'principiante' | 'intermedio' | 'avanzado';
export type ExerciseStatus = 'pendiente' | 'en_progreso' | 'dominado';

export interface ExerciseImage {
  id: string;
  exercise_id: string;
  storage_path: string;
  file_name: string;
}

export interface Exercise {
  id: string;
  folder_id?: string | null;
  title: string;
  category: string;
  instrument: Instrument | 'ambos';
  difficulty: ExerciseDifficulty;
  status: ExerciseStatus;
  bpm: number;
  key: string;
  description: string;
  video_url: string;
  progress: number;
  created_at: string;
  last_practiced: string;
  related_scale_id?: string;    // Opcional: vinculado a una escala específica
  related_harmony_id?: string;  // Opcional: vinculado a una armonía específica
}
