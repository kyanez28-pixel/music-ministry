import { useMemo, useState } from 'react';
import { useSessions, useScaleLogs, useHarmonyLogs, useRhythmPracticeLogs, useSongs, useSetlists } from '@/hooks/use-music-data';
import { getStreak, getTotalMinutes, getSessionCount, formatDuration, formatDurationLong, formatDate, getTodayEC, getMonday } from '@/lib/music-utils';
import { CATEGORY_LABELS, type PracticeCategory } from '@/types/music';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Flame, Music2, BookOpen, Drum, Guitar, Timer } from 'lucide-react';
import { useInstruments } from '@/hooks/use-instruments';
import type { InstrumentDef } from '@/types/music';
import { AppTooltip } from '@/components/AppTooltip';
import { LoadingCard } from '@/components/ui/LoadingCard';

export default function DashboardPage() {
  const [sessions = [], , isLoadingSessions] = useSessions();
  const [scaleLogs = [], , isLoadingScales] = useScaleLogs();
  const [harmonyLogs = [], , isLoadingHarmonies] = useHarmonyLogs();
  const [rhythmPracticeLogs = [], , isLoadingRhythms] = useRhythmPracticeLogs();
  const [songs = [], , isLoadingSongs] = useSongs();
  const [setlists = [], , isLoadingSetlists] = useSetlists();
  const navigate = useNavigate();
  const { instruments } = useInstruments();

  const isLoading = isLoadingSessions || isLoadingScales || isLoadingHarmonies || isLoadingRhythms || isLoadingSongs || isLoadingSetlists;

  const streak = getStreak(sessions || []);
  const today = getTodayEC();
  
  // Sessions in the current month
  const currentMonthPrefix = today.substring(0, 7); // 'YYYY-MM'
  const thisMonthSessions = (sessions || []).filter((s: any) => s.date.startsWith(currentMonthPrefix));
  const monthMinutes = getTotalMinutes(thisMonthSessions);

  // Today's activity
  const todaySessions = (sessions || []).filter((s: any) => s.date === today);
  const todayMinutes = todaySessions.reduce((sum: number, s: any) => sum + s.durationMinutes, 0);
  
  const todayScaleLogsFull = (scaleLogs || []).filter((l: any) => l.date === today);
  const todayHarmonyLogsFull = (harmonyLogs || []).filter((l: any) => l.date === today);
  const todayRhythmsLogsFull = (rhythmPracticeLogs || []).filter((l: any) => l.date === today);
  
  const todayScales = todayScaleLogsFull.length;
  const todayHarmonies = todayHarmonyLogsFull.length;
  const todayRhythms = todayRhythmsLogsFull.length;
  
  const [showTodayDetail, setShowTodayDetail] = useState(false);

  // Current week setlist
  const monday = getMonday(new Date()).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
  const currentSetlist = (setlists || []).find(s => s.weekStart === monday);
  const setlistCount = currentSetlist?.songIds.length ?? 0;

  // Last 7 days activity heatmap
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
      const dayMins = (sessions || []).filter((s: any) => s.date === dateStr).reduce((sum: number, s: any) => sum + s.durationMinutes, 0);
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
  const recent = [...(sessions || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Category breakdown this week
  const weekStart = getMonday(new Date()).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
  const weekSessions = (sessions || []).filter((s: any) => s.date >= weekStart);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 bg-white/5 rounded-lg animate-pulse" />
        <LoadingCard />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="stat-card h-24 animate-pulse bg-white/5" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {(sessions || []).length} sesiones · {(songs || []).length} canciones en biblioteca
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
            <div className="flex items-center gap-4">
              {todayMinutes > 0 && (
                <span className="font-mono text-sm text-primary">{formatDurationLong(todayMinutes)}</span>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] uppercase font-bold tracking-widest text-primary hover:bg-primary/10 px-2"
                onClick={() => setShowTodayDetail(!showTodayDetail)}
              >
                {showTodayDetail ? 'Ocultar Detalle ↑' : 'Ver Detalle ↓'}
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-1">
            {todaySessions.length > 0 && (
              <span>🎵 {todaySessions.length} sesión{todaySessions.length > 1 ? 'es' : ''}</span>
            )}
            {todayScales > 0 && <span>🎼 {todayScales} escalas</span>}
            {todayHarmonies > 0 && <span>🎶 {todayHarmonies} armonías</span>}
            {todayRhythms > 0 && <span>🥁 {todayRhythms} ritmos</span>}
          </div>

          {showTodayDetail && (
            <div className="mt-4 pt-4 border-t border-primary/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {todaySessions.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-primary/70 font-bold mb-2">Sesiones Registradas</p>
                  <div className="space-y-2">
                    {todaySessions.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between text-[11px] bg-white/5 rounded-lg p-2 border border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{instruments.find((i: InstrumentDef) => i.id === s.instrument)?.emoji || '🎼'}</span>
                          <div>
                            <p className="font-medium text-foreground/90">{s.categories.map((c: any) => CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS] || c).join(', ')}</p>
                            {s.notes && <p className="text-muted-foreground truncate max-w-[200px]">{s.notes}</p>}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-primary">{formatDurationLong(s.durationMinutes)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(todayScales > 0 || todayHarmonies > 0 || todayRhythms > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {todayScales > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-primary/70 font-bold mb-2">Escalas</p>
                      <div className="space-y-1">
                        {todayScaleLogsFull.map((l: any, idx: number) => (
                          <div key={idx} className="text-[10px] py-1 px-2 rounded bg-primary/5 text-foreground/80 flex items-center justify-between">
                            <span>{l.scale_id}</span>
                            <span className="text-[9px] opacity-70">practicada</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {todayHarmonies > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-primary/70 font-bold mb-2">Armonías</p>
                      <div className="space-y-1">
                        {todayHarmonyLogsFull.map((l: any, idx: number) => (
                          <div key={idx} className="text-[10px] py-1 px-2 rounded bg-primary/5 text-foreground/80 flex items-center justify-between">
                            <span>{l.harmony_id}</span>
                            <span className="text-[9px] opacity-70">practicada</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {todayRhythms > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-primary/70 font-bold mb-2">Ritmos</p>
                      <div className="space-y-1">
                        {todayRhythmsLogsFull.map((l: any, idx: number) => (
                          <div key={idx} className="text-[10px] py-1 px-2 rounded bg-primary/5 text-foreground/80 flex items-center justify-between">
                            <span>{l.rhythm_id}</span>
                            <span className="text-[9px] opacity-70">practicado</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <p className="text-[9px] text-center text-muted-foreground/60 italic pt-2">
                * Las escalas, armonías y ritmos muestran actividad pero no suman tiempo a menos que registres una sesión.
              </p>
            </div>
          )}
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
        <AppTooltip content="El tiempo total que has dedicado a la música durante este mes.">
          <div className="stat-card cursor-help">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Este mes</span>
            </div>
            <p className="font-mono text-2xl font-bold text-foreground">{formatDurationLong(monthMinutes)}</p>
            <p className="text-xs text-muted-foreground mt-1">{thisMonthSessions.length} sesiones</p>
          </div>
        </AppTooltip>
        {/* Instrument stats cards */}
        {instruments.map((i: InstrumentDef) => {
          const mins = getTotalMinutes(thisMonthSessions, i.id);
          const count = getSessionCount(thisMonthSessions, i.id);
          return (
            <AppTooltip key={i.id} content={`Tiempo dedicado practicando ${i.name} este mes.`}>
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
                  {formatDuration(d.minutes)}
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
                      <span className="font-mono text-muted-foreground">{formatDurationLong(Math.round(mins))}</span>
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
          { icon: Music2, label: 'Escalas', desc: 'Explorar colección', path: '/scales', color: 'text-blue-400/90' },
          { icon: BookOpen, label: 'Armonías', desc: 'Explorar colección', path: '/harmonies', color: 'text-purple-400/90' },
          { icon: Guitar, label: 'Melodías', desc: 'Gestionar repertorio', path: '/melodies', color: 'text-green-400/90' },
          { icon: Drum, label: 'Ritmos', desc: 'Explorar colección', path: '/rhythms', color: 'text-orange-400/90' },
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
