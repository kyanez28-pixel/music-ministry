import { useState, useMemo } from 'react';
import { useSessions, useHarmonyLogs } from '@/hooks/use-music-data';
import { generateId, getTodayEC } from '@/lib/music-utils';
import { PREDEFINED_HARMONIES, HARMONY_CATEGORIES } from '@/lib/predefined-harmonies';
import type { Instrument, HarmonyPracticeLog } from '@/types/music';
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

export default function HarmoniesPage() {
  const [sessions, setSessions] = useSessions();
  const [harmonyLogs, setHarmonyLogs] = useHarmonyLogs();
  const { instruments } = useInstruments();
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [instrument, setInstrument] = useState<Instrument>(instruments[0]?.id || 'piano');
  const [search, setSearch] = useState('');

  // Video attachments
  const [harmonyVideos, setHarmonyVideos] = useLocalStorage<Record<string, string>>('mm-harmony-videos', {});
  const [editingVideoHarmony, setEditingVideoHarmony] = useState<{id: string, name: string} | null>(null);
  const [tempVideoUrl, setTempVideoUrl] = useState('');

  const openVideoEdit = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); e.preventDefault();
    setEditingVideoHarmony({ id, name });
    setTempVideoUrl(harmonyVideos[id] || '');
  };

  const saveVideo = () => {
    if (editingVideoHarmony) {
      setHarmonyVideos((prev: Record<string, string>) => ({ ...prev, [editingVideoHarmony.id]: tempVideoUrl }));
    }
    setEditingVideoHarmony(null);
  };

  const today = getTodayEC();

  const todayChecked = useMemo(() => {
    const set = new Set<string>();
    harmonyLogs
      .filter(l => l.date === today && l.instrument === instrument)
      .forEach(l => set.add(l.harmonyId));
    return set;
  }, [harmonyLogs, today, instrument]);

  const filtered = useMemo(() => PREDEFINED_HARMONIES
    .filter((h: any) => filterCategory === 'todos' || h.category === filterCategory)
    .filter((h: any) => !search.trim() ||
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.description.toLowerCase().includes(search.toLowerCase())),
  [filterCategory, search]);

  const practiceCount = useMemo(() => {
    const counts: Record<string, number> = {};
    harmonyLogs.forEach((l: HarmonyPracticeLog) => { counts[l.harmonyId] = (counts[l.harmonyId] || 0) + 1; });
    return counts;
  }, [harmonyLogs]);

  const maxPractice = Math.max(1, ...Object.values(practiceCount));

  const toggleHarmony = (harmonyId: string) => {
    if (todayChecked.has(harmonyId)) {
      setHarmonyLogs((prev: HarmonyPracticeLog[]) => prev.filter((l: HarmonyPracticeLog) =>
        !(l.harmonyId === harmonyId && l.date === today && l.instrument === instrument)
      ));
    } else {
      const log: HarmonyPracticeLog = { harmonyId, date: today, instrument };
      setHarmonyLogs((prev: HarmonyPracticeLog[]) => [...prev, log]);
    }
  };

  const toggleAll = () => {
    const allChecked = filtered.every((h: any) => todayChecked.has(h.id));
    if (allChecked) {
      setHarmonyLogs((prev: HarmonyPracticeLog[]) => prev.filter((l: HarmonyPracticeLog) =>
        !(filtered.some((h: any) => h.id === l.harmonyId) && l.date === today && l.instrument === instrument)
      ));
    } else {
      const newLogs: HarmonyPracticeLog[] = filtered
        .filter((h: any) => !todayChecked.has(h.id))
        .map((h: any) => ({ harmonyId: h.id, date: today, instrument }));
      setHarmonyLogs((prev: HarmonyPracticeLog[]) => [...prev, ...newLogs]);
    }
  };

  const saveSession = () => {
    const checkedToday = harmonyLogs.filter(l => l.date === today && l.instrument === instrument);
    if (checkedToday.length === 0) {
      toast.error('Marca al menos una armonía antes de guardar');
      return;
    }

    const names = checkedToday
      .map((l: HarmonyPracticeLog) => PREDEFINED_HARMONIES.find((h: any) => h.id === l.harmonyId)?.name)
      .filter(Boolean)
      .join(', ');
    const notesText = `Armonías (${checkedToday.length}): ${names}`;

    const existingSession = sessions.find(
      s => s.date === today && s.instrument === instrument && s.categories.includes('armonias')
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
        categories: ['armonias' as const],
        notes: notesText,
        rating: 3,
        goal: '',
      }]);
    }

    setHarmonyLogs((prev: HarmonyPracticeLog[]) => prev.filter((l: HarmonyPracticeLog) => !(l.date === today && l.instrument === instrument)));
    toast.success(`¡Sesión guardada! ${checkedToday.length} armonía${checkedToday.length !== 1 ? 's' : ''} registrada${checkedToday.length !== 1 ? 's' : ''}`);
  };

  const checkedCount = todayChecked.size;
  const allFilteredChecked = filtered.length > 0 && filtered.every(h => todayChecked.has(h.id));
  const totalPracticed = Object.keys(practiceCount).length;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="lista" className="w-full">
        {/* Header with Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="page-title">🎶 Armonías</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalPracticed} de {PREDEFINED_HARMONIES.length} armonías practicadas alguna vez
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <TabsList className="glass-panel p-1">
              <TabsTrigger value="lista" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2">
                <ListMusic className="h-4 w-4" /> Lista
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

        <TabsContent value="lista" className="space-y-6 mt-0">
          {/* Instrument */}
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
              placeholder="Buscar armonía..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-40 flex-1 glass-panel border-white/5"
            />
            <select
              value={filterCategory}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterCategory(e.target.value)}
              className="glass-panel text-secondary-foreground rounded-md px-3 py-1.5 text-sm border-white/5"
            >
              <option value="todos">Todas las categorías</option>
              {HARMONY_CATEGORIES.map((c: any) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>

          {/* Progress */}
          <div className="stat-card border-white/5 bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Hoy: <span className="text-primary font-semibold">{checkedCount}</span> marcada{checkedCount !== 1 ? 's' : ''}
              </span>
              {filtered.length > 0 && (
                <button onClick={toggleAll} className="text-xs text-primary hover:underline">
                  {allFilteredChecked ? 'Desmarcar todas' : 'Marcar todas las filtradas'}
                </button>
              )}
            </div>
            <Progress value={filtered.length > 0 ? (checkedCount / filtered.length) * 100 : 0} className="h-2" />
          </div>

          {/* Groups by category */}
          {HARMONY_CATEGORIES
            .filter(cat => filterCategory === 'todos' || filterCategory === cat.key)
            .map((cat: any) => {
              const items = filtered.filter((h: any) => h.category === cat.key);
              if (items.length === 0) return null;
              return (
                <div key={cat.key}>
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1 opacity-70">
                    {cat.label}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {items.map((harmony: any) => {
                      const checked = todayChecked.has(harmony.id);
                      const count = practiceCount[harmony.id] ?? 0;
                      const progressPct = Math.min(100, (count / maxPractice) * 100);
                      return (
                        <label
                          key={harmony.id}
                          className={`stat-card flex items-center gap-3 cursor-pointer transition-all hover:border-primary/40 group ${
                            checked ? 'border-primary/40 bg-primary/10' : 'border-white/5 bg-white/5'
                          }`}
                        >
                          <Checkbox checked={checked} onCheckedChange={() => toggleHarmony(harmony.id)} 
                            className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mt-0.5">
                              <span className={`text-sm font-medium truncate flex items-center gap-1.5 ${checked ? 'text-primary' : 'text-foreground'}`}>
                                {harmony.name}
                                <button onClick={(e: React.MouseEvent) => openVideoEdit(e, harmony.id, harmony.name)}
                                  className={`hover:text-primary transition-colors shrink-0 ${harmonyVideos[harmony.id] ? 'text-red-500' : 'text-muted-foreground/40 opacity-0 group-hover:opacity-100'}`}>
                                  <Play className="h-3.5 w-3.5" />
                                </button>
                              </span>
                              {count > 0 && (
                                <span className="text-xs text-muted-foreground shrink-0 font-mono opacity-60">{count}×</span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate opacity-70">{harmony.description}</p>
                            {count > 0 && (
                              <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-primary/40 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {filtered.length === 0 && (
            <div className="stat-card py-16 text-center border-dashed border-white/10 opacity-60">
              <p className="text-muted-foreground italic">No hay armonías que coincidan con los filtros.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ejercicios" className="mt-0 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="stat-card border-white/5 bg-primary/5 mb-6">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-primary" /> Ejercicios de Armonía
            </h3>
            <p className="text-xs text-muted-foreground">
              Registra aquí tus progresiones por grados, voicings específicos y ejemplos armónicos.
            </p>
          </div>
          <ExerciseSection defaultCategory="Armonía" />
        </TabsContent>
      </Tabs>

      {filtered.length === 0 && (
        <div className="stat-card py-8 text-center">
          <p className="text-muted-foreground">No hay armonías con estos filtros</p>
        </div>
      )}

      {/* Video Dialog */}
      <Dialog open={!!editingVideoHarmony} onOpenChange={(open: boolean) => { if (!open) setEditingVideoHarmony(null); }}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Play className="h-4 w-4 text-red-500" />
              Video de clase / referencia
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm font-semibold text-primary">{editingVideoHarmony?.name}</p>
            <div>
              <label className="text-xs text-muted-foreground">Link de YouTube (ej: https://youtu.be/...)</label>
              <Input value={tempVideoUrl} onChange={e => setTempVideoUrl(e.target.value)} placeholder="https://..." />
            </div>
            {tempVideoUrl && tempVideoUrl.includes('youtu') && (
              <div className="w-full aspect-video rounded-lg overflow-hidden bg-black/10 mt-2">
                <iframe src={tempVideoUrl.replace('watch?v=', 'embed/').split('&')[0]} className="w-full h-full border-none" />
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingVideoHarmony(null)}>Cancelar</Button>
              <Button size="sm" onClick={saveVideo}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
