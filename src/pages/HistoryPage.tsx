import { useState, useMemo } from 'react';
import { useSessions } from '@/hooks/use-music-data';
import { formatDate, formatDurationLong, formatDuration, getMonday } from '@/lib/music-utils';
import { CATEGORY_LABELS, ALL_CATEGORIES, type PracticeCategory, type Instrument } from '@/types/music';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CalendarDays, BarChart3, Music, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { useInstruments } from '@/hooks/use-instruments';
import { AppTooltip } from '@/components/AppTooltip';
import type { InstrumentDef } from '@/types/music';
import { LoadingCard } from '@/components/ui/LoadingCard';

type ViewMode = 'list' | 'calendar' | 'stats';

export default function HistoryPage() {
  const [sessions = [], setSessions, isLoading] = useSessions();
  const [filterInstrument, setFilterInstrument] = useState<Instrument | 'todos'>('todos');
  const [filterCategory, setFilterCategory] = useState<PracticeCategory | 'todas'>('todas');
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // ─── Weekly stats navigation ───
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  const { instruments } = useInstruments();

  const filtered = (sessions || [])
    .filter((s: any) => filterInstrument === 'todos' || s.instrument === filterInstrument)
    .filter((s: any) => filterCategory === 'todas' || s.categories.includes(filterCategory))
    .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));

  // Edit state
  const [editDate, setEditDate] = useState('');
  const [editInstrument, setEditInstrument] = useState<Instrument>('piano');
  const [editHours, setEditHours] = useState(0);
  const [editMins, setEditMins] = useState(0);
  const [editCategories, setEditCategories] = useState<PracticeCategory[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [editRating, setEditRating] = useState(3);

  const openEdit = (id: string) => {
    const s = (sessions || []).find((x: any) => x.id === id);
    if (!s) return;
    setEditId(id);
    setEditDate(s.date);
    setEditInstrument(s.instrument);
    setEditHours(Math.floor(s.durationMinutes / 60));
    setEditMins(s.durationMinutes % 60);
    setEditCategories([...s.categories] as PracticeCategory[]);
    setEditNotes(s.notes);
    setEditRating(s.rating);
  };

  const saveEdit = () => {
    const duration = editHours * 60 + editMins;
    if (duration <= 0) { toast.error('La duración debe ser mayor a 0'); return; }
    if (editCategories.length === 0) { toast.error('Selecciona al menos una categoría'); return; }
    setSessions((prev: any[]) => prev.map((s: any) => s.id === editId ? {
      ...s, date: editDate, instrument: editInstrument,
      durationMinutes: duration,
      categories: editCategories, notes: editNotes, rating: editRating,
    } : s));
    setEditId(null);
    toast.success('Sesión actualizada');
  };

  const confirmDelete = () => {
    setSessions((prev: any[]) => prev.filter((s: any) => s.id !== deleteId));
    setDeleteId(null);
    setEditId(null);
    toast.success('Sesión eliminada');
  };

  // ─── Calendar data ───
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    (sessions || []).forEach((s: any) => {
      const existing = map.get(s.date) || [];
      existing.push(s);
      map.set(s.date, existing);
    });
    return map;
  }, [sessions]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    const startPad = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [calendarMonth]);

  const getDateStr = (day: number) => {
    const y = calendarMonth.getFullYear();
    const m = String(calendarMonth.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-${String(day).padStart(2, '0')}`;
  };

  // ─── Weekly stats ───
  const weeklyStats = useMemo(() => {
    // Calculate the monday of the target week
    const now = new Date();
    const baseMonday = getMonday(now);
    baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);

    const days: { dateStr: string; label: string; shortLabel: string; minutes: number; sessions: number; isToday: boolean }[] = [];
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });

    for (let i = 0; i < 7; i++) {
      const d = new Date(baseMonday);
      d.setDate(d.getDate() + i);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
      const daySessions = (sessions || []).filter((s: any) => s.date === dateStr);
      const mins = daySessions.reduce((sum: number, s: any) => sum + s.durationMinutes, 0);
      days.push({
        dateStr,
        label: d.toLocaleDateString('es-EC', { weekday: 'long', timeZone: 'America/Guayaquil' }),
        shortLabel: d.toLocaleDateString('es-EC', { weekday: 'short', timeZone: 'America/Guayaquil' }).slice(0, 2),
        minutes: mins,
        sessions: daySessions.length,
        isToday: dateStr === todayStr,
      });
    }

    const totalMinutes = days.reduce((s, d) => s + d.minutes, 0);
    const totalSessions = days.reduce((s, d) => s + d.sessions, 0);
    const activeDays = days.filter(d => d.minutes > 0).length;
    const maxDayMins = Math.max(...days.map(d => d.minutes), 1);

    // Category breakdown for the week
    const weekDates = new Set(days.map(d => d.dateStr));
    const weekSessions = (sessions || []).filter((s: any) => weekDates.has(s.date));
    const catMap: Record<string, number> = {};
    weekSessions.forEach((s: any) => {
      const perCat = s.durationMinutes / (s.categories.length || 1);
      s.categories.forEach((c: string) => { catMap[c] = (catMap[c] || 0) + perCat; });
    });
    const topCats = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4) as [string, number][];

    // Label for the week range
    const startLabel = new Date(baseMonday).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', timeZone: 'America/Guayaquil' });
    const endDate = new Date(baseMonday);
    endDate.setDate(endDate.getDate() + 6);
    const endLabel = endDate.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', timeZone: 'America/Guayaquil' });
    const isCurrentWeek = weekOffset === 0;

    return { days, totalMinutes, totalSessions, activeDays, maxDayMins, topCats, startLabel, endLabel, isCurrentWeek };
  }, [sessions, weekOffset]);

  // ─── Stats ───
  const stats = useMemo(() => {
    const totalMinutes = (sessions || []).reduce((sum: number, x: any) => sum + x.durationMinutes, 0);
    const totalSessions = (sessions || []).length;
    const uniqueDays = new Set((sessions || []).map((s: any) => s.date)).size;
    const avgMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

    const catCounts: Record<string, number> = {};
    const catMinutes: Record<string, number> = {};
    (sessions || []).forEach((s: any) => {
      const perCat = s.durationMinutes / (s.categories.length || 1);
      s.categories.forEach((c: string) => {
        catCounts[c] = (catCounts[c] || 0) + 1;
        catMinutes[c] = (catMinutes[c] || 0) + perCat;
      });
    });
    const topCategories = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Monthly trend (last 6 months)
    const monthlyMinutes: { label: string; minutes: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-EC', { month: 'short' });
      const minutes = (sessions || []).filter((s: any) => s.date && s.date.startsWith(prefix)).reduce((sum: number, s: any) => sum + s.durationMinutes, 0);
      monthlyMinutes.push({ label, minutes });
    }

    // Rating distribution
    const ratingDist = [1, 2, 3, 4, 5].map(r => ({
      rating: r,
      count: (sessions || []).filter((s: any) => s.rating === r).length,
    }));
    const maxRatingCount = Math.max(...ratingDist.map(r => r.count), 1);

    return { totalMinutes, totalSessions, uniqueDays, avgMinutes, topCategories, catMinutes, monthlyMinutes, ratingDist, maxRatingCount };
  }, [sessions]);

  const maxMonthly = Math.max(...stats.monthlyMinutes.map(m => m.minutes), 1);
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 bg-white/5 rounded-lg animate-pulse" />
        <LoadingCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Historial</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} sesiones</p>
        </div>
        <div className="flex gap-1">
          {([
            { mode: 'list' as ViewMode, icon: Music, label: 'Lista' },
            { mode: 'calendar' as ViewMode, icon: CalendarDays, label: 'Calendario' },
            { mode: 'stats' as ViewMode, icon: BarChart3, label: 'Stats' },
          ]).map(({ mode, icon: Icon, label }) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`chip text-xs ${viewMode === mode ? 'chip-active' : ''}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterInstrument} onChange={e => setFilterInstrument(e.target.value as any)}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border border-border">
          <option value="todos">Todos los instrumentos</option>
          {instruments.map((i: InstrumentDef) => (
            <option key={i.id} value={i.id}>{i.emoji} {i.name}</option>
          ))}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as any)}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border border-border">
          <option value="todas">Todas las categorías</option>
          {ALL_CATEGORIES.map((c: string) => <option key={c} value={c}>{CATEGORY_LABELS[c as PracticeCategory]}</option>)}
        </select>
      </div>

      {/* ═══ LIST VIEW ═══ */}
      {viewMode === 'list' && (
        <div className="space-y-4">

          {/* ── Weekly Summary Card ── */}
          <div className="stat-card space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="section-title text-sm">
                  {weeklyStats.isCurrentWeek ? 'Esta semana' : `Semana del ${weeklyStats.startLabel}`}
                </h3>
                <span className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs font-mono font-medium text-foreground/90">
                  {weeklyStats.startLabel} – {weeklyStats.endLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setWeekOffset(o => o - 1)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  title="Semana anterior"
                >
                  <ChevronLeft className="h-4 w-4 text-foreground/80" />
                </button>
                {!weeklyStats.isCurrentWeek && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="text-xs text-primary font-semibold px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors"
                  >
                    Hoy
                  </button>
                )}
                <button
                  onClick={() => setWeekOffset(o => Math.min(0, o + 1))}
                  disabled={weeklyStats.isCurrentWeek}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Semana siguiente"
                >
                  <ChevronRight className="h-4 w-4 text-foreground/80" />
                </button>
              </div>
            </div>

            {/* Summary metrics row */}
            <div className="flex flex-wrap items-baseline justify-between gap-3 pt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  {formatDurationLong(weeklyStats.totalMinutes)}
                </span>
                <span className="text-xs font-medium text-muted-foreground">practicados</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="metric-badge">
                  <span className="font-mono font-bold text-amber-300 text-sm">{weeklyStats.totalSessions}</span> sesiones
                </span>
                <span className="metric-badge">
                  <span className="font-mono font-bold text-amber-300 text-sm">{weeklyStats.activeDays}</span> días activos
                </span>
              </div>
            </div>

            {/* Day bars - Clean, bright, clearly readable */}
            <div className="flex items-end gap-2 h-28 pt-2 pb-1">
              {weeklyStats.days.map((d) => (
                <div key={d.dateStr} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                  {d.minutes > 0 ? (
                    <span className="text-xs font-mono font-bold text-amber-300 drop-shadow-sm leading-none">
                      {formatDuration(d.minutes)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-muted-foreground/30 leading-none">—</span>
                  )}
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      d.isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''
                    }`}
                    style={{
                      height: `${Math.max((d.minutes / weeklyStats.maxDayMins) * 64, d.minutes > 0 ? 8 : 4)}px`,
                      background: d.minutes > 0
                        ? `linear-gradient(to top, hsl(42 75% 45%), hsl(42 75% 58%))`
                        : 'hsl(var(--secondary))',
                      boxShadow: d.minutes > 0 ? '0 0 12px rgba(245,158,11,0.25)' : 'none',
                    }}
                  />
                  <span
                    className={`text-xs font-mono font-bold uppercase leading-none ${
                      d.isToday ? 'text-primary' : 'text-foreground/80'
                    }`}
                  >
                    {d.shortLabel}
                  </span>
                </div>
              ))}
            </div>

            {/* Top categories breakdown */}
            {weeklyStats.topCats.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center text-xs uppercase tracking-wider font-bold text-muted-foreground">
                  <span>Categorías</span>
                  <span>Tiempo</span>
                </div>
                <div className="space-y-2">
                  {weeklyStats.topCats.map(([cat, mins]) => {
                    const maxMins = weeklyStats.topCats[0]?.[1] || 1;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-foreground/95">{CATEGORY_LABELS[cat as PracticeCategory] ?? cat}</span>
                          <span className="font-mono font-bold text-amber-300">{formatDurationLong(Math.round(mins))}</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500/70 to-primary rounded-full transition-all duration-500"
                            style={{ width: `${(mins / maxMins) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {weeklyStats.totalMinutes === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2 italic">Sin sesiones esta semana</p>
            )}
          </div>

          {/* ── Session list ── */}
          {filtered.length === 0 ? (
            <div className="stat-card py-12 text-center">
              <p className="text-muted-foreground font-medium">No hay sesiones que mostrar</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((s: any) => (
                <AppTooltip key={s.id} content="Haz clic para editar los detalles de esta sesión.">
                  <div onClick={() => openEdit(s.id)}
                    className="stat-card flex items-center justify-between cursor-pointer hover:border-primary/40 group p-3.5 sm:p-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-2xl shrink-0 p-2 rounded-xl bg-white/5 border border-white/5 group-hover:scale-105 transition-transform">
                        {instruments.find((i: InstrumentDef) => i.id === s.instrument)?.emoji || '🎼'}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground">{formatDate(s.date)}</p>
                        <p className="text-xs font-medium text-foreground/80 truncate mt-0.5">
                          {s.categories.map((c: string) => CATEGORY_LABELS[c as PracticeCategory]).join(', ')}
                        </p>
                        {s.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-mono text-sm sm:text-base font-bold text-amber-300">{formatDurationLong(s.durationMinutes)}</p>
                      <p className="text-xs text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)] mt-0.5">
                        {'★'.repeat(s.rating)}{'☆'.repeat(5 - s.rating)}
                      </p>
                    </div>
                  </div>
                </AppTooltip>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ CALENDAR VIEW ═══ */}
      {viewMode === 'calendar' && (
        <div className="stat-card space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="p-2 hover:bg-secondary rounded-lg border border-white/5 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="section-title capitalize text-base sm:text-lg">
              {calendarMonth.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="p-2 hover:bg-secondary rounded-lg border border-white/5 transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
              <div key={d} className="text-xs text-foreground/75 font-bold py-1.5">{d}</div>
            ))}
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`pad-${i}`} />;
              const dateStr = getDateStr(day);
              const daySessions = sessionsByDate.get(dateStr) || [];
              const totalMin = daySessions.reduce((sum: number, x: any) => sum + x.durationMinutes, 0);
              const hasData = daySessions.length > 0;
              const intensity = Math.min(totalMin / 90, 1);
              const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
              const isToday = dateStr === today;
              return (
                <div key={day}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all cursor-default ${
                    hasData
                      ? 'bg-primary/20 border border-primary/40 text-foreground font-semibold shadow-sm'
                      : isToday
                        ? 'border-2 border-primary text-primary font-bold bg-primary/5'
                        : 'text-foreground/70 bg-secondary/30 hover:bg-secondary/50'
                  }`}
                  style={hasData ? { backgroundColor: `hsl(42 75% 58% / ${0.35 + intensity * 0.55})` } : {}}
                  title={hasData ? `${daySessions.length} sesión(es), ${formatDuration(totalMin)}` : undefined}
                >
                  <span className={`text-xs font-semibold ${isToday ? 'text-primary font-bold' : ''}`}>{day}</span>
                  {hasData && (
                    <span className="text-[10px] font-mono font-bold text-amber-300 leading-none mt-0.5">
                      {formatDuration(totalMin)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 pt-2 justify-center border-t border-white/5">
            <span className="text-xs text-muted-foreground font-medium">Menos</span>
            {[0.2, 0.4, 0.6, 0.8, 1].map(v => (
              <div key={v} className="w-5 h-5 rounded-md border border-white/10" style={{ backgroundColor: `hsl(42 75% 58% / ${0.25 + v * 0.7})` }} />
            ))}
            <span className="text-xs text-muted-foreground font-medium">Más</span>
          </div>
        </div>
      )}

      {/* ═══ STATS VIEW ═══ */}
      {viewMode === 'stats' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="stat-card text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono drop-shadow-sm">{formatDuration(stats.totalMinutes)}</p>
              <p className="text-xs font-semibold text-foreground/80 mt-1">Tiempo total</p>
            </div>
            <div className="stat-card text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono drop-shadow-sm">{stats.totalSessions}</p>
              <p className="text-xs font-semibold text-foreground/80 mt-1">Sesiones</p>
            </div>
            <div className="stat-card text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono drop-shadow-sm">{stats.uniqueDays}</p>
              <p className="text-xs font-semibold text-foreground/80 mt-1">Días practicados</p>
            </div>
            <div className="stat-card text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono drop-shadow-sm">{formatDuration(stats.avgMinutes)}</p>
              <p className="text-xs font-semibold text-foreground/80 mt-1">Promedio/sesión</p>
            </div>
          </div>

          {/* Monthly trend */}
          <div className="stat-card">
            <h3 className="section-title text-sm mb-3">Tendencia mensual</h3>
            <div className="flex items-end gap-2 h-36 pt-2 pb-1">
              {stats.monthlyMinutes.map(m => (
                <div key={m.label} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                  <span className="text-xs font-mono font-bold text-amber-300 leading-none">
                    {m.minutes > 0 ? formatDuration(m.minutes) : '—'}
                  </span>
                  <div className="w-full rounded-t-md bg-gradient-to-t from-primary/60 to-primary transition-all duration-500"
                    style={{ height: `${(m.minutes / maxMonthly) * 88}px`, minHeight: m.minutes > 0 ? '6px' : '2px' }} />
                  <span className="text-xs font-semibold text-foreground/80 capitalize">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top categories */}
          <div className="stat-card">
            <h3 className="section-title text-sm mb-3">Categorías más practicadas</h3>
            <div className="space-y-3">
              {stats.topCategories.map(([cat, count]) => {
                const maxCount = stats.topCategories[0]?.[1] || 1;
                const mins = Math.round(stats.catMinutes[cat] || 0);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-foreground/95">{CATEGORY_LABELS[cat as PracticeCategory]}</span>
                      <span className="font-mono font-bold text-amber-300">{count} ses. · {formatDuration(mins)}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500/70 to-primary rounded-full transition-all duration-500"
                        style={{ width: `${(count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rating distribution */}
          <div className="stat-card">
            <h3 className="section-title text-sm mb-3">Calidad de sesiones</h3>
            <div className="flex items-end gap-2 h-20 pt-2 pb-1">
              {stats.ratingDist.map(({ rating, count }) => (
                <div key={rating} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                  <span className="text-xs font-mono font-bold text-amber-300">{count}</span>
                  <div className="w-full rounded-t-md transition-all duration-500"
                    style={{
                      height: `${(count / stats.maxRatingCount) * 44}px`,
                      minHeight: count > 0 ? '6px' : '2px',
                      background: `linear-gradient(to top, hsl(42 75% ${30 + rating * 6}%), hsl(42 75% ${40 + rating * 6}%))`,
                    }} />
                  <span className="text-amber-400 text-xs font-bold">{'★'.repeat(rating)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      <Dialog open={!!editId} onOpenChange={open => { if (!open) setEditId(null); }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Editar Sesión</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Fecha</label>
                <Input type="date" value={editDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Instrumento</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {instruments.map((i: InstrumentDef) => (
                    <button key={i.id} onClick={() => setEditInstrument(i.id)}
                      className={`chip flex-1 justify-center text-xs ${editInstrument === i.id ? 'chip-active' : ''}`}>
                      {i.emoji} {i.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Horas</label>
                <Input type="number" min={0} value={editHours} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditHours(parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Minutos</label>
                <Input type="number" min={0} max={59} value={editMins} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditMins(parseInt(e.target.value) || 0)} />
              </div>
            </div>
            {(editHours > 0 || editMins > 0) && (
              <p className="text-xs text-muted-foreground text-center">
                = {editHours * 60 + editMins} minutos totales
              </p>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Categorías</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_CATEGORIES.map((cat: string) => (
                  <button key={cat}
                    onClick={() => setEditCategories((prev: PracticeCategory[]) => prev.includes(cat as PracticeCategory) ? prev.filter(c => c !== cat) : [...prev, cat as PracticeCategory])}
                    className={`chip text-xs ${editCategories.includes(cat as PracticeCategory) ? 'chip-active' : ''}`}>
                    {CATEGORY_LABELS[cat as PracticeCategory]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Calidad</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setEditRating(star)} className="text-xl transition-transform hover:scale-110">
                    {star <= editRating ? '★' : '☆'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Notas</label>
              <Textarea value={editNotes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditNotes(e.target.value)} rows={3} />
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <Button variant="destructive" size="sm" onClick={() => setDeleteId(editId)}>🗑 Eliminar</Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditId(null)}>Cancelar</Button>
                <Button size="sm" onClick={saveEdit}>Guardar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <DialogContent className="bg-card border-border max-w-sm text-center">
          <p className="text-4xl mb-2">⚠</p>
          <p className="font-display text-lg">¿Eliminar esta sesión?</p>
          <p className="text-sm text-muted-foreground mt-1">Esta acción no se puede deshacer.</p>
          <div className="flex justify-center gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Sí, eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
