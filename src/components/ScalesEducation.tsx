import { useMemo, useState } from 'react';
import {
  SCALE_THEORY,
  SCALE_TYPE_OPTIONS,
  HEATMAP_TYPES,
  NOTES,
  NOTES_EN,
  PREDEFINED_SCALES,
  getScaleNotes,
  PredefinedScale,
} from '@/lib/predefined-scales';
import { getTodayEC, formatDate } from '@/lib/music-utils';
import {
  Sparkles,
  Music2,
  Binary,
  ListMusic,
  Info,
  CheckCircle2,
  Circle,
  Play,
  Flame,
  Trophy,
  Target,
  TrendingUp,
  Layers,
  Compass,
  ArrowRight,
  Filter,
  Check,
  Calendar,
  Eye,
  AlertCircle,
  Clock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const STEP_COLORS: Record<string, string> = { T: 'bg-primary/70', S: 'bg-amber-400/80', A: 'bg-purple-400/80' };
const STEP_LABELS: Record<string, string> = { T: 'Tono', S: 'Semi', A: 'Aum' };

export const TYPE_COLUMN_DEFS = [
  { key: 'mayor', label: 'Mayor', short: 'Mayor', color: '#4ade80' },
  { key: 'menor_natural', label: 'Menor Natural', short: 'Menor Nat.', color: '#60a5fa' },
  { key: 'pentatonica_mayor', label: 'Pentatónica Mayor', short: 'Penta. Mayor', color: '#fb923c' },
  { key: 'pentatonica_menor', label: 'Pentatónica Menor', short: 'Penta. Menor', color: '#f472b6' },
  { key: 'blues', label: 'Pentatónica con Blues', short: 'Penta. Blues', color: '#34d399' },
] as const;

interface Props {
  scaleLogs: any[];
  allScales: any[];
  practiceCount: Record<string, number>;
  lastPracticed?: Record<string, string>;
  todayChecked?: Set<string>;
  scaleVideos?: Record<string, string>;
  scaleProgressions?: Record<string, string>;
  today?: string;
  instrument?: string;
  onToggleScale?: (scaleId: string) => void;
  onGoToPracticeTab?: (scaleName?: string) => void;
}

export function ScalesEducation({
  scaleLogs,
  allScales,
  practiceCount,
  lastPracticed = {},
  todayChecked = new Set(),
  scaleVideos = {},
  scaleProgressions = {},
  today = '',
  instrument = 'piano',
  onToggleScale,
  onGoToPracticeTab,
}: Props) {
  const [activeTab, setActiveTab] = useState<'progreso' | 'teoria'>('progreso');
  const [matrixFilter, setMatrixFilter] = useState<'all' | 'pending' | 'today'>('all');
  const [progressPeriod, setProgressPeriod] = useState<'todo' | 'mes' | 'semana' | 'hoy'>('todo');
  const [selectedScaleForModal, setSelectedScaleForModal] = useState<PredefinedScale | null>(null);

  // Theory explorer state
  const [theoryType, setTheoryType] = useState('mayor');
  const [theoryRoot, setTheoryRoot] = useState('C');

  const effectiveToday = today || getTodayEC();

  // Period ranges calculation
  const { weekStartStr, weekEndStr, weekLabel, monthKey, monthLabel } = useMemo(() => {
    const todayDate = new Date(effectiveToday + 'T12:00:00');
    const dayOfWeek = todayDate.getDay();
    const diffToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const mondayDate = new Date(todayDate);
    mondayDate.setDate(todayDate.getDate() + diffToMon);
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(mondayDate.getDate() + 6);

    const weekStartStr = mondayDate.toISOString().slice(0, 10);
    const weekEndStr = sundayDate.toISOString().slice(0, 10);

    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const monthFull = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const startDay = mondayDate.getDate();
    const endDay = sundayDate.getDate();
    const startMonth = months[mondayDate.getMonth()];
    const endMonth = months[sundayDate.getMonth()];
    const year = sundayDate.getFullYear();
    const weekLabel = startMonth === endMonth
      ? `${startDay} - ${endDay} ${endMonth} ${year}`
      : `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;

    const monthKey = effectiveToday.slice(0, 7);
    const [y, m] = monthKey.split('-');
    const monthLabel = `${monthFull[parseInt(m, 10) - 1] || m} ${y}`;

    return { weekStartStr, weekEndStr, weekLabel, monthKey, monthLabel };
  }, [effectiveToday]);

  // Logs filtered by selected period
  const periodLogs = useMemo(() => {
    if (progressPeriod === 'hoy') {
      return (scaleLogs || []).filter((l: any) => l.date === effectiveToday);
    }
    if (progressPeriod === 'semana') {
      return (scaleLogs || []).filter((l: any) => l.date >= weekStartStr && l.date <= weekEndStr);
    }
    if (progressPeriod === 'mes') {
      return (scaleLogs || []).filter((l: any) => l.date && l.date.startsWith(monthKey));
    }
    return scaleLogs || [];
  }, [scaleLogs, progressPeriod, effectiveToday, weekStartStr, weekEndStr, monthKey]);

  // Active counts for the selected period
  const activePracticeCount = useMemo(() => {
    const counts: Record<string, number> = {};
    periodLogs.forEach((l: any) => {
      counts[l.scale_id] = (counts[l.scale_id] || 0) + 1;
    });
    return counts;
  }, [periodLogs]);

  // ── Calculation of Stats for the selected period ─────────────────────────
  const {
    totalScalesCount,
    practicedScalesCount,
    masteredScalesCount,
    inProgressScalesCount,
    unpracticedScalesCount,
    totalRepsInPeriod,
    activeDaysInPeriod,
    coveragePct,
    byTypeStats,
    byNoteStats,
    topPracticed,
    recommendations,
  } = useMemo(() => {
    const totalScalesCount = PREDEFINED_SCALES.length; // 60
    let practicedScalesCount = 0;
    let masteredScalesCount = 0;
    let inProgressScalesCount = 0;
    let totalRepsInPeriod = 0;
    const activeDates = new Set<string>();

    const byType: Record<string, { count: number; totalReps: number; practicedCount: number }> = {};
    TYPE_COLUMN_DEFS.forEach(t => {
      byType[t.key] = { count: 12, totalReps: 0, practicedCount: 0 };
    });

    const byNote: Record<string, { note: string; noteEN: string; practicedCount: number; totalReps: number }> = {};
    NOTES_EN.forEach((n, idx) => {
      byNote[n] = { note: NOTES[idx], noteEN: n, practicedCount: 0, totalReps: 0 };
    });

    // Check unique scales and reps for this period
    PREDEFINED_SCALES.forEach(scale => {
      const reps = activePracticeCount[scale.id] ?? 0;
      if (reps > 0) {
        practicedScalesCount++;
        totalRepsInPeriod += reps;

        if (reps >= 3) masteredScalesCount++;
        else inProgressScalesCount++;

        if (byType[scale.scaleType]) {
          byType[scale.scaleType].practicedCount++;
          byType[scale.scaleType].totalReps += reps;
        }

        const noteKey = scale.noteEN;
        if (byNote[noteKey]) {
          byNote[noteKey].practicedCount++;
          byNote[noteKey].totalReps += reps;
        }
      }
    });

    periodLogs.forEach((l: any) => {
      if (l.date) activeDates.add(l.date);
    });

    const unpracticedScalesCount = totalScalesCount - practicedScalesCount;
    const coveragePct = Math.round((practicedScalesCount / (totalScalesCount || 1)) * 100);

    // Top practiced in this period (or fallback to general top)
    const topPracticed = Object.entries(activePracticeCount)
      .filter(([_, reps]) => reps > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, reps]) => ({
        scale: PREDEFINED_SCALES.find(s => s.id === id) || allScales.find(s => s.id === id),
        reps,
      }))
      .filter(item => item.scale);

    // Smart Recommendations: Suggest scales that have 0 practice, prioritizing notes with 0 practice
    const candidateNotes = Object.values(byNote)
      .sort((a, b) => a.practicedCount - b.practicedCount)
      .map(n => n.note);

    const recs: PredefinedScale[] = [];
    for (const note of candidateNotes) {
      if (recs.length >= 3) break;
      const preferredTypes = ['mayor', 'pentatonica_mayor', 'menor_natural', 'pentatonica_menor', 'blues'];
      for (const t of preferredTypes) {
        const sc = PREDEFINED_SCALES.find(s => s.note === note && s.scaleType === t);
        if (sc && !(practiceCount[sc.id] > 0)) {
          recs.push(sc);
          break;
        }
      }
    }

    return {
      totalScalesCount,
      practicedScalesCount,
      masteredScalesCount,
      inProgressScalesCount,
      unpracticedScalesCount,
      totalRepsInPeriod,
      activeDaysInPeriod: activeDates.size,
      coveragePct,
      byTypeStats: byType,
      byNoteStats: byNote,
      topPracticed,
      recommendations: recs,
    };
  }, [activePracticeCount, periodLogs, allScales, practiceCount]);

  // Selected scale details for modal
  const selectedScaleNotes = useMemo(() => {
    if (!selectedScaleForModal) return [];
    return getScaleNotes(selectedScaleForModal.noteEN.split('/')[0], selectedScaleForModal.scaleType);
  }, [selectedScaleForModal]);

  const selectedVideoUrl = selectedScaleForModal
    ? scaleVideos[selectedScaleForModal.id] || (selectedScaleForModal as any).video_url || ''
    : '';
  const selectedProgression = selectedScaleForModal
    ? scaleProgressions[selectedScaleForModal.id] || ''
    : '';

  const ytVideoId = useMemo(() => {
    if (!selectedVideoUrl) return null;
    return (
      selectedVideoUrl.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&]+)/
      )?.[1] ?? null
    );
  }, [selectedVideoUrl]);

  // Filtered notes for matrix table
  const visibleNotesIndices = useMemo(() => {
    return NOTES_EN.map((_, idx) => idx).filter(idx => {
      const noteEsp = NOTES[idx];
      if (matrixFilter === 'all') return true;
      if (matrixFilter === 'pending') {
        return TYPE_COLUMN_DEFS.some(type => {
          const sc = PREDEFINED_SCALES.find(s => s.note === noteEsp && s.scaleType === type.key);
          return sc ? !(activePracticeCount[sc.id] > 0) : true;
        });
      }
      if (matrixFilter === 'today') {
        return TYPE_COLUMN_DEFS.some(type => {
          const sc = PREDEFINED_SCALES.find(s => s.note === noteEsp && s.scaleType === type.key);
          return sc ? todayChecked.has(sc.id) : false;
        });
      }
      return true;
    });
  }, [matrixFilter, activePracticeCount, todayChecked]);

  // ── Theory Explorer Calculations ───────────────────────────────────────
  const theory = SCALE_THEORY[theoryType];
  const rootSimple = theoryRoot.split('/')[0];
  const scaleNotesTheory = theory ? getScaleNotes(rootSimple, theoryType) : [];

  return (
    <div className="space-y-6">
      {/* Sub-tabs header & Period Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex gap-1.5 p-1 bg-secondary/40 border border-white/5 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('progreso')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'progreso'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Matriz de Dominio & Progreso
          </button>
          <button
            onClick={() => setActiveTab('teoria')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'teoria'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Compass className="h-4 w-4" />
            Explorador Teórico
          </button>
        </div>

        {/* Temporal Scope Selector (Diario, Semanal, Mensual, Total) */}
        {activeTab === 'progreso' && (
          <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-xl self-start lg:self-auto shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 hidden sm:inline">
              Periodo:
            </span>
            <button
              onClick={() => setProgressPeriod('hoy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                progressPeriod === 'hoy'
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Diario (Hoy)
            </button>
            <button
              onClick={() => setProgressPeriod('semana')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                progressPeriod === 'semana'
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Semanal
            </button>
            <button
              onClick={() => setProgressPeriod('mes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                progressPeriod === 'mes'
                  ? 'bg-amber-500 text-black shadow-sm shadow-amber-500/25 font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Mensual
            </button>
            <button
              onClick={() => setProgressPeriod('todo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                progressPeriod === 'todo'
                  ? 'bg-white/15 text-foreground shadow-sm font-bold border border-white/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              🌟 Total Histórico
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ══ TAB 1: PROGRESO & MATRIZ DE DOMINIO ════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'progreso' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Period Banner Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>
                Visualizando progreso:{' '}
                <strong className="text-foreground">
                  {progressPeriod === 'hoy'
                    ? `Hoy · ${formatDate(effectiveToday)}`
                    : progressPeriod === 'semana'
                    ? `Semana actual · ${weekLabel}`
                    : progressPeriod === 'mes'
                    ? `Mes actual · ${monthLabel}`
                    : 'Todo el Histórico Acumulado'}
                </strong>
              </span>
            </div>
            <span className="font-mono text-[11px] text-foreground/80">
              {practicedScalesCount} escalas · {totalRepsInPeriod} repasos registrados
            </span>
          </div>

          {/* Top KPI Cards (Adapts to period) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Escalas Practicadas en el Período */}
            <div className="stat-card p-4 relative overflow-hidden group border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {progressPeriod === 'hoy'
                    ? 'Estudiadas Hoy'
                    : progressPeriod === 'semana'
                    ? 'Escalas Esta Semana'
                    : progressPeriod === 'mes'
                    ? 'Escalas Este Mes'
                    : 'Cobertura Histórica'}
                </span>
                <span className="text-xs font-mono font-bold text-primary">{coveragePct}%</span>
              </div>
              <p className="font-mono text-2xl sm:text-3xl font-black text-foreground mt-1">
                {practicedScalesCount}
                <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1">/ {totalScalesCount}</span>
              </p>
              <div className="w-full bg-secondary/60 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-primary rounded-full transition-all duration-500"
                  style={{ width: `${coveragePct}%` }}
                />
              </div>
            </div>

            {/* Repeticiones Totales en el Período */}
            <div className="stat-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-amber-400" /> Repasos Totales
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                  {progressPeriod === 'hoy' ? 'Hoy' : progressPeriod === 'semana' ? 'Semana' : progressPeriod === 'mes' ? 'Mes' : 'Total'}
                </span>
              </div>
              <p className="font-mono text-2xl sm:text-3xl font-black text-amber-300 mt-1">
                {totalRepsInPeriod}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {activeDaysInPeriod} {activeDaysInPeriod === 1 ? 'día con actividad' : 'días con actividad'}
              </p>
            </div>

            {/* Dominadas en el Período */}
            <div
              onClick={() => setMatrixFilter(matrixFilter === 'pending' ? 'all' : 'pending')}
              className={`stat-card p-4 cursor-pointer transition-all hover:border-white/20 ${
                matrixFilter === 'pending' ? 'border-primary ring-1 ring-primary/40' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Target className="h-3.5 w-3.5 text-blue-400" /> Por Comenzar
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">0 reps</span>
              </div>
              <p className="font-mono text-2xl sm:text-3xl font-black text-foreground mt-1">
                {unpracticedScalesCount}
              </p>
              <p className="text-[11px] text-primary/80 mt-1 hover:underline">
                {matrixFilter === 'pending' ? '✓ Filtrando pendientes' : 'Clic para filtrar matriz'}
              </p>
            </div>

            {/* Sesión de Hoy / Activo */}
            <div
              onClick={() => setMatrixFilter(matrixFilter === 'today' ? 'all' : 'today')}
              className={`stat-card p-4 cursor-pointer transition-all hover:border-emerald-500/30 ${
                matrixFilter === 'today' ? 'border-emerald-400 ring-1 ring-emerald-400/40' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Hoy
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-400 font-bold">Activo</span>
              </div>
              <p className="font-mono text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                {todayChecked.size}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {todayChecked.size > 0 ? 'Marcadas en tu sesión' : 'Aún sin repasar hoy'}
              </p>
            </div>
          </div>

          {/* 🎯 Recomendaciones Inteligentes de Práctica */}
          {recommendations.length > 0 && (
            <div className="glass-panel p-4 sm:p-5 rounded-2xl border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-transparent to-primary/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Sugerencias para tu Sesión de Hoy</h3>
                    <p className="text-xs text-muted-foreground">
                      Escalas clave en tonalidades que aún no has explorado para balancear tu dominio musical:
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recommendations.map(scale => {
                  const typeDef = TYPE_COLUMN_DEFS.find(t => t.key === scale.scaleType);
                  const isCheckedToday = todayChecked.has(scale.id);

                  return (
                    <div
                      key={scale.id}
                      className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: `${typeDef?.color ?? '#4ade80'}15`,
                              color: typeDef?.color ?? '#4ade80',
                              border: `1px solid ${typeDef?.color ?? '#4ade80'}30`,
                            }}
                          >
                            {typeDef?.short ?? scale.scaleType}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">0 reps</span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-amber-300 transition-colors">
                          {scale.label}
                        </h4>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                          {scale.note} · {getScaleNotes(scale.noteEN.split('/')[0], scale.scaleType).join(' ')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/5">
                        <button
                          onClick={() => setSelectedScaleForModal(scale)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" /> Ver & Tutorial
                        </button>
                        {onToggleScale && (
                          <button
                            onClick={() => onToggleScale(scale.id)}
                            className={`p-1.5 rounded-lg text-xs transition-all ${
                              isCheckedToday
                                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                                : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground'
                            }`}
                            title={isCheckedToday ? 'Marcada hoy' : 'Marcar como practicada hoy'}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ MATRIZ DE DOMINIO (HEATMAP) ════ */}
          <div className="stat-card p-4 sm:p-5">
            {/* Table controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
              <div>
                <h3 className="section-title text-sm sm:text-base mb-0.5 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> Mapa de Dominio · 12 Tonalidades × 5 Tipos
                </h3>
                <p className="text-xs text-muted-foreground">
                  {progressPeriod === 'hoy'
                    ? 'Mostrando actividad registrada exclusivamente hoy.'
                    : progressPeriod === 'semana'
                    ? `Mostrando actividad registrada durante esta semana (${weekLabel}).`
                    : progressPeriod === 'mes'
                    ? `Mostrando actividad registrada durante este mes (${monthLabel}).`
                    : 'Mostrando todo el historial acumulado. Haz clic en cualquier casilla para ver notas o practicar.'}
                </p>
              </div>

              {/* Matrix filters */}
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 self-start md:self-auto">
                <button
                  onClick={() => setMatrixFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    matrixFilter === 'all'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Todas (12)
                </button>
                <button
                  onClick={() => setMatrixFilter('pending')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                    matrixFilter === 'pending'
                      ? 'bg-amber-500 text-black font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Target className="h-3 w-3" /> Solo pendientes
                </button>
                <button
                  onClick={() => setMatrixFilter('today')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                    matrixFilter === 'today'
                      ? 'bg-emerald-500 text-white font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sparkles className="h-3 w-3" /> Practicadas hoy
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full border-separate border-spacing-1.5 sm:border-spacing-2 min-w-[620px]">
                <thead>
                  <tr>
                    {/* Corner / Note column */}
                    <th className="text-left font-mono text-xs uppercase tracking-wider text-muted-foreground pb-2 px-2 w-28">
                      Nota / Tónica
                    </th>

                    {/* Column Headers for each of the 5 types with DISTINCT, CLEAR LABELS */}
                    {TYPE_COLUMN_DEFS.map(col => {
                      const stat = byTypeStats[col.key];
                      const pct = Math.round(((stat?.practicedCount ?? 0) / 12) * 100);

                      return (
                        <th key={col.key} className="text-center pb-2 px-1">
                          <div className="flex flex-col items-center">
                            <span
                              className="text-xs sm:text-sm font-bold tracking-tight"
                              style={{ color: col.color }}
                            >
                              {col.short}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {stat?.practicedCount ?? 0}/12
                              </span>
                              <span className="text-[9px] font-mono px-1 rounded bg-white/5 text-foreground/70">
                                {pct}%
                              </span>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {visibleNotesIndices.map(noteIdx => {
                    const noteEsp = NOTES[noteIdx];
                    const noteEN = NOTES_EN[noteIdx];
                    const noteStat = byNoteStats[noteEN];
                    const notePracticedCount = noteStat?.practicedCount ?? 0;
                    const isFullyMasteredNote = notePracticedCount === 5;

                    return (
                      <tr key={noteEN} className="group/row">
                        {/* Note header row */}
                        <td className="pr-2 py-0.5">
                          <div className="flex items-center justify-between bg-white/[0.03] group-hover/row:bg-white/[0.06] p-1.5 rounded-lg border border-white/5 transition-colors">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-mono text-xs sm:text-sm font-bold text-foreground">
                                {noteEN.split('/')[0]}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate">
                                ({noteEsp.split('/')[0]})
                              </span>
                            </div>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                isFullyMasteredNote
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : notePracticedCount > 0
                                  ? 'bg-amber-500/10 text-amber-300'
                                  : 'text-muted-foreground/60'
                              }`}
                            >
                              {notePracticedCount}/5
                            </span>
                          </div>
                        </td>

                        {/* 5 Cells for this Note */}
                        {TYPE_COLUMN_DEFS.map(col => {
                          const scale = PREDEFINED_SCALES.find(
                            s => s.note === noteEsp && s.scaleType === col.key
                          );
                          const scaleId = scale?.id || `${noteEsp}-${col.key}`;
                          const reps = activePracticeCount[scaleId] ?? 0;
                          const totalRepsAllTime = practiceCount[scaleId] ?? 0;
                          const isCheckedToday = todayChecked.has(scaleId);
                          const hasVideo = Boolean(scaleVideos[scaleId]);

                          // Mastery level styling
                          let cellBg = 'bg-secondary/30 border-white/5 text-muted-foreground/40 hover:border-white/20';
                          let badge = null;

                          if (reps >= 5) {
                            cellBg =
                              'bg-gradient-to-r from-amber-500/30 to-amber-400/20 border-amber-400/50 text-amber-200 shadow-sm shadow-amber-500/10 hover:border-amber-300';
                            badge = <span className="font-mono font-black text-xs">{reps}×</span>;
                          } else if (reps >= 2) {
                            cellBg =
                              'bg-amber-400/15 border-amber-400/30 text-amber-300 hover:border-amber-400/60';
                            badge = <span className="font-mono font-bold text-xs">{reps}×</span>;
                          } else if (reps === 1) {
                            cellBg =
                              'bg-amber-400/10 border-amber-400/20 text-amber-400/90 hover:border-amber-400/40';
                            badge = <span className="font-mono text-xs">1×</span>;
                          } else {
                            badge = <span className="text-muted-foreground/30 text-xs">·</span>;
                          }

                          return (
                            <td key={col.key} className="p-0.5">
                              <button
                                onClick={() => scale && setSelectedScaleForModal(scale)}
                                className={`w-full h-8 sm:h-9 rounded-lg border flex items-center justify-center relative transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${cellBg} ${
                                  isCheckedToday
                                    ? 'ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.35)]'
                                    : ''
                                }`}
                                title={`${scale?.label || col.short}: ${
                                  reps > 0 ? `${reps} prácticas en este período` : 'Sin practicar en este período'
                                }${totalRepsAllTime > 0 ? ` (${totalRepsAllTime} total histórico)` : ''}${
                                  isCheckedToday ? ' · Practicada hoy ✨' : ''
                                }`}
                              >
                                {badge}

                                {isCheckedToday && (
                                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-background animate-pulse" />
                                )}

                                {hasVideo && !isCheckedToday && (
                                  <span className="absolute bottom-1 right-1 w-1 h-1 bg-red-400/80 rounded-full" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Visual Legend */}
            <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="font-bold text-foreground/80 uppercase tracking-wider text-[10px]">
                  Niveles de dominio:
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-secondary/40 border border-white/5 flex items-center justify-center text-[9px] text-muted-foreground">
                    ·
                  </div>
                  <span>Sin practicar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-amber-400/10 border border-amber-400/20 text-[9px] text-amber-300 font-mono flex items-center justify-center">
                    1
                  </div>
                  <span>Iniciada (1×)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-amber-400/20 border border-amber-400/40 text-[9px] text-amber-300 font-bold flex items-center justify-center">
                    2+
                  </div>
                  <span>En desarrollo (2-4×)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-amber-500/40 border border-amber-300 text-[9px] text-amber-200 font-black flex items-center justify-center">
                    5+
                  </div>
                  <span>Dominada (5+×)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-emerald-500/30 border border-emerald-400 ring-1 ring-emerald-400 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-emerald-400 font-medium">✨ Practicada hoy</span>
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground/70">
                Punto rojo = Tutorial disponible
              </div>
            </div>
          </div>

          {/* ════ BREAKDOWN BY TYPE & TOP PRACTICED ════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Por tipo de escala */}
            <div className="stat-card p-4 sm:p-5">
              <h4 className="section-title text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Progreso por Tipo de Escala ({progressPeriod === 'todo' ? 'Total' : progressPeriod === 'mes' ? 'Este Mes' : progressPeriod === 'semana' ? 'Esta Semana' : 'Hoy'})
              </h4>
              <div className="space-y-3">
                {TYPE_COLUMN_DEFS.map(col => {
                  const stat = byTypeStats[col.key];
                  const practiced = stat?.practicedCount ?? 0;
                  const total = 12;
                  const pct = Math.round((practiced / total) * 100);

                  return (
                    <div key={col.key} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold" style={{ color: col.color }}>
                          {col.label}
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-foreground font-bold">{practiced} de 12</span>
                          <span className="text-muted-foreground">({pct}%)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-secondary/40 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: col.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Escalas Más Repasadas en el Período */}
            <div className="stat-card p-4 sm:p-5">
              <h4 className="section-title text-sm mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" /> Top Escalas ({progressPeriod === 'todo' ? 'Histórico' : progressPeriod === 'mes' ? 'Este Mes' : progressPeriod === 'semana' ? 'Esta Semana' : 'Hoy'})
              </h4>

              {topPracticed.length > 0 ? (
                <div className="space-y-2.5">
                  {topPracticed.map(({ scale, reps }, i) => {
                    const typeDef = TYPE_COLUMN_DEFS.find(t => t.key === scale!.scaleType);
                    const isCheckedToday = todayChecked.has(scale!.id);

                    return (
                      <div
                        key={scale!.id}
                        onClick={() => setSelectedScaleForModal(scale as PredefinedScale)}
                        className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-base shrink-0">
                            {['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                              {scale!.label}
                            </p>
                            <p className="text-[10px] text-muted-foreground" style={{ color: typeDef?.color }}>
                              {typeDef?.label ?? scale!.scaleType}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isCheckedToday && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                              Hoy ✨
                            </span>
                          )}
                          <span className="font-mono text-xs sm:text-sm font-bold text-amber-300">
                            {reps}×
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No se registraron prácticas en este período seleccionado.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ══ TAB 2: EXPLORADOR TEÓRICO ══════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'teoria' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass-panel border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 pointer-events-none">
              <Music2 className="h-40 w-40" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
                    <Sparkles className="h-3.5 w-3.5" /> Explorador Teórico
                  </div>
                  <h2 className="text-3xl font-black text-foreground tracking-tight">
                    Escala de{' '}
                    <span className="text-primary underline underline-offset-8 decoration-primary/30">
                      {rootSimple} {theory?.label}
                    </span>
                  </h2>
                </div>

                <div className="flex gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest ml-1">
                      Nota Tónica
                    </label>
                    <select
                      value={theoryRoot}
                      onChange={e => setTheoryRoot(e.target.value)}
                      className="bg-black/40 text-foreground rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:border-primary/50 outline-none transition-all cursor-pointer hover:bg-black/60 min-w-[120px]"
                    >
                      {NOTES_EN.map(n => (
                        <option key={n} value={n.split('/')[0]}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest ml-1">
                      Estructura
                    </label>
                    <select
                      value={theoryType}
                      onChange={e => setTheoryType(e.target.value)}
                      className="bg-black/40 text-foreground rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:border-primary/50 outline-none transition-all cursor-pointer hover:bg-black/60 min-w-[160px]"
                    >
                      {SCALE_TYPE_OPTIONS.map(t => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {theory && (
                <div className="flex flex-col md:flex-row gap-6 pt-4 border-t border-white/5">
                  <div className="flex-1">
                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                      {theory.description}
                    </p>
                  </div>
                  <div className="flex gap-4 shrink-0">
                    <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Notas</p>
                      <p className="text-xl font-black text-primary">{scaleNotesTheory.length}</p>
                    </div>
                    <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Tipo</p>
                      <p className="text-xl font-black text-foreground">
                        {scaleNotesTheory.length === 5
                          ? 'Penta'
                          : scaleNotesTheory.length === 6
                          ? 'Hexa'
                          : 'Hepta'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {theory && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <div className="stat-card p-8 bg-gradient-to-b from-secondary/20 to-transparent relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold">
                      Distribución de Grados
                    </h4>
                    <div className="flex items-center gap-2">
                      <Binary className="h-3 w-3 text-primary/60" />
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Fórmula: {theory.degrees.join(' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end gap-2 px-2 relative">
                    <div className="absolute bottom-[2.25rem] left-0 w-full h-[2px] bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 -z-0" />

                    {scaleNotesTheory.map((note, i) => (
                      <div
                        key={i}
                        className="relative z-10 flex flex-col items-center gap-4 flex-1 max-w-[80px]"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-all duration-300 shadow-lg group-hover:-translate-y-1 ${
                            i === 0
                              ? 'bg-primary text-primary-foreground scale-110 shadow-primary/20'
                              : 'bg-secondary text-foreground/80 border border-white/10'
                          }`}
                        >
                          {theory.degrees[i] ?? '8'}
                        </div>

                        <div
                          className={`h-10 min-w-[2.5rem] px-2 rounded-xl border-2 flex items-center justify-center font-mono text-sm font-bold bg-black shadow-xl ${
                            i === 0
                              ? 'border-primary text-primary shadow-primary/10'
                              : 'border-white/20 text-foreground/90'
                          }`}
                        >
                          {note}
                          {theory.chords?.[i] ?? ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="stat-card p-6">
                  <h4 className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold mb-6">
                    Estructura Interválica
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        {theory.steps.map((step, i) => (
                          <div key={i} className="flex-1">
                            <div
                              className={`h-12 rounded-xl flex flex-col items-center justify-center font-black relative group cursor-help transition-all hover:scale-105 ${
                                STEP_COLORS[step] ?? 'bg-secondary'
                              }`}
                            >
                              <span className="text-sm">{step}</span>
                              <span className="text-[8px] opacity-60 uppercase">{STEP_LABELS[step]}</span>

                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                                {theory.semitones[i]} semitonos
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-muted-foreground uppercase tracking-widest px-1">
                        <span>Inicio</span>
                        <span>Octava</span>
                      </div>
                    </div>

                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3">
                      <p className="text-[10px] text-primary/80 font-bold uppercase tracking-widest">Leyenda</p>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center gap-3 text-[11px]">
                          <div className="w-4 h-4 rounded-md bg-primary/70" />
                          <span className="text-foreground/70">
                            <strong>Tono:</strong> Salto de 2 trastes / notas
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <div className="w-4 h-4 rounded-md bg-amber-400/80" />
                          <span className="text-foreground/70">
                            <strong>Semitono:</strong> Salto de 1 traste / nota
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <div className="w-4 h-4 rounded-md bg-purple-400/80" />
                          <span className="text-foreground/70">
                            <strong>Aumentado:</strong> Salto de 3 semitonos
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="stat-card p-6 border-l-4 border-l-primary/30">
                  <div className="flex items-center gap-2 mb-4">
                    <ListMusic className="h-4 w-4 text-primary" />
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
                      Transporte Cromático
                    </h4>
                  </div>

                  <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {NOTES_EN.map(n => {
                      const r = n.split('/')[0];
                      const notes = getScaleNotes(r, theoryType);
                      const isSelected = r === rootSimple;
                      const practiced = practiceCount[`${n}-${theoryType}`] ?? 0;

                      return (
                        <button
                          key={n}
                          onClick={() => setTheoryRoot(r)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl transition-all group ${
                            isSelected
                              ? 'bg-primary/20 border border-primary/30'
                              : 'hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`font-mono text-sm w-8 text-left ${
                                isSelected
                                  ? 'text-primary font-black'
                                  : 'text-muted-foreground group-hover:text-foreground'
                              }`}
                            >
                              {r}
                            </span>
                            <div className="flex gap-1.5 flex-wrap ml-1">
                              {notes.map((note, i) => (
                                <span
                                  key={i}
                                  className={`text-[10px] font-mono ${
                                    i === 0 ? 'text-primary/70' : 'text-foreground/40'
                                  }`}
                                >
                                  {note}
                                  {theory.chords?.[i] ?? ''}
                                </span>
                              ))}
                            </div>
                          </div>
                          {practiced > 0 && (
                            <span className="text-[9px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                              {practiced}×
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="stat-card p-6 bg-amber-500/5 border-amber-500/20">
                  <div className="flex items-center gap-2 mb-3 text-amber-500">
                    <Info className="h-4 w-4" />
                    <h4 className="text-[10px] uppercase tracking-widest font-bold">Tip de Práctica</h4>
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed italic">
                    "Para dominar la escala de {rootSimple} {theory.label}, practica primero lentamente enfocándote en la digitación y la claridad de cada nota antes de subir el tempo."
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ══ MODAL INTERACTIVO DE DETALLE & ACCIÓN RÁPIDA DE ESCALA ═════════ */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={Boolean(selectedScaleForModal)}
        onOpenChange={open => {
          if (!open) setSelectedScaleForModal(null);
        }}
      >
        <DialogContent className="bg-card border-border sm:max-w-xl max-h-[90vh] overflow-y-auto">
          {selectedScaleForModal && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  {(() => {
                    const col = TYPE_COLUMN_DEFS.find(t => t.key === selectedScaleForModal.scaleType);
                    return (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${col?.color ?? '#4ade80'}15`,
                          color: col?.color ?? '#4ade80',
                          border: `1px solid ${col?.color ?? '#4ade80'}30`,
                        }}
                      >
                        {col?.label ?? selectedScaleForModal.scaleType}
                      </span>
                    );
                  })()}
                  {todayChecked.has(selectedScaleForModal.id) && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Practicada Hoy ✨
                    </span>
                  )}
                </div>
                <DialogTitle className="text-2xl font-black text-foreground">
                  {selectedScaleForModal.label}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Tónica: {selectedScaleForModal.note} ({selectedScaleForModal.noteEN})
                </DialogDescription>
              </DialogHeader>

              {/* Stats & Practice Count */}
              <div className="grid grid-cols-3 gap-2.5 bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">
                    {progressPeriod === 'todo' ? 'Total Histórico' : 'En este período'}
                  </p>
                  <p className="font-mono text-xl font-bold text-amber-300 mt-0.5">
                    {activePracticeCount[selectedScaleForModal.id] ?? 0}×
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Estado</p>
                  <p className="text-xs font-semibold mt-1">
                    {(practiceCount[selectedScaleForModal.id] ?? 0) >= 3 ? (
                      <span className="text-emerald-400">Dominada</span>
                    ) : (practiceCount[selectedScaleForModal.id] ?? 0) > 0 ? (
                      <span className="text-amber-400">En desarrollo</span>
                    ) : (
                      <span className="text-muted-foreground">Pendiente</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Última vez</p>
                  <p className="text-xs font-semibold mt-1 text-foreground/80 truncate">
                    {todayChecked.has(selectedScaleForModal.id)
                      ? 'Hoy'
                      : lastPracticed[selectedScaleForModal.id] || 'Nunca'}
                  </p>
                </div>
              </div>

              {/* Scale Notes Pills */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Secuencia de Notas</span>
                  <span className="text-[10px] font-normal text-primary">
                    {selectedScaleNotes.length} notas
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedScaleNotes.map((note, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col items-center justify-center w-11 h-12 rounded-xl border ${
                        idx === 0
                          ? 'bg-primary text-primary-foreground border-primary font-black shadow-md shadow-primary/20'
                          : 'bg-black/60 border-white/10 text-foreground font-bold'
                      }`}
                    >
                      <span className="text-xs font-mono">{note}</span>
                      <span className="text-[8px] opacity-70">
                        {SCALE_THEORY[selectedScaleForModal.scaleType]?.degrees[idx] ?? `${idx + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progression / Chords if available */}
              {selectedProgression && (
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Progresión / Acordes Sugeridos
                  </p>
                  <p className="font-mono text-sm text-foreground/90 font-medium">{selectedProgression}</p>
                </div>
              )}

              {/* YouTube Video Player if available */}
              {selectedVideoUrl && ytVideoId && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Play className="h-3.5 w-3.5 text-red-400" /> Video Tutorial
                  </p>
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-video relative shadow-lg">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytVideoId}`}
                      className="absolute inset-0 w-full h-full border-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-white/10">
                {onToggleScale && (
                  <button
                    onClick={() => onToggleScale(selectedScaleForModal.id)}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      todayChecked.has(selectedScaleForModal.id)
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600'
                        : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    {todayChecked.has(selectedScaleForModal.id)
                      ? '✓ Practicada hoy (Clic para desmarcar)'
                      : 'Marcar como practicada hoy'}
                  </button>
                )}

                {onGoToPracticeTab && (
                  <button
                    onClick={() => {
                      const name = selectedScaleForModal.label;
                      setSelectedScaleForModal(null);
                      onGoToPracticeTab(name);
                    }}
                    className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-white/5 hover:bg-white/10 text-foreground flex items-center justify-center gap-2 border border-white/10 transition-colors"
                  >
                    Ver en Práctica <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
