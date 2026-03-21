import { useState, useMemo } from 'react';
import { useSessions } from '@/hooks/use-music-data';
import { formatDate, formatDurationLong, formatDuration } from '@/lib/music-utils';
import { CATEGORY_LABELS, ALL_CATEGORIES, type PracticeCategory, type Instrument } from '@/types/music';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CalendarDays, BarChart3, Music, ChevronLeft, ChevronRight } from 'lucide-react';
import { useInstruments } from '@/hooks/use-instruments';
import { AppTooltip } from '@/components/AppTooltip';
import type { InstrumentDef } from '@/types/music';

type ViewMode = 'list' | 'calendar' | 'stats';

export default function HistoryPage() {
  const [sessions, setSessions] = useSessions();
  const [filterInstrument, setFilterInstrument] = useState<Instrument | 'todos'>('todos');
  const [filterCategory, setFilterCategory] = useState<PracticeCategory | 'todas'>('todas');
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const { instruments } = useInstruments();

  const filtered = sessions
    .filter((s: any) => filterInstrument === 'todos' || s.instrument === filterInstrument)
    .filter((s: any) => filterCategory === 'todas' || s.categories.includes(filterCategory))
    .sort((a: any, b: any) => b.date.localeCompare(a.date));

  // Edit state
  const [editDate, setEditDate] = useState('');
  const [editInstrument, setEditInstrument] = useState<Instrument>('piano');
  const [editHours, setEditHours] = useState(0);
  const [editMins, setEditMins] = useState(0);
  const [editCategories, setEditCategories] = useState<PracticeCategory[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [editRating, setEditRating] = useState(3);

  const openEdit = (id: string) => {
    const s = sessions.find((x: any) => x.id === id);
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
    sessions.forEach((s: any) => {
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

  // ─── Stats ───
  const stats = useMemo(() => {
    const totalMinutes = sessions.reduce((sum: number, x: any) => sum + x.durationMinutes, 0);
    const totalSessions = sessions.length;
    const uniqueDays = new Set(sessions.map((s: any) => s.date)).size;
    const avgMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

    const catCounts: Record<string, number> = {};
    const catMinutes: Record<string, number> = {};
    sessions.forEach((s: any) => {
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
      const minutes = sessions.filter((s: any) => s.date.startsWith(prefix)).reduce((sum: number, s: any) => sum + s.durationMinutes, 0);
      monthlyMinutes.push({ label, minutes });
    }

    // Rating distribution
    const ratingDist = [1, 2, 3, 4, 5].map(r => ({
      rating: r,
      count: sessions.filter((s: any) => s.rating === r).length,
    }));
    const maxRatingCount = Math.max(...ratingDist.map(r => r.count), 1);

    return { totalMinutes, totalSessions, uniqueDays, avgMinutes, topCategories, catMinutes, monthlyMinutes, ratingDist, maxRatingCount };
  }, [sessions]);

  const maxMonthly = Math.max(...stats.monthlyMinutes.map(m => m.minutes), 1);

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
        filtered.length === 0 ? (
          <div className="stat-card py-12 text-center">
            <p className="text-muted-foreground">No hay sesiones que mostrar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s: any) => (
              <AppTooltip key={s.id} content="Haz clic para editar los detalles de esta sesión.">
                <div onClick={() => openEdit(s.id)}
                  className="stat-card flex items-center justify-between cursor-pointer hover:border-primary/30">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xl shrink-0">
                      {instruments.find((i: InstrumentDef) => i.id === s.instrument)?.emoji || '🎼'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{formatDate(s.date)}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.categories.map(c => CATEGORY_LABELS[c]).join(', ')}
                      </p>
                      {s.notes && (
                        <p className="text-xs text-muted-foreground/60 mt-0.5 line-clamp-1">{s.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-mono text-sm">{formatDurationLong(s.durationMinutes)}</p>
                    <p className="text-xs text-amber-400">{'★'.repeat(s.rating)}{'☆'.repeat(5 - s.rating)}</p>
                  </div>
                </div>
              </AppTooltip>
            ))}
          </div>
        )
      )}

      {/* ═══ CALENDAR VIEW ═══ */}
      {viewMode === 'calendar' && (
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="p-1 hover:bg-secondary rounded"><ChevronLeft className="h-5 w-5" /></button>
            <h3 className="section-title capitalize">
              {calendarMonth.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="p-1 hover:bg-secondary rounded"><ChevronRight className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
              <div key={d} className="text-xs text-muted-foreground font-medium py-1">{d}</div>
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
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-md text-xs transition-colors cursor-default ${
                    hasData ? 'text-primary-foreground' : isToday ? 'border border-primary text-primary' : 'text-muted-foreground'
                  }`}
                  style={hasData ? { backgroundColor: `hsl(42 60% 55% / ${0.3 + intensity * 0.7})` } : {}}
                  title={hasData ? `${daySessions.length} sesión(es), ${formatDuration(totalMin)}` : undefined}
                >
                  <span className={`font-medium ${isToday && !hasData ? 'font-bold' : ''}`}>{day}</span>
                  {hasData && <span className="text-[8px] leading-none mt-0.5">{formatDuration(totalMin)}</span>}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-4 justify-center">
            <span className="text-[10px] text-muted-foreground">Menos</span>
            {[0.2, 0.4, 0.6, 0.8, 1].map(v => (
              <div key={v} className="w-4 h-4 rounded-sm" style={{ backgroundColor: `hsl(42 60% 55% / ${0.3 + v * 0.7})` }} />
            ))}
            <span className="text-[10px] text-muted-foreground">Más</span>
          </div>
        </div>
      )}

      {/* ═══ STATS VIEW ═══ */}
      {viewMode === 'stats' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="stat-card text-center">
              <p className="text-xl font-bold text-primary font-mono">{formatDuration(stats.totalMinutes)}</p>
              <p className="text-xs text-muted-foreground">Tiempo total</p>
            </div>
            <div className="stat-card text-center">
              <p className="text-xl font-bold text-primary font-mono">{stats.totalSessions}</p>
              <p className="text-xs text-muted-foreground">Sesiones</p>
            </div>
            <div className="stat-card text-center">
              <p className="text-xl font-bold text-primary font-mono">{stats.uniqueDays}</p>
              <p className="text-xs text-muted-foreground">Días practicados</p>
            </div>
            <div className="stat-card text-center">
              <p className="text-xl font-mono font-bold text-primary">{formatDuration(stats.avgMinutes)}</p>
              <p className="text-xs text-muted-foreground">Promedio/sesión</p>
            </div>
          </div>

          {/* Monthly trend */}
          <div className="stat-card">
            <h3 className="section-title text-sm mb-3">Tendencia mensual</h3>
            <div className="flex items-end gap-2 h-28">
              {stats.monthlyMinutes.map(m => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-mono text-muted-foreground">{formatDuration(m.minutes)}</span>
                  <div className="w-full rounded-t-sm bg-primary/80 transition-all"
                    style={{ height: `${(m.minutes / maxMonthly) * 80}px`, minHeight: m.minutes > 0 ? '4px' : '0px' }} />
                  <span className="text-[10px] text-muted-foreground capitalize">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top categories */}
          <div className="stat-card">
            <h3 className="section-title text-sm mb-3">Categorías más practicadas</h3>
            <div className="space-y-2">
              {stats.topCategories.map(([cat, count]) => {
                const maxCount = stats.topCategories[0]?.[1] || 1;
                const mins = Math.round(stats.catMinutes[cat] || 0);
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-xs w-36 shrink-0">{CATEGORY_LABELS[cat as PracticeCategory]}</span>
                    <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-20 text-right">{count} · {formatDuration(mins)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rating distribution */}
          <div className="stat-card">
            <h3 className="section-title text-sm mb-3">Calidad de sesiones</h3>
            <div className="flex items-end gap-2 h-16">
              {stats.ratingDist.map(({ rating, count }) => (
                <div key={rating} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono text-muted-foreground">{count}</span>
                  <div className="w-full rounded-t-sm"
                    style={{
                      height: `${(count / stats.maxRatingCount) * 48}px`,
                      minHeight: count > 0 ? '4px' : '0px',
                      background: `hsl(42 60% ${30 + rating * 8}%)`,
                    }} />
                  <span className="text-amber-400 text-xs">{'★'.repeat(rating)}</span>
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
