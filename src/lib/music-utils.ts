import { PracticeSession, Instrument } from '@/types/music';

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback to UUIDv4 spec compliant generation if crypto is missing
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function formatDurationLong(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // getDay: 0=domingo, 1=lunes... queremos que lunes sea inicio
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getTodayEC(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
}

export function formatDate(dateStr: string): string {
  // Añadir T12:00:00 evita problemas de zona horaria al parsear solo fechas
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Guayaquil',
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Guayaquil',
  });
}

export function getStreak(sessions: PracticeSession[]): { current: number; best: number } {
  if (sessions.length === 0) return { current: 0, best: 0 };

  const uniqueDates = [...new Set(sessions.map(s => s.date))].sort();
  const today = getTodayEC();
  const yesterday = new Date(today + 'T12:00:00');
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });

  // Racha actual: contar desde hoy o ayer hacia atrás
  let current = 0;
  const lastDate = uniqueDates[uniqueDates.length - 1];
  
  // Solo cuenta racha si practicó hoy o ayer (no rompe por no practicar hoy todavía)
  if (lastDate === today || lastDate === yesterdayStr) {
    let checkDate = new Date(lastDate + 'T12:00:00');
    const dateSet = new Set(uniqueDates);

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
      if (dateSet.has(dateStr)) {
        current++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Mejor racha histórica
  let best = 0;
  let streak = 0;

  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const prev = new Date(uniqueDates[i - 1] + 'T12:00:00');
      const curr = new Date(uniqueDates[i] + 'T12:00:00');
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      streak = diffDays === 1 ? streak + 1 : 1;
    }
    best = Math.max(best, streak);
  }

  // Si la racha actual supera la histórica (puede pasar si best no se actualizó)
  best = Math.max(best, current);

  return { current, best };
}

export function getTotalMinutes(sessions: PracticeSession[], instrument?: Instrument): number {
  const filtered = instrument ? sessions.filter(s => s.instrument === instrument) : sessions;
  return filtered.reduce((sum, s) => sum + s.durationMinutes, 0);
}

export function getSessionCount(sessions: PracticeSession[], instrument?: Instrument): number {
  return instrument ? sessions.filter(s => s.instrument === instrument).length : sessions.length;
}

/** Devuelve los días únicos practicados en el último N días */
export function getActiveDaysInLastN(sessions: PracticeSession[], n: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - n);
  const cutoffStr = cutoff.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
  return new Set(sessions.filter(s => s.date >= cutoffStr).map(s => s.date)).size;
}

export function parseChord(chord: string) {
  const m = chord.match(/^([A-G][#b]?)(.*)/);
  if (!m) return null;
  const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flat: Record<string,string> = { Db:'C#', Eb:'D#', Gb:'F#', Ab:'G#', Bb:'A#' };
  const root = flat[m[1]] ?? m[1];
  const rootIdx = CHROMATIC.indexOf(root);
  return rootIdx === -1 ? null : { rootIdx, type: m[2] };
}

export function getDegree(chord: string, keyRoot: string) {
  const c = parseChord(chord);
  const k = parseChord(keyRoot);
  if (!c || !k) return '';
  const diff = (c.rootIdx - k.rootIdx + 12) % 12;
  const degrees = ['I', 'bII', 'II', 'bIII', 'III', 'IV', 'bV', 'V', 'bVI', 'VI', 'bVII', 'VII'];
  let deg = degrees[diff];
  if (c.type.startsWith('m') && !c.type.startsWith('maj')) deg = deg.toLowerCase();
  return deg;
}
