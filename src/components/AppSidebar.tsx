import {
  LayoutDashboard, Timer, List, Music2, BookOpen,
  Guitar, Drum, BarChart3, Cross, BookMarked, Clock4, Download
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { AppTooltip } from './AppTooltip';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useSongs, useSetlists, useScaleLogs, useHarmonyLogs, useRhythmLogs } from '@/hooks/use-music-data';
import { getMonday, getTodayEC } from '@/lib/music-utils';
import { useInstruments } from '@/hooks/use-instruments';
import { Settings2 } from 'lucide-react';
import { InstrumentDef } from '@/types/music';
import { InstrumentSettings } from './InstrumentSettings';
import { useState } from 'react';
import { usePWAInstall } from '@/hooks/use-pwa-install';

const generalItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, desc: 'Vista general de tu progreso y racha' },
  { title: 'Registrar Práctica', url: '/practice', icon: Timer, desc: 'Anota lo que has practicado hoy' },
  { title: 'Historial', url: '/history', icon: List, desc: 'Revisa tus sesiones pasadas' },
];

const ministryItems = [
  { title: 'Setlist Semanal', url: '/setlist', icon: Cross, desc: 'Canciones asignadas para esta semana' },
];

const studyItems = [
  { title: 'Escalas', url: '/scales', icon: Music2, desc: 'Biblioteca de escalas musicales' },
  { title: 'Armonías', url: '/harmonies', icon: BookOpen, desc: 'Progresiones de acordes y armonía' },
  { title: 'Melodías', url: '/melodies', icon: Guitar, desc: 'Repertorio de melodías y frases' },
  { title: 'Ritmos', url: '/rhythms', icon: Drum, desc: 'Patrones rítmicos y grooves' },
  { title: 'Ejercicios', url: '/exercises', icon: BookMarked, desc: 'Técnicas y ejercicios diarios' },
  { title: 'Metrónomo', url: '/metronome', icon: Clock4, desc: 'Herramienta de tiempo constante' },
];

const statsItems = [
  { title: 'Por Período', url: '/stats', icon: BarChart3, desc: 'Análisis detallado de tu tiempo de práctica' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [songs] = useSongs();
  const [setlists] = useSetlists();
  const [scaleLogs] = useScaleLogs();
  const [harmonyLogs] = useHarmonyLogs();
  const [rhythmLogs] = useRhythmLogs();
  const { instruments } = useInstruments();
  const { isInstallable, installApp } = usePWAInstall();

  const today = getTodayEC();
  const monday = getMonday(new Date()).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
  const currentSetlist = setlists.find((s: any) => s.weekStart === monday);
  const setlistCount = currentSetlist?.songIds.length ?? 0;

  // Badges para actividad de hoy
  const todayScales = scaleLogs.filter((l: any) => l.date === today).length;
  const todayHarmonies = harmonyLogs.filter((l: any) => l.date === today).length;
  const todayRhythms = rhythmLogs.filter((l: any) => l.date === today).length;

  const getBadge = (title: string): number | null => {
    if (title === 'Setlist Semanal' && setlistCount > 0) return setlistCount;
    if (title === 'Escalas' && todayScales > 0) return todayScales;
    if (title === 'Armonías' && todayHarmonies > 0) return todayHarmonies;
    if (title === 'Ritmos' && todayRhythms > 0) return todayRhythms;
    return null;
  };

  const renderGroup = (label: string, items: typeof generalItems) => (
    <SidebarGroup key={label}>
      <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider font-body">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const badge = getBadge(item.title);
            const isActive = location.pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <AppTooltip 
                    content={item.desc} 
                    side="right" 
                    sideOffset={collapsed ? 15 : -100}
                    className="max-w-[200px]"
                  >
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50 transition-colors w-full"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className={`mr-2 h-4 w-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                      {!collapsed && (
                        <span className="flex-1 flex items-center justify-between">
                          <span>{item.title}</span>
                          {badge !== null && (
                            <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full font-mono min-w-[20px] text-center">
                              {badge}
                            </span>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </AppTooltip>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border glass-panel !bg-sidebar-background/80 backdrop-blur-xl">
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <span className="text-2xl leading-none">♪</span>
        {!collapsed && (
          <div>
            <h1 className="font-display text-base font-bold text-foreground leading-tight">MusicMinistry</h1>
            <p className="text-xs text-muted-foreground">Estudio Personal</p>
          </div>
        )}
      </div>
      <SidebarContent className="py-2">
        {renderGroup('General', generalItems)}
        {renderGroup('Ministerio', ministryItems)}
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider font-body flex justify-between items-center w-full">
            <span>Instrumentos</span>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-1 hover:bg-sidebar-accent rounded-sm transition-colors"
              title="Gestionar Instrumentos"
            >
              <Settings2 className="h-3 w-3" />
            </button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {instruments.map((inst: InstrumentDef) => (
                <SidebarMenuItem key={inst.id}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`/practice?instrument=${inst.id}`}
                      className="hover:bg-sidebar-accent/50 transition-colors"
                    >
                      <span className="mr-2">{inst.emoji}</span>
                      {!collapsed && <span>{inst.name}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {renderGroup('Estudio', studyItems)}
        {renderGroup('Estadísticas', statsItems)}

        {isInstallable && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider font-body">
              Aplicación
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={installApp} className="text-primary hover:bg-primary/10">
                    <Download className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Instalar App</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <InstrumentSettings open={showSettings} onOpenChange={setShowSettings} />
    </Sidebar>
  );
}
