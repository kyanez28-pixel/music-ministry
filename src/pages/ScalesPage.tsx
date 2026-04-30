import { useState, useMemo, useRef } from 'react';
import { useSessions, useScaleLogs, useScales, useScaleFolders, useScaleImages } from '@/hooks/use-music-data';
import { generateId, getTodayEC } from '@/lib/music-utils';
import { PREDEFINED_SCALES, SCALE_TYPE_OPTIONS, NOTES, NOTE_EN, SCALE_THEORY } from '@/lib/predefined-scales';
import type { Instrument, ScalePracticeLog } from '@/types/music';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, BookOpen, ListMusic, FolderPlus, Plus, ChevronDown, ChevronRight, Trash2, Pencil, Upload, X, Image as ImageIcon, BarChart3, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingCard, LoadingGrid } from '@/components/ui/LoadingCard';
import { ExerciseSection } from '@/components/ExerciseSection';
import type { InstrumentDef } from '@/types/music';
import { useInstruments } from '@/hooks/use-instruments';
import { ScalesEducation } from '@/components/ScalesEducation';

const FOLDER_COLORS = ['#d4a843', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#34d399', '#e879f9'];

export default function ScalesPage() {
  const [sessions = [], setSessions] = useSessions();
  const [scaleLogs = [], setScaleLogs, isLoadingLogs] = useScaleLogs();
  const [customScales = [], setCustomScales, isLoadingScales] = useScales();
  const [folders = [], setFolders, isLoadingFolders] = useScaleFolders();
  const [allImages = [], setAllImages] = useScaleImages();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [editingVideoScale, setEditingVideoScale] = useState<{id: string, name: string} | null>(null);
  const [tempVideoUrl, setTempVideoUrl] = useState('');

  const openVideoEdit = (e: React.MouseEvent, scale: any) => {
    e.stopPropagation(); e.preventDefault();
    setEditingVideoScale({ id: scale.id, name: scale.label });
    setTempVideoUrl(scale.video_url || '');
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
    setCustomScales((prev: any[]) => {
      if (prev.some((s: any) => s.id === editingScaleId)) {
        return prev.map((s: any) => s.id === editingScaleId ? { ...s, ...scaleData } : s);
      }
      return [...prev, scaleData];
    });
    toast.success('Escala guardada');
    resetScaleForm();
  };

  const saveVideo = () => {
    if (editingVideoScale) {
      setCustomScales((prev: any[]) => prev.map((s: any) => 
        s.id === editingVideoScale.id ? { ...s, video_url: tempVideoUrl } : s
      ));
      toast.success('Video actualizado');
    }
    setEditingVideoScale(null);
  };

  const handleFiles = async (files: File[]) => {
    if (!editingScaleId) return;
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    
    for (const file of imageFiles) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height *= maxDim / width;
              width = maxDim;
            } else {
              width *= maxDim / height;
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', 0.7);
          
          const newImg = {
            id: generateId(),
            scale_id: editingScaleId,
            storage_path: base64,
            file_name: file.name
          };
          setAllImages((prev: any[]) => [...prev, newImg]);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
    toast.success(`${imageFiles.length} imagen(es) añadida(s)`);
  };

  const today = getTodayEC();

  const todayChecked = useMemo(() => {
    const set = new Set<string>();
    (scaleLogs || [])
      .filter((l: any) => l.date === today && l.instrument === instrument)
      .forEach((l: any) => set.add(l.scale_id));
    return set;
  }, [scaleLogs, today, instrument]);

  const allScales = useMemo(() => {
    const mappedCustom = (customScales || []).map((s: any) => ({
      id: s.id,
      label: s.name,
      scaleType: s.type || 'custom',
      note: 'C',
      folder_id: s.folder_id,
      video_url: s.video_url,
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
    const groups = (folders || []).map((f: any) => ({
      folder: f,
      items: filtered.filter((s: any) => s.folder_id === f.id),
    }));
    const unfoldered = filtered.filter((s: any) => !s.folder_id);
    return { groups, unfoldered };
  }, [folders, filtered]);

  const practiceCount = useMemo(() => {
    const counts: Record<string, number> = {};
    (scaleLogs || []).forEach((l: any) => { counts[l.scale_id] = (counts[l.scale_id] || 0) + 1; });
    return counts;
  }, [scaleLogs]);

  const maxPractice = Math.max(1, ...Object.values(practiceCount));

  const toggleScale = (scale_id: string) => {
    if (todayChecked.has(scale_id)) {
      setScaleLogs((prev: any[]) => prev.filter((l: any) =>
        !(l.scale_id === scale_id && l.date === today && l.instrument === instrument)
      ));
    } else {
      const log: ScalePracticeLog = { scale_id, date: today, instrument };
      setScaleLogs((prev: any[]) => [...prev, log]);
    }
  };

  const toggleAll = () => {
    const allChecked = filtered.every((s: any) => todayChecked.has(s.id));
    if (allChecked) {
      setScaleLogs((prev: any[]) => prev.filter((l: any) =>
        !(filtered.some((s: any) => s.id === l.scale_id) && l.date === today && l.instrument === instrument)
      ));
    } else {
      const newLogs: ScalePracticeLog[] = filtered
        .filter((s: any) => !todayChecked.has(s.id))
        .map((s: any) => ({ scale_id: s.id, date: today, instrument }));
      setScaleLogs((prev: any[]) => [...prev, ...newLogs]);
    }
  };

  const saveSession = () => {
    const checkedToday = (scaleLogs || []).filter((l: any) => l.date === today && l.instrument === instrument);
    if (checkedToday.length === 0) { toast.error('Marca al menos una escala antes de guardar'); return; }
    const scaleNames = checkedToday
      .map((l: any) => PREDEFINED_SCALES.find((s: any) => s.id === l.scale_id)?.label)
      .filter(Boolean).join(', ');
    const notesText = `Escalas (${checkedToday.length}): ${scaleNames}`;
    const existingSession = (sessions || []).find((s: any) =>
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
    const theory = SCALE_THEORY[scale.scaleType];
    const displayLabel = scale.labelEN || scale.label;
    return (
      <label
        key={scale.id}
        className={`stat-card flex items-start gap-3 cursor-pointer transition-all hover:border-primary/40 group ${
          checked ? 'border-primary/40 bg-primary/10' : 'border-white/5 bg-white/5'
        }`}
      >
        <Checkbox checked={checked} onCheckedChange={() => toggleScale(scale.id)}
          className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className={`text-sm font-semibold truncate block ${checked ? 'text-primary' : 'text-foreground'}`}>
                {displayLabel}
              </span>
              {theory && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 inline-block"
                  style={{ background: theory.color+'22', color: theory.color }}>
                  {theory.labelEN}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              {count > 0 && <span className="text-[10px] text-muted-foreground font-mono">{count}×</span>}
              {allImages.some((img: any) => img.scale_id === scale.id) && <ImageIcon className="h-3 w-3 text-primary/60" />}
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditScale(scale); }}
                className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity">
                <Pencil className="h-3 w-3" />
              </button>
              <button onClick={(e: React.MouseEvent) => openVideoEdit(e, scale)}
                className={`hover:text-primary transition-colors ${scale.video_url ? 'text-red-500' : 'text-muted-foreground/30 opacity-0 group-hover:opacity-100'}`}>
                <Play className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-2">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: theory?.color ?? 'hsl(var(--primary))' }} />
          </div>
        </div>
      </label>
    );
  };
  if (isLoadingScales || isLoadingFolders) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 bg-white/5 rounded-lg animate-pulse" />
        <LoadingCard />
        <LoadingGrid />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="practica" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="page-title">🎼 Scales</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalPracticed} of {PREDEFINED_SCALES.length} scales practiced · {folders.length} folders
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <TabsList className="glass-panel p-1">
              <TabsTrigger value="practica" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2">
                <ListMusic className="h-4 w-4" /> Practice
              </TabsTrigger>
              <TabsTrigger value="educacion" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Progress
              </TabsTrigger>
              <TabsTrigger value="ejercicios" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Exercises
              </TabsTrigger>
            </TabsList>
            <button onClick={() => { resetFolderForm(); setShowFolderForm(true); }} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground" title="New folder"><FolderPlus className="h-4 w-4" /></button>
            <button onClick={() => { resetScaleForm(); setShowScaleForm(true); }} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground" title="New scale"><Plus className="h-4 w-4" /></button>
            <button onClick={saveSession} disabled={checkedCount === 0} className="premium-btn-glow px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Save Session {checkedCount > 0 ? `(${checkedCount})` : ''}
            </button>
          </div>
        </div>

        <TabsContent value="practica" className="space-y-6 mt-0">
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
            <Input placeholder="Search scale..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="w-40 flex-1 glass-panel border-white/5" />
            <select value={filterNote} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterNote(e.target.value)} className="glass-panel text-secondary-foreground rounded-md px-3 py-1.5 text-sm border-white/5">
              <option value="todos">All notes</option>
              {NOTES.map((n: string) => <option key={n} value={n}>{NOTE_EN[n] ?? n}</option>)}
            </select>
            <select value={filterType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value)} className="glass-panel text-secondary-foreground rounded-md px-3 py-1.5 text-sm border-white/5">
              <option value="todos">All types</option>
              {SCALE_TYPE_OPTIONS.map((t: any) => <option key={t.value} value={t.value}>{t.labelEN ?? t.label}</option>)}
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
                Today: <span className="text-primary font-semibold">{checkedCount}</span> scale{checkedCount !== 1 ? 's' : ''} checked
                {filtered.length !== PREDEFINED_SCALES.length && ` (of ${filtered.length} filtered)`}
              </span>
              {filtered.length > 0 && (
                <button onClick={toggleAll} className="text-xs text-primary hover:underline">
                  {allFilteredChecked ? 'Uncheck all' : 'Check all filtered'}
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
              {groupedScales.groups.map(({ folder, items }: { folder: any; items: any[] }) => (
                <div key={folder.id}>
                  <button
                    onClick={() => setCollapsedFolders((prev: Set<string>) => { const n = new Set(prev); n.has(folder.id) ? n.delete(folder.id) : n.add(folder.id); return n; })}
                    className="flex items-center gap-2 group w-full text-left mb-3"
                  >
                    {collapsedFolders.has(folder.id) ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
                    <span className="section-title text-base">{folder.name}</span>
                    <span className="text-xs text-muted-foreground">({items.length})</span>
                    <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEditFolder(folder); }} className="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground">editar</button>
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

        <TabsContent value="educacion" className="mt-0 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ScalesEducation scaleLogs={scaleLogs} allScales={allScales} practiceCount={practiceCount} />
        </TabsContent>

        <TabsContent value="ejercicios" className="mt-0 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="stat-card border-white/5 bg-primary/5 mb-6">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-1"><BookOpen className="h-4 w-4 text-primary" /> Scale Exercises</h3>
            <p className="text-xs text-muted-foreground">Save your fingerings, sheet music captures and specific technical challenges here.</p>
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
              <Input value={fFolderName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFFolderName(e.target.value)} placeholder="Ej: Escalas Mayores" autoFocus />
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
              <select value={sFolderId || ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSFolderId(e.target.value || null)} className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm border border-border">
                <option value="">(Sin carpeta)</option>
                {folders.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            {editingScaleId && (
              <div className="pt-2">
                <label className="text-xs text-muted-foreground block mb-2">Imágenes (digitaciones / capturas)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-all mb-3"
                >
                  <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground">Sube digitaciones o capturas</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) handleFiles(Array.from(e.target.files)); }} />
                
                <div className="grid grid-cols-4 gap-2">
                  {allImages.filter((img: any) => img.scale_id === editingScaleId).map((img: any) => (
                    <div key={img.id} className="relative aspect-square rounded overflow-hidden border border-white/10 group">
                      <img src={img.storage_path} className="w-full h-full object-cover" alt="prev" />
                      <button onClick={() => setAllImages((prev: any[]) => prev.filter((i: any) => i.id !== img.id))} 
                        className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-2 w-2" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            <DialogTitle className="font-display flex items-center gap-2"><Play className="h-4 w-4 text-red-500" /> Video / Referencia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm font-semibold text-primary">{editingVideoScale?.name}</p>
            <div>
              <label className="text-xs text-muted-foreground">Enlace (YouTube, Spotify, Drive, cualquier URL...)</label>
              <Input value={tempVideoUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempVideoUrl(e.target.value)} placeholder="https://..." />
            </div>
            {tempVideoUrl && (
              tempVideoUrl.includes('youtu') ? (
                <div className="w-full aspect-video rounded-lg overflow-hidden bg-black/10 mt-2">
                  <iframe
                    src={tempVideoUrl
                      .replace('watch?v=', 'embed/')
                      .replace('youtu.be/', 'www.youtube.com/embed/')
                      .split('&')[0]}
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a
                  href={tempVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/10 border border-primary/20 rounded-lg p-3 transition-colors"
                >
                  <Play className="h-4 w-4 shrink-0" />
                  <span className="truncate">{tempVideoUrl}</span>
                </a>
              )
            )}
            <div className="flex gap-2 justify-end pt-2">
              {tempVideoUrl && (
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setTempVideoUrl('')}>Quitar</Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setEditingVideoScale(null)}>Cancelar</Button>
              <Button size="sm" onClick={saveVideo}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
