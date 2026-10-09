import { useState, useMemo, useRef, useEffect } from 'react';
import { useSessions, useScaleLogs, useScales, useScaleFolders, useScaleImages } from '@/hooks/use-music-data';
import { generateId, getTodayEC, formatDate } from '@/lib/music-utils';
import { PREDEFINED_SCALES, SCALE_TYPE_OPTIONS, NOTES, NOTE_EN, SCALE_THEORY } from '@/lib/predefined-scales';
import type { Instrument, ScalePracticeLog } from '@/types/music';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Play, BookOpen, ListMusic, FolderPlus, Plus, ChevronDown, ChevronRight,
  Trash2, Pencil, Upload, X, Image as ImageIcon, BarChart3, Link2, ChevronUp,
  Sparkles, Calendar, CheckCircle2, History, RotateCcw, Flame, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProgressionBuilder } from '@/components/ProgressionBuilder';
import { LoadingCard, LoadingGrid } from '@/components/ui/LoadingCard';
import { ExerciseSection } from '@/components/ExerciseSection';
import type { InstrumentDef } from '@/types/music';
import { useInstruments } from '@/hooks/use-instruments';
import { ScalesEducation } from '@/components/ScalesEducation';
import { useLocalStorage } from '@/hooks/use-local-storage';

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
  const [dailyFilter, setDailyFilter] = useState<'todos' | 'hoy' | 'pendientes' | 'frecuentes'>('todos');
  const [currentTab, setCurrentTab] = useState<string>('practica');
  const { instruments } = useInstruments();
  const [search, setSearch] = useState('');

  // Video URL storage for ALL scales (predefined + custom)
  const [scaleVideos, setScaleVideos] = useLocalStorage<Record<string,string>>('kymusic_scale_videos', {});
  const [scaleProgressions, setScaleProgressions] = useLocalStorage<Record<string,string>>('kymusic_scale_progressions', {});
  const [playingScaleId, setPlayingScaleId] = useState<string | null>(null);

  const [editingVideoScale, setEditingVideoScale] = useState<{id: string, name: string} | null>(null);
  const [tempVideoUrls, setTempVideoUrls] = useState<string[]>(['']);
  const [tempProgressions, setTempProgressions] = useState<string[]>(['']);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [initialFoldersCollapsed, setInitialFoldersCollapsed] = useState(false);

  // Auto-collapse all folders on first load
  useEffect(() => {
    if (!initialFoldersCollapsed && folders.length > 0) {
      setCollapsedFolders(new Set(folders.map((f: any) => f.id)));
      setInitialFoldersCollapsed(true);
    }
  }, [folders, initialFoldersCollapsed]);

  const openVideoEdit = (e: React.MouseEvent, scale: any) => {
    e.stopPropagation(); e.preventDefault();
    setEditingVideoScale({ id: scale.id, name: scale.label });
    const parsedUrls = scale.video_url ? scale.video_url.split('\n') : [''];
    setTempVideoUrls(parsedUrls.length > 0 ? parsedUrls : ['']);
    const progStr = scaleProgressions[scale.id] || '';
    const parsedProgs = progStr ? progStr.split('\n') : [''];
    
    // Ensure tempProgressions has the same length as tempVideoUrls
    const progs = parsedUrls.map((_, i) => parsedProgs[i] || '');
    setTempProgressions(progs.length > 0 ? progs : ['']);
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
      // Zip each URL with its corresponding progression, then filter out empty URLs
      const pairs = tempVideoUrls.map((url, i) => ({ url, prog: tempProgressions[i] || '' }))
        .filter(p => p.url.trim() !== '');
      const finalUrlStr = pairs.map(p => p.url).join('\n');
      const finalProgStr = pairs.map(p => p.prog).join('\n');
      
      setScaleVideos((prev: Record<string,string>) => ({
        ...prev,
        [editingVideoScale.id]: finalUrlStr,
      }));
      setScaleProgressions((prev: Record<string,string>) => ({
        ...prev,
        [editingVideoScale.id]: finalProgStr,
      }));
      // Also update customScales if it's a custom one
      setCustomScales((prev: any[]) => prev.map((s: any) =>
        s.id === editingVideoScale.id ? { ...s, video_url: finalUrlStr } : s
      ));
      toast.success(finalUrlStr ? 'Videos guardados ✓' : 'Videos eliminados');
    }
    setEditingVideoScale(null);
    setTempProgressions(['']);
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

  // All scales combined (predefined + custom)
  const allScales = useMemo(() => {
    const mappedCustom = (customScales || []).map((s: any) => ({
      id: s.id,
      label: s.name,
      labelEN: s.name,
      scaleType: s.type || 'custom',
      note: 'C',
      noteEN: 'C',
      folder_id: s.folder_id,
      video_url: scaleVideos[s.id] || s.video_url || '',
    }));
    // Merge scaleVideos into predefined scales
    const mappedPredefined = PREDEFINED_SCALES.map(s => ({
      ...s,
      video_url: scaleVideos[s.id] || '',
    }));
    return [...mappedPredefined, ...mappedCustom];
  }, [customScales, scaleVideos]);

  // Statistics across all scale logs
  const { practiceCount, lastPracticed } = useMemo(() => {
    const counts: Record<string, number> = {};
    const lastDates: Record<string, string> = {};
    (scaleLogs || []).forEach((l: any) => {
      counts[l.scale_id] = (counts[l.scale_id] || 0) + 1;
      if (!lastDates[l.scale_id] || l.date > lastDates[l.scale_id]) {
        lastDates[l.scale_id] = l.date;
      }
    });
    return { practiceCount: counts, lastPracticed: lastDates };
  }, [scaleLogs]);

  const maxPractice = Math.max(1, ...Object.values(practiceCount));

  // Today checked for active instrument
  const todayChecked = useMemo(() => {
    const set = new Set<string>();
    (scaleLogs || [])
      .filter((l: any) => l.date === today && l.instrument === instrument)
      .forEach((l: any) => set.add(l.scale_id));
    return set;
  }, [scaleLogs, today, instrument]);

  // Helper for human-readable relative practice info
  const getRelativePracticeLabel = (scaleId: string, isCheckedToday: boolean) => {
    if (isCheckedToday) {
      return { label: 'Practicada hoy', isToday: true, badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    }
    const lastDate = lastPracticed[scaleId];
    if (!lastDate) {
      return { label: 'Sin practicar', isToday: false, badgeClass: 'text-muted-foreground/60 border-white/5 bg-white/5' };
    }
    if (lastDate === today) {
      return { label: 'Practicada hoy', isToday: true, badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    }
    const todayD = new Date(today + 'T12:00:00');
    const pastD = new Date(lastDate + 'T12:00:00');
    const diffDays = Math.round((todayD.getTime() - pastD.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      return { label: 'Ayer', isToday: false, badgeClass: 'bg-amber-400/10 text-amber-300 border-amber-400/20' };
    }
    if (diffDays <= 6) {
      return { label: `Hace ${diffDays} días`, isToday: false, badgeClass: 'text-muted-foreground/80 border-white/10 bg-white/5' };
    }
    if (diffDays <= 29) {
      return { label: `Hace ${Math.floor(diffDays / 7)} sem`, isToday: false, badgeClass: 'text-muted-foreground/70 border-white/5 bg-white/5' };
    }
    return { label: formatDate(lastDate), isToday: false, badgeClass: 'text-muted-foreground/70 border-white/5 bg-white/5' };
  };

  // Filtered scales
  const filtered = useMemo(() => {
    let result = allScales
      .filter((s: any) => filterType === 'todos' || s.scaleType === filterType)
      .filter((s: any) => filterNote === 'todos' || s.note === filterNote)
      .filter((s: any) => !search.trim() || s.label.toLowerCase().includes(search.toLowerCase()))
      .filter((s: any) => filterFolder === 'todos' || s.folder_id === filterFolder);

    if (dailyFilter === 'hoy') {
      result = result.filter((s: any) => todayChecked.has(s.id));
    } else if (dailyFilter === 'pendientes') {
      result = result.filter((s: any) => !todayChecked.has(s.id));
    } else if (dailyFilter === 'frecuentes') {
      result = [...result].sort((a: any, b: any) => (practiceCount[b.id] || 0) - (practiceCount[a.id] || 0));
    }
    return result;
  }, [filterType, filterNote, search, allScales, filterFolder, dailyFilter, todayChecked, practiceCount]);

  const groupedScales = useMemo(() => {
    const groups = (folders || []).map((f: any) => ({
      folder: f,
      items: filtered.filter((s: any) => s.folder_id === f.id),
    }));
    const unfoldered = filtered.filter((s: any) => !s.folder_id);
    return { groups, unfoldered };
  }, [folders, filtered]);

  // Today practiced scales list
  const todayPracticedScales = useMemo(() => {
    return allScales.filter((s: any) => todayChecked.has(s.id));
  }, [allScales, todayChecked]);

  // History grouped by date
  const logsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    (scaleLogs || []).forEach((l: any) => {
      const list = map.get(l.date) || [];
      list.push(l);
      map.set(l.date, list);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, logs]) => {
        const enhancedLogs = logs.map((l: any) => {
          const scaleObj = allScales.find((s: any) => s.id === l.scale_id);
          return {
            ...l,
            scale: scaleObj,
            label: scaleObj?.label || l.scale_id,
            theory: scaleObj ? SCALE_THEORY[scaleObj.scaleType] : null,
            video_url: scaleObj?.video_url || '',
          };
        });
        return {
          date,
          logs: enhancedLogs,
          count: logs.length,
          isToday: date === today,
        };
      });
  }, [scaleLogs, allScales, today]);

  const toggleScale = (scale_id: string) => {
    if (todayChecked.has(scale_id)) {
      setScaleLogs((prev: any[]) => prev.filter((l: any) =>
        !(l.scale_id === scale_id && l.date === today && l.instrument === instrument)
      ));
    } else {
      const log: ScalePracticeLog = {
        id: generateId(),
        scale_id,
        date: today,
        instrument,
        created_at: new Date().toISOString(),
      };
      setScaleLogs((prev: any[]) => [...prev, log]);
    }
  };

  const toggleAll = () => {
    const allChecked = filtered.length > 0 && filtered.every((s: any) => todayChecked.has(s.id));
    if (allChecked) {
      setScaleLogs((prev: any[]) => prev.filter((l: any) =>
        !(filtered.some((s: any) => s.id === l.scale_id) && l.date === today && l.instrument === instrument)
      ));
    } else {
      const newLogs: ScalePracticeLog[] = filtered
        .filter((s: any) => !todayChecked.has(s.id))
        .map((s: any) => ({
          id: generateId(),
          scale_id: s.id,
          date: today,
          instrument,
          created_at: new Date().toISOString(),
        }));
      setScaleLogs((prev: any[]) => [...prev, ...newLogs]);
    }
  };

  const saveSession = () => {
    const checkedToday = (scaleLogs || []).filter((l: any) => l.date === today && l.instrument === instrument);
    if (checkedToday.length === 0) {
      toast.error('Marca al menos una escala antes de guardar la sesión');
      return;
    }
    const scaleNames = checkedToday
      .map((l: any) => allScales.find((s: any) => s.id === l.scale_id)?.label)
      .filter(Boolean).join(', ');
    const notesText = `Escalas (${checkedToday.length}): ${scaleNames}`;

    // Buscar si ya existe una sesión para hoy (ej. la registrada con el cronómetro principal)
    const existingSession = (sessions || []).find((s: any) =>
      s.date === today && (s.instrument === instrument || !s.instrument)
    );

    if (existingSession) {
      // Vinculamos las escalas a la sesión existente SIN alterar su duración real
      const existingCategories = existingSession.categories || [];
      const updatedCategories = Array.from(new Set([...existingCategories, 'escalas' as const]));

      let updatedNotes = existingSession.notes || '';
      if (!updatedNotes) {
        updatedNotes = notesText;
      } else if (updatedNotes.includes('Escalas (')) {
        updatedNotes = updatedNotes.replace(/Escalas \(\d+\): [^\n]+/, notesText);
      } else {
        updatedNotes = `${updatedNotes}\n${notesText}`;
      }

      setSessions((prev: any[]) => prev.map((s: any) =>
        s.id === existingSession.id
          ? {
              ...s,
              categories: updatedCategories,
              notes: updatedNotes,
            }
          : s
      ));
      toast.success(`¡Vinculado a tu sesión de hoy (${existingSession.durationMinutes} min)!`);
    } else {
      // Si no hay sesión previa del cronómetro, registramos con 0 minutos para no inflar las estadísticas
      setSessions((prev: any[]) => [...prev, {
        id: generateId(),
        date: today,
        instrument,
        durationMinutes: 0,
        categories: ['escalas' as const],
        notes: notesText,
        rating: 4,
        goal: 'Práctica diaria de escalas',
      }]);
      toast.success(`¡Escalas registradas! Se asociarán a tu tiempo del cronómetro.`);
    }
  };

  const deleteLog = (logId?: string, scaleId?: string, date?: string, inst?: string) => {
    setScaleLogs((prev: any[]) => prev.filter((l: any) => {
      if (logId && l.id) return l.id !== logId;
      return !(l.scale_id === scaleId && l.date === date && l.instrument === inst);
    }));
    toast.success('Registro de escala eliminado');
  };

  const checkedCount = todayChecked.size;
  const allFilteredChecked = filtered.length > 0 && filtered.every((s: any) => todayChecked.has(s.id));
  const totalPracticed = Object.keys(practiceCount).length;

  const renderScaleCard = (scale: any) => {
    const checked = todayChecked.has(scale.id);
    const count = practiceCount[scale.id] ?? 0;
    const progressPct = Math.min(100, (count / maxPractice) * 100);
    const theory = SCALE_THEORY[scale.scaleType];
    const displayLabel = scale.label;
    const urls = scale.video_url ? scale.video_url.split('\n').filter(Boolean) : [];
    const progressionStr = scaleProgressions[scale.id] || '';
    const progressions = progressionStr ? progressionStr.split('\n') : [];
    const hasVideo = urls.length > 0 || !!progressionStr;
    const isPlaying = playingScaleId === scale.id;
    const relPractice = getRelativePracticeLabel(scale.id, checked);

    return (
      <div
        key={scale.id}
        className={`stat-card transition-all duration-300 relative ${
          checked
            ? 'border-amber-400/50 bg-gradient-to-br from-amber-500/15 via-primary/10 to-card/90 shadow-[0_4px_22px_rgba(245,158,11,0.16)] ring-1 ring-amber-400/35'
            : 'border-white/5 bg-white/5 hover:border-white/15 hover:bg-white/[0.07]'
        }`}
      >
        {/* Main row */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <Checkbox
            checked={checked}
            onCheckedChange={() => toggleScale(scale.id)}
            className={`border-white/25 mt-0.5 transition-transform duration-200 ${
              checked
                ? 'bg-amber-400 border-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.5)] scale-110'
                : 'hover:border-primary'
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-sm font-semibold truncate block ${checked ? 'text-amber-300 drop-shadow-sm font-bold' : 'text-foreground'}`}>
                    {displayLabel}
                  </span>
                  {checked && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-in fade-in zoom-in-95 duration-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Hoy
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {theory && (
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block"
                      style={{ background: theory.color + '22', color: theory.color }}
                    >
                      {theory.label}
                    </span>
                  )}

                  {!checked && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${relPractice.badgeClass}`}>
                      {relPractice.label}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border transition-colors ${
                      checked
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                        : 'bg-white/5 text-muted-foreground border-white/10'
                    }`}
                    title={`Practicada ${count} veces en total`}
                  >
                    {count}×
                  </span>
                )}
                {allImages.some((img: any) => img.scale_id === scale.id) && (
                  <ImageIcon className="h-3 w-3 text-primary/60" />
                )}

                {/* Play button: red when has URL, shows player inline */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (hasVideo) setPlayingScaleId(isPlaying ? null : scale.id);
                    else openVideoEdit(e, scale);
                  }}
                  className={`p-0.5 rounded transition-all ${
                    hasVideo
                      ? isPlaying
                        ? 'text-red-400 scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                        : 'text-red-500 hover:text-red-400 hover:scale-110'
                      : 'text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-muted-foreground'
                  }`}
                  title={hasVideo ? (isPlaying ? 'Cerrar videos' : 'Ver videos') : 'Agregar video'}
                >
                  <Play className="h-3.5 w-3.5" fill={hasVideo ? 'currentColor' : 'none'} />
                </button>

                {/* Edit video link (only when has URL) */}
                {hasVideo && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      openVideoEdit(e, scale);
                    }}
                    className="p-0.5 rounded text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-primary transition-all relative"
                    title="Editar enlaces de video"
                  >
                    <Link2 className="h-3 w-3" />
                    {urls.length > 1 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-[8px] text-white w-3 h-3 flex items-center justify-center rounded-full font-bold">
                        {urls.length}
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openEditScale(scale);
                  }}
                  className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity p-0.5"
                  title="Organizar o añadir imágenes"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-2.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  checked ? 'shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''
                }`}
                style={{
                  width: `${progressPct}%`,
                  background: checked ? 'linear-gradient(90deg, #f59e0b, #4ade80)' : (theory?.color ?? 'hsl(var(--primary))'),
                }}
              />
            </div>
          </div>
        </label>

        {/* Inline video player */}
        {isPlaying && hasVideo && (
          <div className="mt-3 flex flex-col gap-4 animate-in fade-in duration-200">
            {urls.map((url: string, idx: number) => {
              const ytId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&]+)/)?.[1] ?? null;
              const prog = progressions[idx];
              return (
                <div key={idx} className="flex flex-col rounded-lg border border-white/10 bg-black overflow-hidden shadow-2xl">
                  {ytId ? (
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}${urls.length === 1 ? '?autoplay=1' : ''}`}
                        className="absolute inset-0 w-full h-full border-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-4 text-sm text-primary hover:bg-primary/10 transition-colors bg-secondary/30"
                    >
                      <Play className="h-4 w-4" /> Abrir enlace {urls.length > 1 ? idx + 1 : ''}
                    </a>
                  )}
                  {prog && prog.trim() !== '' && (
                    <div className="p-3 bg-primary/5 border-t border-white/10">
                      <p className="text-[10px] text-primary/80 uppercase tracking-widest mb-1 font-bold">Progresión / Notas</p>
                      <p className="font-mono text-base text-foreground/90 font-semibold">{prog}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
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
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="page-title">🎼 Escalas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="text-amber-400 font-semibold">{totalPracticed}</span> de {PREDEFINED_SCALES.length} escalas practicadas ({Math.round((totalPracticed / (PREDEFINED_SCALES.length || 1)) * 100)}% de dominio) · <span className="text-emerald-400 font-semibold">{checkedCount}</span> hoy
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <TabsList className="glass-panel p-1">
              <TabsTrigger value="practica" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2">
                <ListMusic className="h-4 w-4" /> Práctica
              </TabsTrigger>
              <TabsTrigger value="registro" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Registro Diario
                {checkedCount > 0 && (
                  <span className="ml-1 bg-amber-400 text-black text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {checkedCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="educacion" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Progreso
              </TabsTrigger>
              <TabsTrigger value="ejercicios" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Ejercicios
              </TabsTrigger>
            </TabsList>
            <button onClick={() => { resetFolderForm(); setShowFolderForm(true); }} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground" title="Nueva carpeta"><FolderPlus className="h-4 w-4" /></button>
            <button onClick={() => { resetScaleForm(); setShowScaleForm(true); }} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground" title="Nueva escala"><Plus className="h-4 w-4" /></button>
            <button onClick={saveSession} disabled={checkedCount === 0} className="premium-btn-glow px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Guardar Sesión {checkedCount > 0 ? `(${checkedCount})` : ''}
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
            <Input placeholder="Buscar escala..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="w-40 flex-1 glass-panel border-white/5" />
            <select value={filterNote} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterNote(e.target.value)} className="glass-panel text-secondary-foreground rounded-md px-3 py-1.5 text-sm border-white/5">
              <option value="todos">Todas las notas</option>
              {NOTES.map((n: string) => <option key={n} value={n}>{NOTE_EN[n] ?? n}</option>)}
            </select>
            <select value={filterType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value)} className="glass-panel text-secondary-foreground rounded-md px-3 py-1.5 text-sm border-white/5">
              <option value="todos">Todos los tipos</option>
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

          {/* Daily Practice Command Center */}
          <div className="stat-card border-primary/25 bg-gradient-to-r from-card/95 via-card/80 to-primary/10 p-4 sm:p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-medium text-amber-300/90 uppercase tracking-wider">
                    Práctica Diaria · {formatDate(today)}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 mt-0.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Registro de Escalas de Hoy
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-mono text-2xl font-black text-amber-300 leading-none">
                    {checkedCount}
                    <span className="text-xs text-muted-foreground font-normal ml-1">/ {filtered.length}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {filtered.length > 0 ? Math.round((checkedCount / filtered.length) * 100) : 0}% completado hoy
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={saveSession}
                  disabled={checkedCount === 0}
                  className="premium-btn-glow bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-lg text-xs"
                >
                  Guardar Sesión {checkedCount > 0 ? `(${checkedCount})` : ''}
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1 mb-4">
              <Progress
                value={filtered.length > 0 ? (checkedCount / filtered.length) * 100 : 0}
                className="h-2.5 bg-white/10"
              />
            </div>

            {/* Filter chips & toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-muted-foreground mr-1">Filtrar:</span>
                <button
                  onClick={() => setDailyFilter('todos')}
                  className={`chip text-xs py-1 px-2.5 ${dailyFilter === 'todos' ? 'chip-active' : ''}`}
                >
                  Todas ({allScales.length})
                </button>
                <button
                  onClick={() => setDailyFilter('hoy')}
                  className={`chip text-xs py-1 px-2.5 flex items-center gap-1 ${
                    dailyFilter === 'hoy' ? 'chip-active' : ''
                  }`}
                >
                  <span className="text-amber-400">✨</span> Practicadas hoy ({checkedCount})
                </button>
                <button
                  onClick={() => setDailyFilter('pendientes')}
                  className={`chip text-xs py-1 px-2.5 ${dailyFilter === 'pendientes' ? 'chip-active' : ''}`}
                >
                  ⏳ Pendientes ({Math.max(0, allScales.length - checkedCount)})
                </button>
                <button
                  onClick={() => setDailyFilter('frecuentes')}
                  className={`chip text-xs py-1 px-2.5 flex items-center gap-1 ${
                    dailyFilter === 'frecuentes' ? 'chip-active' : ''
                  }`}
                >
                  <Flame className="h-3 w-3 text-orange-400" /> Más estudiadas
                </button>
              </div>

              {filtered.length > 0 && (
                <button
                  onClick={toggleAll}
                  className="text-xs text-amber-300/80 hover:text-amber-300 hover:underline flex items-center gap-1 ml-auto"
                >
                  {allFilteredChecked ? (
                    <>
                      <RotateCcw className="h-3 w-3" /> Desmarcar todas
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> Marcar todas las filtradas
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Today's Practiced Scales Strip */}
            {todayPracticedScales.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-amber-300/80">
                    Escalas registradas hoy ({todayPracticedScales.length}):
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-0.5">
                  {todayPracticedScales.map((s: any) => {
                    const sTheory = SCALE_THEORY[s.scaleType];
                    const sUrls = s.video_url ? s.video_url.split('\n').filter(Boolean) : [];
                    return (
                      <div
                        key={s.id}
                        className="inline-flex items-center gap-1.5 bg-card/90 border border-amber-400/30 rounded-lg px-2 py-1 text-xs shadow-sm hover:border-amber-400/60 transition-colors"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: sTheory?.color || 'hsl(var(--primary))' }}
                        />
                        <span className="font-semibold text-foreground/90">{s.label}</span>
                        {sUrls.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlayingScaleId(playingScaleId === s.id ? null : s.id);
                            }}
                            className="text-red-400 hover:text-red-300 p-0.5 ml-0.5"
                            title="Ver video tutorial"
                          >
                            <Play className="h-2.5 w-2.5" fill="currentColor" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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

        {/* Tab: Registro Diario Histórico */}
        <TabsContent value="registro" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Summary KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="stat-card text-center py-4">
              <span className="text-2xl mb-1 block">📅</span>
              <p className="font-mono text-2xl sm:text-3xl font-extrabold text-amber-300">{logsByDate.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Días con práctica</p>
            </div>
            <div className="stat-card text-center py-4">
              <span className="text-2xl mb-1 block">✨</span>
              <p className="font-mono text-2xl sm:text-3xl font-extrabold text-amber-300">{checkedCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Estudiadas hoy</p>
            </div>
            <div className="stat-card text-center py-4">
              <span className="text-2xl mb-1 block">🎼</span>
              <p className="font-mono text-2xl sm:text-3xl font-extrabold text-amber-300">{totalPracticed}</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Escalas practicadas</p>
            </div>
            <div className="stat-card text-center py-4">
              <span className="text-2xl mb-1 block">⚡</span>
              <p className="font-mono text-2xl sm:text-3xl font-extrabold text-amber-300">{(scaleLogs || []).length}</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Registros totales</p>
            </div>
          </div>

          {/* History timeline list */}
          {logsByDate.length === 0 ? (
            <div className="stat-card py-16 text-center border-dashed border-white/10 opacity-70">
              <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <h3 className="text-base font-semibold text-foreground">Aún no hay registros de escalas</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Marca las escalas en la pestaña "Práctica" conforme las vayas estudiando cada día para construir tu historial diario.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="section-title text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Historial Cronológico de Escalas Estudiadas
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {logsByDate.length} {logsByDate.length === 1 ? 'día registrado' : 'días registrados'}
                </span>
              </div>

              <div className="space-y-4">
                {logsByDate.map(({ date, logs, count, isToday }) => {
                  return (
                    <div
                      key={date}
                      className={`stat-card p-4 transition-all duration-300 ${
                        isToday
                          ? 'border-amber-400/40 bg-gradient-to-r from-card via-card to-amber-500/10 shadow-lg ring-1 ring-amber-400/30'
                          : 'border-white/5 bg-white/5'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Calendar className={`h-4 w-4 ${isToday ? 'text-amber-400' : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-bold ${isToday ? 'text-amber-300' : 'text-foreground'}`}>
                            {isToday ? `Hoy · ${formatDate(date)}` : formatDate(date)}
                          </span>
                          {isToday && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Sesión activa
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white/10 text-foreground/80">
                            {count} {count === 1 ? 'escala estudiada' : 'escalas estudiadas'}
                          </span>
                        </div>
                      </div>

                      {/* Grid of scales practiced that day */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3">
                        {logs.map((item: any, idx: number) => {
                          const theory = item.theory;
                          const instDef = instruments.find((i: InstrumentDef) => i.id === item.instrument);
                          const urls = item.video_url ? item.video_url.split('\n').filter(Boolean) : [];
                          const hasVid = urls.length > 0;
                          const isItemPlaying = playingScaleId === `${date}-${item.scale_id}`;

                          return (
                            <div
                              key={item.id || idx}
                              className="p-3 rounded-lg border border-white/10 bg-black/30 hover:border-white/20 transition-all flex flex-col justify-between gap-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground/95 truncate">
                                    {item.label}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {theory && (
                                      <span
                                        className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                                        style={{ background: theory.color + '22', color: theory.color }}
                                      >
                                        {theory.label}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                                      {instDef?.emoji || '🎼'} {instDef?.name || item.instrument}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {hasVid && (
                                    <button
                                      onClick={() => {
                                        setPlayingScaleId(isItemPlaying ? null : `${date}-${item.scale_id}`);
                                      }}
                                      className={`p-1 rounded transition-colors ${
                                        isItemPlaying ? 'text-red-400' : 'text-red-500 hover:text-red-400'
                                      }`}
                                      title={isItemPlaying ? 'Ocultar video' : 'Ver video tutorial'}
                                    >
                                      <Play className="h-3.5 w-3.5" fill="currentColor" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteLog(item.id, item.scale_id, item.date, item.instrument)}
                                    className="p-1 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    title="Eliminar este registro"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Inline video player for the log */}
                              {isItemPlaying && hasVid && (
                                <div className="mt-2 rounded overflow-hidden border border-white/10 animate-in fade-in duration-200">
                                  {urls[0].match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&]+)/)?.[1] ? (
                                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                      <iframe
                                        src={`https://www.youtube.com/embed/${
                                          urls[0].match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&]+)/)?.[1]
                                        }?autoplay=1`}
                                        className="absolute inset-0 w-full h-full border-none"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      />
                                    </div>
                                  ) : (
                                    <a
                                      href={urls[0]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block p-2 text-xs text-primary bg-secondary/30 text-center"
                                    >
                                      Abrir enlace de video ↗
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="educacion" className="mt-0 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ScalesEducation
            scaleLogs={scaleLogs}
            allScales={allScales}
            practiceCount={practiceCount}
            lastPracticed={lastPracticed}
            todayChecked={todayChecked}
            scaleVideos={scaleVideos}
            scaleProgressions={scaleProgressions}
            today={today}
            instrument={instrument}
            onToggleScale={toggleScale}
            onGoToPracticeTab={(scaleName?: string) => {
              setCurrentTab('practica');
              if (scaleName) {
                setSearch(scaleName);
                setDailyFilter('todos');
              }
            }}
          />
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
              <label className="text-xs text-muted-foreground mb-2 block">Enlaces (YouTube, Spotify, Drive...)</label>
              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
                {tempVideoUrls.map((url, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragIndex === null || dragIndex === i) return;
                      const newUrls = [...tempVideoUrls];
                      const newProgs = [...tempProgressions];
                      const [movedUrl] = newUrls.splice(dragIndex, 1);
                      const [movedProg] = newProgs.splice(dragIndex, 1);
                      newUrls.splice(i, 0, movedUrl);
                      newProgs.splice(i, 0, movedProg);
                      setTempVideoUrls(newUrls);
                      setTempProgressions(newProgs);
                      setDragIndex(null);
                    }}
                    onDragEnd={() => setDragIndex(null)}
                    className={`flex flex-col gap-2 p-3 bg-white/5 rounded-lg border border-white/5 relative cursor-default transition-opacity ${
                      dragIndex === i ? 'opacity-40 border-primary/50' : ''
                    }`}
                  >
                    <div className="flex gap-2 items-center">
                      <span
                        className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground px-1 select-none"
                        title="Arrastrar para reordenar"
                      >
                        ⠿
                      </span>
                      <Input value={url} onChange={(e) => {
                        const newUrls = [...tempVideoUrls];
                        newUrls[i] = e.target.value;
                        setTempVideoUrls(newUrls);
                      }} placeholder="Enlace (YouTube, Spotify...)" className="flex-1" />
                      {tempVideoUrls.length > 1 && (
                        <Button variant="outline" size="icon" onClick={() => {
                          setTempVideoUrls(tempVideoUrls.filter((_, idx) => idx !== i));
                          setTempProgressions(tempProgressions.filter((_, idx) => idx !== i));
                        }} className="shrink-0 text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <ProgressionBuilder 
                      value={tempProgressions[i] || ''} 
                      onChange={(val) => {
                        const newProgs = [...tempProgressions];
                        newProgs[i] = val;
                        setTempProgressions(newProgs);
                      }} 
                    />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => {
                  setTempVideoUrls([...tempVideoUrls, '']);
                  setTempProgressions([...tempProgressions, '']);
                }} className="w-full text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Añadir otro video
                </Button>
              </div>
            </div>

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
