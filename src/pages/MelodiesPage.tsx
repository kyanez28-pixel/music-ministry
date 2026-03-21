import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useSessions } from '@/hooks/use-music-data';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getTodayEC, generateId } from '@/lib/music-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Plus, FolderPlus, Trash2, Upload, Image, Check,
  Save, X, ChevronDown, ChevronRight, ZoomIn, ArrowLeft,
  ArrowRight, Music2, Play, Maximize2
} from 'lucide-react';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { AppTooltip } from '@/components/AppTooltip';
import { useInstruments } from '@/hooks/use-instruments';
import type { InstrumentDef } from '@/types/music';
import { Instrument } from '@/types/music';

// ─── Types ───────────────────────────────────────────────────────────────────

type MelodyStatus = 'aprendiendo' | 'practicando' | 'dominada';
type InstrumentType = Instrument | 'ambos';

interface MelodyFolder {
  id: string;
  name: string;
  color: string;
}

interface MelodyImage {
  id: string;
  melodyId: string;
  dataUrl: string;   // base64
  fileName: string;
}

interface Melody {
  id: string;
  folderId: string | null;
  name: string;
  instrument: InstrumentType;
  status: MelodyStatus;
  bpm: number;
  key: string;
  timeSignature: string;
  description: string;
  progress: number;
  videoUrl?: string;
}

interface MelodyPracticeLog {
  melodyId: string;
  date: string;
  instrument: Instrument;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<MelodyStatus, { label: string; color: string; emoji: string }> = {
  aprendiendo: { label: 'Aprendiendo', color: 'text-warning', emoji: '🔄' },
  practicando: { label: 'Practicando', color: 'text-info', emoji: '🎯' },
  dominada:    { label: 'Dominada',    color: 'text-success', emoji: '✅' },
};

const FOLDER_COLORS = [
  '#d4a843', '#4ade80', '#60a5fa', '#f472b6',
  '#a78bfa', '#fb923c', '#34d399', '#e879f9',
];

const KEYS_LIST = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
  'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm'];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MelodiesPage() {
  const { openFocusMode } = useFocusMode();
  const [sessions, setSessions] = useSessions();
  const [folders, setFolders] = useLocalStorage<MelodyFolder[]>('mm-melody-folders', []);
  const [melodies, setMelodies] = useLocalStorage<Melody[]>('mm-melodies-v2', []);
  const [allImages, setAllImages] = useLocalStorage<MelodyImage[]>('mm-melody-images', []);
  const [practiceLogs, setPracticeLogs] = useLocalStorage<MelodyPracticeLog[]>('mm-melody-logs', []);

  const { instruments } = useInstruments();
  const today = getTodayEC();

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [filterFolder, setFilterFolder] = useState<string | 'todos'>('todos');
  const [practiceInstrument, setPracticeInstrument] = useState<Instrument>(instruments[0]?.id || 'piano');
  const [viewerImages, setViewerImages] = useState<MelodyImage[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Melody form state
  const [mName, setMName] = useState('');
  const [mFolderId, setMFolderId] = useState<string | null>(null);
  const [mInstrument, setMInstrument] = useState<InstrumentType>('piano');
  const [mStatus, setMStatus] = useState<MelodyStatus>('aprendiendo');
  const [mBpm, setMBpm] = useState(0);
  const [mKey, setMKey] = useState('');
  const [mTimeSig, setMTimeSig] = useState('4/4');
  const [mDesc, setMDesc] = useState('');
  const [mProgress, setMProgress] = useState(0);
  const [mVideoUrl, setMVideoUrl] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);

  // Folder form state
  const [fName, setFName] = useState('');
  const [fColor, setFColor] = useState(FOLDER_COLORS[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Derived data ───────────────────────────────────────────────────────────

  const todayLogs = useMemo(() =>
    practiceLogs.filter(l => l.date === today && l.instrument === practiceInstrument),
    [practiceLogs, today, practiceInstrument]
  );

  const editingImages = useMemo(() =>
    editingId ? allImages.filter(i => i.melodyId === editingId) : [],
    [allImages, editingId]
  );

  const filteredMelodies = useMemo(() => {
    let list = melodies;
    if (filterFolder !== 'todos') list = list.filter((m: Melody) => m.folderId === filterFolder);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((m: Melody) => m.name.toLowerCase().includes(q) || m.key.toLowerCase().includes(q));
    }
    return list;
  }, [melodies, filterFolder, searchQuery]);

  const groupedMelodies = useMemo(() => {
    const groups = folders.map((f: MelodyFolder) => ({
      folder: f,
      items: filteredMelodies.filter((m: Melody) => m.folderId === f.id),
    }));
    const unfoldered = filteredMelodies.filter((m: Melody) => !m.folderId);
    return { groups, unfoldered };
  }, [folders, filteredMelodies]);

  // ─── Melody CRUD ────────────────────────────────────────────────────────────

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setMName(''); setMFolderId(null); setMInstrument('piano');
    setMStatus('aprendiendo'); setMBpm(0); setMKey('');
    setMTimeSig('4/4'); setMDesc(''); setMProgress(0); setMVideoUrl('');
  };

  const openEdit = (m: Melody) => {
    setEditingId(m.id);
    setMName(m.name); setMFolderId(m.folderId); setMInstrument(m.instrument);
    setMStatus(m.status); setMBpm(m.bpm); setMKey(m.key);
    setMTimeSig(m.timeSignature); setMDesc(m.description); setMProgress(m.progress);
    setMVideoUrl(m.videoUrl ?? '');
    setShowForm(true);
  };

  const saveMelody = () => {
    if (!mName.trim()) { toast.error('El nombre es requerido'); return; }
    const melody: Melody = {
      id: editingId ?? generateId(),
      folderId: mFolderId, name: mName.trim(), instrument: mInstrument,
      status: mStatus, bpm: mBpm, key: mKey, timeSignature: mTimeSig,
      description: mDesc, progress: mProgress, videoUrl: mVideoUrl
    };
    if (editingId) {
      setMelodies((prev: Melody[]) => prev.map((m: Melody) => m.id === editingId ? melody : m));
      toast.success('Melodía actualizada');
    } else {
      setMelodies((prev: Melody[]) => [...prev, melody]);
      toast.success('Melodía agregada');
    }
    resetForm();
  };

  const deleteMelody = () => {
    if (!editingId) return;
    setMelodies((prev: Melody[]) => prev.filter((m: Melody) => m.id !== editingId));
    setAllImages((prev: MelodyImage[]) => prev.filter((i: MelodyImage) => i.melodyId !== editingId));
    setPracticeLogs((prev: MelodyPracticeLog[]) => prev.filter((l: MelodyPracticeLog) => l.melodyId !== editingId));
    toast.success('Melodía eliminada');
    resetForm();
  };

  // ─── Folder CRUD ────────────────────────────────────────────────────────────

  const resetFolderForm = () => {
    setShowFolderForm(false);
    setEditingFolderId(null);
    setFName('');
    setFColor(FOLDER_COLORS[0]);
  };

  const openEditFolder = (f: MelodyFolder) => {
    setEditingFolderId(f.id);
    setFName(f.name);
    setFColor(f.color);
    setShowFolderForm(true);
  };

  const saveFolder = () => {
    if (!fName.trim()) { toast.error('El nombre es requerido'); return; }
    if (editingFolderId) {
      setFolders((prev: MelodyFolder[]) => prev.map((f: MelodyFolder) => f.id === editingFolderId ? { ...f, name: fName, color: fColor } : f));
      toast.success('Carpeta actualizada');
    } else {
      setFolders((prev: MelodyFolder[]) => [...prev, { id: generateId(), name: fName.trim(), color: fColor }]);
      toast.success('Carpeta creada');
    }
    resetFolderForm();
  };

  const deleteFolder = (id: string) => {
    setFolders((prev: MelodyFolder[]) => prev.filter((f: MelodyFolder) => f.id !== id));
    setMelodies((prev: Melody[]) => prev.map((m: Melody) => m.folderId === id ? { ...m, folderId: null } : m));
    resetFolderForm();
    toast.success('Carpeta eliminada');
  };

  // ─── Image Upload (base64 localStorage) ─────────────────────────────────────

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFiles = useCallback(async (files: File[]) => {
    if (!editingId) {
      toast.error('Guarda la melodía primero antes de subir imágenes');
      return;
    }
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    // Limit file size to 2MB per image
    const tooBig = imageFiles.filter(f => f.size > 2 * 1024 * 1024);
    if (tooBig.length > 0) {
      toast.error(`${tooBig.length} imagen(es) superan 2MB. Usa imágenes más pequeñas.`);
      return;
    }

    setUploadingImages(true);
    try {
      const newImages: MelodyImage[] = await Promise.all(
        imageFiles.map(async (file: File) => ({
          id: generateId(),
          melodyId: editingId,
          dataUrl: await fileToBase64(file),
          fileName: file.name,
        }))
      );
      setAllImages((prev: MelodyImage[]) => [...prev, ...newImages]);
      toast.success(`${newImages.length} imagen(es) guardada(s)`);
    } catch {
      toast.error('Error al procesar las imágenes');
    } finally {
      setUploadingImages(false);
    }
  }, [editingId, setAllImages]);

  const deleteImage = (id: string) => {
    setAllImages(prev => prev.filter(i => i.id !== id));
    toast.success('Imagen eliminada');
  };

  // Paste handler
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    if (!showForm) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      await handleFiles(imageFiles);
    }
  }, [showForm, handleFiles]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste as any);
    return () => document.removeEventListener('paste', handlePaste as any);
  }, [handlePaste]);

  // ─── Practice ───────────────────────────────────────────────────────────────

  const isCheckedToday = (melodyId: string) =>
    todayLogs.some(l => l.melodyId === melodyId);

  const togglePractice = (melodyId: string) => {
    const exists = practiceLogs.find(
      (l: MelodyPracticeLog) => l.melodyId === melodyId && l.date === today && l.instrument === practiceInstrument
    );
    if (exists) {
      setPracticeLogs((prev: MelodyPracticeLog[]) => prev.filter((l: MelodyPracticeLog) =>
        !(l.melodyId === melodyId && l.date === today && l.instrument === practiceInstrument)
      ));
    } else {
      setPracticeLogs((prev: MelodyPracticeLog[]) => [...prev, { melodyId, date: today, instrument: practiceInstrument }]);
    }
  };

  const saveSession = () => {
    if (todayLogs.length === 0) { toast.error('Marca al menos una melodía'); return; }
    const names = todayLogs
      .map(l => melodies.find(m => m.id === l.melodyId)?.name)
      .filter(Boolean).join(', ');
    const notesText = `Melodías (${todayLogs.length}): ${names}`;
    const duration = todayLogs.length * 5;

    const existingIdx = sessions.findIndex(
      (s: any) => s.date === today && s.instrument === practiceInstrument && s.categories.includes('melodias')
    );
    if (existingIdx >= 0) {
      setSessions((prev: any[]) => prev.map((s: any, i: number) =>
        i === existingIdx ? { ...s, durationMinutes: duration, notes: notesText } : s
      ));
    } else {
      setSessions((prev: any[]) => [...prev, {
        id: generateId(), date: today, instrument: practiceInstrument,
        durationMinutes: duration, categories: ['melodias'],
        notes: notesText, rating: 3, goal: '',
      }]);
    }
    toast.success(`¡Sesión guardada! ${todayLogs.length} melodía(s) en el historial`);
  };

  // ─── Image Viewer ────────────────────────────────────────────────────────────

  const openViewer = (melodyId: string, startIndex = 0) => {
    const imgs = allImages.filter(i => i.melodyId === melodyId);
    if (imgs.length === 0) return;
    setViewerImages(imgs);
    setViewerIndex(startIndex);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const totalChecked = todayLogs.length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">🎵 Melodías</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center">
            {melodies.length} melodías · {folders.length} carpetas
            <AppTooltip content="Total de canciones y melodías organizadas por carpetas.">
              <span className="ml-1 cursor-help opacity-50">ⓘ</span>
            </AppTooltip>
          </p>
        </div>
        <div className="flex gap-2">
          <AppTooltip content="Crear una nueva carpeta para organizar tus melodías.">
            <Button variant="outline" size="sm" onClick={() => { resetFolderForm(); setShowFolderForm(true); }}>
              <FolderPlus className="h-4 w-4 mr-1" /> Carpeta
            </Button>
          </AppTooltip>
          <AppTooltip content="Registrar una nueva melodía en tu biblioteca.">
            <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Melodía
            </Button>
          </AppTooltip>
        </div>
      </div>

      {/* Practice bar */}
      <div className="stat-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Practicar como:</span>
            <div className="flex gap-1">
              {(['piano', 'guitarra', 'ukelele'] as const).map(i => (
                <button key={i} onClick={() => setPracticeInstrument(i)}
                  className={`chip text-xs ${practiceInstrument === i ? 'chip-active' : ''}`}>
                  {i === 'piano' ? '🎹' : i === 'guitarra' ? '🎸' : '🪗'} {i}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono">
              {totalChecked} marcada{totalChecked !== 1 ? 's' : ''} hoy
            </span>
            <AppTooltip content="Guarda el progreso de hoy en el historial de práctica.">
              <Button size="sm" onClick={saveSession} disabled={totalChecked === 0}>
                <Save className="h-4 w-4 mr-1" /> Guardar Sesión
              </Button>
            </AppTooltip>
          </div>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar melodía..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 min-w-40"
        />
        {folders.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <button onClick={() => setFilterFolder('todos')}
              className={`chip text-xs ${filterFolder === 'todos' ? 'chip-active' : ''}`}>
              Todas
            </button>
            {folders.map(f => (
              <button key={f.id} onClick={() => setFilterFolder(f.id)}
                className={`chip text-xs ${filterFolder === f.id ? 'chip-active' : ''}`}
                style={filterFolder !== f.id ? { borderLeft: `3px solid ${f.color}` } : {}}>
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Melody list */}
      {melodies.length === 0 ? (
        <div className="stat-card py-16 text-center space-y-3">
          <Music2 className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No hay melodías todavía.</p>
          <p className="text-xs text-muted-foreground">Crea una carpeta y agrega tu primera melodía.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Grouped by folder */}
          {groupedMelodies.groups.map(({ folder, items }) => (
            <div key={folder.id}>
              <button
                onClick={() => setCollapsedFolders((prev: Set<string>) => {
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
                <AppTooltip content="Editar nombre o color de esta carpeta.">
                  <button
                    onClick={e => { e.stopPropagation(); openEditFolder(folder); }}
                    className="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
                  >
                    editar
                  </button>
                </AppTooltip>
              </button>
              {!collapsedFolders.has(folder.id) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ml-5">
                      {items.map((m: Melody) => (
                        <MelodyCard
                          key={m.id} melody={m}
                          images={allImages.filter((i: MelodyImage) => i.melodyId === m.id)}
                          isChecked={isCheckedToday(m.id)}
                          onToggle={() => togglePractice(m.id)}
                          onEdit={() => openEdit(m)}
                          onViewImages={() => openViewer(m.id)}
                          instruments={instruments}
                        />
                      ))}
                  {items.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-3 py-2">Sin melodías en esta carpeta</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Unfoldered */}
          {groupedMelodies.unfoldered.length > 0 && filterFolder === 'todos' && (
            <div>
              <p className="section-title text-base text-muted-foreground mb-3">Sin carpeta</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedMelodies.unfoldered.map((m: Melody) => (
                  <MelodyCard
                    key={m.id} melody={m}
                    images={allImages.filter((i: MelodyImage) => i.melodyId === m.id)}
                    isChecked={isCheckedToday(m.id)}
                    onToggle={() => togglePractice(m.id)}
                    onEdit={() => openEdit(m)}
                    onViewImages={() => openViewer(m.id)}
                    instruments={instruments}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Melody Form Dialog ─────────────────────────────────────────────── */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) resetForm(); }}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? 'Editar' : 'Nueva'} Melodía
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">

            {/* Name + folder */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Nombre *</label>
                <Input
                  value={mName}
                  onChange={e => setMName(e.target.value)}
                  placeholder="Nombre de la melodía"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Carpeta</label>
                <select value={mFolderId ?? ''} onChange={e => setMFolderId(e.target.value || null)}
                  className="w-full bg-secondary text-secondary-foreground rounded-md px-2 py-2 text-sm border border-border">
                  <option value="">Sin carpeta</option>
                  {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>

            {/* Instrument + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Instrumento</label>
                <div className="flex flex-wrap gap-1">
                  {instruments.map((i: InstrumentDef) => (
                    <button key={i.id} onClick={() => setMInstrument(i.id)}
                      className={`chip flex-1 justify-center text-xs ${mInstrument === i.id ? 'chip-active' : ''}`}>
                      {i.emoji} {i.name}
                    </button>
                  ))}
                  <button onClick={() => setMInstrument('ambos')}
                    className={`chip flex-1 justify-center text-xs ${mInstrument === 'ambos' ? 'chip-active' : ''}`}>
                    🎼 Ambos
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Estado</label>
                <select value={mStatus} onChange={e => setMStatus(e.target.value as MelodyStatus)}
                  className="w-full bg-secondary text-secondary-foreground rounded-md px-2 py-2 text-sm border border-border">
                  {(Object.keys(STATUS_CONFIG) as MelodyStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].emoji} {STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* BPM + Key + Time sig */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">BPM</label>
                <Input type="number" min={0} value={mBpm || ''}
                  onChange={e => setMBpm(parseInt(e.target.value) || 0)}
                  placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tonalidad</label>
                <div className="flex gap-1">
                  <Input value={mKey} onChange={e => setMKey(e.target.value)} placeholder="Dm" className="flex-1" />
                  <select value={mKey} onChange={e => setMKey(e.target.value)}
                    className="bg-secondary text-secondary-foreground rounded-md px-1 text-xs border border-border w-12">
                    <option value="">—</option>
                    {KEYS_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Compás</label>
                <Input value={mTimeSig} onChange={e => setMTimeSig(e.target.value)} placeholder="4/4" />
              </div>
            </div>

            {/* Description and Video */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Play className="h-3 w-3" /> Link del video (YouTube, TikTok...)
                </label>
                <div className="relative">
                  <Input value={mVideoUrl} onChange={e => setMVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..." className="pr-10" />
                  {mVideoUrl && (
                    <button 
                      onClick={() => setMVideoUrl('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Notas / Descripción</label>
                <Textarea value={mDesc} onChange={e => setMDesc(e.target.value)} rows={2}
                  placeholder="Estructura, acordes, secciones a repasar..." />
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-muted-foreground">Progreso</label>
                <span className="text-xs font-mono text-primary">{mProgress}%</span>
              </div>
              <input type="range" min={0} max={100} value={mProgress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMProgress(parseInt(e.target.value))}
                className="w-full accent-primary cursor-pointer" />
              <Progress value={mProgress} className="h-1.5 mt-1" />
            </div>

            {/* Images */}
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                <Image className="h-3 w-3" />
                Imágenes para repasar
                <span className="text-muted-foreground/60 ml-1">(máx. 2MB por imagen)</span>
              </label>

              {editingId ? (
                <>
                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-primary'); }}
                    onDragLeave={e => e.currentTarget.classList.remove('border-primary')}
                    onDrop={async e => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-primary');
                      if (e.dataTransfer.files.length) {
                        await handleFiles(Array.from(e.dataTransfer.files));
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-5 text-center transition-colors cursor-pointer hover:border-primary/50 hover:bg-primary/5"
                  >
                    {uploadingImages ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                        <span className="text-sm text-muted-foreground">Procesando...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Arrastra, haz clic, o pega con <kbd className="bg-secondary px-1 rounded text-xs">Ctrl+V</kbd>
                        </span>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) handleFiles(Array.from(e.target.files)); e.target.value = ''; }} />

                  {/* Image grid */}
                  {editingImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {editingImages.map((img, idx) => (
                        <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border aspect-square">
                          <img src={img.dataUrl} alt={img.fileName}
                            className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                            onClick={() => { setViewerImages(editingImages); setViewerIndex(idx); }} />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                          <AppTooltip content="Eliminar esta imagen">
                            <button
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); deleteImage(img.id); }}
                              className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </AppTooltip>
                          <AppTooltip content="Ampliar imagen">
                            <button
                              onClick={() => { setViewerImages(editingImages); setViewerIndex(idx); }}
                              className="absolute bottom-1.5 right-1.5 bg-background/80 text-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ZoomIn className="h-3 w-3" />
                            </button>
                          </AppTooltip>
                          <p className="absolute bottom-0 left-0 right-0 text-[9px] text-white bg-black/50 px-1 py-0.5 truncate">
                            {img.fileName}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic bg-secondary/30 rounded-lg p-3">
                  💡 Guarda la melodía primero y luego podrás subir imágenes editándola.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-2 border-t border-border">
              {editingId
                ? <Button variant="destructive" size="sm" onClick={deleteMelody}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                  </Button>
                : <div />}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
                <Button size="sm" onClick={saveMelody}>Guardar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Folder Form Dialog ──────────────────────────────────────────────── */}
      <Dialog open={showFolderForm} onOpenChange={open => { if (!open) resetFolderForm(); }}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingFolderId ? 'Editar' : 'Nueva'} Carpeta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Nombre</label>
              <Input value={fName} onChange={e => setFName(e.target.value)}
                placeholder="Ej: Worship, Himnos, Clásicos..." autoFocus />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {FOLDER_COLORS.map(c => (
                  <button key={c} onClick={() => setFColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${fColor === c ? 'scale-125 ring-2 ring-foreground ring-offset-2 ring-offset-background' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }} />
                ))}
                <input type="color" value={fColor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFColor(e.target.value)}
                  className="w-7 h-7 rounded-full cursor-pointer border border-border bg-transparent" />
              </div>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              {editingFolderId
                ? <Button variant="destructive" size="sm" onClick={() => deleteFolder(editingFolderId)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                  </Button>
                : <div />}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetFolderForm}>Cancelar</Button>
                <Button size="sm" onClick={saveFolder}>Guardar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Image Viewer ───────────────────────────────────────────────────── */}
      <Dialog open={viewerImages.length > 0} onOpenChange={open => { if (!open) setViewerImages([]); }}>
        <DialogContent className="bg-black/95 border-border max-w-5xl max-h-[95vh] p-0 overflow-hidden">
          <div className="relative w-full h-full flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/50">
              <span className="text-white text-xs font-mono">
                {viewerImages[viewerIndex]?.fileName}
              </span>
              <span className="text-white/60 text-xs">
                {viewerIndex + 1} / {viewerImages.length}
              </span>
            </div>
            {/* Image */}
            <div className="flex-1 flex items-center justify-center p-4 min-h-[60vh]">
              {viewerImages[viewerIndex] && (
                <img
                  src={viewerImages[viewerIndex].dataUrl}
                  alt={viewerImages[viewerIndex].fileName}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                />
              )}
            </div>
            {/* Navigation */}
            {viewerImages.length > 1 && (
              <div className="flex justify-center gap-4 pb-4">
                <Button variant="outline" size="sm"
                  onClick={() => setViewerIndex(i => (i - 1 + viewerImages.length) % viewerImages.length)}
                  className="bg-black/50 border-white/20 text-white hover:bg-white/20">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-1.5 items-center">
                  {viewerImages.map((_, i) => (
                    <button key={i} onClick={() => setViewerIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === viewerIndex ? 'bg-primary scale-125' : 'bg-white/40 hover:bg-white/70'}`}
                    />
                  ))}
                </div>
                <Button variant="outline" size="sm"
                  onClick={() => setViewerIndex(i => (i + 1) % viewerImages.length)}
                  className="bg-black/50 border-white/20 text-white hover:bg-white/20">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MelodyCard({ melody, images, isChecked, onToggle, onEdit, onViewImages, instruments }: {
  melody: Melody;
  images: MelodyImage[];
  isChecked: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onViewImages: () => void;
  instruments: InstrumentDef[];
}) {
  const { openFocusMode } = useFocusMode();
  const firstImage = images[0];
  const status = STATUS_CONFIG[melody.status];

  const getYouTubeId = (url: string) => {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&]+)/);
    return m ? m[1] : null;
  };

  return (
    <div className={`stat-card overflow-hidden transition-all flex flex-col ${isChecked ? 'border-primary/40 bg-primary/5' : ''} hover:shadow-[0_0_30px_-10px_rgba(255,255,255,0.1)]`}>
      {/* Media thumbnail */}
      {firstImage ? (
        <div className="relative -mx-4 -mt-4 mb-3 cursor-pointer group" onClick={onViewImages}>
          <img src={firstImage.dataUrl} alt={melody.name}
            className="w-full h-36 border-b border-white/5 object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
            <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 drop-shadow-xl" />
          </div>
          {images.length > 1 && (
            <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono border border-white/10">
              {images.length} fotos
            </span>
          )}
          {/* Status badge */}
          <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full border border-white/10">
            {status.emoji} {status.label}
          </span>
        </div>
      ) : melody.videoUrl && getYouTubeId(melody.videoUrl) ? (
        <div className="relative -mx-4 -mt-4 mb-3 cursor-pointer group" onClick={() => window.open(melody.videoUrl, '_blank')}>
          <img src={`https://img.youtube.com/vi/${getYouTubeId(melody.videoUrl!)}/mqdefault.jpg`} alt="Video"
            className="w-full h-36 border-b border-white/5 object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
             <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)] group-hover:scale-110 group-hover:bg-red-500 transition-all duration-300">
               <Play className="h-5 w-5 text-white fill-white ml-0.5" />
             </div>
          </div>
          <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full border border-white/10">
            {status.emoji} {status.label}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2 -mx-2">
          <span className={`text-[11px] font-medium ${status.color}`}>{status.emoji} {status.label}</span>
          <button onClick={onEdit}
            className="text-[10px] text-muted-foreground hover:text-primary transition-colors">
            + foto o video
          </button>
        </div>
      )}

      {/* Focus Mode Overlay Trigger */}
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          openFocusMode(
            { ...melody, title: melody.name, category: 'Melodía' } as any, 
            images as any
          ); 
        }}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/80 z-10"
        title="Modo Enfoque"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>

      {/* Content */}
      <div className="flex items-start gap-3 flex-1">
        {/* Check button */}
        <button onClick={e => { e.stopPropagation(); onToggle(); }}
          className={`mt-1 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${
            isChecked ? 'bg-primary border-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]' : 'border-muted-foreground/30 hover:border-primary/60'
          }`}>
          {isChecked && <Check className="h-3 w-3 text-primary-foreground stroke-[3px]" />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
          <h4 className={`font-semibold text-sm truncate transition-colors ${isChecked ? 'text-primary' : 'group-hover:text-primary'}`}>
            {melody.name}
          </h4>
          
          {melody.progress > 0 && (
            <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden my-2">
              <div className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-500" style={{ width: `${melody.progress}%` }} />
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <span className="opacity-80">
                {typeof melody.instrument === 'string' && melody.instrument !== 'ambos' 
                  ? (instruments.find((i: any) => i.id === melody.instrument)?.emoji || '🎼') 
                  : '🎼'}
              </span>
              <span>{melody.key || '—'}</span>
              <span className="opacity-40">·</span>
              <span>{melody.timeSignature || '—'}</span>
            </span>
            {melody.bpm > 0 && <span className="font-mono bg-secondary/50 px-1.5 rounded text-[10px]">{melody.bpm} BPM</span>}
          </div>

          {melody.description && (
            <p className="text-[11px] text-muted-foreground/60 mt-2 line-clamp-2 italic leading-relaxed">{melody.description}</p>
          )}

          {/* External video link */}
          {melody.videoUrl && (
            <div className="mt-4">
              <a href={melody.videoUrl} target="_blank" rel="noopener noreferrer"
                 className="premium-btn-glow w-full inline-flex items-center justify-center gap-2 text-[11px] font-bold text-red-500 bg-gradient-to-r from-red-500/10 to-red-500/20 border border-red-500/30 px-3 py-2 rounded-lg hover:from-red-500/20 hover:to-red-500/30 transition-all shadow-sm"
                 onClick={e => e.stopPropagation()}>
                <Play className="h-3 w-3 fill-current" /> Ver Tutorial
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
