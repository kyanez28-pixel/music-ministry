import { useState, useMemo } from 'react';
import { useSessions, useHarmonyLogs, useHarmonies, useHarmonyFolders } from '@/hooks/use-music-data';
import { generateId, getTodayEC } from '@/lib/music-utils';
import { PREDEFINED_HARMONIES, HARMONY_CATEGORIES } from '@/lib/predefined-harmonies';
import type { Instrument, HarmonyPracticeLog } from '@/types/music';
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

export default function HarmoniesPage() {
  const [sessions, setSessions] = useSessions();
  const [harmonyLogs, setHarmonyLogs] = useHarmonyLogs();
  const [customHarmonies, setCustomHarmonies] = useHarmonies();
  const [folders, setFolders] = useHarmonyFolders();

  // Folder/Harmony UI State
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [fFolderName, setFFolderName] = useState('');
  const [fFolderColor, setFFolderColor] = useState(FOLDER_COLORS[0]);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [filterFolder, setFilterFolder] = useState<string | 'todos'>('todos');

  const [showHarmonyForm, setShowHarmonyForm] = useState(false);
  const [editingHarmonyId, setEditingHarmonyId] = useState<string | null>(null);
  const [hName, setHName] = useState('');
  const [hFolderId, setHFolderId] = useState<string | null>(null);
  const [hDesc, setHDesc] = useState('');
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
    setCustomHarmonies((prev: any[]) => prev.map((h: any) => h.folder_id === id ? { ...h, folder_id: null } : h));
    resetFolderForm();
    toast.success('Carpeta eliminada');
  };

  const resetHarmonyForm = () => {
    setShowHarmonyForm(false); setEditingHarmonyId(null);
    setHName(''); setHFolderId(null); setHDesc('');
  };

  const openEditHarmony = (h: any) => {
    setEditingHarmonyId(h.id); setHName(h.name); setHFolderId(h.folder_id || null); setHDesc(h.description);
    setShowHarmonyForm(true);
  };

  const saveHarmony = () => {
    if (!hName.trim()) { toast.error('Nombre requerido'); return; }
    const harmonyData = {
        id: editingHarmonyId || generateId(),
        name: hName.trim(),
        description: hDesc,
        folder_id: hFolderId,
        type: 'custom',
    };
    if (customHarmonies.some((ch: any) => ch.id === editingHarmonyId)) {
        setCustomHarmonies((prev: any[]) => prev.map((h: any) => h.id === editingHarmonyId ? { ...h, ...harmonyData } : h));
    } else {
        setCustomHarmonies((prev: any[]) => [...prev, harmonyData]);
    }
    toast.success('Armonía guardada');
    resetHarmonyForm();
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
      .filter((l: any) => l.date === today && l.instrument === instrument)
      .forEach((l: any) => set.add(l.harmonyId));
    return set;
  }, [harmonyLogs, today, instrument]);

  const allHarmonies = useMemo(() => {
    const mappedCustom = (customHarmonies || []).map((h: any) => ({
      id: h.id,
      name: h.name,
      description: h.description || '',
      category: h.type || 'otro',
      folder_id: h.folder_id
    }));
    return [...PREDEFINED_HARMONIES, ...mappedCustom];
  }, [customHarmonies]);

  const filtered = useMemo(() => allHarmonies
    .filter((h: any) => filterCategory === 'todos' || h.category === filterCategory)
    .filter((h: any) => !search.trim() ||
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.description.toLowerCase().includes(search.toLowerCase()))
    .filter((h: any) => filterFolder === 'todos' || h.folder_id === filterFolder),
  [filterCategory, search, allHarmonies, filterFolder]);

  const groupedHarmonies = useMemo(() => {
    const groups = folders.map((f: any) => ({
      folder: f,
      items: filtered.filter((h: any) => h.folder_id === f.id),
    }));
    const unfoldered = filtered.filter((h: any) => !h.folder_id);
    return { groups, unfoldered };
  }, [folders, filtered]);

  const practiceCount = useMemo(() => {
    const counts: Record<string, number> = {};
    harmonyLogs.forEach((l: any) => { counts[l.harmonyId] = (counts[l.harmonyId] || 0) + 1; });
    return counts;
  }, [harmonyLogs]);

  const maxPractice = Math.max(1, ...Object.values(practiceCount));

  const toggleHarmony = (harmonyId: string) => {
    if (todayChecked.has(harmonyId)) {
      setHarmonyLogs((prev: any[]) => prev.filter((l: any) =>
        !(l.harmonyId === harmonyId && l.date === today && l.instrument === instrument)
      ));
    } else {
      const log = { harmonyId, date: today, instrument };
      setHarmonyLogs((prev: any[]) => [...prev, log]);
    }
  };

  const saveSession = () => {
    const checkedToday = harmonyLogs.filter((l: any) => l.date === today && l.instrument === instrument);
    if (checkedToday.length === 0) {
      toast.error('Marca al menos una armonía antes de guardar');
      return;
    }
    const names = checkedToday
      .map((l: any) => PREDEFINED_HARMONIES.find((h: any) => h.id === l.harmonyId)?.name)
      .filter(Boolean)
      .join(', ');
    const notesText = `Armonías (${checkedToday.length}): ${names}`;
    const existingSession = sessions.find((s: any) =>
      s.date === today && s.instrument === instrument && s.categories.includes('armonias')
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
    setHarmonyLogs((prev: any[]) => prev.filter((l: any) => !(l.date === today && l.instrument === instrument)));
    toast.success(`¡Sesión guardada! ${checkedToday.length} armonía${checkedToday.length !== 1 ? 's' : ''} registrada${checkedToday.length !== 1 ? 's' : ''}`);
  };

  const checkedCount = todayChecked.size;
  const totalPracticed = Object.keys(practiceCount).length;

  const renderHarmonyCard = (harmony: any) => {
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
              <span className="truncate">{harmony.name}</span>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditHarmony(harmony); }} className="opacity-0 group-hover:opacity-40 hover:opacity-100 transition-opacity"><Pencil className="h-2.5 w-2.5" /></button>
              <button onClick={(e: React.MouseEvent) => openVideoEdit(e, harmony.id, harmony.name)}
                className={`hover:text-primary transition-colors shrink-0 ${harmonyVideos[harmony.id] ? 'text-red-500' : 'text-muted-foreground/40 opacity-0 group-hover:opacity-100'}`}>
                <Play className="h-3.5 w-3.5" />
              </button>
            </span>
            {count > 0 && (
              <span className="text-xs text-muted-foreground shrink-0 font-mono opacity-60">{count}×</span>
            )}
          </div>
          <Progress value={progressPct} className="h-0.5 mt-1.5 bg-white/5" />
        </div>
      </label>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="lista" className="w-full">
        {/* Header with Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="page-title">🎶 Armonías</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalPracticed} de {PREDEFINED_HARMONIES.length} armonías · {folders.length} carpetas
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
            
            <button onClick={() => { resetFolderForm(); setShowFolderForm(true); }} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground" title="Nueva carpeta"><FolderPlus className="h-4 w-4" /></button>
            <button onClick={() => { resetHarmonyForm(); setShowHarmonyForm(true); }} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground" title="Nueva armonía"><Plus className="h-4 w-4" /></button>
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
              <button key={inst.id} onClick={() => setInstrument(inst.id)} className={`chip flex-1 justify-center ${instrument === inst.id ? 'chip-active' : ''}`}>
                {inst.emoji} {inst.name}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Buscar armonía..." value={search} onChange={e => setSearch(e.target.value)} className="w-40 flex-1 glass-panel border-white/5" />
            <select value={filterCategory} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterCategory(e.target.value)} className="glass-panel text-secondary-foreground rounded-md px-3 py-1.5 text-sm border-white/5">
              <option value="todos">Todas las categorías</option>
              {HARMONY_CATEGORIES.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Folder filter tabs */}
          {folders.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setFilterFolder('todos')} className={`chip text-xs ${filterFolder === 'todos' ? 'chip-active' : ''}`}>Todas</button>
              {folders.map((f: any) => (
                <button key={f.id} onClick={() => setFilterFolder(f.id)} className={`chip text-xs ${filterFolder === f.id ? 'chip-active' : ''}`} style={filterFolder !== f.id ? { borderLeft: `3px solid ${f.color}` } : {}}>
                  {f.name}
                </button>
              ))}
            </div>
          )}

          {/* Harmony list */}
          <div className="space-y-6">
            {groupedHarmonies.groups.map(({ folder, items }) => (
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
                    {items.map((h: any) => renderHarmonyCard(h))}
                  </div>
                )}
              </div>
            ))}

            {groupedHarmonies.unfoldered.length > 0 && (
              <div>
                {folders.length > 0 && <h3 className="section-title text-base mb-3 opacity-70">Otras Armonías ({groupedHarmonies.unfoldered.length})</h3>}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {groupedHarmonies.unfoldered.map((h: any) => renderHarmonyCard(h))}
                </div>
              </div>
            )}
          </div>

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

      {/* Folder Form Dialog */}
      <Dialog open={showFolderForm} onOpenChange={(open: boolean) => { if (!open) resetFolderForm(); }}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader><DialogTitle>{editingFolderId ? 'Editar' : 'Nueva'} Carpeta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Nombre de la carpeta *</label>
              <Input value={fFolderName} onChange={e => setFFolderName(e.target.value)} placeholder="Ej: Adoración Lenta" autoFocus />
            </div>
            <div>
              <label className="text-xs text-muted-foreground text-center block mb-2">Color</label>
              <div className="flex flex-wrap justify-center gap-2">
                {FOLDER_COLORS.map(c => (
                  <button key={c} onClick={() => setFFolderColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${fFolderColor === c ? 'scale-125 shadow-md border-2 border-white' : 'hover:scale-110 opacity-80'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-4 border-t border-border">
              {editingFolderId ? (
                <Button variant="destructive" size="sm" onClick={() => deleteFolder(editingFolderId)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                </Button>
              ) : <div />}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetFolderForm}>Cancelar</Button>
                <Button size="sm" onClick={saveFolder}>Guardar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Harmony Form Dialog */}
      <Dialog open={showHarmonyForm} onOpenChange={(open: boolean) => { if (!open) resetHarmonyForm(); }}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader><DialogTitle>{editingHarmonyId ? 'Organizar' : 'Nueva'} Armonía</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Nombre / Etiqueta</label>
              <Input value={hName} onChange={e => setHName(e.target.value)} placeholder="Nombre de la armonía" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Descripción</label>
              <Input value={hDesc} onChange={e => setHDesc(e.target.value)} placeholder="Breve nota técnica" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Carpeta</label>
              <select value={hFolderId || ''} onChange={e => setHFolderId(e.target.value || null)}
                className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm border border-border">
                <option value="">(Sin carpeta)</option>
                {folders.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={resetHarmonyForm}>Cancelar</Button>
              <Button size="sm" onClick={saveHarmony}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
