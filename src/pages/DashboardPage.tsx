import { useMemo } from 'react';
import { useSessions, useScaleLogs, useHarmonyLogs, useRhythmLogs, useSongs, useSetlists } from '@/hooks/use-music-data';
import { getStreak, getTotalMinutes, getSessionCount, formatDurationLong, formatDate, getTodayEC, getMonday } from '@/lib/music-utils';
import { CATEGORY_LABELS, type PracticeCategory } from '@/types/music';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Flame, Music2, BookOpen, Drum, Guitar, Timer } from 'lucide-react';
import { useInstruments } from '@/hooks/use-instruments';
import type { InstrumentDef } from '@/types/music';
import { AppTooltip } from '@/components/AppTooltip';

export default function DashboardPage() {
  const [sessions] = useSessions();
  const [scaleLogs] = useScaleLogs();
  const [harmonyLogs] = useHarmonyLogs();
  const [rhythmLogs] = useRhythmLogs();
  const [songs] = useSongs();
  const [setlists] = useSetlists();
  const navigate = useNavigate();
  const { instruments } = useInstruments();

  const streak = getStreak(sessions);
  const totalMinutes = getTotalMinutes(sessions);
  const today = getTodayEC();

  // Today's activity
  const todaySessions = sessions.filter((s: any) => s.date === today);
  const todayMinutes = todaySessions.reduce((sum: number, s: any) => sum + s.durationMinutes, 0);
  const todayScales = scaleLogs.filter((l: any) => l.date === today).length;
  const todayHarmonies = harmonyLogs.filter((l: any) => l.date === today).length;
  const todayRhythms = rhythmLogs.filter((l: any) => l.date === today).length;

  // Current week setlist
  const monday = getMonday(new Date()).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
  const currentSetlist = setlists.find(s => s.weekStart === monday);
  const setlistCount = currentSetlist?.songIds.length ?? 0;

  // Last 7 days activity heatmap
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
      const dayMins = sessions.filter((s: any) => s.date === dateStr).reduce((sum: number, s: any) => sum + s.durationMinutes, 0);
      days.push({
        date: dateStr,
        minutes: dayMins,
        label: d.toLocaleDateString('es-EC', { weekday: 'short', timeZone: 'America/Guayaquil' }),
        isToday: dateStr === today,
      });
    }
    return days;
  }, [sessions, today]);

  const maxDayMins = Math.max(...last7Days.map((d: any) => d.minutes), 1);

  // Recent sessions
  const recent = [...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Category breakdown this week
  const weekStart = getMonday(new Date()).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
  const weekSessions = sessions.filter((s: any) => s.date >= weekStart);
  const weekMinutes = weekSessions.reduce((sum: number, s: any) => sum + s.durationMinutes, 0);

  const catWeekMinutes = useMemo(() => {
    const counts: Partial<Record<PracticeCategory, number>> = {};
    weekSessions.forEach((s: any) => {
      const perCat = s.durationMinutes / (s.categories.length || 1);
      s.categories.forEach((c: PracticeCategory) => { counts[c] = (counts[c] || 0) + perCat; });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4) as [PracticeCategory, number][];
  }, [weekSessions]);

  const pianoPercent = 0; // Deprecated, will use dynamic map

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sessions.length === 0
              ? 'Comienza registrando tu primera sesión'
              : `${sessions.length} sesiones · ${songs.length} canciones en biblioteca`}
          </p>
        </div>
        <Button onClick={() => navigate('/practice')} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Sesión
        </Button>
      </div>

      {/* Today banner */}
      {todayMinutes > 0 || todayScales > 0 || todayHarmonies > 0 || todayRhythms > 0 ? (
        <div className="glass-panel rounded-xl border-primary/30 p-5 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-primary">✅ Hoy practicaste</p>
            {todayMinutes > 0 && (
              <span className="font-mono text-sm text-primary">{formatDurationLong(todayMinutes)}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {todaySessions.length > 0 && (
              <span>🎵 {todaySessions.length} sesión{todaySessions.length > 1 ? 'es' : ''}</span>
            )}
            {todayScales > 0 && <span>🎼 {todayScales} escalas</span>}
            {todayHarmonies > 0 && <span>🎶 {todayHarmonies} armonías</span>}
            {todayRhythms > 0 && <span>🥁 {todayRhythms} ritmos</span>}
          </div>
        </div>
      ) : (
        <div className="glass-panel border-dashed rounded-xl text-center py-6 bg-secondary/20">
          <p className="text-sm text-muted-foreground">Aún no practicaste hoy. ¡A darle!</p>
          <Button size="sm" variant="ghost" className="mt-2 text-primary" onClick={() => navigate('/practice')}>
            Comenzar ahora →
          </Button>
        </div>
      )}

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <AppTooltip content="Tu racha de práctica: días consecutivos con al menos una sesión registrada.">
          <div className="stat-card group cursor-help">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-orange-400 animate-pulse-glow group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
              <span className="text-xs font-semibold text-orange-400/90 tracking-wide uppercase">Racha</span>
            </div>
            <p className="font-mono text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-orange-400 to-red-500 drop-shadow-sm">{streak.current}</p>
            <p className="text-xs text-muted-foreground mt-1">días · Mejor: {streak.best}</p>
          </div>
        </AppTooltip>
        <AppTooltip content="El tiempo total que has dedicado a la música desde que empezaste.">
          <div className="stat-card cursor-help">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total global</span>
            </div>
            <p className="font-mono text-2xl font-bold text-foreground">{formatDurationLong(totalMinutes)}</p>
            <p className="text-xs text-muted-foreground mt-1">{sessions.length} sesiones</p>
          </div>
        </AppTooltip>
        {/* Instrument stats cards */}
        {instruments.map((i: InstrumentDef) => {
          const mins = getTotalMinutes(sessions, i.id);
          const count = getSessionCount(sessions, i.id);
          return (
            <AppTooltip key={i.id} content={`Tiempo dedicado practicando ${i.name}.`}>
              <div className="stat-card group cursor-help">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm group-hover:-translate-y-1 transition-transform">{i.emoji}</span>
                  <span className="text-xs tracking-wide uppercase text-muted-foreground">{i.name}</span>
                </div>
                <p className="font-mono text-2xl font-bold text-foreground drop-shadow-sm">{formatDurationLong(mins)}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{count} sesiones</p>
              </div>
            </AppTooltip>
          );
        })}
      </div>

      {/* 7-day activity + Weekly breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 7-day heatmap */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title text-sm">Últimos 7 días</h3>
            {weekMinutes > 0 && (
              <span className="text-xs font-mono text-primary">{formatDurationLong(weekMinutes)} esta semana</span>
            )}
          </div>
          <div className="flex items-end gap-1.5 h-32 pt-2">
            {last7Days.map((d: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <span className={`text-[10px] font-mono tracking-tighter ${d.minutes > 0 ? (d.isToday ? 'text-primary font-medium' : 'text-muted-foreground') : 'opacity-0'}`}>
                  {d.minutes >= 60 ? `${Math.floor(d.minutes / 60)}h${d.minutes % 60 > 0 ? String(d.minutes % 60).padStart(2, '0') : ''}` : `${d.minutes}m`}
                </span>
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${d.isToday ? 'ring-1 ring-primary' : ''}`}
                  style={{
                    height: `${Math.max((d.minutes / maxDayMins) * 80, d.minutes > 0 ? 6 : 0)}px`,
                    background: d.minutes > 0
                      ? `hsl(42 60% 55% / ${0.4 + (d.minutes / maxDayMins) * 0.6})`
                      : 'hsl(var(--secondary))',
                    minHeight: '4px',
                  }}
                />
                <span className={`text-[10px] font-mono capitalize ${d.isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                  {d.label.slice(0, 2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* This week categories */}
        <div className="stat-card">
          <h3 className="section-title text-sm mb-4">Esta semana por categoría</h3>
          {catWeekMinutes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin datos esta semana</p>
          ) : (
            <div className="space-y-2">
              {catWeekMinutes.map(([cat, mins]) => {
                const maxMins = catWeekMinutes[0][1];
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-foreground">{CATEGORY_LABELS[cat]}</span>
                      <span className="font-mono text-muted-foreground">{Math.round(mins)}min</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full transition-all"
                        style={{ width: `${(mins / maxMins) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Music2, label: 'Escalas', desc: `${scaleLogs.length} practicadas`, path: '/scales', color: 'text-blue-400/90' },
          { icon: BookOpen, label: 'Armonías', desc: `${harmonyLogs.length} practicadas`, path: '/harmonies', color: 'text-purple-400/90' },
          { icon: Guitar, label: 'Melodías', desc: 'Gestionar', path: '/melodies', color: 'text-green-400/90' },
          { icon: Drum, label: 'Ritmos', desc: `${rhythmLogs.length} practicados`, path: '/rhythms', color: 'text-orange-400/90' },
        ].map(({ icon: Icon, label, desc, path, color }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="stat-card text-left group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Icon className={`h-6 w-6 mb-3 ${color} group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 drop-shadow-sm`} />
            <p className="text-sm font-semibold tracking-wide text-foreground/90">{label}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{desc}</p>
          </button>
        ))}
      </div>

      {/* Setlist + Instrument split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Setlist summary with progress */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="section-title text-sm">✝ Setlist de esta semana</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Semana del Lunes {monday.split('-')[2]}</p>
            </div>
            <button onClick={() => navigate('/setlist')} className="text-xs text-primary hover:underline font-medium">
              Gestionar →
            </button>
          </div>

          {setlistCount === 0 ? (
            <div className="py-6 text-center border border-dashed border-border rounded-lg bg-secondary/10">
              <p className="text-sm text-muted-foreground">Sin canciones para esta semana</p>
              <Button variant="ghost" size="sm" className="mt-2 text-primary h-7 text-xs" onClick={() => navigate('/setlist')}>
                + Agregar canciones
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>PROGRESO DE REPASO</span>
                  <span>{Math.round(((currentSetlist?.practicedSongIds?.length || 0) / setlistCount) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    style={{ width: `${((currentSetlist?.practicedSongIds?.length || 0) / setlistCount) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {currentSetlist?.songIds.slice(0, 5).map((id: string, i: number) => {
                  const song = songs.find((s: any) => s.id === id);
                  const isPracticed = currentSetlist.practicedSongIds?.includes(id);
                  return song ? (
                    <div key={id} className="flex items-center gap-2 text-sm group">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPracticed ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-primary/40'}`} />
                      <span className={`flex-1 truncate ${isPracticed ? 'text-muted-foreground/70 line-through decoration-emerald-500/30' : 'text-foreground/90 font-medium'}`}>
                        {song.title}
                      </span>
                      {isPracticed ? (
                        <span className="text-[10px] text-emerald-500 font-mono">✓</span>
                      ) : (
                        <span className="text-[10px] text-primary/60 font-mono group-hover:text-primary transition-colors">Pendiente</span>
                      )}
                    </div>
                  ) : null;
                })}
                {setlistCount > 5 && (
                  <p className="text-[10px] text-muted-foreground pl-3.5 italic">+{setlistCount - 5} más en el setlist…</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pending Songs / Recommendation Section */}
        <div className="stat-card border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <h3 className="section-title text-sm mb-3 font-display italic">⚡ Sesión Sugerida</h3>
          
          {setlistCount > 0 && (currentSetlist?.practicedSongIds?.length || 0) < setlistCount ? (
            <div className="space-y-4 h-full flex flex-col">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex-1">
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Próxima a repasar:</p>
                {(() => {
                  const pendingIds = currentSetlist.songIds.filter(id => !currentSetlist.practicedSongIds?.includes(id));
                  const nextId = pendingIds[0];
                  const nextSong = songs.find(s => s.id === nextId);
                  return nextSong ? (
                    <div>
                      <h4 className="text-lg font-bold text-foreground leading-tight">{nextSong.title}</h4>
                      <p className="text-xs text-muted-foreground">{nextSong.artist} · {nextSong.key}</p>
                      
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" className="h-8 gap-1.5 text-xs flex-1" onClick={() => navigate('/practice')}>
                          <Timer className="h-3 w-3" /> Comenzar
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs px-2" onClick={() => navigate('/setlist')}>
                          Ver detalles
                        </Button>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Tienes {setlistCount - (currentSetlist?.practicedSongIds?.length || 0)} canciones pendientes esta semana.
              </p>
            </div>
          ) : setlistCount > 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-6 text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                <Music2 className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-foreground">¡Setlist completado!</p>
              <p className="text-xs text-muted-foreground mt-1 px-4">Has repasado todas las canciones de la semana. ¡Excelente trabajo!</p>
              <Button variant="ghost" size="sm" className="mt-4 text-primary text-xs" onClick={() => navigate('/stats')}>
                Ver mis estadísticas →
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-6 text-center opacity-50">
              <Guitar className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Configura tu setlist para recibir sugerencias</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent sessions */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Sesiones Recientes</h3>
          {sessions.length > 5 && (
            <button onClick={() => navigate('/history')} className="text-sm text-primary hover:underline">Ver todo →</button>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Aún no hay sesiones registradas</p>
        ) : (
          <div className="space-y-2">
            {recent.map((s: any) => (
              <AppTooltip key={s.id} content="Haz clic para ver o editar los detalles de esta sesión.">
                <div
                  onClick={() => navigate('/history')}
                  className="flex items-center justify-between py-2 px-3 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-lg shrink-0">
                      {instruments.find((i: InstrumentDef) => i.id === s.instrument)?.emoji || '🎼'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{formatDate(s.date)}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.categories.map(c => CATEGORY_LABELS[c]).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm">{formatDurationLong(s.durationMinutes)}</p>
                    <p className="text-xs text-amber-400">{'★'.repeat(s.rating)}{'☆'.repeat(5 - s.rating)}</p>
                  </div>
                </div>
              </AppTooltip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
