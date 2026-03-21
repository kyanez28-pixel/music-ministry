import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useRhythms } from '@/hooks/use-music-data';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { generateId } from '@/lib/music-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Play, Plus, Trash2, Upload, X, ZoomIn, ArrowLeft, ArrowRight, BookOpen, Music2, Tag, Maximize2 } from 'lucide-react';
import type { Rhythm, RhythmType } from '@/types/music';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { AppTooltip } from '@/components/AppTooltip';

interface RhythmImage {
  id: string;
  rhythmId: string;
  dataUrl: string;
  fileName: string;
}

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
  const [rhythms, setRhythms] = useRhythms();
  const [allImages, setAllImages] = useLocalStorage<RhythmImage[]>('mm-rhythm-images', []);

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
    editingId ? allImages.filter((i: any) => i.rhythmId === editingId) : [],
  [allImages, editingId]);

  const filtered = useMemo(() => {
    let list = rhythms;
    if (filterType !== 'todos') list = list.filter((r: any) => r.type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r: any) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [rhythms, filterType, search]);

  const imagesByRhythm = useMemo(() => {
    const map: Record<string, RhythmImage[]> = {};
    allImages.forEach((img: any) => {
      if (!map[img.rhythmId]) map[img.rhythmId] = [];
      map[img.rhythmId].push(img);
    });
    return map;
  }, [allImages]);

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setFName(''); setFType('balada'); setFTime('');
    setFBpm(0); setFDescription(''); setFVideoUrl('');
  };

  const openEdit = (r: Rhythm) => {
    setEditingId(r.id);
    setFName(r.name); setFType(r.type); setFTime(r.timeSignature);
    setFBpm(r.bpm); setFDescription(r.description);
    setFVideoUrl(r?.videoUrl ?? '');
    setShowForm(true);
  };

  const saveRhythm = () => {
    if (!fName.trim()) { toast.error('El nombre es requerido'); return; }
    const rhm: Rhythm = {
      id: editingId ?? generateId(),
      name: fName.trim(),
      type: fType,
      timeSignature: fTime,
      bpm: fBpm,
      description: fDescription,
      videoUrl: fVideoUrl,
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
    setAllImages((prev: any[]) => prev.filter((i: any) => i.rhythmId !== editingId));
    toast.success('Ritmo eliminado');
    resetForm();
  };

  // ─── Images ───────────────────────────────────────────────────────────────────

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
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
          id: generateId(), rhythmId: editingId,
          dataUrl: await fileToBase64(file), fileName: file.name,
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
    document.addEventListener('paste', handlePaste as any);
    return () => document.removeEventListener('paste', handlePaste as any);
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

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">🥁 Ritmos</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center">
            {rhythms.length} ritmos registrados
            <AppTooltip content="El total de patrones rítmicos que tienes guardados.">
              <span className="ml-1 cursor-help opacity-50">ⓘ</span>
            </AppTooltip>
          </p>
        </div>
        <AppTooltip content="Crea un nuevo patrón rítmico personalizado.">
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo ritmo
          </Button>
        </AppTooltip>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Buscar ritmo..." value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="flex-1 min-w-40" />
        <select value={filterType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value as any)}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm border border-border">
          <option value="todos">Todos los géneros</option>
          {(Object.keys(RHYTHM_TYPES) as RhythmType[]).map((t: string) => (
            <option key={t} value={t}>{RHYTHM_TYPES[t as RhythmType]}</option>
          ))}
        </select>
      </div>

      {/* Empty state */}
      {rhythms.length === 0 && (
        <div className="stat-card py-16 text-center space-y-3">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Aún no tienes ritmos personalizados.</p>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Crear ritmo
          </Button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((rhm: any) => {
          const imgs = imagesByRhythm[rhm.id] ?? [];
          return (
            <div key={rhm.id} className={`stat-card group overflow-hidden transition-all duration-300 ${
              rhm.type === 'balada' ? 'hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.2)]' :
              rhm.type === 'pop' ? 'hover:shadow-[0_0_30px_-10px_rgba(236,72,153,0.2)]' :
              rhm.type === 'latino' ? 'hover:shadow-[0_0_30px_-10px_rgba(234,179,8,0.2)]' :
              'hover:shadow-[0_0_30px_-10px_rgba(168,162,158,0.2)]'
            }`}>
              {/* Media thumbnail */}
              {imgs.length > 0 ? (
                <div className="relative -mx-4 -mt-4 mb-3 cursor-pointer group/img"
                  onClick={() => openViewer(rhm.id)}>
                  <img src={imgs[0].dataUrl} alt={rhm.name}
                    className="w-full h-40 object-cover transition-transform duration-700 group-hover/img:scale-110" />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 flex items-center justify-center transition-all duration-300">
                    <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover/img:opacity-100 scale-90 group-hover/img:scale-100 transition-all duration-300 drop-shadow-2xl" />
                  </div>
                  {imgs.length > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full font-mono border border-white/10">
                      {imgs.length} fotos
                    </span>
                  )}
                </div>
              ) : rhm.videoUrl && getYouTubeId(rhm.videoUrl) ? (
                <div className="relative -mx-4 -mt-4 mb-3 cursor-pointer group/vid"
                  onClick={() => window.open(rhm.videoUrl, '_blank')}>
                  <img src={`https://img.youtube.com/vi/${getYouTubeId(rhm.videoUrl!)}/mqdefault.jpg`} alt="Video"
                    className="w-full h-40 object-cover transition-transform duration-700 group-hover/vid:scale-110" />
                  <div className="absolute inset-0 bg-black/40 group-hover/vid:bg-black/20 flex items-center justify-center transition-all duration-300">
                    <div className="w-14 h-14 bg-red-600/90 group-hover/vid:bg-red-500 group-hover/vid:scale-110 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(220,38,38,0.6)] transition-all duration-300">
                      <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Focus Mode Overlay Trigger */}
              <AppTooltip content="Entrar en Modo Enfoque (Pantalla completa)">
                <button 
                  onClick={(e: React.MouseEvent) => { 
                    e.stopPropagation(); 
                    openFocusMode(
                      { ...rhm, title: rhm.name, category: RHYTHM_TYPES[rhm.type as RhythmType] || 'Ritmo' } as any, 
                      imgs as any
                    ); 
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/80 z-10"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </AppTooltip>

              {/* Text info */}
              <div className="space-y-3">
                {!imgs.length && !rhm.videoUrl && (
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary/80">
                    {RHYTHM_TYPES[rhm.type]}
                  </span>
                )}
                <h4 className="font-semibold text-lg leading-tight cursor-pointer hover:text-primary transition-colors"
                  onClick={() => openEdit(rhm)}>
                  {rhm.name}
                </h4>

                <div className="flex gap-4 text-[11px] text-muted-foreground/80">
                  {rhm.timeSignature && <span className="flex items-center gap-1">🕒 {rhm.timeSignature}</span>}
                  {rhm.bpm > 0 && <span className="font-mono bg-secondary/50 px-1.5 rounded text-[10px]">♩ {rhm.bpm} BPM</span>}
                </div>

                {rhm.description && (
                  <p className="text-[12px] text-muted-foreground/70 line-clamp-2 leading-relaxed italic">{rhm.description}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                  {rhm.videoUrl && (
                    <a href={rhm.videoUrl} target="_blank" rel="noopener noreferrer"
                      className="premium-btn-glow text-[11px] font-bold flex-1 text-center bg-gradient-to-r from-red-500/10 to-red-600/20 border border-red-500/30 text-red-500 py-2 rounded-lg flex items-center justify-center gap-2 hover:from-red-500/20 shadow-sm"
                      onClick={e => e.stopPropagation()}>
                      <Play className="h-3 w-3 fill-current" /> Ver ritmos
                    </a>
                  )}
                  <AppTooltip content="Editar detalles o imágenes de este ritmo.">
                    <button onClick={() => openEdit(rhm)}
                      className="premium-btn-glow text-[11px] font-bold flex-1 text-center bg-gradient-to-r from-primary/10 to-primary/20 border border-primary/30 text-primary py-2 rounded-lg hover:from-primary/20 shadow-sm">
                      Ajustes
                    </button>
                  </AppTooltip>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && rhythms.length > 0 && (
        <div className="stat-card py-8 text-center text-muted-foreground">
          No hay ritmos que coincidan con la búsqueda.
        </div>
      )}

      {/* ─── Form Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={showForm} onOpenChange={(open: boolean) => { if (!open) resetForm(); }}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? 'Editar' : 'Nuevo'} Ritmo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">

            <div>
              <label className="text-xs text-muted-foreground">Nombre *</label>
              <Input value={fName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFName(e.target.value)}
                placeholder='Ej: Bossa Nova Acústico' autoFocus />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Género / Tipo</label>
                <select value={fType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFType(e.target.value as RhythmType)}
                  className="w-full bg-secondary text-secondary-foreground rounded-md px-2 py-2 text-sm border border-border">
                  {(Object.keys(RHYTHM_TYPES) as RhythmType[]).map((t: string) => (
                    <option key={t} value={t}>{RHYTHM_TYPES[t as RhythmType]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Compás</label>
                <Input value={fTime} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFTime(e.target.value)} placeholder="Ej: 4/4, 6/8" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">BPM objetivo</label>
              <Input type="number" min={0} value={fBpm || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFBpm(parseInt(e.target.value) || 0)} placeholder="0" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Play className="h-3 w-3" /> Link del video (YouTube, TikTok...)
              </label>
              <div className="relative">
                <Input value={fVideoUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..." className="pr-10" />
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

            <div>
               <label className="text-xs text-muted-foreground">Notas / Patrón</label>
               <Textarea value={fDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFDescription(e.target.value)}
                 rows={3} placeholder="Describe el patrón rítmico, variaciones apoyaturas..." />
            </div>

            {/* Images */}
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                <Music2 className="h-3 w-3" /> Imágenes del ritmo
              </label>
              {editingId ? (
                <>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:border-primary/50"
                  >
                     {uploadingImages ? (
                       <span className="text-sm">Subiendo...</span>
                     ) : (
                       <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                         <Upload className="h-6 w-6" />
                         <span className="text-sm">Clic o Ctrl+V para pegar imagen</span>
                       </div>
                     )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e => { if (e.target.files) handleFiles(Array.from(e.target.files)); e.target.value = ''; }} />

                  {editingImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {editingImages.map((img: any, idx: number) => (
                        <div key={img.id} className="relative group rounded-lg overflow-hidden border aspect-square">
                          <img src={img.dataUrl} className="w-full h-full object-cover" />
                          <AppTooltip content="Eliminar esta imagen">
                            <button onClick={() => deleteImage(img.id)}
                              className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 shadow-lg hover:scale-110 transition-all">
                              <X className="h-3 w-3" />
                            </button>
                          </AppTooltip>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic bg-secondary/30 rounded-lg p-2 text-center">
                  💡 Guarda el ritmo primero para poder subir imágenes.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-2 border-t border-border">
              {editingId ? (
                <Button variant="destructive" size="sm" onClick={deleteRhythm}>
                  <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                </Button>
              ) : <div />}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
                <Button size="sm" onClick={saveRhythm}>Guardar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer */}
      <Dialog open={viewerImages.length > 0} onOpenChange={(open: boolean) => { if (!open) setViewerImages([]); }}>
        <DialogContent className="bg-black/95 border-none max-w-5xl max-h-[95vh] p-0 flex flex-col justify-center items-center">
          <button onClick={() => setViewerImages([])} className="absolute top-4 right-4 text-white/50 hover:text-white">
            <X className="h-6 w-6" />
          </button>
          
          {viewerImages[viewerIndex] && (
            <img src={viewerImages[viewerIndex].dataUrl} className="max-w-full max-h-[85vh] object-contain" />
          )}
          
          {viewerImages.length > 1 && (
            <div className="absolute bottom-4 flex gap-4 bg-black/50 p-2 rounded-full backdrop-blur-md">
              <button onClick={() => setViewerIndex(i => (i - 1 + viewerImages.length) % viewerImages.length)}
                className="text-white hover:text-primary"><ArrowLeft className="h-5 w-5" /></button>
              <div className="flex gap-1.5 items-center">
                  {viewerImages.map((_, i) => (
                    <span key={i} className={`w-2 h-2 rounded-full ${i === viewerIndex ? 'bg-primary scale-125' : 'bg-white/40'}`} />
                  ))}
              </div>
              <button onClick={() => setViewerIndex(i => (i + 1) % viewerImages.length)}
                className="text-white hover:text-primary"><ArrowRight className="h-5 w-5" /></button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
