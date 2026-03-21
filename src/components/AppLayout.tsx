import { useRef, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSessions } from '@/hooks/use-music-data';
import { getStreak, formatDurationLong, getTodayEC, getMonday } from '@/lib/music-utils';
import { usePracticeTimer, formatTimer } from '@/hooks/use-practice-timer';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, ExternalLink } from 'lucide-react';
import { usePiP } from '@/hooks/use-pip';
import { createRoot } from 'react-dom/client';
import { TimerPiPContent } from '@/components/TimerPiP';
import { MetronomeWidget } from './MetronomeWidget';

const ROUTE_NAMES: Record<string, string> = {
  '/': 'Dashboard',
  '/practice': 'Registrar Práctica',
  '/history': 'Historial',
  '/setlist': 'Setlist Semanal',
  '/scales': 'Escalas',
  '/harmonies': 'Armonías',
  '/melodies': 'Melodías',
  '/rhythms': 'Ritmos',
  '/exercises': 'Ejercicios',
  '/metronome': 'Metrónomo',
  '/stats': 'Estadísticas',
};

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sessions] = useSessions();
  const streak = getStreak(sessions);
  const routeName = ROUTE_NAMES[location.pathname] ?? '';
  const { seconds, running, toggleTimer } = usePracticeTimer();
  const { requestPiP, isPipActive } = usePiP();
  const pipRootRef = useRef<any>(null);

  // Sync PiP window content when state changes
  useEffect(() => {
    if (isPipActive && pipRootRef.current) {
      pipRootRef.current.render(<TimerPiPContent seconds={seconds} running={running} />);
    }
  }, [seconds, running, isPipActive]);
  
  const today = getTodayEC();
  const todayMinutes = sessions.filter(s => s.date === today).reduce((sum, s) => sum + s.durationMinutes, 0);
  
  const weekStart = getMonday(new Date()).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
  const weekMinutes = sessions.filter(s => s.date >= weekStart).reduce((sum, s) => sum + s.durationMinutes, 0);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 flex items-center justify-between border-b border-white/5 px-5 glass-panel !bg-background/40 sticky top-0 z-50 shadow-sm relative z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="text-sm text-muted-foreground">
                <span className="text-primary font-medium">MusicMinistry</span>
                <span className="mx-1.5">/</span>
                <span>{routeName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Active timer indicator */}
              {(running || seconds > 0) && (
                <button
                  onClick={() => {
                    if (location.pathname !== '/practice') navigate('/practice');
                    else toggleTimer();
                  }}
                  className={`flex items-center gap-2 glass-panel rounded-full py-1.5 px-4 cursor-pointer transition-all ${running ? 'border-primary/50 shadow-[0_0_15px_hsl(var(--primary)/0.25)]' : 'opacity-80'}`}
                >
                  <span className={running ? 'animate-pulse text-primary drop-shadow-[0_0_5px_hsl(var(--primary))]' : 'text-muted-foreground'}>⏱</span>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold text-foreground">{formatTimer(seconds)}</p>
                    <p className="text-[10px] text-muted-foreground leading-none">{running ? 'grabando' : 'pausado'}</p>
                  </div>
                </button>
              )}

              {/* Today's time */}
              {todayMinutes > 0 && (
                <div className="hidden sm:flex items-center gap-2 stat-card py-1.5 px-3">
                  <span className="text-green-400 text-sm">✓</span>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold text-foreground">{formatDurationLong(todayMinutes)}</p>
                    <p className="text-[10px] text-muted-foreground leading-none">hoy</p>
                  </div>
                </div>
              )}

              {/* Streak badge */}
              <div className="flex items-center gap-2 glass-panel rounded-full py-1.5 px-4 animate-pulse-glow text-orange-500">
                <span className="drop-shadow-[0_0_5px_rgba(251,146,60,0.8)]">🔥</span>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold text-orange-400 bg-clip-text text-transparent bg-gradient-to-b from-orange-300 to-red-500">{streak.current}</p>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground leading-none">racha</p>
                </div>
              </div>

              {/* Weekly time */}
              <div className="glass-panel rounded-full py-1.5 px-4 hidden md:block">
                <p className="font-mono text-sm font-semibold text-foreground/90 tracking-wide">{formatDurationLong(weekMinutes)}</p>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground leading-none">semanal</p>
              </div>

              {/* User / Logout */}
              {user && (
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border/50">
                  <span className="text-xs text-muted-foreground hidden sm:inline-block max-w-[120px] truncate">
                    {user.email}
                  </span>
                  <button
                    onClick={async () => {
                      await signOut();
                      navigate('/auth');
                    }}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10 cursor-pointer"
                    title="Cerrar sesión"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </header>
          {/* Main content */}
          <main className="flex-1 overflow-auto p-4 md:p-6 relative">
            <Outlet />
            
            {/* Floating Metronome */}
            <MetronomeWidget />
          </main>

          {/* Persistent Floating Timer (Bottom Right / System Tray Style) */}
          {(running || seconds > 0) && (
            <div className="fixed bottom-5 right-5 z-[60] flex items-center gap-2">
              {/* PiP Toggle Button */}
              {!isPipActive && 'documentPictureInPicture' in window && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const win = await requestPiP();
                    if (win) {
                      const root = createRoot(win.document.body);
                      pipRootRef.current = root;
                      root.render(<TimerPiPContent seconds={seconds} running={running} />);
                    }
                  }}
                  className="p-2 rounded-full glass-panel hover:bg-primary/20 text-primary transition-all shadow-xl border-primary/20 group/pip"
                  title="Abrir en ventana flotante (Siempre arriba)"
                >
                  <ExternalLink className="h-4 w-4 transition-transform group-hover/pip:scale-110" />
                </button>
              )}

              <div 
                onClick={() => {
                  if (location.pathname !== '/practice') navigate('/practice');
                  else toggleTimer();
                }}
                className={`flex items-center gap-3 glass-panel rounded-full py-2 px-5 cursor-pointer transition-all duration-500 hover:scale-105 active:scale-95 group shadow-2xl ${
                  running 
                    ? 'border-primary/40 bg-primary/5 shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.3)]' 
                    : 'border-white/10 opacity-90'
                }`}
              >
                <div className="relative">
                  <span className={`text-xl transition-all ${running ? 'animate-pulse text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]' : 'text-muted-foreground'}`}>
                    ⏱
                  </span>
                  {running && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <p className="font-mono text-lg font-bold tracking-tighter text-foreground leading-none">
                    {formatTimer(seconds)}
                  </p>
                  <p className={`text-[9px] uppercase font-bold tracking-widest leading-none mt-1 transition-colors ${running ? 'text-primary/80' : 'text-muted-foreground/60'}`}>
                    {running ? 'En sesión' : 'Pausado'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
