import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useRhythms, useRhythmFolders, useRhythmImages, useSessions, useRhythmPracticeLogs } from '@/hooks/use-music-data';
import { useInstruments } from '@/hooks/use-instruments';
import { generateId, getTodayEC } from '@/lib/music-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Play, Plus, FolderPlus, Trash2, Upload, X, ZoomIn, ArrowLeft, ArrowRight, BookOpen, Music2, Tag, Maximize2, ChevronDown, ChevronRight, Image as ImageIcon, Check } from 'lucide-react';
import type { Rhythm, RhythmType, RhythmImage, RhythmPracticeLog, Instrument } from '@/types/music';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { AppTooltip } from '@/components/AppTooltip';
import { LoadingCard, LoadingGrid } from '@/components/ui/LoadingCard';

const FOLDER_COLORS = ['#d4a843', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#34d399', '#e879f9'];

const RHYTHM_TYPES: Record<RhythmType, string> = {
  balada: 'Balada',
  vals: 'Vals',
  pop: 'Pop',
  gospel: 'Gospel',
  latino: 'Latino',
  otro: 'Otro',
};

export default function RhythmsPage() {
  const { openFocusMode } = useFocusMode();
  const [sessions, setSessions] = useSessions();
  const [rhythms = [], setRhythms, isLoadingRhythms] = useRhythms();
  const [allImages = [], setAllImages] = useRhythmImages();
  const [folders = [], setFolders, isLoadingFolders] = useRhythmFolders();
  const [practiceLogs = [], setPracticeLogs] = useRhythmPracticeLogs();
  
  const { instruments } = useInstruments();
  const today = getTodayEC();

  const [practiceInstrument, setPracticeInstrument] = useState<Instrument>(instruments?.[0]?.id || 'piano');
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [filterFolder, setFilterFolder] = useState<string | 'todos'>('todos');
  const [initialFoldersCollapsed, setInitialFoldersCollapsed] = useState(false);

  // Auto-collapse all folders on first load
  useEffect(() => {
    if (!initialFoldersCollapsed && folders.length > 0) {
      setCollapsedFolders(new Set(folders.map((f: any) => f.id)));
      setInitialFoldersCollapsed(true);
    }
  }, [folders, initialFoldersCollapsed]);

  const [mFolderId, setMFolderId] = useState<string | null>(null);
  const [fFolderName, setFFolderName] = useState('');
  const [fFolderColor, setFFolderColor] = useState(FOLDER_COLORS[0]);

  // UI
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<RhythmType | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [viewerImages, setViewerImages] = useState<RhythmImage[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fName, setFName] = useState('');
  const [fType, setFType] = useState<RhythmType>('balada');
  const [fTime, setFTime] = useState('');
  const [fBpm, setFBpm] = useState(0);
  const [fDescription, setFDescription] = useState('');
  const [fVideoUrl, setFVideoUrl] = useState('');

  // ─── Derived ──────────────────────────────────────────────────────────────────

  const editingImages = useMemo(() =>
    editingId ? allImages.filter((i: any) => i.rhythm_id === editingId) : [],
  [allImages, editingId]);

  const filtered = useMemo(() => {
    let list = rhythms || [];
    if (filterFolder !== 'todos') list = list.filter((r: any) => r.folder_id === filterFolder);
    if (filterType !== 'todos') list = list.filter((r: any) => r.type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r: any) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [rhythms, filterType, search, filterFolder]);

  const groupedRhythms = useMemo(() => {
    const groups = (folders || []).map((f: any) => ({
      folder: f,
      items: filtered.filter((r: any) => r.folder_id === f.id),
    }));
    const unfoldered = filtered.filter((r: any) => !r.folder_id);
    return { groups, unfoldered };
  }, [folders, filtered]);

  const imagesByRhythm = useMemo(() => {
    const map: Record<string, RhythmImage[]> = {};
    (allImages || []).forEach((img: any) => {
      const rid = img.rhythm_id;
      if (!map[rid]) map[rid] = [];
      map[rid].push(img);
    });
    return map;
  }, [allImages]);

  // ─── Practice ───────────────────────────────────────────────────────────────

  const todayLogs = useMemo(() =>
    (practiceLogs || []).filter(l => l.date === today && l.instrument === practiceInstrument),
    [practiceLogs, today, practiceInstrument]
  );

  const isCheckedToday = (id: string) =>
    todayLogs.some(l => l.rhythm_id === id);

  const togglePractice = (id: string) => {
    const exists = (practiceLogs || []).find(
      (l: RhythmPracticeLog) => l.rhythm_id === id && l.date === today && l.instrument === practiceInstrument
    );
    if (exists) {
      setPracticeLogs((prev: RhythmPracticeLog[]) => prev.filter((l: RhythmPracticeLog) =>
        !(l.rhythm_id === id && l.date === today && l.instrument === practiceInstrument)
      ));
    } else {
      setPracticeLogs((prev: RhythmPracticeLog[]) => [...prev, { rhythm_id: id, date: today, instrument: practiceInstrument } as RhythmPracticeLog]);
    }
  };

  const saveSession = () => {
    if (todayLogs.length === 0) { toast.error('Marca al menos un ritmo'); return; }
    const names = todayLogs
      .map(l => (rhythms || []).find(r => r.id === l.rhythm_id)?.name)
      .filter(Boolean).join(', ');
    const notesText = `Ritmos (${todayLogs.length}): ${names}`;
    const duration = todayLogs.length * 5;

    const newSession = {
      id: generateId(), date: today, category: 'ritmos' as const,
      instrument: practiceInstrument, duration, notes: notesText,
    };
    setSessions((prev: any[]) => {
      const existing = prev.findIndex(s => s.date === today && s.category === 'ritmos' && s.instrument === practiceInstrument);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = { ...copy[existing], duration: copy[existing].duration + duration, notes: copy[existing].notes + '\n' + notesText };
        return copy;
      }
      return [...prev, newSession];
    });
    toast.success('Sesión de ritmos guardada');
  };

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setFName(''); setMFolderId(null); setFType('balada'); setFTime('');
    setFBpm(0); setFDescription(''); setFVideoUrl('');
  };

  const openEdit = (r: Rhythm) => {
    setEditingId(r.id);
    setFName(r.name); setMFolderId(r.folder_id || null); setFType(r.type); setFTime(r.time_signature || '');
    setFBpm(r.bpm || 0); setFDescription(r.description || '');
    setFVideoUrl(r.video_url || '');
    setShowForm(true);
  };

  const saveRhythm = () => {
    if (!fName.trim()) { toast.error('El nombre es requerido'); return; }
    const rhm: Rhythm = {
      id: editingId ?? generateId(),
      folder_id: mFolderId,
      name: fName.trim(),
      type: fType,
      // time_signature: fTime, // Ocluido porque falta temporalmente en BD
      bpm: fBpm,
      description: fDescription,
      video_url: fVideoUrl || undefined,
    };
    if (editingId) {
      setRhythms((prev: any[]) => prev.map((r: any) => r.id === editingId ? rhm : r));
      toast.success('Ritmo actualizado');
    } else {
      setRhythms((prev: Rhythm[]) => [...prev, rhm]);
      toast.success('Ritmo agregado');
    }
    resetForm();
  };

  const deleteRhythm = () => {
    if (!editingId) return;
    setRhythms((prev: any[]) => prev.filter((r: any) => r.id !== editingId));
    setAllImages((prev: any[]) => prev.filter((i: any) => i.rhythm_id !== editingId));
    toast.success('Ritmo eliminado');
    resetForm();
  };

  const resetFolderForm = () => {
    setShowFolderForm(false);
    setEditingFolderId(null);
    setFFolderName('');
    setFFolderColor(FOLDER_COLORS[0]);
  };

  const openEditFolder = (f: any) => {
    setEditingFolderId(f.id);
    setFFolderName(f.name);
    setFFolderColor(f.color || FOLDER_COLORS[0]);
    setShowFolderForm(true);
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
    setRhythms((prev: any[]) => prev.map((m: any) => m.folder_id === id ? { ...m, folder_id: null } : m));
    resetFolderForm();
    toast.success('Carpeta eliminada');
  };

  // ─── Images ───────────────────────────────────────────────────────────────────

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800; // Límite reducido de resolución
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
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFiles = useCallback(async (files: File[]) => {
    if (!editingId) { toast.error('Guarda el ritmo primero'); return; }
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    
    setUploadingImages(true);
    try {
      const newImages: RhythmImage[] = await Promise.all(
        imageFiles.map(async file => ({
          id: generateId(), rhythm_id: editingId,
          storage_path: await fileToBase64(file), file_name: file.name,
        }))
      );
      setAllImages((prev: any[]) => [...prev, ...newImages]);
      toast.success(`${newImages.length} imagen(es) subida(s)`);
    } catch { toast.error('Error al subir'); }
    finally { setUploadingImages(false); }
  }, [editingId, setAllImages]);

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    if (!showForm) return;
    const files: File[] = [];
    for (const item of Array.from(e.clipboardData?.items ?? [])) {
      if (item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) { e.preventDefault(); await handleFiles(files); }
  }, [showForm, handleFiles]);

  useEffect(() => {
    const pasteHandler = (e: Event) => handlePaste(e as unknown as ClipboardEvent);
    document.addEventListener('paste', pasteHandler);
    return () => document.removeEventListener('paste', pasteHandler);
  }, [handlePaste]);

  const deleteImage = (id: string) => {
    setAllImages((prev: any[]) => prev.filter((i: any) => i.id !== id));
    toast.success('Imagen eliminada');
  };

  const openViewer = (id: string, idx = 0) => {
    const imgs = imagesByRhythm[id] ?? [];
    if (imgs.length === 0) return;
    setViewerImages(imgs); setViewerIndex(idx);
  };

  const getYouTubeId = (url: string) => {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&]+)/);
    return m ? m[1] : null;
  };

  const getVideoDisplayUrl = (url: string) => {
    const ytId = getYouTubeId(url);
    if (ytId) return { type: 'youtube' as const, id: ytId };
    return { type: 'external' as const, url };
  };
  if (isLoadingRhythms || isLoadingFolders) {
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

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">🥁 Ritmos</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center">
            {(rhythms || []).length} ritmos · {(folders || []).length} carpetas
            <AppTooltip content="El total de patrones rítmicos que tienes guardados.">
              <span className="ml-1 cursor-help opacity-50">ⓘ</span>
            </AppTooltip>
          </p>
        </div>
        <div className="flex gap-2">
          <AppTooltip content="Crea una nueva carpeta para organizar tus ritmos.">
            <Button variant="outline" size="sm" onClick={() => { resetFolderForm(); setShowFolderForm(true); }}>
              <FolderPlus className="h-4 w-4 mr-1" /> Carpeta
            </Button>
          </AppTooltip>
          <AppTooltip content="Crea un nuevo patrón rítmico personalizado.">
            <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Nuevo ritmo
            </Button>
          </AppTooltip>
        </div>
      </div>

      {/* Practice Bar */}
      {(rhythms || []).length > 0 && (
        <div className="stat-card">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 p-1 bg-secondary/30 rounded-lg">
                <Music2 className="h-4 w-4 text-muted-foreground ml-1" />
                <select value={practiceInstrument} onChange={e => setPracticeInstrument(e.target.value as Instrument)}
                  className="bg-transparent border-none text-sm text-foreground focus:ring-0 cursor-pointer pl-1 pr-6 py-1 font-medium">
                  {instruments.map((inst: any) => <option key={inst.id} value={inst.id}>Practicar con: {inst.name}</option>)}
                </select>
              </div>
              <span className="text-sm font-medium">
                <span className="text-primary">{todayLogs.length}</span> marcados hoy
              </span>
            </div>
            <Button size="sm" variant={todayLogs.length > 0 ? "default" : "secondary"} className="gap-2" onClick={saveSession}>
              <Check className="h-4 w-4" /> Guardar Sesión
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Buscar ritmo..." value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="flex-1 min-w-40" />
        <select value={filterType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value as any)}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm border border-border">
          <option value="todos">Todos los géneros</option>
          {(Object.keys(RHYTHM_TYPES) as RhythmType[]).map((t) => (
            <option key={t} value={t}>{RHYTHM_TYPES[t]}</option>
          ))}
        </select>
      </div>

      {(folders || []).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          <button onClick={() => setFilterFolder('todos')}
            className={`chip text-xs ${filterFolder === 'todos' ? 'chip-active' : ''}`}>
            Todas
          </button>
          {(folders || []).map((f: any) => (
            <button key={f.id} onClick={() => setFilterFolder(f.id)}
              className={`chip text-xs ${filterFolder === f.id ? 'chip-active' : ''}`}
              style={filterFolder !== f.id ? { borderLeft: `3px solid ${f.color}` } : {}}>
              {f.name}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {(rhythms || []).length === 0 && (
        <div className="stat-card py-16 text-center space-y-3">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Aún no tienes ritmos personalizados.</p>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Crear ritmo
          </Button>
        </div>
      )}

      {/* Grid */}
      <div className="space-y-6">
        {groupedRhythms.groups.map(({ folder, items }: { folder: any, items: any[] }) => (
          <div key={folder.id}>
            <button
              onClick={() => setCollapsedFolders((prev) => {
                const next = new Set(prev);
                next.has(folder.id) ? next.delete(folder.id) : next.add(folder.id);
                return next;
              })}
              className="flex items-center gap-2 group w-full text-left mb-3"
            >
              {collapsedFolders.has(folder.id)
                  ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
              <span className="section-title text-base">{folder.name}</span>
              <span className="text-xs text-muted-foreground">({items.length})</span>
              <button
                onClick={e => { e.stopPropagation(); openEditFolder(folder); }}
                className="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
              >
                editar
              </button>
            </button>
            {!collapsedFolders.has(folder.id) && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ml-5">
                {items.map((rhm: any) => {
                  const imgs = imagesByRhythm[rhm.id] ?? [];
                  return (
                    <div key={rhm.id} className="stat-card group overflow-hidden relative">
                      {imgs.length > 0 ? (
                        <div className="relative -mx-4 -mt-4 mb-3 cursor-pointer group/img" onClick={() => openViewer(rhm.id)}>
                          <img src={imgs[0].storage_path} alt={rhm.name} className="w-full h-40 object-cover transition-transform duration-700 group-hover/img:scale-110" />
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 flex items-center justify-center transition-all duration-300">
                            <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover/img:opacity-100 transition-all" />
                          </div>
                        </div>
                      ) : rhm.video_url ? (
                        getYouTubeId(rhm.video_url) ? (
                          <div className="relative -mx-4 -mt-4 mb-3 cursor-pointer group/vid" onClick={() => window.open(rhm.video_url, '_blank')}>
                            <img src={`https://img.youtube.com/vi/${getYouTubeId(rhm.video_url!)}/mqdefault.jpg`} alt="Video" className="w-full h-40 object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Play className="h-8 w-8 text-white fill-white" /></div>
                          </div>
                        ) : (
                          <div className="-mx-4 -mt-4 mb-3 bg-secondary/40 border-b border-border px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-secondary/60 transition-colors" onClick={() => window.open(rhm.video_url, '_blank')}>
                            <Play className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-xs text-muted-foreground truncate">{rhm.video_url}</span>
                          </div>
                        )
                      ) : null}

                      <AppTooltip content="Modo Enfoque">
                        <button onClick={(e) => { e.stopPropagation(); openFocusMode({...rhm, title: rhm.name, category: RHYTHM_TYPES[(rhm.type as RhythmType)] || 'Ritmo'} as any, imgs as any); }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/80 z-10">
                          <Maximize2 className="h-3.5 w-3.5" />
                        </button>
                      </AppTooltip>

                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <button onClick={e => { e.stopPropagation(); togglePractice(rhm.id); }}
                            className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${
                              isCheckedToday(rhm.id) ? 'bg-primary border-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]' : 'border-muted-foreground/30 hover:border-primary/60'
                            }`}>
                            {isCheckedToday(rhm.id) && <Check className="h-3 w-3 text-primary-foreground stroke-[3px]" />}
                          </button>
                          <h4 className={`font-semibold text-lg leading-tight cursor-pointer transition-colors ${isCheckedToday(rhm.id) ? 'text-primary' : 'hover:text-primary'}`} onClick={() => openEdit(rhm)}>{rhm.name}</h4>
                        </div>
                        <div className="flex gap-4 text-[11px] text-muted-foreground/80 pl-7">
                          {rhm.time_signature && <span>🕒 {rhm.time_signature}</span>}
                          {rhm.bpm > 0 && <span className="font-mono">♩ {rhm.bpm} BPM</span>}
                        </div>
                        {rhm.description && <p className="text-xs text-muted-foreground/70 line-clamp-2">{rhm.description}</p>}
                        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                          {rhm.video_url && <Button variant="outline" size="sm" className="flex-1 h-8 text-[11px]" onClick={() => window.open(rhm.video_url, '_blank')}><Play className="h-3 w-3 mr-1 fill-current" /> Video</Button>}
                          <Button variant="secondary" size="sm" className="flex-1 h-8 text-[11px]" onClick={() => openEdit(rhm)}>Ajustes</Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {groupedRhythms.unfoldered.length > 0 && (
          <div>
            {folders.length > 0 && <h3 className="section-title text-base mb-3 opacity-70">Otros Ritmos ({groupedRhythms.unfoldered.length})</h3>}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {groupedRhythms.unfoldered.map((rhm: any) => {
                const imgs = imagesByRhythm[rhm.id] ?? [];
                return (
                  <div key={rhm.id} className="stat-card group overflow-hidden relative">
                    {imgs.length > 0 ? (
                        <div className="relative -mx-4 -mt-4 mb-3 cursor-pointer group/img" onClick={() => openViewer(rhm.id)}>
                          <img src={imgs[0].storage_path} alt={rhm.name} className="w-full h-40 object-cover transition-transform duration-700 group-hover/img:scale-110" />
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 flex items-center justify-center transition-all duration-300">
                            <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover/img:opacity-100 transition-all" />
                          </div>
                        </div>
                    ) : rhm.video_url ? (
                        getYouTubeId(rhm.video_url) ? (
                          <div className="relative -mx-4 -mt-4 mb-3 cursor-pointer group/vid" onClick={() => window.open(rhm.video_url, '_blank')}>
                            <img src={`https://img.youtube.com/vi/${getYouTubeId(rhm.video_url!)}/mqdefault.jpg`} alt="Video" className="w-full h-40 object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Play className="h-8 w-8 text-white fill-white" /></div>
                          </div>
                        ) : (
                          <div className="-mx-4 -mt-4 mb-3 bg-secondary/40 border-b border-border px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-secondary/60 transition-colors" onClick={() => window.open(rhm.video_url, '_blank')}>
                            <Play className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-xs text-muted-foreground truncate">{rhm.video_url}</span>
                          </div>
                        )
                    ) : null}

                    <AppTooltip content="Modo Enfoque">
                      <button onClick={(e) => { e.stopPropagation(); openFocusMode({...rhm, title: rhm.name, category: RHYTHM_TYPES[(rhm.type as RhythmType)] || 'Ritmo'} as any, imgs as any); }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/80 z-10">
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </AppTooltip>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <button onClick={e => { e.stopPropagation(); togglePractice(rhm.id); }}
                          className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${
                            isCheckedToday(rhm.id) ? 'bg-primary border-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]' : 'border-muted-foreground/30 hover:border-primary/60'
                          }`}>
                          {isCheckedToday(rhm.id) && <Check className="h-3 w-3 text-primary-foreground stroke-[3px]" />}
                        </button>
                        <h4 className={`font-semibold text-lg leading-tight cursor-pointer transition-colors ${isCheckedToday(rhm.id) ? 'text-primary' : 'hover:text-primary'}`} onClick={() => openEdit(rhm)}>{rhm.name}</h4>
                      </div>
                      <div className="flex gap-4 text-[11px] text-muted-foreground/80 pl-7">
                        {rhm.time_signature && <span>🕒 {rhm.time_signature}</span>}
                        {rhm.bpm > 0 && <span className="font-mono">♩ {rhm.bpm} BPM</span>}
                      </div>
                      {rhm.description && <p className="text-xs text-muted-foreground/70 line-clamp-2">{rhm.description}</p>}
                      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                        {rhm.video_url && <Button variant="outline" size="sm" className="flex-1 h-8 text-[11px]" onClick={() => window.open(rhm.video_url, '_blank')}><Play className="h-3 w-3 mr-1 fill-current" /> Video</Button>}
                        <Button variant="secondary" size="sm" className="flex-1 h-8 text-[11px]" onClick={() => openEdit(rhm)}>Ajustes</Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 && rhythms.length > 0 && (
        <div className="stat-card py-8 text-center text-muted-foreground">No hay ritmos que coincidan con la búsqueda.</div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open: boolean) => { if (!open) resetForm(); }}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Editar' : 'Nuevo'} Ritmo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Nombre *</label>
              <Input value={fName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFName(e.target.value)} placeholder='Ej: Bossa Nova Acústico' autoFocus />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Carpeta</label>
              <select value={mFolderId || ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMFolderId(e.target.value || null)}
                className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm border border-border">
                <option value="">(Sin carpeta)</option>
                {folders.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Género</label>
                <select value={fType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFType(e.target.value as RhythmType)}
                  className="w-full bg-secondary text-secondary-foreground rounded-md px-2 py-2 text-sm border border-border">
                  {Object.entries(RHYTHM_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Compás</label>
                <Input value={fTime} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFTime(e.target.value)} placeholder="Ej: 4/4" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">BPM</label>
              <Input type="number" value={fBpm || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFBpm(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Video / Referencia</label>
              <Input value={fVideoUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFVideoUrl(e.target.value)} placeholder="YouTube, Spotify, Drive, cualquier URL..." />
              {fVideoUrl && (
                <p className="text-[10px] text-muted-foreground mt-1 opacity-70 truncate">🔗 {fVideoUrl}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Notas</label>
              <Textarea value={fDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFDescription(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                <ImageIcon className="h-3 w-3" />
                Imágenes
              </label>
              {editingId ? (
                <>
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:border-primary/50">
                    {uploadingImages ? <span>Subiendo...</span> : <div className="flex flex-col items-center gap-1.5 opacity-60"><Upload className="h-6 w-6" /><span>Subir o pegar imagen</span></div>}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) handleFiles(Array.from(e.target.files)); e.target.value = ''; }} />
                  {editingImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {editingImages.map((img: any) => (
                        <div key={img.id} className="relative group rounded-lg overflow-hidden border aspect-square">
                          <img src={img.storage_path} className="w-full h-full object-cover" alt="preview" />
                          <button onClick={() => deleteImage(img.id)} className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : <p className="text-xs opacity-50 italic">Guarda el ritmo para subir imágenes.</p>}
            </div>
            <div className="flex justify-between pt-2 border-t">
              {editingId ? <Button variant="destructive" size="sm" onClick={deleteRhythm}>Eliminar</Button> : <div />}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
                <Button size="sm" onClick={saveRhythm}>Guardar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Folder Form Dialog */}
      <Dialog open={showFolderForm} onOpenChange={(open: boolean) => { if (!open) resetFolderForm(); }}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader><DialogTitle>{editingFolderId ? 'Editar' : 'Nueva'} Carpeta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Nombre</label>
              <Input value={fFolderName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFFolderName(e.target.value)} placeholder="Nombre..." autoFocus />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {FOLDER_COLORS.map(c => <button key={c} onClick={() => setFFolderColor(c)} className={`w-8 h-8 rounded-full ${fFolderColor === c ? 'ring-2 ring-white ring-offset-2' : ''}`} style={{ backgroundColor: c }} />)}
            </div>
            <div className="flex justify-between pt-4 border-t">
              {editingFolderId ? <Button variant="destructive" size="sm" onClick={() => deleteFolder(editingFolderId)}>Eliminar</Button> : <div />}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetFolderForm}>Cancelar</Button>
                <Button size="sm" onClick={saveFolder}>Guardar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer */}
      <Dialog open={viewerImages.length > 0} onOpenChange={(open: boolean) => { if (!open) setViewerImages([]); }}>
        <DialogContent className="bg-black/95 border-none max-w-5xl max-h-[95vh] p-0 flex flex-col justify-center items-center">
          <button onClick={() => setViewerImages([])} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="h-6 w-6" /></button>
          {viewerImages[viewerIndex] && <img src={viewerImages[viewerIndex].storage_path} className="max-w-full max-h-[85vh] object-contain" alt="rhythm" />}
          {viewerImages.length > 1 && (
            <div className="absolute bottom-4 flex gap-4 bg-black/50 p-2 rounded-full">
              <button onClick={() => setViewerIndex(i => (i - 1 + viewerImages.length) % viewerImages.length)} className="text-white"><ArrowLeft className="h-5 w-5" /></button>
              <span className="text-white text-sm">{viewerIndex + 1} / {viewerImages.length}</span>
              <button onClick={() => setViewerIndex(i => (i + 1) % viewerImages.length)} className="text-white"><ArrowRight className="h-5 w-5" /></button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
