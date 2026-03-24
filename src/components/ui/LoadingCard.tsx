import { Loader2 } from 'lucide-react';

export function LoadingCard() {
  return (
    <div className="stat-card py-16 text-center space-y-3 animate-pulse">
      <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin" />
      <p className="text-muted-foreground font-medium">Cargando tus datos...</p>
      <p className="text-xs text-muted-foreground/60">Sincronizando con la nube</p>
    </div>
  );
}

export function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="stat-card h-32 animate-pulse bg-white/5 border-white/5" />
      ))}
    </div>
  );
}
