import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Minus, Plus, Play, Square, Music, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetronomeEngine } from '@/lib/metronome-engine';

export const MetronomeWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  // Drag state — saved in localStorage so it persists across reloads
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('mm-widget-pos');
      return saved ? JSON.parse(saved) : { x: window.innerWidth - 90, y: window.innerHeight - 110 };
    } catch {
      return { x: window.innerWidth - 90, y: window.innerHeight - 110 };
    }
  });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  const engineRef = useRef<MetronomeEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    engineRef.current = new MetronomeEngine();
    return () => { engineRef.current?.stop(); };
  }, []);

  const togglePlay = () => {
    if (!engineRef.current) return;
    if (isPlaying) {
      engineRef.current.stop();
      setCurrentBeat(-1);
      setIsPlaying(false);
    } else {
      engineRef.current.start(bpm, beatsPerMeasure, (beat: number) => setCurrentBeat(beat));
      setIsPlaying(true);
    }
  };

  useEffect(() => { if (isPlaying && engineRef.current) engineRef.current.updateBpm(bpm); }, [bpm, isPlaying]);
  useEffect(() => { if (isPlaying && engineRef.current) engineRef.current.updateBeats(beatsPerMeasure); }, [beatsPerMeasure, isPlaying]);

  const handleTap = () => {
    const now = Date.now();
    setTapTimes(prev => {
      const recent = [...prev, now].filter(t => now - t < 3000).slice(-6);
      if (recent.length >= 2) {
        const intervals = recent.slice(1).map((t, i) => t - recent[i]);
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        setBpm(Math.min(250, Math.max(20, Math.round(60000 / avg))));
      }
      return recent;
    });
  };

  // --- Drag logic ---
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag from the button itself, not from controls inside the panel
    isDragging.current = true;
    didDrag.current = false;
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      didDrag.current = true;
      const newX = Math.min(window.innerWidth - 64, Math.max(0, e.clientX - dragOffset.current.x));
      const newY = Math.min(window.innerHeight - 64, Math.max(0, e.clientY - dragOffset.current.y));
      setPos({ x: newX, y: newY });
    };
    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        // Save position
        setPos(p => {
          localStorage.setItem('mm-widget-pos', JSON.stringify(p));
          return p;
        });
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Touch support
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    didDrag.current = false;
    dragOffset.current = {
      x: e.touches[0].clientX - pos.x,
      y: e.touches[0].clientY - pos.y,
    };
  }, [pos]);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      didDrag.current = true;
      const newX = Math.min(window.innerWidth - 64, Math.max(0, e.touches[0].clientX - dragOffset.current.x));
      const newY = Math.min(window.innerHeight - 64, Math.max(0, e.touches[0].clientY - dragOffset.current.y));
      setPos({ x: newX, y: newY });
      e.preventDefault();
    };
    const onTouchEnd = () => {
      if (isDragging.current) {
        isDragging.current = false;
        setPos(p => { localStorage.setItem('mm-widget-pos', JSON.stringify(p)); return p; });
      }
    };
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const handleButtonClick = () => {
    // Only toggle if it wasn't a drag
    if (!didDrag.current) setIsOpen(o => !o);
    didDrag.current = false;
  };

  return (
    <div
      ref={containerRef}
      className="fixed z-50 flex flex-col items-center gap-3"
      style={{ left: pos.x, top: pos.y, userSelect: 'none' }}
    >
      {/* Control Panel — positioned above the button */}
      {isOpen && (
        <div
          className="glass-panel p-4 rounded-2xl border-white/10 shadow-2xl w-64 animate-in fade-in slide-in-from-bottom-5 duration-300 mb-2"
          style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '12px' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Music className="h-3 w-3" /> Metrónomo
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Visualizer */}
          <div className="flex justify-center gap-2 mb-6">
            {Array.from({ length: beatsPerMeasure }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-75 ${
                  currentBeat === i && isPlaying
                    ? 'bg-primary shadow-[0_0_10px_hsl(var(--primary))] scale-y-150'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* BPM Control */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <button
              onClick={() => setBpm(b => Math.max(20, b - 1))}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="text-center">
              <span className="text-3xl font-mono font-bold text-primary block leading-none">{bpm}</span>
              <span className="text-[10px] text-muted-foreground uppercase font-medium">BPM</span>
            </div>
            <button
              onClick={() => setBpm(b => Math.min(250, b + 1))}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button size="sm" variant="outline" className="text-[10px] h-7 border-white/5 bg-white/5" onClick={handleTap}>
              TAP TEMPO
            </Button>
            <select
              value={beatsPerMeasure}
              onChange={e => setBeatsPerMeasure(Number(e.target.value))}
              className="text-[10px] h-7 px-2 rounded-md bg-white/5 border border-white/5 text-foreground leading-none outline-none"
            >
              <option value="2">2/4</option>
              <option value="3">3/4</option>
              <option value="4">4/4</option>
              <option value="6">6/8</option>
            </select>
          </div>

          <button
            onClick={togglePlay}
            className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm
              ${isPlaying
                ? 'bg-destructive/20 text-destructive border border-destructive/30'
                : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              }`}
          >
            {isPlaying ? (
              <><Square className="h-4 w-4 fill-current" /> PARAR</>
            ) : (
              <><Play className="h-4 w-4 fill-current ml-0.5" /> EMPEZAR</>
            )}
          </button>
        </div>
      )}

      {/* Floating Button — drag handle */}
      <button
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onClick={handleButtonClick}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 cursor-grab active:cursor-grabbing
          ${isOpen ? 'bg-background border border-white/10 scale-90' : 'bg-primary text-primary-foreground hover:scale-110 active:scale-95'}
          ${isPlaying && !isOpen ? 'animate-pulse' : ''}
        `}
        style={{
          boxShadow: isPlaying && !isOpen ? '0 0 20px hsl(var(--primary) / 0.5)' : '',
        }}
      >
        {isOpen ? (
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        ) : (
          <div className="relative">
            <Music className="h-6 w-6" />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-primary" />
            )}
          </div>
        )}
      </button>
    </div>
  );
};
