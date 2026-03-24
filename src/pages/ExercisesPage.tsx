import { useExercises } from '@/hooks/use-music-data';
import { ExerciseSection } from '@/components/ExerciseSection';
import type { Exercise, ExerciseStatus } from '@/types/music';
import { BookOpen } from 'lucide-react';

const STATUS_CONFIG: Record<ExerciseStatus, { label: string; emoji: string }> = {
  pendiente:    { label: 'Pendiente',    emoji: '⏳' },
  en_progreso:  { label: 'En progreso',  emoji: '🎯' },
  dominado:     { label: 'Dominado',     emoji: '✅' },
};

import { LoadingCard, LoadingGrid } from '@/components/ui/LoadingCard';

export default function ExercisesPage() {
  const [exercises = [], , isLoading] = useExercises();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 bg-white/5 rounded-lg animate-pulse" />
        <LoadingGrid />
        <LoadingCard />
      </div>
    );
  }

  // Stats
  const totalDone = (exercises || []).filter((e: Exercise) => e.status === 'dominado').length;
  const totalInProgress = (exercises || []).filter((e: Exercise) => e.status === 'en_progreso').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">📚 Mis Ejercicios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {(exercises || []).length} ejercicios registrados · {totalInProgress} en progreso · {totalDone} dominados
          </p>
        </div>
      </div>

      {/* Stats bar */}
      {(exercises || []).length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {(['pendiente', 'en_progreso', 'dominado'] as ExerciseStatus[]).map(s => {
            const count = (exercises || []).filter((e: Exercise) => e.status === s).length;
            const pct = (exercises || []).length > 0 ? Math.round((count / (exercises || []).length) * 100) : 0;
            return (
              <div key={s} className="stat-card text-center border-white/5 bg-white/5 backdrop-blur-sm">
                <p className="text-xl font-bold font-mono text-foreground">{count}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-0.5">
                  {STATUS_CONFIG[s].emoji} {STATUS_CONFIG[s].label}
                </p>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(exercises || []).length === 0 && (
        <div className="stat-card py-16 text-center space-y-3 glass-panel border-dashed">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Aún no tienes ejercicios guardados.</p>
          <p className="text-xs text-muted-foreground/60">
            Aquí puedes guardar capturas de partituras, links de videos y notas para tus clases.
          </p>
        </div>
      )}

      {/* Reusable Section */}
      <ExerciseSection />
    </div>
  );
}
