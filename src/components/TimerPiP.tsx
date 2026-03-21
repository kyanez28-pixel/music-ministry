import React from 'react';
import { formatTimer } from '@/hooks/use-practice-timer';

interface TimerPiPProps {
  seconds: number;
  running: boolean;
}

/**
 * El contenido que se mostrará dentro de la ventana PiP independiente.
 */
export const TimerPiPContent: React.FC<TimerPiPProps> = ({ seconds, running }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#0a0a0f] text-[#f5f5f0] font-sans p-4 overflow-hidden border border-primary/20">
      <div className="relative mb-1">
        <span className={`text-4xl font-mono font-bold tracking-tighter ${running ? 'text-primary' : 'text-muted-foreground/80'}`}>
          {formatTimer(seconds)}
        </span>
        {running && (
          <span className="absolute -top-1 -right-3 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        )}
      </div>
      <div className="flex flex-col items-center">
        <p className={`text-[10px] uppercase font-bold tracking-[0.2em] ${running ? 'text-primary/70 animate-pulse' : 'text-muted-foreground/50'}`}>
          {running ? 'PRÁCTICA ACTIVA' : 'PAUSADO'}
        </p>
        <p className="text-[9px] text-muted-foreground/30 mt-2 font-light">MusicMinistry Premium</p>
      </div>
    </div>
  );
};
