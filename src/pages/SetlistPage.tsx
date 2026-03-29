import { useState, useEffect } from 'react';
import { useSongs, useSetlists } from '@/hooks/use-music-data';
import { getMonday, generateId } from '@/lib/music-utils';
import { type Song, type SongGenre } from '@/types/music';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ExternalLink, Play, X, CheckCircle } from 'lucide-react';
import { AppTooltip } from '@/components/AppTooltip';
import { useSessions } from '@/hooks/use-music-data';
import { useInstruments } from '@/hooks/use-instruments';
import { LoadingCard, LoadingGrid } from '@/components/ui/LoadingCard';

const GENRES: { value: SongGenre; label: string; emoji: string }[] = [
  { value: 'adoracion', label: 'Adoración', emoji: '🙏' },
  { value: 'alabanza', label: 'Alabanza', emoji: '🎉' },
  { value: 'himno', label: 'Himno', emoji: '📖' },
  { value: 'contemporaneo', label: 'Contemporáneo', emoji: '🎸' },
  { value: 'instrumental', label: 'Instrumental', emoji: '🎹' },
];

const INSTRUMENT_EMOJI = { piano: '🎹', guitarra: '🎸', ukelele: '🪗', ambos: '🎼' };
const KEYS_COMMON = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm'];

export default function SetlistPage() {
  const [songs = [], setSongs, isLoadingSongs] = useSongs();
  const [setlists = [], setSetlists, isLoadingSetlists] = useSetlists();
  const [sessions = [], setSessions, isLoadingSessions] = useSessions();
  const { instruments } = useInstruments();

  const isLoading = isLoadingSongs || isLoadingSetlists || isLoadingSessions;
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddSong, setShowAddSong] = useState(false);
  const [filterGenre, setFilterGenre] = useState<SongGenre | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Song form
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songKey, setSongKey] = useState('');
  const [songGenre, setSongGenre] = useState<SongGenre>('adoracion');
  const [songInstrument, setSongInstrument] = useState<'piano' | 'guitarra' | 'ambos'>('ambos');
  const [songNotes, setSongNotes] = useState('');
  const [songUrl, setSongUrl] = useState('');
  const [editingSongId, setEditingSongId] = useState<string | null>(null);

  // Calcular semana actual
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const mondayDate = getMonday(baseDate);
  const mondayStr = mondayDate.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);

  const weekLabel = `${mondayDate.toLocaleDateString('es-EC', {
    day: 'numeric', month: 'short', timeZone: 'America/Guayaquil',
  })} — ${sundayDate.toLocaleDateString('es-EC', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Guayaquil',
  })}`;

  const isCurrentWeek = weekOffset === 0;

  const currentSetlist = (setlists || []).find(s => s?.weekStart === mondayStr)
    ?? { weekStart: mondayStr, songIds: [], rehearsalNotes: '' };

  const setlistSongs = (currentSetlist?.songIds || [])
    .map(id => (songs || []).find(s => s?.id === id))
    .filter(Boolean) as Song[];

  // Bug fix: sincronizar rehearsalNotes cuando cambia la semana
  const [rehearsalNotes, setRehearsalNotes] = useState(currentSetlist.rehearsalNotes);
  useEffect(() => {
    setRehearsalNotes(currentSetlist.rehearsalNotes);
  }, [mondayStr]);  // eslint-disable-line react-hooks/exhaustive-deps

  const updateSetlist = (update: Partial<typeof currentSetlist>) => {
    const updated = { ...currentSetlist, ...update };
    setSetlists(prev => {
      const idx = prev.findIndex(s => s.weekStart === mondayStr);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
  };

  const addToSetlist = (songId: string) => {
    const listIds = currentSetlist.songIds || [];
    if (listIds.includes(songId)) {
      toast.error('Esta canción ya está en el setlist');
      return;
    }
    updateSetlist({ songIds: [...listIds, songId] });
    toast.success('Canción agregada al setlist');
  };

  const removeFromSetlist = (songId: string) => {
    updateSetlist({ songIds: (currentSetlist.songIds || []).filter(id => id !== songId) });
  };

  const moveInSetlist = (index: number, direction: -1 | 1) => {
    const listIds = currentSetlist.songIds || [];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= listIds.length) return;
    const ids = [...listIds];
    [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];
    updateSetlist({ songIds: ids });
  };

  const logSongPractice = (song: Song) => {
    const isPracticed = currentSetlist.practicedSongIds?.includes(song.id);
    
    // Toggle visual state in the setlist
    const newPracticedIds = isPracticed 
      ? (currentSetlist.practicedSongIds || []).filter(id => id !== song.id)
      : [...(currentSetlist.practicedSongIds || []), song.id];
    
    updateSetlist({ practicedSongIds: newPracticedIds });
    
    if (!isPracticed) {
      toast.success(`Marcada como repasado: ${song.title}`);
    } else {
      toast('Canción desmarcada');
    }
  };

  const saveSong = () => {
    if (!songTitle.trim()) { toast.error('El título es requerido'); return; }
    const song: Song = {
      id: editingSongId ?? generateId(),
      title: songTitle.trim(),
      artist: songArtist.trim(),
      key: songKey.trim(),
      genre: songGenre,
      instrument: songInstrument,
      notes: songNotes.trim(),
      reference_url: songUrl.trim(),
    };
    if (editingSongId) {
      setSongs(prev => prev.map(s => s.id === editingSongId ? song : s));
      toast.success('Canción actualizada');
    } else {
      setSongs(prev => [...prev, song]);
      toast.success('Canción agregada a la biblioteca');
    }
    resetSongForm();
  };

  const resetSongForm = () => {
    setShowAddSong(false);
    setEditingSongId(null);
    setSongTitle(''); setSongArtist(''); setSongKey('');
    setSongGenre('adoracion'); setSongInstrument('ambos');
    setSongNotes(''); setSongUrl('');
  };

  const editSong = (song: Song) => {
    setEditingSongId(song.id);
    setSongTitle(song.title);
    setSongArtist(song.artist);
    setSongKey(song.key);
    setSongGenre(song.genre);
    setSongInstrument(song.instrument);
    setSongNotes(song.notes);
    setSongUrl(song.reference_url);
    setShowAddSong(true);
  };

  const deleteSong = (id: string) => {
    setSongs(prev => prev.filter(s => s.id !== id));
    setSetlists(prev => prev.map(sl => ({ ...sl, songIds: (sl.songIds || []).filter(sid => sid !== id) })));
    resetSongForm();
    toast.success('Canción eliminada');
  };

  const filteredSongs = (songs || [])
    .filter(s => s && (filterGenre === 'todos' || s.genre === filterGenre))
    .filter(s => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (s?.title || '').toLowerCase().includes(q) || (s?.artist || '').toLowerCase().includes(q) || (s?.key || '').toLowerCase().includes(q);
    })
    .sort((a, b) => (a?.title || '').localeCompare(b?.title || '', 'es'));

  const getYouTubeId = (url: string) => {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&]+)/);
    return m ? m[1] : null;
  };
  if (isLoading) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">✝ Setlist Semanal</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center">
            {(songs || []).length} canciones en biblioteca
            <AppTooltip content="Total de canciones registradas en tu repertorio personal.">
              <span className="ml-1 cursor-help opacity-50">ⓘ</span>
            </AppTooltip>
          </p>
        </div>
        <AppTooltip content="Registrar una nueva canción en la biblioteca.">
          <Button size="sm" onClick={() => setShowAddSong(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Nueva canción
          </Button>
        </AppTooltip>
      </div>

      {/* Week navigator */}
      <div className="flex items-center justify-between stat-card py-2.5">
        <AppTooltip content="Semana anterior">
          <Button variant="ghost" size="icon" onClick={() => setWeekOffset(w => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </AppTooltip>
        <div className="text-center">
          <p className="font-mono text-sm">{weekLabel}</p>
          {isCurrentWeek && (
            <p className="text-[10px] text-primary font-medium">Semana actual</p>
          )}
        </div>
        <AppTooltip content="Siguiente semana">
          <Button variant="ghost" size="icon" onClick={() => setWeekOffset(w => w + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </AppTooltip>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Setlist */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title text-base">Setlist</h3>
            <span className="text-xs text-muted-foreground font-mono">
              {setlistSongs.length} canción{setlistSongs.length !== 1 ? 'es' : ''}
            </span>
          </div>
          {setlistSongs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Agrega canciones desde la biblioteca →
            </p>
          ) : (
            <div className="space-y-1.5">
              {setlistSongs.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 py-2 px-3 bg-secondary/30 rounded-md group">
                  <span className="font-mono text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{s?.title || 'Sin Título'}</p>
                      {currentSetlist?.practicedSongIds?.includes(s?.id) && (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/10" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {s?.artist || '—'}{s?.key ? ` · ${s.key}` : ''} · {INSTRUMENT_EMOJI[(s?.instrument || 'ambos') as keyof typeof INSTRUMENT_EMOJI] || '🎼'}
                    </p>
                  </div>
                  {s.referenceUrl && getYouTubeId(s.referenceUrl) ? (
                    <div className="relative w-12 h-8 rounded-sm overflow-hidden group/vid cursor-pointer shrink-0"
                      onClick={(e) => { e.stopPropagation(); window.open(s.referenceUrl, '_blank'); }}>
                      <img src={`https://img.youtube.com/vi/${getYouTubeId(s.referenceUrl!)}/default.jpg`}
                        className="w-full h-full object-cover transition-transform group-hover/vid:scale-110" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play className="h-3 w-3 text-white fill-white" />
                      </div>
                    </div>
                  ) : s.referenceUrl ? (
                    <a href={s.referenceUrl} target="_blank" rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary shrink-0"
                      onClick={e => e.stopPropagation()}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}

                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    <AppTooltip 
                      content={currentSetlist?.practicedSongIds?.includes(s?.id) ? 'Desmarcar' : 'Marcar como ensayada'} 
                      side="left"
                    >
                      <button 
                        onClick={() => logSongPractice(s)}
                        className={`transition-all duration-300 flex items-center justify-center p-1.5 rounded-full outline-none focus:ring-2 focus:ring-primary/50 ${
                          currentSetlist?.practicedSongIds?.includes(s?.id) 
                            ? 'bg-emerald-500/15 text-emerald-500 scale-105 shadow-[0_0_8px_rgba(16,185,129,0.2)]' 
                            : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-emerald-400'
                        }`}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    </AppTooltip>

                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <AppTooltip content="Subir posición" side="left">
                        <button onClick={() => moveInSetlist(i, -1)} disabled={i === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                          <ArrowUp className="h-3 w-3" />
                        </button>
                      </AppTooltip>
                      <AppTooltip content="Bajar posición" side="left">
                        <button onClick={() => moveInSetlist(i, 1)} disabled={i === setlistSongs.length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </AppTooltip>
                    </div>

                    <AppTooltip content="Quitar del setlist" side="left">
                      <button onClick={() => removeFromSetlist(s.id)}
                        className="text-muted-foreground hover:text-destructive text-lg shrink-0 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                        ×
                      </button>
                    </AppTooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rehearsal notes */}
        <div className="stat-card flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="section-title text-base">Notas de Ensayo</h3>
            <AppTooltip content="Guardar cambios en las notas de esta semana.">
              <Button size="sm" variant="ghost" className="text-xs"
                onClick={() => { updateSetlist({ rehearsalNotes }); toast.success('Notas guardadas'); }}>
                💾 Guardar
              </Button>
            </AppTooltip>
          </div>
          <Textarea
            value={rehearsalNotes}
            onChange={e => setRehearsalNotes(e.target.value)}
            rows={8}
            placeholder="Observaciones del ensayo, tonalidades a cambiar, partes a repasar..."
            className="flex-1 resize-none"
          />
        </div>
      </div>

      {/* Song library */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title text-base">📚 Biblioteca de Canciones</h3>
          <span className="text-xs text-muted-foreground">{filteredSongs.length} de {songs.length}</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Input
            placeholder="Buscar por título, artista o tonalidad..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 min-w-40"
          />
          <select
            value={filterGenre}
            onChange={e => setFilterGenre(e.target.value as any)}
            className="bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm border border-border"
          >
            <option value="todos">Todos los géneros</option>
            {GENRES.map(g => <option key={g.value} value={g.value}>{g.emoji} {g.label}</option>)}
          </select>
        </div>

        {filteredSongs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {songs.length === 0 ? 'Aún no hay canciones. ¡Agrega tu primera!' : 'No se encontraron canciones'}
          </p>
        ) : (
          <div className="space-y-1">
            {filteredSongs.map(s => {
              const inSetlist = (currentSetlist.songIds || []).includes(s.id);
              const genre = GENRES.find(g => g.value === s.genre);
              return (
                <div key={s.id}
                  className={`flex items-center justify-between py-2 px-3 rounded-md transition-colors ${
                    inSetlist ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/20 hover:bg-secondary/40'
                  }`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => editSong(s)}>
                    <span className="text-sm shrink-0">{genre?.emoji ?? '🎵'}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{s?.title || 'Sin Título'}</p>
                        {inSetlist && (
                          <span className="text-[10px] text-primary font-mono shrink-0">✓ en setlist</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {s?.artist || '—'} · {s?.key || '?'} · {INSTRUMENT_EMOJI[(s?.instrument || 'ambos') as keyof typeof INSTRUMENT_EMOJI] || '🎼'}
                      </p>
                    </div>
                  </div>
                  {s.referenceUrl && getYouTubeId(s.referenceUrl) && (
                    <div className="relative w-12 h-8 rounded-sm overflow-hidden group/vid cursor-pointer shrink-0 ml-2 shadow-sm border border-border/50"
                      onClick={(e) => { e.stopPropagation(); window.open(s.referenceUrl, '_blank'); }}>
                      <img src={`https://img.youtube.com/vi/${getYouTubeId(s.referenceUrl!)}/default.jpg`}
                        className="w-full h-full object-cover transition-transform group-hover/vid:scale-110" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover/vid:bg-black/50 transition-colors">
                        <Play className="h-4 w-4 text-white fill-white opacity-80 group-hover/vid:opacity-100 scale-75" />
                      </div>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant={inSetlist ? 'secondary' : 'ghost'}
                    className="shrink-0 text-xs"
                    onClick={() => inSetlist && s ? removeFromSetlist(s.id) : (s && addToSetlist(s.id))}
                  >
                    {inSetlist ? '− Quitar' : '+ Setlist'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Song dialog */}
      <Dialog open={showAddSong} onOpenChange={open => { if (!open) resetSongForm(); }}>
        <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingSongId ? 'Editar' : 'Nueva'} Canción
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Título *</label>
              <Input
                value={songTitle}
                onChange={e => setSongTitle(e.target.value)}
                placeholder="Nombre de la canción"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Artista / Autor</label>
                <Input value={songArtist} onChange={e => setSongArtist(e.target.value)} placeholder="Ej: Hillsong" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tonalidad</label>
                <div className="flex gap-1">
                  <Input
                    value={songKey}
                    onChange={e => setSongKey(e.target.value)}
                    placeholder="Ej: Am"
                    className="flex-1"
                  />
                  <select
                    value={songKey}
                    onChange={e => setSongKey(e.target.value)}
                    className="bg-secondary text-secondary-foreground rounded-md px-2 text-xs border border-border w-14"
                  >
                    <option value="">—</option>
                    {KEYS_COMMON.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Género</label>
                <select
                  value={songGenre}
                  onChange={e => setSongGenre(e.target.value as SongGenre)}
                  className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm border border-border"
                >
                  {GENRES.map(g => <option key={g.value} value={g.value}>{g.emoji} {g.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Instrumento</label>
                <div className="flex gap-1">
                  {(['piano', 'guitarra', 'ambos'] as const).map(inst => (
                    <button key={inst} onClick={() => setSongInstrument(inst)}
                      className={`chip flex-1 justify-center text-xs py-1 ${songInstrument === inst ? 'chip-active' : ''}`}>
                      {INSTRUMENT_EMOJI[inst as keyof typeof INSTRUMENT_EMOJI]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Notas / Acordes / Estructura</label>
              <Textarea
                value={songNotes}
                onChange={e => setSongNotes(e.target.value)}
                rows={3}
                placeholder="Progresión, intro, puente..."
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Enlace de referencia / Video</label>
              <div className="relative">
                <Input value={songUrl} onChange={e => setSongUrl(e.target.value)} placeholder="YouTube, Spotify, Drive, cualquier URL..." className="pr-10" />
                {songUrl && (
                  <button 
                    onClick={() => setSongUrl('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {songUrl && !songUrl.includes('youtu') && (
                <a href={songUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline truncate block mt-1">🔗 {songUrl}</a>
              )}
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              {editingSongId ? (
                <Button variant="destructive" size="sm" onClick={() => deleteSong(editingSongId)}>
                  🗑 Eliminar
                </Button>
              ) : <div />}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetSongForm}>Cancelar</Button>
                <Button size="sm" onClick={saveSong}>Guardar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
