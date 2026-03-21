import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Square, Minus, Plus, Maximize2, Music, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePracticeTimer, formatTimer } from '@/hooks/use-practice-timer';
import { MetronomeEngine } from '@/lib/metronome-engine';
import { Exercise, ExerciseImage } from '@/types/music';

interface FocusModeProps {
  exercise: Exercise;
  images: ExerciseImage[];
  onClose: () => void;
}

const getYouTubeId = (url: string): string | null => {
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
};

export const FocusMode: React.FC<FocusModeProps> = ({ exercise, images, onClose }) => {
  const { seconds, running, toggleTimer } = usePracticeTimer();
  const [bpm, setBpm] = useState(exercise.bpm || 120);
  const [isPlayingMetronome, setIsPlayingMetronome] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  
  const engineRef = useRef<MetronomeEngine>(new MetronomeEngine());
  const materialVideoUrl = (exercise as any).videoUrl || (exercise as any).referenceUrl;
  const ytId = materialVideoUrl ? getYouTubeId(materialVideoUrl) : null;

  useEffect(() => {
    return () => { engineRef.current.stop(); };
  }, []);

  const toggleMetronome = () => {
    if (isPlayingMetronome) {
      engineRef.current.stop();
      setCurrentBeat(-1);
      setIsPlayingMetronome(false);
    } else {
      engineRef.current.start(bpm, 4, (beat: number) => {
        setCurrentBeat(beat);
      });
      setIsPlayingMetronome(true);
    }
  };

  useEffect(() => {
    if (isPlayingMetronome) engineRef.current.updateBpm(bpm);
  }, [bpm, isPlayingMetronome]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-500 overflow-hidden text-white font-display">
      
      {/* Top bar - Info & Timer */}
      <div className="h-20 px-8 flex items-center justify-between bg-gradient-to-b from-white/10 to-transparent border-b border-white/5">
        <div className="flex items-center gap-6">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-all group"
          >
            <X className="h-5 w-5 text-white/60 group-hover:text-white" />
          </button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{exercise.title}</h2>
            <p className="text-[10px] text-primary uppercase font-bold tracking-[0.2em]">{exercise.category}</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
           <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-primary">
                 <Clock className="h-4 w-4" />
                 <span className="font-mono text-2xl font-bold tracking-tighter">{formatTimer(seconds)}</span>
              </div>
              <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Sesión de Práctica</p>
           </div>
           <Button 
            onClick={toggleTimer} 
            variant={running ? "destructive" : "default"}
            size="sm"
            className={`rounded-full px-6 font-bold shadow-2xl transition-all h-9 ${running ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-primary text-primary-foreground'}`}
           >
             {running ? "PAUSAR" : "INICIAR"}
           </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center relative p-6">
        {ytId ? (
          <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : images.length > 0 ? (
          <div className="relative h-full w-full flex flex-col items-center justify-center gap-4">
             <div className="h-[75vh] w-full flex items-center justify-center">
                <img 
                    src={images[currentImgIndex].dataUrl} 
                    className="max-h-full max-w-full object-contain rounded-xl shadow-[0_0_50px_rgba(255,255,255,0.05)] border border-white/10" 
                    alt="partitura" 
                />
             </div>
             {images.length > 1 && (
                <div className="flex gap-2">
                    {images.map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => setCurrentImgIndex(i)}
                            className={`w-2 h-2 rounded-full transition-all ${currentImgIndex === i ? 'bg-primary w-6' : 'bg-white/20'}`}
                        />
                    ))}
                </div>
             )}
          </div>
        ) : (
          <div className="text-center opacity-20">
             <Music className="h-24 w-24 mx-auto mb-4" />
             <p className="text-xl font-mono">Sin material visual</p>
          </div>
        )}
      </div>

      {/* Bottom Bar - metronome */}
      <div className="h-32 px-12 bg-gradient-to-t from-white/10 to-transparent flex items-center justify-center gap-12 border-t border-white/5 backdrop-blur-sm">
        
        {/* BPM Selector */}
        <div className="flex items-center gap-6">
          <button onClick={() => setBpm((b: number) => Math.max(20, b - 1))} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/5">
            <Minus className="h-5 w-5" />
          </button>
          <div className="text-center w-24">
            <span className="text-6xl font-mono font-bold leading-none select-none">{bpm}</span>
            <p className="text-xs text-primary font-bold tracking-widest mt-1">BPM</p>
          </div>
          <button onClick={() => setBpm((b: number) => Math.min(250, b + 1))} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/5">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Start / Stop */}
        <button 
          onClick={toggleMetronome}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-95 ${
            isPlayingMetronome ? 'bg-red-500 shadow-red-500/20' : 'bg-primary shadow-primary/30'
          }`}
        >
          {isPlayingMetronome ? <Square className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 fill-current ml-1" />}
        </button>

        {/* Visual Beats */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map(i => (
            <div 
                key={i} 
                className={`w-4 h-4 rounded-full transition-all duration-75 ${
                    currentBeat === i && isPlayingMetronome
                    ? 'bg-primary scale-150 shadow-[0_0_15px_hsl(var(--primary))]' 
                    : i === 0 ? 'bg-white/20 border border-primary/40' : 'bg-white/10'
                }`}
            />
          ))}
        </div>

      </div>
    </div>
  );
};
