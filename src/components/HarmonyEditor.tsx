import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Square, Trash2, Plus, X, ChevronUp, ChevronDown, Music, Check } from 'lucide-react';
import { toast } from 'sonner';

// ── Music Theory ─────────────────────────────────────────────────
const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_DISPLAY: Record<string, string> = {
  'C': 'C', 'C#': 'C#/Db', 'D': 'D', 'D#': 'D#/Eb', 'E': 'E',
  'F': 'F', 'F#': 'F#/Gb', 'G': 'G', 'G#': 'G#/Ab', 'A': 'A', 'A#': 'A#/Bb', 'B': 'B',
};
const CHORD_TYPES = [
  { s: '',     l: 'Mayor'  }, { s: 'm',    l: 'Menor'  },
  { s: '7',    l: 'Dom 7'  }, { s: 'maj7', l: 'Maj 7'  },
  { s: 'm7',   l: 'Min 7'  }, { s: 'sus2', l: 'Sus 2'  },
  { s: 'sus4', l: 'Sus 4'  }, { s: 'dim',  l: 'Dim'    },
  { s: 'dim7', l: 'Dim 7'  }, { s: 'aug',  l: 'Aug'    },
  { s: 'add9', l: 'Add 9'  }, { s: '9',    l: '9'      },
  { s: 'm9',   l: 'Min 9'  }, { s: '6',    l: '6'      },
  { s: 'm6',   l: 'Min 6'  }, { s: '11',   l: '11'     },
  { s: '13',   l: '13'     }, { s: 'b5',   l: 'b5'     },
];
const INTERVALS: Record<string, number[]> = {
  '': [0,4,7], 'm': [0,3,7], '7': [0,4,7,10], 'maj7': [0,4,7,11],
  'm7': [0,3,7,10], 'sus2': [0,2,7], 'sus4': [0,5,7],
  'dim': [0,3,6], 'dim7': [0,3,6,9], 'aug': [0,4,8],
  'add9': [0,4,7,14], '9': [0,4,7,10,14], 'm9': [0,3,7,10,14],
  '6': [0,4,7,9], 'm6': [0,3,7,9], '11': [0,4,7,10,14,17],
  '13': [0,4,7,10,14,21], 'b5': [0,4,6],
};
const BASE_HZ = [261.63,277.18,293.66,311.13,329.63,349.23,369.99,392,415.3,440,466.16,493.88];

function noteHz(idx: number, octave = 4) {
  return BASE_HZ[((idx % 12) + 12) % 12] * Math.pow(2, octave - 4);
}
function parseChord(chord: string) {
  const m = chord.match(/^([A-G][#b]?)(.*)/);
  if (!m) return null;
  const flat: Record<string,string> = { Db:'C#', Eb:'D#', Gb:'F#', Ab:'G#', Bb:'A#' };
  const root = flat[m[1]] ?? m[1];
  const rootIdx = CHROMATIC.indexOf(root);
  return rootIdx === -1 ? null : { rootIdx, type: m[2] };
}
function transposeChord(chord: string, semitones: number) {
  const p = parseChord(chord);
  if (!p) return chord;
  const newIdx = ((p.rootIdx + semitones) % 12 + 12) % 12;
  return CHROMATIC[newIdx] + p.type;
}
function playChordAudio(chord: string, ctx: AudioContext, t: number, dur: number) {
  const p = parseChord(chord);
  if (!p) return;
  const ivs = INTERVALS[p.type] ?? [0, 4, 7];
  ivs.slice(0, 4).forEach((iv, i) => {
    const ni = ((p.rootIdx + iv) % 12 + 12) % 12;
    const oct = i === 0 ? 3 : 4 + Math.floor((p.rootIdx + iv) / 12);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 2800;
    osc.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.value = noteHz(ni, oct);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.13, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.85);
    osc.start(t); osc.stop(t + dur);
  });
}

// ── Data Types ────────────────────────────────────────────────────
export interface HarmonyEditorData {
  chords: string[];
  bpm: number;
  musicalKey: string;
  description: string;
}

interface Props {
  open: boolean;
  harmonyId: string;
  harmonyName: string;
  data: HarmonyEditorData;
  onClose: () => void;
  onSave: (name: string, data: HarmonyEditorData) => void;
  onDelete: () => void;
}

// ── Chord Picker ─────────────────────────────────────────────────
function ChordPicker({ initial, onConfirm, onCancel }: {
  initial?: string;
  onConfirm: (chord: string) => void;
  onCancel: () => void;
}) {
  const parsed = initial ? parseChord(initial) : null;
  const [rootIdx, setRootIdx] = useState(parsed?.rootIdx ?? 0);
  const [type, setType]       = useState(parsed?.type ?? '');
  const chord = CHROMATIC[rootIdx] + type;
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a2e] p-4 space-y-4 shadow-2xl">
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Nota raíz</p>
      <div className="grid grid-cols-6 gap-1.5">
        {CHROMATIC.map((n, i) => (
          <button key={n} onClick={() => setRootIdx(i)}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              rootIdx === i
                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                : 'bg-white/5 hover:bg-white/10 text-foreground'
            }`}>
            {NOTE_DISPLAY[n] ?? n}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Tipo de acorde</p>
      <div className="grid grid-cols-6 gap-1.5">
        {CHORD_TYPES.map(ct => (
          <button key={ct.s} onClick={() => setType(ct.s)}
            className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              type === ct.s
                ? 'bg-amber-500/80 text-black shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-muted-foreground'
            }`}>
            {ct.l}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <div className="text-2xl font-bold text-primary tracking-wide">{chord}</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}><X className="h-3 w-3 mr-1"/>Cancel</Button>
          <Button size="sm" onClick={() => onConfirm(chord)}>
            <Check className="h-3 w-3 mr-1"/>Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Editor ───────────────────────────────────────────────────
export function HarmonyEditor({ open, harmonyId, harmonyName, data, onClose, onSave, onDelete }: Props) {
  const [name,        setName]        = useState(harmonyName);
  const [chords,      setChords]      = useState<string[]>(data.chords.length ? data.chords : []);
  const [bpm,         setBpm]         = useState(data.bpm || 80);
  const [musicalKey,  setMusicalKey]  = useState(data.musicalKey || 'C');
  const [description, setDescription] = useState(data.description || '');
  const [transposed,  setTransposed]  = useState(0); // semitones from original

  // Chord picker state
  const [pickerIdx, setPickerIdx] = useState<number | 'new' | null>(null);

  // Audio
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [playing,    setPlaying]    = useState(false);
  const stopRef      = useRef(false);

  // Sync when dialog reopens
  useEffect(() => {
    if (open) {
      setName(harmonyName);
      setChords(data.chords.length ? data.chords : []);
      setBpm(data.bpm || 80);
      setMusicalKey(data.musicalKey || 'C');
      setDescription(data.description || '');
      setTransposed(0);
      setPickerIdx(null);
    }
  }, [open, harmonyId]);

  // ── Transpose ──
  const doTranspose = (delta: number) => {
    setChords(prev => prev.map(c => transposeChord(c, delta)));
    setTransposed(prev => prev + delta);
    const newKey = transposeChord(musicalKey, delta);
    setMusicalKey(newKey);
  };

  // ── Playback ──
  const playAll = async () => {
    if (playing) { stopRef.current = true; return; }
    if (chords.length === 0) return;
    stopRef.current = false;
    setPlaying(true);
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();
    const secPerBeat = 60 / bpm;
    const now = ctx.currentTime + 0.05;
    chords.forEach((c, i) => playChordAudio(c, ctx, now + i * secPerBeat * 2, secPerBeat * 2));
    const total = chords.length * secPerBeat * 2 * 1000;
    setTimeout(() => { if (!stopRef.current) setPlaying(false); }, total);
  };
  const stopAll = () => { stopRef.current = true; setPlaying(false); };

  // ── Chord actions ──
  const addChord    = (chord: string) => { setChords(p => [...p, chord]); setPickerIdx(null); };
  const editChord   = (idx: number, chord: string) => { setChords(p => p.map((c, i) => i === idx ? chord : c)); setPickerIdx(null); };
  const removeChord = (idx: number) => { setChords(p => p.filter((_, i) => i !== idx)); setPickerIdx(null); };

  const handleSave = () => {
    if (!name.trim()) { toast.error('Escribe un nombre'); return; }
    onSave(name.trim(), { chords, bpm, musicalKey, description });
  };

  const handleDelete = () => {
    if (confirm(`¿Eliminar "${name}"?`)) { onDelete(); }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { stopAll(); onClose(); } }}>
      <DialogContent className="bg-[#0f0f1a] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-transparent">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Music className="h-5 w-5 text-amber-400" />
            Editor de Armonía
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">
          {/* ── Song info ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 block">Nombre de la canción *</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Maravillosa Gracia" className="bg-white/5 border-white/10" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 block">Artista / Nota</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Hillsong, clave de Sol..." className="bg-white/5 border-white/10" />
            </div>
          </div>

          {/* ── Key + BPM ── */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 block">Tonalidad</label>
              <select value={musicalKey} onChange={e => setMusicalKey(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-foreground">
                {CHROMATIC.flatMap(n => [
                  <option key={n+'maj'} value={n}>{n} Mayor</option>,
                  <option key={n+'min'} value={n+'m'}>{n}m Menor</option>,
                ])}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 block">BPM</label>
              <div className="flex items-center gap-2">
                <Input type="number" value={bpm} onChange={e => setBpm(Math.max(40, Math.min(240, +e.target.value)))}
                  className="w-20 bg-white/5 border-white/10" min={40} max={240} />
                <input type="range" min={40} max={240} value={bpm} onChange={e => setBpm(+e.target.value)}
                  className="w-28 accent-amber-500" />
              </div>
            </div>
          </div>

          {/* ── Transpose ── */}
          <div className="rounded-xl border border-white/10 bg-white/3 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-0.5">Transportar</p>
                <p className="text-xs text-muted-foreground">
                  {transposed === 0 ? 'Tonalidad original' : `${transposed > 0 ? '+' : ''}${transposed} semitonos`}
                  {' · Clave actual: '}<span className="text-primary font-bold">{musicalKey}</span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => doTranspose(-2)} title="-1 tono"
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono transition-colors">−2</button>
                <button onClick={() => doTranspose(-1)} title="-½ tono"
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-sm font-bold transition-colors">
                  <ChevronDown className="h-4 w-4" />
                </button>
                <span className="px-3 text-sm font-mono text-muted-foreground">{transposed > 0 ? '+' : ''}{transposed}</span>
                <button onClick={() => doTranspose(+1)} title="+½ tono"
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-green-500/20 hover:text-green-400 text-sm font-bold transition-colors">
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button onClick={() => doTranspose(+2)} title="+1 tono"
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono transition-colors">+2</button>
                <button onClick={() => { doTranspose(-transposed); setTransposed(0); }}
                  className="ml-2 px-2 py-1 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
                  reset
                </button>
              </div>
            </div>
          </div>

          {/* ── Chord Progression ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Progresión de Acordes</p>
              <span className="text-xs text-muted-foreground">{chords.length} acordes</span>
            </div>

            {/* Chord chips */}
            <div className="flex flex-wrap gap-2 mb-3 min-h-[48px] p-3 rounded-xl bg-black/20 border border-white/5">
              {chords.length === 0 && (
                <p className="text-xs text-muted-foreground italic self-center">Agrega acordes con el botón +</p>
              )}
              {chords.map((chord, idx) => (
                <div key={idx} className={`group relative flex items-center gap-1 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                  pickerIdx === idx
                    ? 'border-amber-500/60 bg-amber-500/15 shadow-lg shadow-amber-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                }`}
                  onClick={() => setPickerIdx(pickerIdx === idx ? null : idx)}>
                  <span className="text-base font-bold text-foreground">{chord}</span>
                  <button onClick={e => { e.stopPropagation(); removeChord(idx); }}
                    className="opacity-0 group-hover:opacity-100 ml-1 text-red-400 hover:text-red-300 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button onClick={() => setPickerIdx(pickerIdx === 'new' ? null : 'new')}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-dashed border-white/20 hover:border-amber-400/40 hover:bg-amber-400/5 text-muted-foreground hover:text-amber-400 transition-all text-sm">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Inline chord picker */}
            {pickerIdx !== null && (
              <ChordPicker
                initial={typeof pickerIdx === 'number' ? chords[pickerIdx] : undefined}
                onConfirm={chord => typeof pickerIdx === 'number' ? editChord(pickerIdx, chord) : addChord(chord)}
                onCancel={() => setPickerIdx(null)}
              />
            )}
          </div>

          {/* ── Playback ── */}
          <div className="rounded-xl border border-white/10 bg-gradient-to-r from-white/3 to-transparent p-4">
            <div className="flex items-center gap-4">
              <button onClick={playing ? stopAll : playAll} disabled={chords.length === 0}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  playing
                    ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                    : 'bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 disabled:opacity-30 disabled:cursor-not-allowed'
                }`}>
                {playing ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                {playing ? 'Detener' : 'Escuchar progresión'}
              </button>
              {playing && (
                <div className="flex gap-1">
                  {chords.map((_, i) => (
                    <div key={i} className="w-2 h-5 rounded-full bg-primary/30 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              )}
              {!playing && chords.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  ~{((chords.length * 2 * 60) / bpm).toFixed(1)}s a {bpm} BPM
                </p>
              )}
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-all">
              <Trash2 className="h-4 w-4" /> Eliminar
            </button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { stopAll(); onClose(); }}>Cancelar</Button>
              <Button size="sm" onClick={handleSave} className="bg-primary hover:bg-primary/90 font-semibold px-6">
                Guardar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
