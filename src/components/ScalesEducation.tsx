import { useMemo, useState } from 'react';
import { SCALE_THEORY, SCALE_TYPE_OPTIONS, HEATMAP_TYPES, NOTES_EN, getScaleNotes } from '@/lib/predefined-scales';
import { formatDuration } from '@/lib/music-utils';
import { Sparkles, Music2, Binary, ListMusic, Info } from 'lucide-react';

const STEP_COLORS: Record<string,string> = { T:'bg-primary/70', S:'bg-amber-400/80', A:'bg-purple-400/80' };
const STEP_LABELS: Record<string,string> = { T:'Tono', S:'Semi', A:'Aum' };

interface Props {
  scaleLogs: any[];
  allScales: any[];
  practiceCount: Record<string, number>;
}

export function ScalesEducation({ scaleLogs, allScales, practiceCount }: Props) {
  const [theoryType, setTheoryType] = useState('mayor');
  const [theoryRoot, setTheoryRoot] = useState('C');

  // ── Progress data ────────────────────────────────────────────────
  const { byType, byNote, top5, heatmap, totalPracticed } = useMemo(() => {
    const byType: Record<string,number> = {};
    const byNote: Record<string,number> = {};
    allScales.forEach(s => {
      const c = practiceCount[s.id] ?? 0;
      if (!c) return;
      byType[s.scaleType] = (byType[s.scaleType] || 0) + c;
      const note = s.noteEN || s.note;
      byNote[note] = (byNote[note] || 0) + c;
    });
    const top5 = Object.entries(practiceCount).sort((a,b)=>b[1]-a[1]).slice(0,5)
      .map(([id,count]) => ({ scale: allScales.find(s=>s.id===id), count }))
      .filter(x=>x.scale);
    // heatmap: noteEN → typeKey → count
    const heatmap: Record<string,Record<string,number>> = {};
    NOTES_EN.forEach(n => { heatmap[n] = {}; });
    allScales.forEach(s => {
      const c = practiceCount[s.id] ?? 0;
      if (!c) return;
      const n = s.noteEN || s.note;
      if (heatmap[n]) heatmap[n][s.scaleType] = (heatmap[n][s.scaleType]||0)+c;
    });
    const totalPracticed = Object.keys(practiceCount).length;
    return { byType, byNote, top5, heatmap, totalPracticed };
  }, [scaleLogs, allScales, practiceCount]);

  const maxType = Math.max(1, ...Object.values(byType));
  const maxNote = Math.max(1, ...Object.values(byNote));
  const maxHeat = Math.max(1, ...Object.values(heatmap).flatMap(r=>Object.values(r)));

  // ── Theory ───────────────────────────────────────────────────────
  const theory = SCALE_THEORY[theoryType];
  const rootSimple = theoryRoot.split('/')[0];
  const scaleNotes = theory ? getScaleNotes(rootSimple, theoryType) : [];
  const [activeTab, setActiveTab] = useState<'progreso'|'teoria'>('progreso');

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-secondary/30 rounded-lg w-fit">
        {(['progreso','teoria'] as const).map(t => (
          <button key={t} onClick={()=>setActiveTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize
              ${activeTab===t ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
            {t === 'progreso' ? '📊 Progreso' : '🎓 Teoría'}
          </button>
        ))}
      </div>

      {/* ══ PROGRESO ══ */}
      {activeTab === 'progreso' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:'Escalas dominadas', val: totalPracticed },
              { label:'Tipos practicados', val: Object.keys(byType).length },
              { label:'Notas practicadas', val: Object.keys(byNote).length+'/12' },
            ].map(s=>(
              <div key={s.label} className="stat-card text-center py-3">
                <p className="font-mono text-2xl font-bold text-primary">{s.val}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <div className="stat-card">
            <p className="section-title text-sm mb-3">Mapa de Práctica · Notas vs Tipos</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr>
                    <th className="text-left text-muted-foreground pr-2 font-mono w-14">Nota</th>
                    {HEATMAP_TYPES.map(t=>(
                      <th key={t} className="text-muted-foreground px-0.5 pb-1 font-normal">
                        {SCALE_THEORY[t]?.label.split(' ')[0] ?? t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {NOTES_EN.map(note=>(
                    <tr key={note}>
                      <td className="font-mono text-muted-foreground pr-2 py-0.5">{note.split('/')[0]}</td>
                      {HEATMAP_TYPES.map(type=>{
                        const c = heatmap[note]?.[type] ?? 0;
                        const alpha = c > 0 ? 0.2 + (c/maxHeat)*0.8 : 0;
                        return (
                          <td key={type} className="px-0.5 py-0.5">
                            <div className="w-full h-5 rounded-sm flex items-center justify-center"
                              style={{ background: c>0 ? `hsl(42 60% 55% / ${alpha})` : 'hsl(var(--secondary))', minWidth:'20px' }}
                              title={c>0 ? `${note} ${SCALE_THEORY[type]?.label}: ${c}×` : ''}>
                              {c>0 && <span className="text-[8px] font-mono text-foreground/80">{c}</span>}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* By Type + By Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="stat-card">
              <p className="section-title text-sm mb-3">Por Tipo de Escala</p>
              <div className="space-y-2">
                {SCALE_TYPE_OPTIONS.filter(t=>byType[t.value]>0).sort((a,b)=>(byType[b.value]||0)-(byType[a.value]||0)).map(t=>(
                  <div key={t.value}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span style={{color: SCALE_THEORY[t.value]?.color}}>{t.label}</span>
                      <span className="font-mono text-muted-foreground">{byType[t.value]}×</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{width:`${(byType[t.value]/maxType)*100}%`, background: SCALE_THEORY[t.value]?.color ?? 'hsl(var(--primary))'}} />
                    </div>
                  </div>
                ))}
                {!Object.keys(byType).length && <p className="text-xs text-muted-foreground text-center py-4">Sin datos aún</p>}
              </div>
            </div>
            <div className="stat-card">
              <p className="section-title text-sm mb-3">Por Nota Tónica</p>
              <div className="space-y-2">
                {NOTES_EN.filter(n=>byNote[n]>0).sort((a,b)=>(byNote[b]||0)-(byNote[a]||0)).map(n=>(
                  <div key={n}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="font-mono">{n.split('/')[0]}</span>
                      <span className="font-mono text-muted-foreground">{byNote[n]}×</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary/70 rounded-full" style={{width:`${(byNote[n]/maxNote)*100}%`}} />
                    </div>
                  </div>
                ))}
                {!Object.keys(byNote).length && <p className="text-xs text-muted-foreground text-center py-4">Sin datos aún</p>}
              </div>
            </div>
          </div>

          {/* Top 5 */}
          {top5.length > 0 && (
            <div className="stat-card">
              <p className="section-title text-sm mb-3">🏆 Más Practicadas</p>
              <div className="space-y-2">
                {top5.map(({scale, count}, i) => (
                  <div key={scale!.id} className="flex items-center gap-3">
                    <span className="text-lg">{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{scale!.label}</p>
                      <p className="text-[10px] text-muted-foreground" style={{color:SCALE_THEORY[scale!.scaleType]?.color}}>
                        {SCALE_THEORY[scale!.scaleType]?.label}
                      </p>
                    </div>
                    <span className="font-mono text-sm text-primary">{count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TEORÍA ══ */}
      {activeTab === 'teoria' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Header & Selectors Panel */}
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
                    Escala de <span className="text-primary underline underline-offset-8 decoration-primary/30">{rootSimple} {theory?.label}</span>
                  </h2>
                </div>
                
                <div className="flex gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest ml-1">Nota Tónica</label>
                    <select value={theoryRoot} onChange={e=>setTheoryRoot(e.target.value)}
                      className="bg-black/40 text-foreground rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:border-primary/50 outline-none transition-all cursor-pointer hover:bg-black/60 min-w-[120px]">
                      {NOTES_EN.map(n=><option key={n} value={n.split('/')[0]}>{n}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest ml-1">Estructura</label>
                    <select value={theoryType} onChange={e=>setTheoryType(e.target.value)}
                      className="bg-black/40 text-foreground rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:border-primary/50 outline-none transition-all cursor-pointer hover:bg-black/60 min-w-[160px]">
                      {SCALE_TYPE_OPTIONS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
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
                      <p className="text-xl font-black text-primary">{scaleNotes.length}</p>
                    </div>
                    <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Tipo</p>
                      <p className="text-xl font-black text-foreground">{scaleNotes.length === 5 ? 'Penta' : scaleNotes.length === 6 ? 'Hexa' : 'Hepta'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {theory && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Main Visualization (Degrees & Notes) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Visual Scale Display */}
                <div className="stat-card p-8 bg-gradient-to-b from-secondary/20 to-transparent relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold">Distribución de Grados</h4>
                    <div className="flex items-center gap-2">
                      <Binary className="h-3 w-3 text-primary/60" />
                      <span className="text-[10px] font-mono text-muted-foreground">Fórmula: {theory.degrees.join(' ')}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end gap-2 px-2 relative">
                    {/* Horizontal Line Connector */}
                    <div className="absolute bottom-[2.25rem] left-0 w-full h-[2px] bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 -z-0" />
                    
                    {scaleNotes.map((note, i) => (
                      <div key={i} className="relative z-10 flex flex-col items-center gap-4 flex-1 max-w-[80px]">
                        {/* Degree */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-all duration-300 shadow-lg group-hover:-translate-y-1
                          ${i === 0 ? 'bg-primary text-primary-foreground scale-110 shadow-primary/20' : 'bg-secondary text-foreground/80 border border-white/10'}`}>
                          {theory.degrees[i] ?? '8'}
                        </div>
                        
                        {/* Note Circle */}
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-sm font-bold bg-black shadow-xl
                          ${i === 0 ? 'border-primary text-primary shadow-primary/10' : 'border-white/20 text-foreground/90'}`}>
                          {note}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interval Pattern Details */}
                <div className="stat-card p-6">
                  <h4 className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold mb-6">Estructura Interválica</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        {theory.steps.map((step, i) => (
                          <div key={i} className="flex-1">
                            <div className={`h-12 rounded-xl flex flex-col items-center justify-center font-black relative group cursor-help transition-all hover:scale-105
                              ${STEP_COLORS[step] ?? 'bg-secondary'}`}>
                              <span className="text-sm">{step}</span>
                              <span className="text-[8px] opacity-60 uppercase">{STEP_LABELS[step]}</span>
                              
                              {/* Hover info tooltip-like behavior via classes */}
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
                          <span className="text-foreground/70"><strong>Tono:</strong> Salto de 2 trastes / notas</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <div className="w-4 h-4 rounded-md bg-amber-400/80" />
                          <span className="text-foreground/70"><strong>Semitono:</strong> Salto de 1 traste / nota</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <div className="w-4 h-4 rounded-md bg-purple-400/80" />
                          <span className="text-foreground/70"><strong>Aumentado:</strong> Salto de 3 semitonos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Info (12 Tones & Context) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Chromatic Context */}
                <div className="stat-card p-6 border-l-4 border-l-primary/30">
                  <div className="flex items-center gap-2 mb-4">
                    <ListMusic className="h-4 w-4 text-primary" />
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Transporte Cromático</h4>
                  </div>
                  
                  <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {NOTES_EN.map(n => {
                      const r = n.split('/')[0];
                      const notes = getScaleNotes(r, theoryType);
                      const isSelected = r === rootSimple;
                      const practiced = practiceCount[`${n}-${theoryType}`] ?? 0;
                      
                      return (
                        <button key={n} onClick={() => setTheoryRoot(r)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl transition-all group
                          ${isSelected ? 'bg-primary/20 border border-primary/30' : 'hover:bg-white/5 border border-transparent'}`}>
                          <div className="flex items-center gap-3">
                            <span className={`font-mono text-sm w-8 text-left ${isSelected ? 'text-primary font-black' : 'text-muted-foreground group-hover:text-foreground'}`}>
                              {r}
                            </span>
                            <div className="flex gap-1">
                              {notes.slice(0, 4).map((note,i) => (
                                <span key={i} className={`text-[10px] font-mono ${i===0?'text-primary/70':'text-foreground/40'}`}>
                                  {note}
                                </span>
                              ))}
                              <span className="text-[10px] text-foreground/20">...</span>
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

                {/* Practical Tip */}
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
    </div>
  );
}
