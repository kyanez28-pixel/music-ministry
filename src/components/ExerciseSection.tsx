import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { generateId, getTodayEC, formatDate } from '@/lib/music-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Plus, Trash2, Upload, X, ZoomIn, ArrowLeft, ArrowRight,
  ExternalLink, Play, BookOpen, ChevronDown, ChevronRight,
  Music2, Tag, Pencil, Trash, Maximize2
} from 'lucide-react';
import type { Exercise, ExerciseImage, ExerciseDifficulty, ExerciseStatus } from '@/types/music';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { AppTooltip } from '@/components/AppTooltip';

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
  const [exercises, setExercises] = useLocalStorage<Exercise[]>('mm-exercises', []);
  const [allImages, setAllImages] = useLocalStorage<ExerciseImage[]>('mm-exercise-images', []);
  const today = getTodayEC();

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewerImages, setViewerImages] = useState<ExerciseImage[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [uploadingImages, setUploadingImages] = useState(false);
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
    let list = exercises;
    if (relatedScaleId) list = list.filter(e => e.relatedScaleId === relatedScaleId);
    if (relatedHarmonyId) list = list.filter(e => e.relatedHarmonyId === relatedHarmonyId);
    
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [exercises, relatedScaleId, relatedHarmonyId, search]);

  const imagesByExercise = useMemo(() => {
    const map: Record<string, ExerciseImage[]> = {};
    allImages.forEach(img => {
      if (!map[img.exerciseId]) map[img.exerciseId] = [];
      map[img.exerciseId].push(img);
    });
    return map;
  }, [allImages]);

  // Actions
  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setFTitle(''); setFCategory(defaultCategory || ''); setFInstrument('piano');
    setFDifficulty('principiante'); setFStatus('pendiente');
    setFBpm(0); setFKey(''); setFDescription('');
    setFVideoUrl(''); setFProgress(0);
  };

  const openEdit = (e: Exercise) => {
    setEditingId(e.id);
    setFTitle(e.title); setFCategory(e.category); setFInstrument(e.instrument);
    setFDifficulty(e.difficulty); setFStatus(e.status);
    setFBpm(e.bpm); setFKey(e.key); setFDescription(e.description);
    setFVideoUrl(e.videoUrl); setFProgress(e.progress);
    setShowForm(true);
  };

  const saveExercise = () => {
    if (!fTitle.trim()) { toast.error('El título es requerido'); return; }
    const ex: Exercise = {
      id: editingId ?? generateId(),
      title: fTitle.trim(), category: fCategory.trim(),
      instrument: fInstrument, difficulty: fDifficulty,
      status: fStatus, bpm: fBpm, key: fKey,
      description: fDescription, videoUrl: fVideoUrl,
      progress: fProgress,
      createdAt: editingId ? (exercises.find(e => e.id === editingId)?.createdAt ?? today) : today,
      lastPracticed: today,
      relatedScaleId,
      relatedHarmonyId
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
    setAllImages((prev: ExerciseImage[]) => prev.filter(img => img.exerciseId !== id));
    toast.success('Ejercicio eliminado');
  };

  const markPracticed = (id: string) => {
    setExercises((prev: Exercise[]) => prev.map(e =>
      e.id === id ? { ...e, lastPracticed: today } : e
    ));
    toast.success('Marcado como practicado hoy ✓');
  };

  const handleFiles = useCallback(async (files: File[]) => {
    if (!editingId) { toast.error('Guarda el ejercicio primero'); return; }
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const tooBig = imageFiles.filter(f => f.size > 3 * 1024 * 1024);
    if (tooBig.length > 0) { toast.error(`${tooBig.length} imagen(es) superan 3MB`); return; }
    setUploadingImages(true);
    try {
      const reader = (f: File) => new Promise<string>((resolve) => {
        const r = new FileReader(); r.onload = () => resolve(r.result as string); r.readAsDataURL(f);
      });
      const newImages: ExerciseImage[] = await Promise.all(
        imageFiles.map(async file => ({
          id: generateId(), exerciseId: editingId,
          dataUrl: await reader(file), fileName: file.name,
        }))
      );
      setAllImages((prev: ExerciseImage[]) => [...prev, ...newImages]);
      toast.success(`${newImages.length} imagen(es) guardada(s)`);
    } catch { toast.error('Error al procesar las imágenes'); }
    finally { setUploadingImages(false); }
  }, [editingId, setAllImages]);

  return (
    <div className="space-y-4">
      {/* Search & Add */}
      <div className="flex items-center gap-2">
        <Input 
          placeholder="Buscar mis ejercicios..." 
          value={search} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} 
          className="flex-1 glass-panel border-white/10"
        />
        <AppTooltip content="Agregar un nuevo ejercicio o técnica.">
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="premium-btn-glow">
            <Plus className="h-4 w-4 mr-1" /> Nuevo
          </Button>
        </AppTooltip>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(ex => {
          const imgs = imagesByExercise[ex.id] ?? [];
          const practicedToday = ex.lastPracticed === today;
          return (
            <div key={ex.id} className={`stat-card relative group transition-all hover:border-primary/40 ${practicedToday ? 'border-primary/30' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-semibold text-sm leading-tight text-foreground truncate max-w-[150px]">{ex.title}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{ex.category}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <AppTooltip content="Modo Enfoque (Pantalla completa)">
                    <button onClick={() => openFocusMode(ex, imgs)} className="p-1.5 rounded-md hover:bg-primary/20 hover:text-primary transition-all group/btn">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </AppTooltip>
                  <AppTooltip content="Editar ejercicio">
                    <button onClick={() => openEdit(ex)} className="p-1.5 rounded-md hover:bg-primary/20 hover:text-primary transition-all group/btn">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </AppTooltip>
                  <AppTooltip content="Eliminar ejercicio">
                    <button onClick={() => deleteExercise(ex.id)} className="p-1.5 rounded-md hover:bg-destructive/20 hover:text-destructive transition-all group/btn">
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </AppTooltip>
                </div>
              </div>

              {/* Preview */}
              <div className="relative aspect-video rounded-md overflow-hidden bg-secondary/50 mb-3 border border-white/5 cursor-pointer"
                onClick={() => imgs.length > 0 ? (setViewerImages(imgs), setViewerIndex(0)) : ex.videoUrl ? window.open(ex.videoUrl, '_blank') : openEdit(ex)}>
                {imgs.length > 0 ? (
                  <img src={imgs[0].dataUrl} className="w-full h-full object-cover" alt="partitura" />
                ) : ex.videoUrl ? (
                  <YouTubeThumb url={ex.videoUrl} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-20">
                    <Music2 className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  {imgs.length > 0 && <ZoomIn className="h-6 w-6 text-white" />}
                  {ex.videoUrl && <Play className="h-8 w-8 text-primary fill-primary/20" />}
                </div>
              </div>

              {/* Footer */}
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
                  {ex.videoUrl && (
                    <button 
                      onClick={() => window.open(ex.videoUrl, '_blank')}
                      className="text-[10px] px-2 py-1 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all flex items-center gap-1"
                      title="Ver Video"
                    >
                      <Play className="h-2.5 w-2.5 fill-current" /> Video
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
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center glass-panel border-dashed opacity-50">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm">No tienes ejercicios aquí todavía.</p>
            <p className="text-xs">Sube tus capturas de partituras o links de videos para organizarlos.</p>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open: boolean) => { if (!open) resetForm(); }}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? 'Editar' : 'Nuevo'} Ejercicio
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Título *</label>
              <Input value={fTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFTitle(e.target.value)} placeholder='Ej: Intro de Montuno en C' autoFocus />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="text-xs text-muted-foreground block mb-1">Categoría</label>
                  <Input value={fCategory} onChange={e => setFCategory(e.target.value)} placeholder="Ej: Montuno, Solo..." />
               </div>
               <div>
                  <label className="text-xs text-muted-foreground block mb-1">Tonalidad</label>
                  <Input value={fKey} onChange={e => setFKey(e.target.value)} placeholder="Ej: C, Am" />
               </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Video Link</label>
              <div className="relative">
                <Input value={fVideoUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFVideoUrl(e.target.value)} placeholder="https://youtube.com..." className="pr-10" />
                {fVideoUrl && (
                  <button 
                    onClick={() => setFVideoUrl('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
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
                  onChange={e => { if (e.target.files) handleFiles(Array.from(e.target.files)); }} />
                
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {allImages.filter(i => i.exerciseId === editingId).map((img: ExerciseImage) => (
                    <div key={img.id} className="relative aspect-square rounded overflow-hidden border border-white/10 group">
                      <img src={img.dataUrl} className="w-full h-full object-cover" alt="prev" />
                      <AppTooltip content="Eliminar esta imagen">
                        <button onClick={() => setAllImages((prev: ExerciseImage[]) => prev.filter(i => i.id !== img.id))} 
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

      {/* Global Image Viewer */}
      <Dialog open={viewerImages.length > 0} onOpenChange={open => { if (!open) setViewerImages([]); }}>
        <DialogContent className="bg-black/95 border-none max-w-5xl max-h-[95vh] p-0 flex flex-col items-center justify-center">
          <div className="absolute top-4 right-4 z-10">
            <button onClick={() => setViewerImages([])} className="text-white bg-black/50 p-2 rounded-full hover:bg-black/80">
              <X className="h-5 w-5" />
            </button>
          </div>
          {viewerImages[viewerIndex] && (
            <img src={viewerImages[viewerIndex].dataUrl} className="max-w-full max-h-[85vh] object-contain shadow-2xl" alt="partitura" />
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
