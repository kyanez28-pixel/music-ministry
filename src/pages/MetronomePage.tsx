import { useState, useEffect, useRef, useCallback } from 'react';
import { Minus, Plus, Play, Square, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { MetronomeEngine } from '@/lib/metronome-engine';

// ─── BPM Presets ─────────────────────────────────────────────────────────────

const BPM_PRESETS = [
  { label: 'Largo',      bpm: 50,  color: 'text-blue-400' },
  { label: 'Adagio',     bpm: 70,  color: 'text-cyan-400' },
  { label: 'Andante',    bpm: 85,  color: 'text-green-400' },
  { label: 'Moderato',   bpm: 100, color: 'text-yellow-400' },
  { label: 'Allegro',    bpm: 130, color: 'text-orange-400' },
  { label: 'Presto',     bpm: 168, color: 'text-red-400' },
];

const TIME_SIGNATURES = [
  { beats: 2, label: '2/4' },
  { beats: 3, label: '3/4' },
  { beats: 4, label: '4/4' },
  { beats: 6, label: '6/8' },
];

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MetronomePage() {
  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  const engineRef = useRef(new MetronomeEngine());
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Control de reproducción ─────────────────────────────────────────────

  const startMetronome = useCallback((bpmVal: number, beats: number) => {
    engineRef.current.start(bpmVal, beats, (beat: number) => {
      setCurrentBeat(beat);
    });
  }, []);

  const stopMetronome = useCallback(() => {
    engineRef.current.stop();
    setCurrentBeat(-1);
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      stopMetronome();
      setIsPlaying(false);
    } else {
      startMetronome(bpm, beatsPerMeasure);
      setIsPlaying(true);
    }
  };

  // Actualizar BPM mientras suena
  useEffect(() => {
    if (isPlaying) engineRef.current.updateBpm(bpm);
  }, [bpm, isPlaying]);

  // Actualizar compás mientras suena
  useEffect(() => {
    if (isPlaying) engineRef.current.updateBeats(beatsPerMeasure);
  }, [beatsPerMeasure, isPlaying]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => { engineRef.current.stop(); };
  }, []);

  // ─── Cambio de BPM ───────────────────────────────────────────────────────

  const changeBpm = (delta: number) => {
    setBpm(prev => Math.min(250, Math.max(20, prev + delta)));
  };

  const startHold = (delta: number) => {
    changeBpm(delta);
    holdIntervalRef.current = setInterval(() => changeBpm(delta), 120);
  };

  const stopHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  // ─── Tap Tempo ────────────────────────────────────────────────────────────

  const handleTap = () => {
    const now = Date.now();
    setTapTimes(prev => {
      const recent = [...prev, now].filter(t => now - t < 3000).slice(-6);
      if (recent.length >= 2) {
        const intervals = recent.slice(1).map((t, i) => t - recent[i]);
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const newBpm = Math.round(60000 / avg);
        const clamped = Math.min(250, Math.max(20, newBpm));
        setBpm(clamped);
      }
      return recent;
    });
  };

  // ─── Tempo label ─────────────────────────────────────────────────────────

  const getTempoLabel = () => {
    if (bpm < 60)  return { label: 'Largo',    color: 'text-blue-400' };
    if (bpm < 80)  return { label: 'Adagio',   color: 'text-cyan-400' };
    if (bpm < 100) return { label: 'Andante',  color: 'text-green-400' };
    if (bpm < 120) return { label: 'Moderato', color: 'text-yellow-400' };
    if (bpm < 156) return { label: 'Allegro',  color: 'text-orange-400' };
    return { label: 'Presto', color: 'text-red-400' };
  };

  const tempo = getTempoLabel();
  const beatInterval = 60000 / bpm; // ms per beat

  return (
    <div className="max-w-lg mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="page-title">🥁 Metrónomo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mantén el tiempo mientras practicas
        </p>
      </div>

      {/* Main card */}
      <div className="stat-card space-y-8">

        {/* Beat visualizer */}
        <div className="flex justify-center gap-3">
          {Array.from({ length: beatsPerMeasure }).map((_, i) => {
            const isActive = currentBeat === i && isPlaying;
            const isAccent = i === 0;
            return (
              <div
                key={i}
                className={`rounded-full transition-all flex items-center justify-center font-mono text-sm font-bold
                  ${isAccent ? 'w-14 h-14' : 'w-12 h-12'}
                  ${isActive && isAccent
                    ? 'bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.6)] scale-125'
                    : isActive
                    ? 'bg-primary/70 text-primary-foreground scale-110'
                    : isAccent
                    ? 'bg-secondary border-2 border-primary/40 text-primary'
                    : 'bg-secondary border border-border text-muted-foreground'
                  }`}
                style={{
                  transition: isActive
                    ? 'all 0.05s ease-out'
                    : `all ${beatInterval * 0.3}ms ease-out`,
                }}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        {/* BPM Display */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-4">

            {/* Botón - */}
            <button
              onMouseDown={() => startHold(-1)}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={() => startHold(-1)}
              onTouchEnd={stopHold}
              className="w-12 h-12 rounded-full bg-secondary hover:bg-secondary/80 active:scale-95 transition-all flex items-center justify-center"
            >
              <Minus className="h-5 w-5" />
            </button>

            {/* BPM number */}
            <div className="text-center min-w-[120px]">
              <p className={`font-mono text-7xl font-bold leading-none transition-colors ${isPlaying ? 'text-primary' : 'text-foreground'}`}>
                {bpm}
              </p>
              <p className="text-xs text-muted-foreground mt-1">BPM</p>
            </div>

            {/* Botón + */}
            <button
              onMouseDown={() => startHold(1)}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={() => startHold(1)}
              onTouchEnd={stopHold}
              className="w-12 h-12 rounded-full bg-secondary hover:bg-secondary/80 active:scale-95 transition-all flex items-center justify-center"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Tempo label */}
          <p className={`text-lg font-medium ${tempo.color} transition-colors`}>
            {tempo.label}
          </p>
        </div>

        {/* Slider BPM */}
        <div className="px-2 space-y-1">
          <input
            type="range"
            min={20}
            max={250}
            value={bpm}
            onChange={e => setBpm(parseInt(e.target.value))}
            className="w-full accent-primary cursor-pointer h-2"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>20</span>
            <span>60</span>
            <span>100</span>
            <span>140</span>
            <span>180</span>
            <span>250</span>
          </div>
        </div>

        {/* Play button */}
        <div className="flex justify-center">
          <button
            onClick={togglePlay}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95
              ${isPlaying
                ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/30'
                : 'bg-primary hover:bg-primary/90 shadow-primary/30'
              }`}
            style={{
              boxShadow: isPlaying
                ? '0 0 30px hsl(var(--destructive) / 0.4)'
                : '0 0 20px hsl(var(--primary) / 0.3)',
            }}
          >
            {isPlaying
              ? <Square className="h-8 w-8 text-white fill-white" />
              : <Play className="h-8 w-8 text-white fill-white ml-1" />
            }
          </button>
        </div>

        {/* Status */}
        <p className="text-center text-xs text-muted-foreground">
          {isPlaying
            ? `♩ = ${bpm} · ${beatsPerMeasure}/4 · ${tempo.label}`
            : 'Presiona para iniciar'}
        </p>

      </div>

      {/* Compás */}
      <div className="stat-card space-y-3">
        <h3 className="section-title text-sm">Compás</h3>
        <div className="grid grid-cols-4 gap-2">
          {TIME_SIGNATURES.map(sig => (
            <button
              key={sig.beats}
              onClick={() => setBeatsPerMeasure(sig.beats)}
              className={`py-3 rounded-lg font-mono text-lg font-bold transition-all ${
                beatsPerMeasure === sig.beats
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary text-foreground hover:bg-secondary/70'
              }`}
            >
              {sig.label}
            </button>
          ))}
        </div>
      </div>

      {/* Presets de tempo */}
      <div className="stat-card space-y-3">
        <h3 className="section-title text-sm">Presets de tempo</h3>
        <div className="grid grid-cols-3 gap-2">
          {BPM_PRESETS.map(preset => (
            <button
              key={preset.bpm}
              onClick={() => setBpm(preset.bpm)}
              className={`py-2.5 px-3 rounded-lg text-sm transition-all flex flex-col items-center gap-0.5
                ${bpm === preset.bpm
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/70'
                }`}
            >
              <span className={`font-mono font-bold ${bpm === preset.bpm ? 'text-primary-foreground' : preset.color}`}>
                {preset.bpm}
              </span>
              <span className="text-[10px] opacity-80">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tap Tempo */}
      <div className="stat-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="section-title text-sm">Tap Tempo</h3>
          <span className="text-xs text-muted-foreground">Toca el ritmo para detectar BPM</span>
        </div>
        <button
          onClick={handleTap}
          className="w-full py-5 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-[0.98] active:bg-primary/20 transition-all border-2 border-dashed border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
        >
          <div className="flex flex-col items-center gap-1">
            <Music className="h-6 w-6" />
            <span className="text-sm font-medium">Toca aquí al ritmo</span>
            {tapTimes.length >= 2 && (
              <span className="text-xs text-primary font-mono">
                {tapTimes.length} taps · {bpm} BPM detectado
              </span>
            )}
          </div>
        </button>
        {tapTimes.length > 0 && (
          <button
            onClick={() => setTapTimes([])}
            className="text-xs text-muted-foreground hover:text-foreground mx-auto block"
          >
            limpiar taps
          </button>
        )}
      </div>

      {/* Ajuste fino */}
      <div className="stat-card space-y-3">
        <h3 className="section-title text-sm">Ajuste fino</h3>
        <div className="flex gap-2 flex-wrap">
          {[-10, -5, -1, +1, +5, +10].map(delta => (
            <button
              key={delta}
              onClick={() => changeBpm(delta)}
              className="flex-1 py-2 rounded-lg bg-secondary hover:bg-secondary/70 text-sm font-mono transition-all active:scale-95"
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
