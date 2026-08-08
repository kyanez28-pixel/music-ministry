import { useState, useMemo } from 'react';
import {
  useSessions, useScaleLogs, useRhythmPracticeLogs,
  useMelodyPracticeLogs, useMelodies, useScales, useRhythms, useSongs
} from '@/hooks/use-music-data';
import {
  formatDuration, formatDurationLong, getStreak,
  getTodayEC, getMonday, formatDateShort, getMonthMondaySundayWeeks
} from '@/lib/music-utils';
import { CATEGORY_LABELS, ALL_CATEGORIES, type PracticeCategory } from '@/types/music';
import { LoadingCard } from '@/components/ui/LoadingCard';
import { useInstruments } from '@/hooks/use-instruments';
import type { InstrumentDef } from '@/types/music';

export type Period = 'semana' | 'mes' | 'ultimos30' | 'año' | 'todo';

const PERIOD_OPTIONS: { id: Period; label: string; shortLabel: string }[] = [
  { id: 'semana', label: 'Esta Semana', shortLabel: 'Semana' },
  { id: 'mes', label: 'Este Mes', shortLabel: 'Mes' },
  { id: 'ultimos30', label: 'Últimos 30 días', shortLabel: '30 Días' },
  { id: 'año', label: 'Este Año', shortLabel: 'Año' },
  { id: 'todo', label: 'Todo el Historial', shortLabel: 'Todo' },
];

function ProgressBar({ value, max, color = 'bg-gradient-to-r from-amber-500/80 to-primary' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 bg-secondary rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatMini({ label, value, sub, emoji }: { label: string; value: string | number; sub?: string; emoji?: string }) {
  return (
    <div className="stat-card text-center">
      {emoji && <p className="text-2xl mb-1">{emoji}</p>}
      <p className="font-mono text-2xl sm:text-3xl font-extrabold text-amber-300 drop-shadow-sm">{value}</p>
      <p className="text-xs font-semibold text-foreground/90 mt-1">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5 font-medium">{sub}</p>}
    </div>
  );
}

export default function StatsPage() {
  const [sessions = [], , isLoadingSessions] = useSessions();
  const [songs = [], , isLoadingSongs] = useSongs();
  const [scaleLogs = [], , isLoadingScaleLogs] = useScaleLogs();
  const [rhythmLogs = [], , isLoadingRhythmLogs] = useRhythmPracticeLogs();
  const [melodyLogs = [], , isLoadingMelodyLogs] = useMelodyPracticeLogs();
  const [melodies = [], , isLoadingMelodies] = useMelodies();
  const [scales = [], , isLoadingScalesData] = useScales();
  const [rhythms = [], , isLoadingRhythms] = useRhythms();
  const [period, setPeriod] = useState<Period>('mes');
  const { instruments } = useInstruments();

  const today = getTodayEC();

  const isLoading =
    isLoadingSessions || isLoadingSongs || isLoadingScaleLogs ||
    isLoadingRhythmLogs || isLoadingMelodyLogs || isLoadingMelodies ||
    isLoadingScalesData || isLoadingRhythms;

  const periodInfo = useMemo(() => {
    const now = new Date(today + 'T12:00:00');

    if (period === 'semana') {
      const mon = getMonday(now);
      const startStr = mon.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
      const sun = new Date(mon);
      sun.setDate(sun.getDate() + 6);
      const endStr = sun.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
      const subLabel = `esta semana (${mon.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })} – ${sun.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })})`;
      return { startStr, endStr, subLabel, mode: 'semana' as const, mon, sun };
    }

    if (period === 'mes') {
      const y = now.getFullYear();
      const m = now.getMonth();
      const startStr = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      const endStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const monthName = now.toLocaleDateString('es-EC', { month: 'long' });
      const subLabel = `este mes (${monthName} ${y})`;
      return { startStr, endStr, subLabel, mode: 'mes' as const, year: y, month: m, lastDay };
    }

    if (period === 'ultimos30') {
      const past = new Date(now);
      past.setDate(past.getDate() - 29);
      const startStr = past.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
      const endStr = today;
      const subLabel = `últimos 30 días (${past.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })} – ${now.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })})`;
      return { startStr, endStr, subLabel, mode: 'ultimos30' as const, past };
    }

    if (period === 'año') {
      const y = now.getFullYear();
      const startStr = `${y}-01-01`;
      const endStr = `${y}-12-31`;
      const subLabel = `este año (${y})`;
      return { startStr, endStr, subLabel, mode: 'año' as const, year: y };
    }

    return { startStr: '1970-01-01', endStr: '2099-12-31', subLabel: 'en total', mode: 'todo' as const };
  }, [period, today]);

  const inPeriod = (date: string) => date >= periodInfo.startStr && date <= periodInfo.endStr;

  const filteredSessions = useMemo(() =>
    (sessions || []).filter(s => s.date && inPeriod(s.date)), [sessions, periodInfo]);
  const filteredScaleLogs = useMemo(() =>
    (scaleLogs || []).filter((l: any) => l.date && inPeriod(l.date)), [scaleLogs, periodInfo]);
  const filteredRhythmLogs = useMemo(() =>
    (rhythmLogs || []).filter((l: any) => l.date && inPeriod(l.date)), [rhythmLogs, periodInfo]);
  const filteredMelodyLogs = useMemo(() =>
    (melodyLogs || []).filter((l: any) => l.date && inPeriod(l.date)), [melodyLogs, periodInfo]);

  const totalMinutes = filteredSessions.reduce((s, x) => s + x.durationMinutes, 0);
  const avgMinutes = filteredSessions.length > 0 ? Math.round(totalMinutes / filteredSessions.length) : 0;
  const uniqueDays = new Set(filteredSessions.map(s => s.date)).size;
  const streak = getStreak(sessions || []);
  const bestSession = filteredSessions.reduce<any>((best, s) =>
    !best || s.durationMinutes > best.durationMinutes ? s : best, null);

  const uniqueScalesCount = new Set(filteredScaleLogs.map((l: any) => l.scale_id)).size;
  const uniqueRhythmsCount = new Set(filteredRhythmLogs.map((l: any) => l.rhythm_id)).size;
  const uniqueMelodiesCount = new Set(filteredMelodyLogs.map((l: any) => l.melody_id)).size;

  const categoryMinutes = useMemo(() => {
    const map: Record<string, number> = {};
    ALL_CATEGORIES.forEach(c => { map[c] = 0; });
    filteredSessions.forEach(s => {
      const perCat = s.durationMinutes / (s.categories.length || 1);
      s.categories.forEach(c => { map[c] = (map[c] || 0) + perCat; });
    });
    return map as Record<PracticeCategory, number>;
  }, [filteredSessions]);

  const maxCatMinutes = Math.max(...Object.values(categoryMinutes), 1);
  const activeCats = ALL_CATEGORIES.filter(c => categoryMinutes[c] > 0)
    .sort((a, b) => categoryMinutes[b] - categoryMinutes[a]);

  const activityData = useMemo(() => {
    if (periodInfo.mode === 'semana') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(periodInfo.mon);
        d.setDate(d.getDate() + i);
        const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
        const mins = filteredSessions.filter(s => s.date === dateStr).reduce((sum, s) => sum + s.durationMinutes, 0);
        const scaleCount = filteredScaleLogs.filter((l: any) => l.date === dateStr).length;
        const melodyCount = filteredMelodyLogs.filter((l: any) => l.date === dateStr).length;
        const rhythmCount = filteredRhythmLogs.filter((l: any) => l.date === dateStr).length;
        return {
          label: d.toLocaleDateString('es-EC', { weekday: 'short', timeZone: 'America/Guayaquil' }),
          subLabel: `${d.getDate()}`,
          minutes: mins,
          isToday: dateStr === today,
          scaleCount, melodyCount, rhythmCount,
          hasStudy: scaleCount + melodyCount + rhythmCount > 0,
        };
      });
    }

    if (periodInfo.mode === 'mes') {
      const weeks = getMonthMondaySundayWeeks(periodInfo.year, periodInfo.month, today);

      return weeks.map((w) => {
        const mins = filteredSessions
          .filter(s => s.date >= w.startStr && s.date <= w.endStr)
          .reduce((sum, s) => sum + s.durationMinutes, 0);
        const scaleCount = filteredScaleLogs.filter((l: any) => l.date >= w.startStr && l.date <= w.endStr).length;
        const melodyCount = filteredMelodyLogs.filter((l: any) => l.date >= w.startStr && l.date <= w.endStr).length;
        const rhythmCount = filteredRhythmLogs.filter((l: any) => l.date >= w.startStr && l.date <= w.endStr).length;

        return {
          label: w.label,
          subLabel: w.subLabel,
          minutes: mins,
          isToday: w.isCurrentWeek,
          scaleCount, melodyCount, rhythmCount,
          hasStudy: scaleCount + melodyCount + rhythmCount > 0,
        };
      });
    }

    if (periodInfo.mode === 'ultimos30') {
      // 5 semanas continuas de lunes a domingo
      const now = new Date(today + 'T12:00:00');
      const thisMonday = getMonday(now);
      const weeks = Array.from({ length: 5 }, (_, idx) => {
        const i = 4 - idx; // 4, 3, 2, 1, 0
        const m = new Date(thisMonday);
        m.setDate(m.getDate() - i * 7);
        const sun = new Date(m);
        sun.setDate(sun.getDate() + 6);
        const startStr = m.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
        const endStr = sun.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
        const subLabel = `${m.getDate()} ${m.toLocaleDateString('es-EC', { month: 'short' })}–${sun.getDate()} ${sun.toLocaleDateString('es-EC', { month: 'short' })}`;
        const isCurrentWeek = today >= startStr && today <= endStr;
        return { label: `Sem ${idx + 1}`, subLabel, startStr, endStr, isCurrentWeek };
      });

      return weeks.map(w => {
        const mins = filteredSessions.filter(s => s.date >= w.startStr && s.date <= w.endStr)
          .reduce((sum, s) => sum + s.durationMinutes, 0);
        const scaleCount = filteredScaleLogs.filter((l: any) => l.date >= w.startStr && l.date <= w.endStr).length;
        const melodyCount = filteredMelodyLogs.filter((l: any) => l.date >= w.startStr && l.date <= w.endStr).length;
        const rhythmCount = filteredRhythmLogs.filter((l: any) => l.date >= w.startStr && l.date <= w.endStr).length;

        return {
          label: w.label,
          subLabel: w.subLabel,
          minutes: mins,
          isToday: w.isCurrentWeek,
          scaleCount, melodyCount, rhythmCount,
          hasStudy: scaleCount + melodyCount + rhythmCount > 0,
        };
      });
    }

    if (periodInfo.mode === 'año') {
      const y = periodInfo.year;
      return Array.from({ length: 12 }, (_, idx) => {
        const m = idx + 1;
        const prefix = `${y}-${String(m).padStart(2, '0')}`;
        const d = new Date(y, idx, 15);
        const mins = filteredSessions.filter(s => s.date.startsWith(prefix)).reduce((sum, s) => sum + s.durationMinutes, 0);
        const currentMonthIdx = new Date(today + 'T12:00:00').getMonth();
        return {
          label: d.toLocaleDateString('es-EC', { month: 'short' }),
          subLabel: '',
          minutes: mins,
          isToday: idx === currentMonthIdx,
          scaleCount: 0, melodyCount: 0, rhythmCount: 0,
          hasStudy: false,
        };
      });
    }

    const now = new Date(today + 'T12:00:00');
    return Array.from({ length: 12 }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 15);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mins = filteredSessions.filter(s => s.date.startsWith(prefix)).reduce((sum, s) => sum + s.durationMinutes, 0);
      return {
        label: d.toLocaleDateString('es-EC', { month: 'short' }),
        subLabel: `${d.getFullYear().toString().slice(2)}`,
        minutes: mins,
        isToday: idx === 11,
        scaleCount: 0, melodyCount: 0, rhythmCount: 0,
        hasStudy: false,
      };
    });
  }, [periodInfo, filteredSessions, filteredScaleLogs, filteredMelodyLogs, filteredRhythmLogs, today]);

  const maxActivity = Math.max(...activityData.map(d => d.minutes), 1);

  const buildTop = (logs: any[], idKey: string, catalog: any[]) =>
    Object.entries(
      logs.reduce<Record<string, number>>((acc, l) => { acc[l[idKey]] = (acc[l[idKey]] || 0) + 1; return acc; }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id, count]) => ({ name: (catalog || []).find((x: any) => x.id === id)?.name || id, count: count as number }));

  const topScales = useMemo(() => buildTop(filteredScaleLogs, 'scale_id', scales), [filteredScaleLogs, scales]);
  const topMelodies = useMemo(() => buildTop(filteredMelodyLogs, 'melody_id', melodies), [filteredMelodyLogs, melodies]);
  const topRhythms = useMemo(() => buildTop(filteredRhythmLogs, 'rhythm_id', rhythms), [filteredRhythmLogs, rhythms]);

  const practicedSongs = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSessions.forEach(s => {
      if (s.notes?.startsWith('Repaso setlist: ')) {
        const title = s.notes.replace('Repaso setlist: ', '');
        counts[title] = (counts[title] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredSessions]);

  const melodyByStatus = useMemo(() => {
    const all = melodies || [];
    return {
      dominada: all.filter((m: any) => m.status === 'dominada').length,
      practicando: all.filter((m: any) => m.status === 'practicando').length,
      aprendiendo: all.filter((m: any) => m.status === 'aprendiendo').length,
      total: all.length,
    };
  }, [melodies]);

  const achievements = useMemo(() => [
    { emoji: '🔥', label: '7 días de racha', earned: streak.current >= 7 },
    { emoji: '🏆', label: '30 días de racha', earned: streak.current >= 30 },
    { emoji: '⏱️', label: '10 hrs totales', earned: (sessions || []).reduce((s, x) => s + x.durationMinutes, 0) >= 600 },
    { emoji: '🎵', label: '5 melodías dominadas', earned: melodyByStatus.dominada >= 5 },
    { emoji: '🎼', label: '10 escalas practicadas', earned: new Set((scaleLogs || []).map((l: any) => l.scale_id)).size >= 10 },
    { emoji: '🥁', label: '5 ritmos practicados', earned: new Set((rhythmLogs || []).map((l: any) => l.rhythm_id)).size >= 5 },
    { emoji: '📚', label: '50 sesiones', earned: (sessions || []).length >= 50 },
    { emoji: '🌟', label: '100 sesiones', earned: (sessions || []).length >= 100 },
  ], [streak, sessions, melodyByStatus, scaleLogs, rhythmLogs]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 bg-white/5 rounded-lg animate-pulse" />
        <LoadingCard /><LoadingCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">📊 Estadísticas</h1>
          <p className="text-sm text-muted-foreground mt-1">Resumen detallado de tu práctica musical</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setPeriod(opt.id)}
              className={`chip text-xs font-semibold ${period === opt.id ? 'chip-active shadow-sm' : ''}`}
            >
              {opt.shortLabel}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatMini label="Tiempo total" value={formatDurationLong(totalMinutes)} sub={periodInfo.subLabel} emoji="⏱️" />
        <StatMini label="Sesiones" value={filteredSessions.length} sub={periodInfo.subLabel} emoji="📋" />
        <StatMini label="Días activos" value={uniqueDays} sub={periodInfo.subLabel} emoji="📅" />
        <StatMini label="Promedio/sesión" value={formatDuration(avgMinutes)} sub="por sesión" emoji="📈" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <p className="text-3xl mb-1">🎼</p>
          <p className="font-mono text-3xl font-extrabold text-blue-400 drop-shadow-sm">{filteredScaleLogs.length}</p>
          <p className="text-xs font-semibold text-foreground/90 mt-1">
            {filteredScaleLogs.length === 1 ? 'práctica de escalas' : 'prácticas de escalas'}
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            {uniqueScalesCount} {uniqueScalesCount === 1 ? 'escala distinta' : 'escalas distintas'}
          </p>
        </div>
        <div className="stat-card text-center">
          <p className="text-3xl mb-1">🎵</p>
          <p className="font-mono text-3xl font-extrabold text-green-400 drop-shadow-sm">{filteredMelodyLogs.length}</p>
          <p className="text-xs font-semibold text-foreground/90 mt-1">
            {filteredMelodyLogs.length === 1 ? 'práctica de melodías' : 'prácticas de melodías'}
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            {uniqueMelodiesCount} {uniqueMelodiesCount === 1 ? 'melodía distinta' : 'melodías distintas'}
          </p>
        </div>
        <div className="stat-card text-center">
          <p className="text-3xl mb-1">🥁</p>
          <p className="font-mono text-3xl font-extrabold text-orange-400 drop-shadow-sm">{filteredRhythmLogs.length}</p>
          <p className="text-xs font-semibold text-foreground/90 mt-1">
            {filteredRhythmLogs.length === 1 ? 'práctica de ritmos' : 'prácticas de ritmos'}
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            {uniqueRhythmsCount} {uniqueRhythmsCount === 1 ? 'ritmo distinto' : 'ritmos distintos'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="stat-card flex items-center gap-4">
          <span className="text-4xl">🔥</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-400">Racha actual</p>
            <p className="font-mono text-3xl sm:text-4xl font-extrabold text-foreground">
              {streak.current} <span className="text-base font-medium text-muted-foreground">{streak.current === 1 ? 'día' : 'días'}</span>
            </p>
            <p className="text-xs font-semibold text-foreground/80 mt-0.5">Mejor racha: {streak.best} {streak.best === 1 ? 'día' : 'días'}</p>
          </div>
        </div>
        {bestSession ? (
          <div className="stat-card flex items-center gap-4">
            <span className="text-4xl">🏆</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Mejor sesión del período</p>
              <p className="font-mono text-3xl sm:text-4xl font-extrabold text-amber-300">{formatDurationLong(bestSession.durationMinutes)}</p>
              <p className="text-xs font-semibold text-foreground/80 mt-0.5">
                {instruments.find((i: InstrumentDef) => i.id === bestSession.instrument)?.emoji || '🎼'} {formatDateShort(bestSession.date)} {'★'.repeat(bestSession.rating)}
              </p>
            </div>
          </div>
        ) : (
          <div className="stat-card flex items-center justify-center text-muted-foreground text-sm font-medium">Sin sesiones en este período</div>
        )}
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="section-title text-base">
            Actividad {period === 'semana' ? 'diaria' : period === 'mes' || period === 'ultimos30' ? 'por semanas' : 'mensual'}
          </h3>
          <span className="text-xs font-mono font-medium text-muted-foreground">
            {periodInfo.subLabel}
          </span>
        </div>
        <div className="flex items-end gap-2 h-44 pt-2 pb-1">
          {activityData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 relative group">
              <span className={`text-xs font-mono font-bold ${d.minutes > 0 ? 'text-amber-300' : 'text-muted-foreground/30'}`}>
                {d.minutes > 0 ? formatDuration(d.minutes) : '—'}
              </span>
              <div
                className={`w-full rounded-t-md transition-all duration-500 ${d.isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-card' : ''}`}
                style={{
                  height: `${Math.max((d.minutes / maxActivity) * 95, d.minutes > 0 ? 8 : 4)}px`,
                  background: d.minutes > 0
                    ? `linear-gradient(to top, hsl(42 75% 45%), hsl(42 75% 58%))`
                    : 'hsl(var(--secondary))',
                  boxShadow: d.minutes > 0 ? '0 0 12px rgba(245,158,11,0.25)' : 'none',
                }}
              />
              {d.hasStudy && (
                <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex gap-1">
                  {d.scaleCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm" />}
                  {d.melodyCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-sm" />}
                  {d.rhythmCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-sm" />}
                </div>
              )}
              <div className="text-center leading-none">
                <span className={`text-xs font-mono font-bold uppercase block ${d.isToday ? 'text-primary' : 'text-foreground/80'}`}>
                  {d.label}
                </span>
                {d.subLabel && (
                  <span className="text-[10px] text-muted-foreground block mt-0.5 font-mono">
                    {d.subLabel}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {activityData.some(d => d.hasStudy) && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
            <p className="text-xs font-semibold text-muted-foreground">Estudio marcado:</p>
            {[{ color: 'bg-blue-400', label: 'Escalas' }, { color: 'bg-green-400', label: 'Melodías' }, { color: 'bg-orange-400', label: 'Ritmos' }].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs font-semibold text-foreground/85">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalMinutes > 0 && (
        <div className="stat-card">
          <h3 className="section-title mb-4">Por instrumento</h3>
          <div className="space-y-3">
            {instruments.map((inst: InstrumentDef) => {
              const mins = filteredSessions.filter(s => s.instrument === inst.id).reduce((sum, s) => sum + s.durationMinutes, 0);
              if (mins === 0) return null;
              return (
                <div key={inst.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-foreground/95">{inst.emoji} {inst.name}</span>
                    <span className="font-mono font-bold text-amber-300">
                      {formatDurationLong(mins)} · {Math.round((mins / totalMinutes) * 100)}%
                    </span>
                  </div>
                  <ProgressBar value={mins} max={totalMinutes} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeCats.length > 0 && (
        <div className="stat-card">
          <h3 className="section-title mb-4">Por categoría de práctica</h3>
          <div className="space-y-3">
            {activeCats.map(cat => (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground/95">{CATEGORY_LABELS[cat]}</span>
                  <span className="font-mono font-bold text-amber-300">{formatDuration(Math.round(categoryMinutes[cat]))}</span>
                </div>
                <ProgressBar value={categoryMinutes[cat]} max={maxCatMinutes} />
              </div>
            ))}
          </div>
        </div>
      )}

      {(topScales.length > 0 || topMelodies.length > 0 || topRhythms.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {topScales.length > 0 && (
            <div className="stat-card">
              <h3 className="section-title text-sm mb-3">🎼 Escalas más practicadas</h3>
              <div className="space-y-2">
                {topScales.map(({ name, count }, i) => (
                  <div key={name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono font-bold text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-xs font-semibold text-foreground/90 truncate">{name}</span>
                    </div>
                    <span className="shrink-0 bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">{count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {topMelodies.length > 0 && (
            <div className="stat-card">
              <h3 className="section-title text-sm mb-3">🎵 Melodías más practicadas</h3>
              <div className="space-y-2">
                {topMelodies.map(({ name, count }, i) => (
                  <div key={name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono font-bold text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-xs font-semibold text-foreground/90 truncate">{name}</span>
                    </div>
                    <span className="shrink-0 bg-green-500/15 border border-green-500/25 text-green-400 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">{count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {topRhythms.length > 0 && (
            <div className="stat-card">
              <h3 className="section-title text-sm mb-3">🥁 Ritmos más practicados</h3>
              <div className="space-y-2">
                {topRhythms.map(({ name, count }, i) => (
                  <div key={name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono font-bold text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-xs font-semibold text-foreground/90 truncate">{name}</span>
                    </div>
                    <span className="shrink-0 bg-orange-500/15 border border-orange-500/25 text-orange-400 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">{count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {melodyByStatus.total > 0 && (
        <div className="stat-card">
          <h3 className="section-title mb-4">Progreso del repertorio de melodías</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="font-mono text-2xl sm:text-3xl font-extrabold text-green-400">{melodyByStatus.dominada}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-green-300 mt-0.5">✅ Dominadas</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="font-mono text-2xl sm:text-3xl font-extrabold text-blue-400">{melodyByStatus.practicando}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-300 mt-0.5">🎯 Practicando</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="font-mono text-2xl sm:text-3xl font-extrabold text-yellow-400">{melodyByStatus.aprendiendo}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-yellow-300 mt-0.5">🔄 Aprendiendo</p>
            </div>
          </div>
          <div className="h-3 rounded-full overflow-hidden flex bg-secondary">
            {melodyByStatus.dominada > 0 && <div className="bg-green-500 transition-all duration-700" style={{ width: `${(melodyByStatus.dominada / melodyByStatus.total) * 100}%` }} />}
            {melodyByStatus.practicando > 0 && <div className="bg-blue-500 transition-all duration-700" style={{ width: `${(melodyByStatus.practicando / melodyByStatus.total) * 100}%` }} />}
            {melodyByStatus.aprendiendo > 0 && <div className="bg-yellow-500 transition-all duration-700" style={{ width: `${(melodyByStatus.aprendiendo / melodyByStatus.total) * 100}%` }} />}
          </div>
          <p className="text-xs font-semibold text-foreground/80 mt-2 text-right">{melodyByStatus.total} melodías en total</p>
        </div>
      )}

      {practicedSongs.length > 0 && (
        <div className="stat-card">
          <h3 className="section-title mb-4">Canciones más repasadas (setlist)</h3>
          <div className="space-y-2">
            {practicedSongs.map(([title, count]) => (
              <div key={title} className="flex items-center justify-between py-1.5 border-b border-white/10 last:border-0">
                <span className="text-sm font-semibold text-foreground">{title}</span>
                <span className="bg-primary/15 border border-primary/25 text-primary text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {count} {count === 1 ? 'vez' : 'veces'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="stat-card">
        <h3 className="section-title mb-4">🏅 Logros</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {achievements.map(({ emoji, label, earned }) => (
            <div key={label} className={`rounded-xl p-3 text-center border transition-all ${earned ? 'border-primary/40 bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.15)]' : 'border-white/5 bg-secondary/20 opacity-40 grayscale'}`}>
              <p className="text-2xl mb-1">{emoji}</p>
              <p className="text-xs font-semibold text-foreground/90 leading-tight">{label}</p>
              {earned && <p className="text-xs text-amber-300 font-bold mt-1">✓ Conseguido</p>}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
