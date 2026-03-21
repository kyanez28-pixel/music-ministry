import { useState, useMemo } from 'react';
import { useSessions, useSongs } from '@/hooks/use-music-data';
import { formatDuration, formatDurationLong, getStreak, getActiveDaysInLastN, getTodayEC } from '@/lib/music-utils';
import { CATEGORY_LABELS, ALL_CATEGORIES, type PracticeCategory } from '@/types/music';

type Period = 'semana' | 'mes' | 'año' | 'todo';

const PERIOD_DAYS: Record<Period, number | null> = {
  semana: 7,
  mes: 30,
  año: 365,
  todo: null,
};

export default function StatsPage() {
  const [sessions] = useSessions();
  const [songs] = useSongs();
  const [period, setPeriod] = useState<Period>('mes');

  const today = getTodayEC();

  // Filtrar por período usando comparación de strings de fecha (más preciso)
  const filtered = useMemo(() => {
    const days = PERIOD_DAYS[period];
    if (days === null) return sessions;
    const cutoff = new Date(today + 'T00:00:00');
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
    return sessions.filter(s => s.date >= cutoffStr);
  }, [sessions, period, today]);

  const totalMinutes = filtered.reduce((sum, s) => sum + s.durationMinutes, 0);
  const pianoMinutes = filtered.filter(s => s.instrument === 'piano').reduce((sum, s) => sum + s.durationMinutes, 0);
  const guitarMinutes = filtered.filter(s => s.instrument === 'guitarra').reduce((sum, s) => sum + s.durationMinutes, 0);
  const ukeleleMinutes = filtered.filter(s => s.instrument === 'ukelele').reduce((sum, s) => sum + s.durationMinutes, 0);
  const avgMinutes = filtered.length > 0 ? Math.round(totalMinutes / filtered.length) : 0;
  const uniqueDays = new Set(filtered.map(s => s.date)).size;

  // Mejor sesión
  const bestSession = filtered.reduce<any>((best: any, s: any) =>
    !best || s.durationMinutes > best.durationMinutes ? s : best, null);

  // Racha
  const streak = getStreak(sessions);

  // Días activos en período
  const days = PERIOD_DAYS[period];
  const activeDays = days ? getActiveDaysInLastN(sessions, days) : uniqueDays;

  // Category breakdown
  const categoryMinutes = useMemo(() => {
    const map: Record<string, number> = {};
    ALL_CATEGORIES.forEach(c => { map[c] = 0; });
    filtered.forEach(s => {
      const perCat = s.durationMinutes / (s.categories.length || 1);
      s.categories.forEach(c => { map[c] = (map[c] || 0) + perCat; });
    });
    return map as Record<PracticeCategory, number>;
  }, [filtered]);

  const maxCatMinutes = Math.max(...Object.values(categoryMinutes), 1);
  const activeCats = ALL_CATEGORIES.filter(c => categoryMinutes[c] > 0)
    .sort((a, b) => categoryMinutes[b] - categoryMinutes[a]);

  // Song practice analysis
  const practicedSongs = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(s => {
      if (s.notes?.startsWith('Repaso setlist: ')) {
        const title = s.notes.replace('Repaso setlist: ', '');
        counts[title] = (counts[title] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filtered]);

  // Actividad por bloques de tiempo
  const activityData = useMemo(() => {
    if (period === 'semana') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today + 'T12:00:00');
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
        const mins = filtered.filter(s => s.date === dateStr).reduce((sum, s) => sum + s.durationMinutes, 0);
        return {
          label: d.toLocaleDateString('es-EC', { weekday: 'short', timeZone: 'America/Guayaquil' }),
          minutes: mins,
          isToday: dateStr === today,
        };
      });
    }

    const weeks = period === 'mes' ? 4 : period === 'año' ? 12 : 12;
    return Array.from({ length: weeks }, (_, idx) => {
      const w = weeks - 1 - idx;
      const end = new Date(today + 'T12:00:00');
      end.setDate(end.getDate() - w * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      const startStr = start.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
      const endStr = end.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
      const mins = filtered.filter(s => s.date > startStr && s.date <= endStr)
        .reduce((sum, s) => sum + s.durationMinutes, 0);
      return { label: `S${idx + 1}`, minutes: mins, isToday: false };
    });
  }, [filtered, period, today]);

  const maxActivity = Math.max(...activityData.map(d => d.minutes), 1);

  return (
    <div className="space-y-6">
      {/* Header + period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Estadísticas</h1>
        <div className="flex gap-1">
          {(['semana', 'mes', 'año', 'todo'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`chip text-sm ${period === p ? 'chip-active' : ''}`}>
              {p === 'todo' ? 'Todo' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card text-center">
          <p className="font-mono text-xl font-bold text-foreground">{formatDurationLong(totalMinutes)}</p>
          <p className="text-xs text-muted-foreground mt-1">Tiempo total</p>
        </div>
        <div className="stat-card text-center">
          <p className="font-mono text-xl font-bold text-foreground">{filtered.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Sesiones</p>
        </div>
        <div className="stat-card text-center">
          <p className="font-mono text-xl font-bold text-foreground">{activeDays}</p>
          <p className="text-xs text-muted-foreground mt-1">Días activos</p>
        </div>
        <div className="stat-card text-center">
          <p className="font-mono text-xl font-bold text-foreground">{formatDuration(avgMinutes)}</p>
          <p className="text-xs text-muted-foreground mt-1">Promedio/sesión</p>
        </div>
      </div>

      {/* Streak + best session */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="stat-card flex items-center gap-4">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-xs text-muted-foreground">Racha actual</p>
            <p className="font-mono text-2xl font-bold text-foreground">{streak.current} días</p>
            <p className="text-xs text-muted-foreground">Mejor: {streak.best} días</p>
          </div>
        </div>
        {bestSession && (
          <div className="stat-card flex items-center gap-4">
            <span className="text-3xl">🏆</span>
            <div>
              <p className="text-xs text-muted-foreground">Mejor sesión del período</p>
              <p className="font-mono text-2xl font-bold text-foreground">{formatDurationLong(bestSession.durationMinutes)}</p>
              <p className="text-xs text-muted-foreground">
                {bestSession.instrument === 'piano' ? '🎹' : '🎸'} {bestSession.date}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Activity chart */}
      <div className="stat-card">
        <h3 className="section-title mb-4">
          Actividad {period === 'semana' ? 'diaria' : 'semanal'}
        </h3>
        <div className="flex items-end gap-1.5 h-36">
          {activityData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              {d.minutes > 0 && (
                <span className="text-[9px] font-mono text-muted-foreground">{formatDuration(d.minutes)}</span>
              )}
              <div
                className={`w-full rounded-t transition-all duration-300 ${d.isToday ? 'ring-1 ring-primary' : ''}`}
                style={{
                  height: `${Math.max((d.minutes / maxActivity) * 100, d.minutes > 0 ? 4 : 0)}%`,
                  minHeight: '4px',
                  background: d.minutes > 0
                    ? `hsl(42 60% 55% / ${0.4 + (d.minutes / maxActivity) * 0.6})`
                    : 'hsl(var(--secondary))',
                }}
              />
              <span className={`text-[10px] font-mono capitalize ${d.isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="stat-card">
        <h3 className="section-title mb-4">Por Categoría</h3>
        {activeCats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin datos para este período</p>
        ) : (
          <div className="space-y-2.5">
            {activeCats.map(cat => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{CATEGORY_LABELS[cat]}</span>
                  <span className="font-mono text-muted-foreground">{formatDuration(Math.round(categoryMinutes[cat]))}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(categoryMinutes[cat] / maxCatMinutes) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Por instrumento */}
      <div className="stat-card">
        <h3 className="section-title mb-4">Por instrumento</h3>
        {totalMinutes === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin datos para este período</p>
        ) : (
          <div className="space-y-3">
            {[
              { label: '🎹 Piano', minutes: pianoMinutes, color: 'hsl(var(--primary))' },
              { label: '🎸 Guitarra', minutes: guitarMinutes, color: 'hsl(var(--warning))' },
              { label: '🪗 Ukelele', minutes: ukeleleMinutes, color: 'hsl(var(--info))' },
            ].map(({ label, minutes, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{label}</span>
                  <span className="font-mono text-muted-foreground">
                    {formatDurationLong(minutes)} · {Math.round((minutes / totalMinutes) * 100)}%
                  </span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(minutes / totalMinutes) * 100}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Por canción */}
      {practicedSongs.length > 0 && (
        <div className="stat-card">
          <h3 className="section-title mb-4">Canciones más repasadas</h3>
          <div className="space-y-3">
            {practicedSongs.map(([title, count]) => (
              <div key={title} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                <span className="text-sm font-medium">{title}</span>
                <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-mono">
                  {count} {count === 1 ? 'vez' : 'veces'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
