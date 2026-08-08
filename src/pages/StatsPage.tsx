import { useState, useMemo } from 'react';
import {
  useSessions, useScaleLogs, useRhythmPracticeLogs,
  useMelodyPracticeLogs, useMelodies, useScales, useRhythms, useSongs
} from '@/hooks/use-music-data';
import {
  formatDuration, formatDurationLong, getStreak,
  getActiveDaysInLastN, getTodayEC
} from '@/lib/music-utils';
import { CATEGORY_LABELS, ALL_CATEGORIES, type PracticeCategory } from '@/types/music';
import { LoadingCard } from '@/components/ui/LoadingCard';
import { useInstruments } from '@/hooks/use-instruments';
import type { InstrumentDef } from '@/types/music';

type Period = 'semana' | 'mes' | 'año' | 'todo';

const PERIOD_DAYS: Record<Period, number | null> = {
  semana: 7, mes: 30, año: 365, todo: null,
};

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

  const cutoffDate = useMemo(() => {
    const days = PERIOD_DAYS[period];
    if (!days) return null;
    const d = new Date(today + 'T00:00:00');
    d.setDate(d.getDate() - days);
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
  }, [period, today]);

  const inPeriod = (date: string) => !cutoffDate || date >= cutoffDate;

  const filteredSessions = useMemo(() =>
    (sessions || []).filter(s => inPeriod(s.date)), [sessions, cutoffDate]);
  const filteredScaleLogs = useMemo(() =>
    (scaleLogs || []).filter((l: any) => inPeriod(l.date)), [scaleLogs, cutoffDate]);
  const filteredRhythmLogs = useMemo(() =>
    (rhythmLogs || []).filter((l: any) => inPeriod(l.date)), [rhythmLogs, cutoffDate]);
  const filteredMelodyLogs = useMemo(() =>
    (melodyLogs || []).filter((l: any) => inPeriod(l.date)), [melodyLogs, cutoffDate]);

  const totalMinutes = filteredSessions.reduce((s, x) => s + x.durationMinutes, 0);
  const avgMinutes = filteredSessions.length > 0 ? Math.round(totalMinutes / filteredSessions.length) : 0;
  const uniqueDays = new Set(filteredSessions.map(s => s.date)).size;
  const days = PERIOD_DAYS[period];
  const activeDays = days ? getActiveDaysInLastN(sessions || [], days) : uniqueDays;
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
    if (period === 'semana') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today + 'T12:00:00');
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
        const mins = filteredSessions.filter(s => s.date === dateStr).reduce((sum, s) => sum + s.durationMinutes, 0);
        const scaleCount = filteredScaleLogs.filter((l: any) => l.date === dateStr).length;
        const melodyCount = filteredMelodyLogs.filter((l: any) => l.date === dateStr).length;
        const rhythmCount = filteredRhythmLogs.filter((l: any) => l.date === dateStr).length;
        return {
          label: d.toLocaleDateString('es-EC', { weekday: 'short', timeZone: 'America/Guayaquil' }),
          minutes: mins, isToday: dateStr === today,
          scaleCount, melodyCount, rhythmCount,
          hasStudy: scaleCount + melodyCount + rhythmCount > 0,
        };
      });
    }
    const weeks = period === 'mes' ? 4 : 12;
    return Array.from({ length: weeks }, (_, idx) => {
      const w = weeks - 1 - idx;
      const end = new Date(today + 'T12:00:00');
      end.setDate(end.getDate() - w * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      const startStr = start.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
      const endStr = end.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
      const mins = filteredSessions.filter(s => s.date > startStr && s.date <= endStr).reduce((sum, s) => sum + s.durationMinutes, 0);
      return { label: `S${idx + 1}`, minutes: mins, isToday: false, hasStudy: false, scaleCount: 0, melodyCount: 0, rhythmCount: 0 };
    });
  }, [filteredSessions, filteredScaleLogs, filteredMelodyLogs, filteredRhythmLogs, period, today]);

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

  const periodLabel: Record<Period, string> = { semana: 'esta semana', mes: 'este mes', año: 'este año', todo: 'en total' };

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">📊 Estadísticas</h1>
          <p className="text-sm text-muted-foreground mt-1">Resumen detallado de tu práctica musical</p>
        </div>
        <div className="flex gap-1.5">
          {(['semana', 'mes', 'año', 'todo'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`chip text-xs font-semibold ${period === p ? 'chip-active' : ''}`}>
              {p === 'todo' ? 'Todo' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatMini label="Tiempo total" value={formatDurationLong(totalMinutes)} sub={periodLabel[period]} emoji="⏱️" />
        <StatMini label="Sesiones" value={filteredSessions.length} sub={periodLabel[period]} emoji="📋" />
        <StatMini label="Días activos" value={activeDays} sub={periodLabel[period]} emoji="📅" />
        <StatMini label="Promedio/sesión" value={formatDuration(avgMinutes)} sub="por sesión" emoji="📈" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <p className="text-3xl mb-1">🎼</p>
          <p className="font-mono text-3xl font-extrabold text-blue-400 drop-shadow-sm">{filteredScaleLogs.length}</p>
          <p className="text-xs font-semibold text-foreground/90 mt-1">prácticas de escalas</p>
          <p className="text-xs text-muted-foreground font-medium">{uniqueScalesCount} escalas distintas</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-3xl mb-1">🎵</p>
          <p className="font-mono text-3xl font-extrabold text-green-400 drop-shadow-sm">{filteredMelodyLogs.length}</p>
          <p className="text-xs font-semibold text-foreground/90 mt-1">prácticas de melodías</p>
          <p className="text-xs text-muted-foreground font-medium">{uniqueMelodiesCount} melodías distintas</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-3xl mb-1">🥁</p>
          <p className="font-mono text-3xl font-extrabold text-orange-400 drop-shadow-sm">{filteredRhythmLogs.length}</p>
          <p className="text-xs font-semibold text-foreground/90 mt-1">prácticas de ritmos</p>
          <p className="text-xs text-muted-foreground font-medium">{uniqueRhythmsCount} ritmos distintos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="stat-card flex items-center gap-4">
          <span className="text-4xl">🔥</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-400">Racha actual</p>
            <p className="font-mono text-3xl sm:text-4xl font-extrabold text-foreground">
              {streak.current} <span className="text-base font-medium text-muted-foreground">días</span>
            </p>
            <p className="text-xs font-semibold text-foreground/80 mt-0.5">Mejor: {streak.best} días</p>
          </div>
        </div>
        {bestSession ? (
          <div className="stat-card flex items-center gap-4">
            <span className="text-4xl">🏆</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Mejor sesión del período</p>
              <p className="font-mono text-3xl sm:text-4xl font-extrabold text-amber-300">{formatDurationLong(bestSession.durationMinutes)}</p>
              <p className="text-xs font-semibold text-foreground/80 mt-0.5">
                {instruments.find((i: InstrumentDef) => i.id === bestSession.instrument)?.emoji || '🎼'} {bestSession.date} {'★'.repeat(bestSession.rating)}
              </p>
            </div>
          </div>
        ) : (
          <div className="stat-card flex items-center justify-center text-muted-foreground text-sm font-medium">Sin sesiones en este período</div>
        )}
      </div>

      <div className="stat-card">
        <h3 className="section-title mb-4">Actividad {period === 'semana' ? 'diaria' : 'semanal'}</h3>
        <div className="flex items-end gap-2 h-40 pt-2 pb-1">
          {activityData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 relative">
              <span className={`text-xs font-mono font-bold ${d.minutes > 0 ? 'text-amber-300' : 'text-muted-foreground/30'}`}>
                {d.minutes > 0 ? formatDuration(d.minutes) : '—'}
              </span>
              <div
                className={`w-full rounded-t-md transition-all duration-500 ${d.isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-card' : ''}`}
                style={{
                  height: `${Math.max((d.minutes / maxActivity) * 88, d.minutes > 0 ? 8 : 4)}px`,
                  background: d.minutes > 0
                    ? `linear-gradient(to top, hsl(42 75% 45%), hsl(42 75% 58%))`
                    : 'hsl(var(--secondary))',
                  boxShadow: d.minutes > 0 ? '0 0 12px rgba(245,158,11,0.25)' : 'none',
                }}
              />
              {period === 'semana' && d.hasStudy && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
                  {d.scaleCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm" />}
                  {d.melodyCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-sm" />}
                  {d.rhythmCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-sm" />}
                </div>
              )}
              <span className={`text-xs font-mono font-bold uppercase ${d.isToday ? 'text-primary' : 'text-foreground/80'}`}>
                {d.label.slice(0, 2)}
              </span>
            </div>
          ))}
        </div>
        {period === 'semana' && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
            <p className="text-xs font-semibold text-muted-foreground">Estudio:</p>
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
