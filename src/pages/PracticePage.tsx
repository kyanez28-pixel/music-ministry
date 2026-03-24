import { useState, useEffect, useRef } from 'react';
import { useSessions } from '@/hooks/use-music-data';
import { generateId, getTodayEC } from '@/lib/music-utils';
import { ALL_CATEGORIES, CATEGORY_LABELS, type PracticeCategory, type Instrument } from '@/types/music';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { usePracticeTimer, formatTimer } from '@/hooks/use-practice-timer';
import { useInstruments } from '@/hooks/use-instruments';
import { InstrumentDef } from '@/types/music';
import { LoadingCard } from '@/components/ui/LoadingCard';

// ─── Sonido de aviso (Web Audio API, sin archivos externos) ──────────────────

function playMilestoneSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playNote = (freq: number, start: number, dur: number, gain = 0.45) => {
      // Oscilador principal (más rico con Square para mayor presencia si se desea, pero Sine con armónicos es más "MusicMinistry")
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator(); // Armónico
      const vol = ctx.createGain();
      
      osc.connect(vol);
      osc2.connect(vol);
      vol.connect(ctx.destination);
      
      osc.type = 'sine';
      osc2.type = 'sine';
      
      osc.frequency.setValueAtTime(freq, start);
      osc2.frequency.setValueAtTime(freq * 2, start); // Octava arriba para brillo
      
      vol.gain.setValueAtTime(0, start);
      vol.gain.linearRampToValueAtTime(gain, start + 0.01);
      vol.gain.exponentialRampToValueAtTime(0.001, start + dur);
      
      osc.start(start);
      osc2.start(start);
      osc.stop(start + dur);
      osc2.stop(start + dur);
    };

    const t = ctx.currentTime;
    // Secuencia de campana armónica
    const base = 523.25; // Do5
    playNote(base,             t,        0.6); 
    playNote(base * 1.2599,    t + 0.1,  0.6); // Mi5
    playNote(base * 1.4983,    t + 0.2,  0.8); // Sol5
    
    // Segunda ráfaga más aguda para asegurar atención
    playNote(base * 2,         t + 0.6,  0.4, 0.3); // Do6
  } catch {
    // Silencioso si el navegador no soporta AudioContext
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PracticePage() {
  const [sessions = [], setSessions, isLoading] = useSessions();
  const [date, setDate] = useState(getTodayEC());
  const [instrument, setInstrument] = useState<Instrument>('piano');
  const [categories, setCategories] = useState<PracticeCategory[]>([]);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(3);
  const [goal] = useState('');

  const { instruments } = useInstruments();
  const { seconds: timerSeconds, running: timerRunning, toggleTimer, resetTimer } = usePracticeTimer();

  // Manual duration
  const [manualHours, setManualHours] = useState(0);
  const [manualMins, setManualMins] = useState(0);
  const [useManual, setUseManual] = useState(false);

  // Flash visual
  const [flashing, setFlashing] = useState(false);
  const lastMilestoneRef = useRef(0);

  // ─── Detector de hitos cada 15 minutos ──────────────────────────────────────
  useEffect(() => {
    if (!timerRunning) return;

    const currentMilestone = Math.floor(timerSeconds / (15 * 60));

    if (currentMilestone > lastMilestoneRef.current && currentMilestone > 0) {
      lastMilestoneRef.current = currentMilestone;

      const totalMins = currentMilestone * 15;
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      const label = h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m} minutos`;

      playMilestoneSound();

      setFlashing(true);
      setTimeout(() => setFlashing(false), 2000);

      toast(`🎵 ¡${label} practicando!`, {
        description: 'Excelente concentración. Puedes tomar un breve descanso.',
        duration: 7000,
      });
    }
  }, [timerSeconds, timerRunning]);

  // Reset milestone cuando se resetea el timer
  useEffect(() => {
    if (timerSeconds === 0) lastMilestoneRef.current = 0;
  }, [timerSeconds]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const toggleCategory = (cat: PracticeCategory) =>
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const getDurationMinutes = () => {
    if (useManual) return manualHours * 60 + manualMins;
    return Math.max(1, Math.round(timerSeconds / 60));
  };

  const handleSave = () => {
    const duration = getDurationMinutes();
    if (duration <= 0) { toast.error('La duración debe ser mayor a 0'); return; }
    if (categories.length === 0) { toast.error('Selecciona al menos una categoría'); return; }
    setSessions((prev: any[]) => [...prev, {
      id: generateId(), date, instrument,
      durationMinutes: duration, categories, notes, rating, goal,
    }]);
    toast.success('¡Sesión guardada!');
    handleClear();
  };

  const handleClear = () => {
    setDate(getTodayEC());
    if (instruments.length > 0) setInstrument(instruments[0].id);
    setCategories([]);
    setNotes('');
    setRating(3);
    resetTimer();
    setManualHours(0);
    setManualMins(0);
    setUseManual(false);
    lastMilestoneRef.current = 0;
  };

  const timerMinutes = Math.round(timerSeconds / 60);
  const secondsInBlock = timerSeconds % (15 * 60);
  const progressToNext = (secondsInBlock / (15 * 60)) * 100;
  const secondsToNext = (15 * 60) - secondsInBlock;
  const nextMilestoneMin = (Math.floor(timerSeconds / (15 * 60)) + 1) * 15;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-12 w-48 bg-white/5 rounded-lg animate-pulse" />
        <LoadingCard />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Registrar Práctica</h1>
          <p className="text-sm text-muted-foreground mt-1">Documenta tu sesión de hoy</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClear}>Limpiar</Button>
          <Button onClick={handleSave}>Guardar Sesión →</Button>
        </div>
      </div>

      <div className="stat-card space-y-6">

        {/* Date & Instrument */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Fecha</label>
            <Input type="date" value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Instrumento</label>
            <div className="flex flex-wrap gap-2">
              {instruments.map((inst: InstrumentDef) => (
                <button key={inst.id} onClick={() => setInstrument(inst.id)}
                  className={`chip flex-1 min-w-[100px] justify-center ${instrument === inst.id ? 'chip-active' : ''}`}>
                  {inst.emoji} {inst.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Duration / Timer */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Duración</label>
          {!useManual ? (
            <div className="text-center space-y-3">

              {/* Timer display con flash e impacto */}
              <div className={`relative inline-block rounded-2xl px-8 py-3 transition-all duration-300 ${
                flashing
                  ? 'bg-primary/25 shadow-[0_0_40px_hsl(var(--primary)/0.5)] scale-110 animate-shake'
                  : 'bg-transparent'
              }`}>
                {/* Screen Flash Overlay */}
                {flashing && (
                  <div className="fixed inset-0 pointer-events-none z-[100] bg-primary animate-screen-flash" />
                )}
                
                <p className={`font-mono text-5xl font-bold transition-colors select-none ${
                  flashing ? 'text-primary' : timerRunning ? 'text-primary' : 'text-foreground'
                }`}>
                  {formatTimer(timerSeconds)}
                </p>
                {timerRunning && !flashing && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
                {flashing && (
                  <div className="absolute -top-4 -right-4 text-3xl animate-bounce drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                    🎵
                  </div>
                )}
              </div>

              {timerSeconds > 0 && (
                <p className="text-xs text-muted-foreground font-mono">
                  ≈ {timerMinutes} min{timerMinutes !== 1 ? 's' : ''} practicado{timerMinutes !== 1 ? 's' : ''}
                </p>
              )}

              {/* Barra de progreso hacia el próximo hito */}
              {timerSeconds > 0 && (
                <div className="mx-auto max-w-xs space-y-1.5">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>
                      {timerRunning
                        ? `Aviso en ${formatTimer(secondsToNext)}`
                        : 'Cronómetro pausado'}
                    </span>
                    <span className="text-primary font-mono">
                      {timerRunning ? `próx: ${nextMilestoneMin}min` : ''}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        flashing ? 'bg-primary' : 'bg-primary/50'
                      }`}
                      style={{ width: `${progressToNext}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 text-center">
                    🔔 Aviso sonoro y visual cada 15 minutos
                  </p>
                </div>
              )}

              <div className="flex justify-center gap-2">
                <Button
                  variant={timerRunning ? 'secondary' : 'default'}
                  onClick={toggleTimer}
                  size="sm"
                  className="min-w-[100px]"
                >
                  {timerRunning ? '⏸ Pausar' : timerSeconds > 0 ? '▶ Continuar' : '▶ Iniciar'}
                </Button>
                {timerSeconds > 0 && (
                  <Button variant="outline" size="sm" onClick={resetTimer}>↺ Reset</Button>
                )}
              </div>
              <button onClick={() => setUseManual(true)} className="text-xs text-primary hover:underline">
                ó ingresa manualmente
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-3 items-center justify-center">
                <div className="flex items-center gap-1">
                  <Input type="number" min={0} max={23} value={manualHours}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 text-center font-mono" />
                  <span className="text-sm text-muted-foreground">h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Input type="number" min={0} max={59} value={manualMins}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualMins(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 text-center font-mono" />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
              {(manualHours > 0 || manualMins > 0) && (
                <p className="text-xs text-center text-muted-foreground">
                  = {manualHours * 60 + manualMins} minutos totales
                </p>
              )}
              <button onClick={() => setUseManual(false)} className="text-xs text-primary hover:underline block mx-auto">
                usar cronómetro
              </button>
            </div>
          )}
        </div>

        {/* Categories */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            ¿Qué practicaste?{' '}
            <span className="text-xs">Selecciona todo lo que aplique</span>
            {categories.length > 0 && (
              <span className="ml-2 text-primary font-medium">
                {categories.length} seleccionado{categories.length > 1 ? 's' : ''}
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat: PracticeCategory) => (
              <button key={cat} onClick={() => toggleCategory(cat)}
                className={`chip ${categories.includes(cat) ? 'chip-active' : ''}`}>
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Calidad de sesión</label>
          <div className="flex gap-1 items-center">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setRating(star)} className="text-2xl transition-transform hover:scale-110">
                {star <= rating ? '★' : '☆'}
              </button>
            ))}
            <span className="ml-2 text-xs text-muted-foreground">
              {rating === 1 ? 'Difícil' : rating === 2 ? 'Regular' : rating === 3 ? 'Bien' : rating === 4 ? 'Muy bien' : 'Excelente'}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            Notas <span className="text-xs">opcional</span>
          </label>
          <Textarea value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            placeholder="¿Qué trabajaste hoy? ¿Qué mejorar?" rows={3} />
        </div>

      </div>
    </div>
  );
}
