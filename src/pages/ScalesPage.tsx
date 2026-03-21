import { useState, useMemo } from 'react';
import { useSessions, useScaleLogs } from '@/hooks/use-music-data';
import { generateId, getTodayEC } from '@/lib/music-utils';
import { PREDEFINED_SCALES, SCALE_TYPE_OPTIONS, NOTES } from '@/lib/predefined-scales';
import type { Instrument, ScalePracticeLog } from '@/types/music';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, BookOpen, ListMusic } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExerciseSection } from '@/components/ExerciseSection';
import type { Exercise, InstrumentDef } from '@/types/music';
import { useInstruments } from '@/hooks/use-instruments';

export default function ScalesPage() {
  const [sessions, setSessions] = useSessions();
  const [scaleLogs, setScaleLogs] = useScaleLogs();
  const [filterType, setFilterType] = useState<string>('todos');
  const [filterNote, setFilterNote] = useState<string>('todos');
  const [instrument, setInstrument] = useState<Instrument>('piano');
  const { instruments } = useInstruments();
  const [search, setSearch] = useState('');

  // Video attachments
  const [scaleVideos, setScaleVideos] = useLocalStorage<Record<string, string>>('mm-scale-videos', {});
  const [editingVideoScale, setEditingVideoScale] = useState<{id: string, name: string} | null>(null);
  const [tempVideoUrl, setTempVideoUrl] = useState('');

  const openVideoEdit = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); e.preventDefault();
    setEditingVideoScale({ id, name });
    setTempVideoUrl(scaleVideos[id] || '');
  };

  const saveVideo = () => {
    if (editingVideoScale) {
      setScaleVideos((prev: Record<string, string>) => ({ ...prev, [editingVideoScale.id]: tempVideoUrl }));
    }
    setEditingVideoScale(null);
  };

  const today = getTodayEC();

  const todayChecked = useMemo(() => {
    const set = new Set<string>();
    scaleLogs
      .filter((l: any) => l.date === today && l.instrument === instrument)
      .forEach((l: any) => set.add(l.scaleId));
    return set;
  }, [scaleLogs, today, instrument]);

  const filtered = useMemo(() => PREDEFINED_SCALES
    .filter((s: any) => filterType === 'todos' || s.scaleType === filterType)
    .filter((s: any) => filterNote === 'todos' || s.note === filterNote)
    .filter((s: any) => !search.trim() || s.label.toLowerCase().includes(search.toLowerCase())),
  [filterType, filterNote, search]);

  const practiceCount = useMemo(() => {
    const counts: Record<string, number> = {};
    scaleLogs.forEach((l: any) => { counts[l.scaleId] = (counts[l.scaleId] || 0) + 1; });
    return counts;
  }, [scaleLogs]);

  const maxPractice = Math.max(1, ...Object.values(practiceCount));

  const toggleScale = (scaleId: string) => {
    if (todayChecked.has(scaleId)) {
      setScaleLogs((prev: any[]) => prev.filter((l: any) =>
        !(l.scaleId === scaleId && l.date === today && l.instrument === instrument)
      ));
    } else {
      const log: ScalePracticeLog = { scaleId, date: today, instrument };
      setScaleLogs((prev: any[]) => [...prev, log]);
    }
  };

  // Marcar/desmarcar todas las filtradas
  const toggleAll = () => {
    const allChecked = filtered.every((s: any) => todayChecked.has(s.id));
    if (allChecked) {
      // Desmarcar todas
      setScaleLogs((prev: any[]) => prev.filter((l: any) =>
        !(filtered.some((s: any) => s.id === l.scaleId) && l.date === today && l.instrument === instrument)
      ));
    } else {
      // Marcar las que faltan
      const newLogs: ScalePracticeLog[] = filtered
        .filter((s: any) => !todayChecked.has(s.id))
        .map((s: any) => ({ scaleId: s.id, date: today, instrument }));
      setScaleLogs((prev: any[]) => [...prev, ...newLogs]);
    }
  };

  const saveSession = () => {
    const checkedToday = scaleLogs.filter((l: any) => l.date === today && l.instrument === instrument);
    if (checkedToday.length === 0) {
      toast.error('Marca al menos una escala antes de guardar');
      return;
    }

    const scaleNames = checkedToday
      .map((l: any) => PREDEFINED_SCALES.find((s: any) => s.id === l.scaleId)?.label)
      .filter(Boolean)
      .join(', ');
    const notesText = `Escalas (${checkedToday.length}): ${scaleNames}`;

    const existingSession = sessions.find(
      (s: any) => s.date === today && s.instrument === instrument && s.categories.includes('escalas')
    );

    if (existingSession) {
      setSessions((prev: any[]) => prev.map((s: any) =>
        s.id === existingSession.id
          ? { ...s, notes: notesText, durationMinutes: Math.max(s.durationMinutes, checkedToday.length * 2) }
          : s
      ));
    } else {
      setSessions((prev: any[]) => [...prev, {
        id: generateId(),
        date: today,
        instrument,
        durationMinutes: checkedToday.length * 2,
        categories: ['escalas' as const],
        notes: notesText,
        rating: 3,
        goal: '',
      }]);
    }

    setScaleLogs((prev: any[]) => prev.filter((l: any) => !(l.date === today && l.instrument === instrument)));
    toast.success(`¡Sesión guardada! ${checkedToday.length} escala${checkedToday.length !== 1 ? 's' : ''} registrada${checkedToday.length !== 1 ? 's' : ''}`);
  };

  const checkedCount = todayChecked.size;
  const allFilteredChecked = filtered.length > 0 && filtered.every((s: any) => todayChecked.has(s.id));

  // Estadísticas globales de escalas practicadas
  const totalPracticed = Object.keys(practiceCount).length;
  const totalScales = PREDEFINED_SCALES.length;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="guia" className="w-full">
        {/* Header with Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="page-title">🎼 Escalas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalPracticed} de {totalScales} practicadas alguna vez
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <TabsList className="glass-panel p-1">
              <TabsTrigger value="guia" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2">
                <ListMusic className="h-4 w-4" /> Guía
              </TabsTrigger>
              <TabsTrigger value="ejercicios" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Mis Ejercicios
              </TabsTrigger>
            </TabsList>
            
            <button
              onClick={saveSession}
              disabled={checkedCount === 0}
              className="premium-btn-glow px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar Sesión {checkedCount > 0 ? `(${checkedCount})` : ''}
            </button>
          </div>
        </div>

        <TabsContent value="guia" className="space-y-6 mt-0">
          {/* Instrument selector */}
          <div className="flex flex-wrap gap-2">
            {instruments.map((inst: InstrumentDef) => (
              <button
                key={inst.id}
                onClick={() => setInstrument(inst.id)}
                className={`chip flex-1 justify-center ${instrument === inst.id ? 'chip-active' : ''}`}
              >
                {inst.emoji} {inst.name}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Buscar escala..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="w-40 flex-1 glass-panel border-white/5"
            />
            <select
              value={filterNote}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterNote(e.target.value)}
              className="glass-panel text-secondary-foreground rounded-md px-3 py-1.5 text-sm border-white/5"
            >
              <option value="todos">Todas las notas</option>
              {NOTES.map((n: string) => <option key={n} value={n}>{n}</option>)}
            </select>
            <select
              value={filterType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value)}
              className="glass-panel text-secondary-foreground rounded-md px-3 py-1.5 text-sm border-white/5"
            >
              <option value="todos">Todos los tipos</option>
              {SCALE_TYPE_OPTIONS.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Progress + toggle all */}
          <div className="stat-card border-white/5 bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Hoy: <span className="text-primary font-semibold">{checkedCount}</span> marcada{checkedCount !== 1 ? 's' : ''}
                {filtered.length !== PREDEFINED_SCALES.length && ` (de ${filtered.length} filtradas)`}
              </span>
              {filtered.length > 0 && (
                <button
                  onClick={toggleAll}
                  className="text-xs text-primary hover:underline"
                >
                  {allFilteredChecked ? 'Desmarcar todas' : 'Marcar todas las filtradas'}
                </button>
              )}
            </div>
            <Progress value={filtered.length > 0 ? (checkedCount / filtered.length) * 100 : 0} className="h-2" />
          </div>

          {/* Scale grid */}
          {filtered.length === 0 ? (
            <div className="stat-card py-16 text-center border-dashed border-white/10 opacity-60">
              <p className="text-muted-foreground italic">No hay escalas que coincidan con los filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filtered.map((scale: any) => {
                const checked = todayChecked.has(scale.id);
                const count = practiceCount[scale.id] ?? 0;
                const progressPct = Math.min(100, (count / maxPractice) * 100);

                return (
                  <label
                    key={scale.id}
                    className={`stat-card flex items-center gap-3 cursor-pointer transition-all hover:border-primary/40 group ${
                      checked ? 'border-primary/40 bg-primary/10' : 'border-white/5 bg-white/5'
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleScale(scale.id)}
                      className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className={`text-sm font-medium truncate flex items-center gap-1.5 ${checked ? 'text-primary' : 'text-foreground'}`}>
                          {scale.label}
                          <button onClick={(e: React.MouseEvent) => openVideoEdit(e, scale.id, scale.label)}
                            className={`hover:text-primary transition-colors shrink-0 ${scaleVideos[scale.id] ? 'text-red-500' : 'text-muted-foreground/40 opacity-0 group-hover:opacity-100'}`}>
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        </span>
                        {count > 0 && (
                          <span className="text-xs text-muted-foreground shrink-0 font-mono opacity-60">{count}×</span>
                        )}
                      </div>
                      {count > 0 && (
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-primary/40 rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ejercicios" className="mt-0 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="stat-card border-white/5 bg-primary/5 mb-6">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-primary" /> Ejercicios de Escalas
            </h3>
            <p className="text-xs text-muted-foreground">
              Guarda tus digitaciones, capturas de partituras y retos técnicos específicos aquí.
            </p>
          </div>
          <ExerciseSection defaultCategory="Escala" />
        </TabsContent>
      </Tabs>

      {/* Video Dialog */}
      <Dialog open={!!editingVideoScale} onOpenChange={(open: boolean) => { if (!open) setEditingVideoScale(null); }}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Play className="h-4 w-4 text-red-500" />
              Video de clase / referencia
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm font-semibold text-primary">{editingVideoScale?.name}</p>
            <div>
              <label className="text-xs text-muted-foreground">Link de YouTube (ej: https://youtu.be/...)</label>
              <Input value={tempVideoUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempVideoUrl(e.target.value)} placeholder="https://..." />
            </div>
            {tempVideoUrl && tempVideoUrl.includes('youtu') && (
              <div className="w-full aspect-video rounded-lg overflow-hidden bg-black/10 mt-2">
                <iframe src={tempVideoUrl.replace('watch?v=', 'embed/').split('&')[0]} className="w-full h-full border-none" />
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingVideoScale(null)}>Cancelar</Button>
              <Button size="sm" onClick={saveVideo}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
