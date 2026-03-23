import { useState, useMemo } from 'react';
import { useSessions, useScaleLogs, useScales, useScaleFolders } from '@/hooks/use-music-data';
import { generateId, getTodayEC } from '@/lib/music-utils';
import { PREDEFINED_SCALES, SCALE_TYPE_OPTIONS, NOTES } from '@/lib/predefined-scales';
import type { Instrument, ScalePracticeLog } from '@/types/music';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, BookOpen, ListMusic, FolderPlus, Plus, ChevronDown, ChevronRight, Trash2, Pencil } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExerciseSection } from '@/components/ExerciseSection';
import type { InstrumentDef } from '@/types/music';
import { useInstruments } from '@/hooks/use-instruments';

const FOLDER_COLORS = ['#d4a843', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#34d399', '#e879f9'];

export default function ScalesPage() {
  const [sessions, setSessions] = useSessions();
  const [scaleLogs, setScaleLogs] = useScaleLogs();
  const [customScales, setCustomScales] = useScales();
  const [folders, setFolders] = useScaleFolders();

  const [showFolderForm, setShowFolderForm] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [fFolderName, setFFolderName] = useState('');
  const [fFolderColor, setFFolderColor] = useState(FOLDER_COLORS[0]);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [filterFolder, setFilterFolder] = useState<string | 'todos'>('todos');

  const [showScaleForm, setShowScaleForm] = useState(false);
  const [editingScaleId, setEditingScaleId] = useState<string | null>(null);
  const [sName, setSName] = useState('');
  const [sFolderId, setSFolderId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('todos');
  const [filterNote, setFilterNote] = useState<string>('todos');
  const [instrument, setInstrument] = useState<Instrument>('piano');
  const { instruments } = useInstruments();
  const [search, setSearch] = useState('');

  const [scaleVideos, setScaleVideos] = useLocalStorage<Record<string, string>>('mm-scale-videos', {});
  const [editingVideoScale, setEditingVideoScale] = useState<{id: string, name: string} | null>(null);
  const [tempVideoUrl, setTempVideoUrl] = useState('');

  const openVideoEdit = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); e.preventDefault();
    setEditingVideoScale({ id, name });
    setTempVideoUrl(scaleVideos[id] || '');
  };

  const resetFolderForm = () => {
    setShowFolderForm(false); setEditingFolderId(null);
    setFFolderName(''); setFFolderColor(FOLDER_COLORS[0]);
  };

  const openEditFolder = (f: any) => {
    setEditingFolderId(f.id); setFFolderName(f.name);
    setFFolderColor(f.color || FOLDER_COLORS[0]); setShowFolderForm(true);
  };

  const saveFolder = () => {
    if (!fFolderName.trim()) { toast.error('El nombre es requerido'); return; }
    if (editingFolderId) {
      setFolders((prev: any[]) => prev.map((f: any) => f.id === editingFolderId ? { ...f, name: fFolderName, color: fFolderColor } : f));
      toast.success('Carpeta actualizada');
    } else {
      setFolders((prev: any[]) => [...prev, { id: generateId(), name: fFolderName.trim(), color: fFolderColor }]);
      toast.success('Carpeta creada');
    }
    resetFolderForm();
  };

  const deleteFolder = (id: string) => {
    setFolders((prev: any[]) => prev.filter((f: any) => f.id !== id));
    setCustomScales((prev: any[]) => prev.map((s: any) => s.folder_id === id ? { ...s, folder_id: null } : s));
    resetFolderForm();
    toast.success('Carpeta eliminada');
  };

  const resetScaleForm = () => {
    setShowScaleForm(false); setEditingScaleId(null);
    setSName(''); setSFolderId(null);
  };

  const openEditScale = (s: any) => {
    setEditingScaleId(s.id);
    setSName(s.label);
    setSFolderId(s.folder_id || null);
    setShowScaleForm(true);
  };

  const saveScale = () => {
    if (!sName.trim()) { toast.error('Nombre requerido'); return; }
    const scaleData = {
      id: editingScaleId || generateId(),
      name: sName.trim(),
      folder_id: sFolderId,
      type: 'custom',
    };
    if (customScales.some((cs: any) => cs.id === editingScaleId)) {
      setCustomScales((prev: any[]) => prev.map((s: any) => s.id === editingScaleId ? { ...s, ...scaleData } : s));
    } else if (editingScaleId) {
      setCustomScales((prev: any[]) => [...prev, scaleData]);
    } else {
      setCustomScales((prev: any[]) => [...prev, scaleData]);
    }
    toast.success('Escala guardada');
    resetScaleForm();
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

  const allScales = useMemo(() => {
    const mappedCustom = (customScales || []).map((s: any) => ({
      id: s.id,
      label: s.name,
      scaleType: s.type || 'mayor',
      note: 'C',
      folder_id: s.folder_id
    }));
    return [...PREDEFINED_SCALES, ...mappedCustom];
  }, [customScales]);

  const filtered = useMemo(() => allScales
    .filter((s: any) => filterType === 'todos' || s.scaleType === filterType)
    .filter((s: any) => filterNote === 'todos' || s.note === filterNote)
    .filter((s: any) => !search.trim() || s.label.toLowerCase().includes(search.toLowerCase()))
    .filter((s: any) => filterFolder === 'todos' || s.folder_id === filterFolder),
  [filterType, filterNote, search, allScales, filterFolder]);

  const groupedScales = useMemo(() => {
    const groups = folders.map((f: any) => ({
      folder: f,
      items: filtered.filter((s: any) => s.folder_id === f.id),
    }));
    const unfoldered = filtered.filter((s: any) => !s.folder_id);
    return { groups, unfoldered };
  }, [folders, filtered]);

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

  const toggleAll = () => {
    const allChecked = filtered.every((s: any) => todayChecked.has(s.id));
    if (allChecked) {
      setScaleLogs((prev: any[]) => prev.filter((l: any) =>
        !(filtered.some((s: any) => s.id === l.scaleId) && l.date === today && l.instrument === instrument)
      ));
    } else {
      const newLogs: ScalePracticeLog[] = filtered
        .filter((s: any) => !todayChecked.has(s.id))
        .map((s: any) => ({ scaleId: s.id, date: today, instrument }));
      setScaleLogs((prev: any[]) => [...prev, ...newLogs]);
    }
  };

  const saveSession = () => {
    const checkedToday = scaleLogs.filter((l: any) => l.date === today && l.instrument === instrument);
    if (checkedToday.length === 0) { toast.error('Marca al menos una escala antes de guardar'); return; }
    const scaleNames = checkedToday
      .map((l: any) => PREDEFINED_SCALES.find((s: any) => s.id === l.scaleId)?.label)
      .filter(Boolean).join(', ');
    const notesText = `Escalas (${checkedToday.length}): ${scaleNames}`;
    const existingSession = sessions.find((s: any) =>
      s.date === today && s.instrument === instrument && s.categories.includes('escalas')
    );
    if (existingSession) {
      setSessions((prev: any[]) => prev.map((s: any) =>
        s.id === existingSession.id ? { ...s, notes: notesText, durationMinutes: Math.max(s.durationMinutes, checkedToday.length * 2) } : s
      ));
    } else {
      setSessions((prev: any[]) => [...prev, {
        id: generateId(), date: today, instrument,
        durationMinutes: checkedToday.length * 2,
        categories: ['escalas' as const], notes: notesText, rating: 3, goal: '',
      }]);
    }
    setScaleLogs((prev: any[]) => prev.filter((l: any) => !(l.date === today && l.instrument === instrument)));
    toast.success(`¡Sesión guardada! ${checkedToday.length} escala${checkedToday.length !== 1 ? 's' : ''} registrada${checkedToday.length !== 1 ? 's' : ''}`);
  };

  const checkedCount = todayChecked.size;
  const allFilteredChecked = filtered.length > 0 && filtered.every((s: any) => todayChecked.has(s.id));
  const totalPracticed = Object.keys(practiceCount).length;

  const renderScaleCard = (scale: any) => {
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
        <Checkbox checked={checked} onCheckedChange={() => toggleScale(scale.id)} className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <span className={`text-sm font-medium truncate flex items-center gap-1.5 ${checked ? 'text-primary' : 'text-foreground'}`}>
              <span className="truncate">{scale.label}</span>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditScale(scale); }} className="opacity-0 group-hover:opacity-40 hover:opacity-100 transition-opacity"><Pencil className="h-2.5 w-2.5" /></button>
              <button onClick={(e: React.MouseEvent) => openVideoEdit(e, scale.id, scale.label)}
                className={`hover:text-primary transition-colors shrink-0 ${scaleVideos[scale.id] ? 'text-red-500' : 'text-muted-foreground/40 opacity-0 group-hover:opacity-100'}`}>
                <Play className="h-3.5 w-3.5" />
              </button>
            </span>
            {count > 0 && <span className="text-xs text-muted-foreground shrink-0 font-mono opacity-60">{count}×</span>}
          </div>
          {count > 0 && (
            <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-primary/40 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          )}
        </div>
      </label>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="guia" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="page-title">🎼 Escalas</h1>
            <p className="text-sm text-muted-foreground mt-1">{totalPracticed} de {PREDEFINED_SCALES.length} escalas · {folders.length} carpetas</p>
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
            <button onClick={() => { resetFolderForm(); setShowFolderForm(true); }} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground" title="Nueva carpeta"><FolderPlus className="h-4 w-4" /></button>
            <button onClick={() => { resetScaleForm(); setShowScaleForm(true); }} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground" title="Nueva escala"><Plus className="h-4 w-4" /></button>
            <button onClick={saveSession} disabled={checkedCount === 0} className="premium-btn-glow px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Guardar Sesión {checkedCount > 0 ? `(${checkedCount})` : ''}
            </button>
          </div>
        </div>

        <TabsContent value="guia" className="space-y-6 mt-0">
          {/* Instrument selector */}
          <div className="flex flex-wrap gap-2">
            {instruments.map((inst: InstrumentDef) => (
              <button key={inst.id} onClick={() => setInstrument(inst.id)} className={`chip flex-1 justify-center ${instrument === inst.id ? 'chip-active' : ''}`}>
                {inst.emoji} {inst.name}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Buscar escala..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="w-40 flex-1 glass-panel border-white/5" />
            <select value={filterNote} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterNote(e.target.value)} className="glass-panel text-secondary-foreground rounded-md px-3 py-1.5 text-sm border-white/5">
              <option value="todos">Todas las notas</option>
              {NOTES.map((n: string) => <option key={n} value={n}>{n}</option>)}
            </select>
            <select value={filterType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value)} className="glass-panel text-secondary-foreground rounded-md px-3 py-1.5 text-sm border-white/5">
              <option value="todos">Todos los tipos</option>
              {SCALE_TYPE_OPTIONS.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Folder filter tabs */}
          {folders.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setFilterFolder('todos')} className={`chip text-xs ${filterFolder === 'todos' ? 'chip-active' : ''}`}>Todas las carpetas</button>
              {folders.map((f: any) => (
                <button key={f.id} onClick={() => setFilterFolder(f.id)} className={`chip text-xs ${filterFolder === f.id ? 'chip-active' : ''}`} style={filterFolder !== f.id ? { borderLeft: `3px solid ${f.color}` } : {}}>
                  {f.name}
                </button>
              ))}
            </div>
          )}

          {/* Progress + toggle all */}
          <div className="stat-card border-white/5 bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Hoy: <span className="text-primary font-semibold">{checkedCount}</span> marcada{checkedCount !== 1 ? 's' : ''}
                {filtered.length !== PREDEFINED_SCALES.length && ` (de ${filtered.length} filtradas)`}
              </span>
              {filtered.length > 0 && (
                <button onClick={toggleAll} className="text-xs text-primary hover:underline">
                  {allFilteredChecked ? 'Desmarcar todas' : 'Marcar todas las filtradas'}
                </button>
              )}
            </div>
            <Progress value={filtered.length > 0 ? (checkedCount / filtered.length) * 100 : 0} className="h-2" />
          </div>

          {/* Scale grid grouped by folders */}
          {filtered.length === 0 ? (
            <div className="stat-card py-16 text-center border-dashed border-white/10 opacity-60">
              <p className="text-muted-foreground italic">No hay escalas que coincidan con los filtros.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedScales.groups.map(({ folder, items }) => (
                <div key={folder.id}>
                  <button
                    onClick={() => setCollapsedFolders((prev: Set<string>) => { const n = new Set(prev); n.has(folder.id) ? n.delete(folder.id) : n.add(folder.id); return n; })}
                    className="flex items-center gap-2 group w-full text-left mb-3"
                  >
                    {collapsedFolders.has(folder.id) ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
                    <span className="section-title text-base">{folder.name}</span>
                    <span className="text-xs text-muted-foreground">({items.length})</span>
                    <button onClick={e => { e.stopPropagation(); openEditFolder(folder); }} className="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground">editar</button>
                  </button>
                  {!collapsedFolders.has(folder.id) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ml-5">
                      {items.map((s: any) => renderScaleCard(s))}
                    </div>
                  )}
                </div>
              ))}
              {groupedScales.unfoldered.length > 0 && (
                <div>
                  {folders.length > 0 && <h3 className="section-title text-base mb-3 opacity-70">Otras Escalas ({groupedScales.unfoldered.length})</h3>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {groupedScales.unfoldered.map((s: any) => renderScaleCard(s))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ejercicios" className="mt-0 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="stat-card border-white/5 bg-primary/5 mb-6">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-1"><BookOpen className="h-4 w-4 text-primary" /> Ejercicios de Escalas</h3>
            <p className="text-xs text-muted-foreground">Guarda tus digitaciones, capturas de partituras y retos técnicos específicos aquí.</p>
          </div>
          <ExerciseSection defaultCategory="Escala" />
        </TabsContent>
      </Tabs>

      {/* Folder Form Dialog */}
      <Dialog open={showFolderForm} onOpenChange={(open: boolean) => { if (!open) resetFolderForm(); }}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader><DialogTitle>{editingFolderId ? 'Editar' : 'Nueva'} Carpeta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Nombre de la carpeta *</label>
              <Input value={fFolderName} onChange={e => setFFolderName(e.target.value)} placeholder="Ej: Escalas Mayores" autoFocus />
            </div>
            <div>
              <label className="text-xs text-muted-foreground text-center block mb-2">Color</label>
              <div className="flex flex-wrap justify-center gap-2">
                {FOLDER_COLORS.map(c => <button key={c} onClick={() => setFFolderColor(c)} className={`w-8 h-8 rounded-full transition-transform ${fFolderColor === c ? 'scale-125 shadow-md border-2 border-white' : 'hover:scale-110 opacity-80'}`} style={{ backgroundColor: c }} />)}
              </div>
            </div>
            <div className="flex justify-between pt-4 border-t border-border">
              {editingFolderId ? <Button variant="destructive" size="sm" onClick={() => deleteFolder(editingFolderId)}><Trash2 className="h-3 w-3 mr-1" /> Eliminar</Button> : <div />}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetFolderForm}>Cancelar</Button>
                <Button size="sm" onClick={saveFolder}>Guardar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scale Form Dialog */}
      <Dialog open={showScaleForm} onOpenChange={(open: boolean) => { if (!open) resetScaleForm(); }}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader><DialogTitle>{editingScaleId ? 'Organizar' : 'Nueva'} Escala</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Nombre / Etiqueta</label>
              <Input value={sName} onChange={e => setSName(e.target.value)} placeholder="Nombre de la escala" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Carpeta</label>
              <select value={sFolderId || ''} onChange={e => setSFolderId(e.target.value || null)} className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm border border-border">
                <option value="">(Sin carpeta)</option>
                {folders.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={resetScaleForm}>Cancelar</Button>
              <Button size="sm" onClick={saveScale}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Dialog */}
      <Dialog open={!!editingVideoScale} onOpenChange={(open: boolean) => { if (!open) setEditingVideoScale(null); }}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2"><Play className="h-4 w-4 text-red-500" /> Video de clase / referencia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm font-semibold text-primary">{editingVideoScale?.name}</p>
            <div>
              <label className="text-xs text-muted-foreground">Link de YouTube</label>
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
