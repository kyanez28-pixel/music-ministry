import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useExercises, useExerciseFolders, useExerciseImages } from '@/hooks/use-music-data';
import { generateId, getTodayEC, formatDate } from '@/lib/music-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Plus, FolderPlus, Trash2, Upload, X, ZoomIn, ArrowLeft, ArrowRight,
  ExternalLink, Play, BookOpen, ChevronDown, ChevronRight,
  Music2, Tag, Pencil, Trash, Maximize2
} from 'lucide-react';
import type { Exercise, ExerciseDifficulty, ExerciseStatus, ExerciseFolder, ExerciseImage } from '@/types/music';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { AppTooltip } from '@/components/AppTooltip';
import { LoadingGrid } from '@/components/ui/LoadingCard';

const FOLDER_COLORS = ['#d4a843', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#34d399', '#e879f9'];

// ─── Constants ─────────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<ExerciseDifficulty, { label: string; color: string; emoji: string }> = {
  principiante: { label: 'Principiante', color: 'text-success',  emoji: '🟢' },
  intermedio:   { label: 'Intermedio',   color: 'text-warning',  emoji: '🟡' },
  avanzado:     { label: 'Avanzado',     color: 'text-destructive', emoji: '🔴' },
};

const STATUS_CONFIG: Record<ExerciseStatus, { label: string; emoji: string }> = {
  pendiente:    { label: 'Pendiente',    emoji: '⏳' },
  en_progreso:  { label: 'En progreso',  emoji: '🎯' },
  dominado:     { label: 'Dominado',     emoji: '✅' },
};

const SUGGESTED_CATEGORIES = [
  'Montuno', 'Ritmo 2-3', 'Ritmo 3-2', 'Clave', 'Guajeo',
  'Arpegio', 'Acorde', 'Escala', 'Técnica', 'Lectura', 'Improvisación',
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function YouTubeThumb({ url }: { url: string }) {
  const id = getYouTubeId(url);
  if (!id) return null;
  return (
    <img
      src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`}
      alt="YouTube thumbnail"
      className="w-full h-full object-cover rounded"
    />
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface ExerciseSectionProps {
  relatedScaleId?: string;
  relatedHarmonyId?: string;
  defaultCategory?: string;
}

export const ExerciseSection: React.FC<ExerciseSectionProps> = ({ 
  relatedScaleId, 
  relatedHarmonyId,
  defaultCategory 
}) => {
  const { openFocusMode } = useFocusMode();
  const [exercises = [], setExercises, isLoadingEx] = useExercises();
  const [allImages = [], setAllImages, isLoadingImg] = useExerciseImages();
  const [folders = [], setFolders, isLoadingFolders] = useExerciseFolders();
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [filterFolder, setFilterFolder] = useState<string | 'todos'>('todos');
  const [mFolderId, setMFolderId] = useState<string | null>(null);
  const [fFolderName, setFFolderName] = useState('');
  const [fFolderColor, setFFolderColor] = useState(FOLDER_COLORS[0]);
  const today = getTodayEC();

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewerImages, setViewerImages] = useState<ExerciseImage[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [fTitle, setFTitle] = useState('');
  const [fCategory, setFCategory] = useState(defaultCategory || '');
  const [fInstrument, setFInstrument] = useState<Exercise['instrument']>('piano');
  const [fDifficulty, setFDifficulty] = useState<ExerciseDifficulty>('principiante');
  const [fStatus, setFStatus] = useState<ExerciseStatus>('pendiente');
  const [fBpm, setFBpm] = useState(0);
  const [fKey, setFKey] = useState('');
  const [fDescription, setFDescription] = useState('');
  const [fVideoUrl, setFVideoUrl] = useState('');
  const [fProgress, setFProgress] = useState(0);

  // Filter logic
  const filtered = useMemo(() => {
    let list = exercises || [];
    if (filterFolder !== 'todos') list = (list || []).filter((e: any) => e.folder_id === filterFolder);
    if (relatedScaleId) list = list.filter((e: any) => e.related_scale_id === relatedScaleId);
    if (relatedHarmonyId) list = list.filter((e: any) => e.related_harmony_id === relatedHarmonyId);
    
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e: any) =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [exercises, relatedScaleId, relatedHarmonyId, search, filterFolder]);

  const groupedExercises = useMemo(() => {
    const groups = (folders || []).map((f: any) => ({
      folder: f,
      items: filtered.filter((e: any) => e.folder_id === f.id),
    }));
    const unfoldered = filtered.filter((e: any) => !e.folder_id);
    return { groups, unfoldered };
  }, [folders, filtered]);

  const imagesByExercise = useMemo(() => {
    const map: Record<string, ExerciseImage[]> = {};
    (allImages || []).forEach((img: any) => {
      const eid = img.exercise_id;
      if (!map[eid]) map[eid] = [];
      map[eid].push(img);
    });
    return map;
  }, [allImages]);

  // Actions
  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setFTitle(''); setMFolderId(null); setFCategory(defaultCategory || ''); setFInstrument('piano');
    setFDifficulty('principiante'); setFStatus('pendiente');
    setFBpm(0); setFKey(''); setFDescription('');
    setFVideoUrl(''); setFProgress(0);
  };

  const openEdit = (e: Exercise) => {
    setEditingId(e.id);
    setFTitle(e.title); setMFolderId(e.folder_id || null); setFCategory(e.category); setFInstrument(e.instrument);
    setFDifficulty(e.difficulty); setFStatus(e.status);
    setFBpm(e.bpm); setFKey(e.key); setFDescription(e.description);
    setFVideoUrl(e.video_url); setFProgress(e.progress);
    setShowForm(true);
  };

  const saveExercise = () => {
    if (!fTitle.trim()) { toast.error('El título es requerido'); return; }
    const ex: Exercise = {
      id: editingId ?? generateId(),
      folder_id: mFolderId,
      title: fTitle.trim(), category: fCategory.trim(),
      instrument: fInstrument, difficulty: fDifficulty,
      status: fStatus, bpm: fBpm, key: fKey,
      description: fDescription, video_url: fVideoUrl,
      progress: fProgress,
      created_at: editingId ? ((exercises || []).find((e: any) => e.id === editingId)?.created_at ?? today) : today,
      last_practiced: today,
      related_scale_id: relatedScaleId,
      related_harmony_id: relatedHarmonyId,
    };
    if (editingId) {
      setExercises((prev: Exercise[]) => prev.map(e => e.id === editingId ? ex : e));
      toast.success('Ejercicio actualizado');
    } else {
      setExercises((prev: Exercise[]) => [...prev, ex]);
      toast.success('Ejercicio agregado');
    }
    resetForm();
  };

  const deleteExercise = (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este ejercicio?')) return;
    setExercises((prev: Exercise[]) => prev.filter(e => e.id !== id));
    setAllImages((prev: any[]) => prev.filter((img: any) => img.exercise_id !== id));
    toast.success('Ejercicio eliminado');
  };

  const markPracticed = (id: string) => {
    setExercises((prev: Exercise[]) => prev.map(e =>
      e.id === id ? { ...e, last_practiced: today } : e
    ));
    toast.success('Marcado como practicado hoy ✓');
  };

  // Folder actions
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
    setExercises((prev: any[]) => prev.map((e: any) => e.folder_id === id ? { ...e, folder_id: null } : e));
    resetFolderForm();
    toast.success('Carpeta eliminada');
  };

  // Image handling
  const handleFiles = useCallback(async (files: File[]) => {
    if (!editingId) { toast.error('Guarda el ejercicio primero'); return; }
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    
    setUploadingImages(true);
    try {
      const compressedImages: ExerciseImage[] = await Promise.all(
        imageFiles.map(async file => {
          return new Promise<ExerciseImage>((resolve, reject) => {
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
                resolve({
                  id: generateId(),
                  exercise_id: editingId,
                  storage_path: canvas.toDataURL('image/jpeg', 0.7),
                  file_name: file.name
                });
              };
              img.onerror = reject;
              img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );
      setAllImages((prev: any[]) => [...prev, ...compressedImages]);
      toast.success(`${compressedImages.length} imagen(es) guardada(s)`);
    } catch { toast.error('Error al procesar las imágenes'); }
    finally { setUploadingImages(false); }
  }, [editingId, setAllImages]);

  const renderCard = (ex: any) => {
    const imgs = imagesByExercise[ex.id] ?? [];
    const practicedToday = ex.last_practiced === today;
    return (
      <div key={ex.id} className={`stat-card relative group transition-all hover:border-primary/40 ${practicedToday ? 'border-primary/30' : ''}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h4 className="font-semibold text-sm leading-tight text-foreground truncate max-w-[150px]">{ex.title}</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{ex.category}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <AppTooltip content="Modo Enfoque (Pantalla completa)">
              <button onClick={() => openFocusMode(ex, imgs as any)} className="p-1.5 rounded-md hover:bg-primary/20 hover:text-primary transition-all">
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </AppTooltip>
            <AppTooltip content="Editar ejercicio">
              <button onClick={() => openEdit(ex)} className="p-1.5 rounded-md hover:bg-primary/20 hover:text-primary transition-all">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </AppTooltip>
            <AppTooltip content="Eliminar ejercicio">
              <button onClick={() => deleteExercise(ex.id)} className="p-1.5 rounded-md hover:bg-destructive/20 hover:text-destructive transition-all">
                <Trash className="h-3.5 w-3.5" />
              </button>
            </AppTooltip>
          </div>
        </div>

        <div className="relative aspect-video rounded-md overflow-hidden bg-secondary/50 mb-3 border border-white/5 cursor-pointer">
          {playingVideoId === ex.id && ex.video_url ? (
            // ── Inline YouTube embed ──
            (() => {
              const ytId = getYouTubeId(ex.video_url);
              return ytId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <a href={ex.video_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary underline">
                    <Play className="h-4 w-4" /> Abrir video
                  </a>
                </div>
              );
            })()
          ) : imgs.length > 0 ? (
            <div onClick={() => imgs.length > 0 ? (setViewerImages(imgs), setViewerIndex(0)) : undefined}>
              <img src={imgs[0].storage_path} className="w-full h-full object-cover" alt="partitura" />
            </div>
          ) : ex.video_url ? (
            // ── YouTube thumbnail with play overlay ──
            <div className="relative w-full h-full" onClick={() => setPlayingVideoId(ex.id)}>
              <YouTubeThumb url={ex.video_url} />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/10 transition-colors">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                  <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-20" onClick={() => openEdit(ex)}>
              <Music2 className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-white/5">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => markPracticed(ex.id)}
              className={`text-[10px] px-2 py-1 rounded-full transition-all flex items-center gap-1 ${
                practicedToday ? 'bg-primary/20 text-primary' : 'bg-secondary hover:bg-primary/20 hover:text-primary'
              }`}
            >
              {practicedToday ? '✓ Practicado' : '+ Hoy'}
            </button>
            {ex.video_url && (
              <button
                onClick={() => setPlayingVideoId(playingVideoId === ex.id ? null : ex.id)}
                className={`text-[10px] px-2 py-1 rounded-full transition-all flex items-center gap-1 ${
                  playingVideoId === ex.id
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                }`}
              >
                <Play className="h-2.5 w-2.5 fill-current" />
                {playingVideoId === ex.id ? 'Cerrar' : 'Ver video'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
            {ex.bpm > 0 && <span>♩{ex.bpm}</span>}
            {ex.key && <span>{ex.key}</span>}
          </div>
        </div>
      </div>
    );
  };

  if (isLoadingEx || isLoadingFolders) {
    return <LoadingGrid />;
  }

  return (
    <div className="space-y-4">
      {/* Search & Header Actions */}
      <div className="flex items-center gap-2">
        <Input 
          placeholder="Buscar mis ejercicios..." 
          value={search} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} 
          className="flex-1 glass-panel border-white/10"
        />
        <AppTooltip content="Agregar una nueva carpeta.">
          <Button size="sm" variant="outline" onClick={() => { resetFolderForm(); setShowFolderForm(true); }}>
            <FolderPlus className="h-4 w-4" />
          </Button>
        </AppTooltip>
        <AppTooltip content="Agregar un nuevo ejercicio o técnica.">
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="premium-btn-glow">
            <Plus className="h-4 w-4 mr-1" /> Nuevo
          </Button>
        </AppTooltip>
      </div>

      {/* Folder filter tabs */}
      {folders.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <button onClick={() => setFilterFolder('todos')} className={`chip text-xs ${filterFolder === 'todos' ? 'chip-active' : ''}`}>Todos</button>
          {folders.map((f: any) => (
            <button key={f.id} onClick={() => setFilterFolder(f.id)}
              className={`chip text-xs ${filterFolder === f.id ? 'chip-active' : ''}`}
              style={filterFolder !== f.id ? { borderLeft: `3px solid ${f.color}` } : {}}>
              {f.name}
            </button>
          ))}
        </div>
      )}

      {/* Grouped by folder */}
      <div className="space-y-4">
        {groupedExercises.groups.map(({ folder, items }: any) => (
          <div key={folder.id}>
            <button
              onClick={() => setCollapsedFolders(prev => { const n = new Set(prev); n.has(folder.id) ? n.delete(folder.id) : n.add(folder.id); return n; })}
              className="flex items-center gap-2 group w-full text-left mb-2"
            >
              {collapsedFolders.has(folder.id) ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
              <span className="section-title text-base">{folder.name}</span>
              <span className="text-xs text-muted-foreground">({items.length})</span>
              <button onClick={e => { e.stopPropagation(); openEditFolder(folder); }} className="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground">editar</button>
            </button>
            {!collapsedFolders.has(folder.id) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-5">
                {items.map((ex: any) => renderCard(ex))}
              </div>
            )}
          </div>
        ))}

        {/* Unfoldered */}
        {groupedExercises.unfoldered.length > 0 && (
          <div>
            {folders.length > 0 && <h3 className="section-title text-sm mb-2 opacity-70">Sin Carpeta ({groupedExercises.unfoldered.length})</h3>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupedExercises.unfoldered.map((ex: any) => renderCard(ex))}
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="col-span-full py-12 text-center glass-panel border-dashed opacity-50">
          <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm">No tienes ejercicios aquí todavía.</p>
          <p className="text-xs">Sube tus capturas de partituras o links de videos para organizarlos.</p>
        </div>
      )}

      {/* Exercise Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open: boolean) => { if (!open) resetForm(); }}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? 'Editar' : 'Nuevo'} Ejercicio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Título *</label>
              <Input value={fTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFTitle(e.target.value)} placeholder='Ej: Intro de Montuno en C' autoFocus />
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
                <label className="text-xs text-muted-foreground block mb-1">Categoría</label>
                <Input value={fCategory} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFCategory(e.target.value)} placeholder="Ej: Montuno, Solo..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Tonalidad</label>
                <Input value={fKey} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFKey(e.target.value)} placeholder="Ej: C, Am" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Video Link</label>
              <div className="relative">
                <Input value={fVideoUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFVideoUrl(e.target.value)} placeholder="https://youtube.com..." className="pr-10" />
                {fVideoUrl && (
                  <button onClick={() => setFVideoUrl('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Dificultad</label>
                <select value={fDifficulty} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFDifficulty(e.target.value as ExerciseDifficulty)}
                  className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm border border-border">
                  {Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Estado</label>
                <select value={fStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFStatus(e.target.value as ExerciseStatus)}
                  className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm border border-border">
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                </select>
              </div>
            </div>

            {editingId ? (
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Imágenes (partituras / clips)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-all"
                >
                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Sube fotos de tus partituras o ejemplos</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) handleFiles(Array.from(e.target.files)); }} />
                
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {allImages.filter((i: any) => i.exercise_id === editingId).map((img: ExerciseImage) => (
                    <div key={img.id} className="relative aspect-square rounded overflow-hidden border border-white/10 group">
                      <img src={img.storage_path} className="w-full h-full object-cover" alt="prev" />
                      <AppTooltip content="Eliminar esta imagen">
                        <button onClick={() => setAllImages((prev: any[]) => prev.filter((i: any) => i.id !== img.id))} 
                          className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110">
                          <X className="h-2 w-2" />
                        </button>
                      </AppTooltip>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-secondary/50 rounded-lg text-[11px] text-muted-foreground italic">
                💡 Primero guarda el ejercicio para poder subirle imágenes.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
              <Button size="sm" onClick={saveExercise}>Guardar</Button>
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
              <Input value={fFolderName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFFolderName(e.target.value)} placeholder="Nombre de la carpeta..." autoFocus />
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

      {/* Global Image Viewer */}
      <Dialog open={viewerImages.length > 0} onOpenChange={(open: boolean) => { if (!open) setViewerImages([]); }}>
        <DialogContent className="bg-black/95 border-none max-w-5xl max-h-[95vh] p-0 flex flex-col items-center justify-center">
          <div className="absolute top-4 right-4 z-10">
            <button onClick={() => setViewerImages([])} className="text-white bg-black/50 p-2 rounded-full hover:bg-black/80">
              <X className="h-5 w-5" />
            </button>
          </div>
          {viewerImages[viewerIndex] && (
            <img src={viewerImages[viewerIndex].storage_path} className="max-w-full max-h-[85vh] object-contain shadow-2xl" alt="partitura" />
          )}
          {viewerImages.length > 1 && (
            <div className="flex gap-4 mt-6">
              <Button size="sm" variant="outline" className="text-white border-white/20 hover:bg-white/10" 
                onClick={() => setViewerIndex(i => (i - 1 + viewerImages.length) % viewerImages.length)}>
                Anterior
              </Button>
              <span className="text-white/60 text-sm flex items-center">{viewerIndex + 1} / {viewerImages.length}</span>
              <Button size="sm" variant="outline" className="text-white border-white/20 hover:bg-white/10"
                onClick={() => setViewerIndex(i => (i + 1) % viewerImages.length)}>
                Siguiente
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
