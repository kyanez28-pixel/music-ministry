import { useMemo, useState } from 'react';
import { SCALE_THEORY, SCALE_TYPE_OPTIONS, HEATMAP_TYPES, NOTES_EN, getScaleNotes } from '@/lib/predefined-scales';
import { formatDuration } from '@/lib/music-utils';

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
        <div className="space-y-4">
          {/* Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Tipo de Escala</p>
              <select value={theoryType} onChange={e=>setTheoryType(e.target.value)}
                className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm border border-border">
                {SCALE_TYPE_OPTIONS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="stat-card">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Nota Tónica</p>
              <select value={theoryRoot} onChange={e=>setTheoryRoot(e.target.value)}
                className="w-full bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm border border-border">
                {NOTES_EN.map(n=><option key={n} value={n.split('/')[0]}>{n}</option>)}
              </select>
            </div>
          </div>

          {theory && (
            <>
              {/* Header */}
              <div className="stat-card" style={{borderColor: theory.color+'44', background: theory.color+'0a'}}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{background: theory.color}} />
                  <h3 className="font-bold text-lg">{rootSimple} {theory.label}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{theory.description}</p>
              </div>

              {/* Interval steps */}
              <div className="stat-card">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Patrón de Intervalos</p>
                <div className="flex items-center gap-1 flex-wrap">
                  {theory.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className={`px-3 py-2 rounded-lg text-xs font-bold text-foreground ${STEP_COLORS[step] ?? 'bg-secondary'}`}>
                        <div className="text-center font-mono">{step}</div>
                        <div className="text-[9px] opacity-70 text-center">{STEP_LABELS[step]}</div>
                      </div>
                      {i < theory.steps.length-1 && <div className="w-3 h-0.5 bg-border" />}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-3 text-[10px] text-muted-foreground">
                  <span><span className="inline-block w-2 h-2 rounded bg-primary/70 mr-1" />T = Tono (2 semitonos)</span>
                  <span><span className="inline-block w-2 h-2 rounded bg-amber-400/80 mr-1" />S = Semitono (1 semitono)</span>
                  <span><span className="inline-block w-2 h-2 rounded bg-purple-400/80 mr-1" />A = 2da Aum (3 semitonos)</span>
                </div>
              </div>

              {/* Scale notes */}
              <div className="stat-card">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
                  Notas de {rootSimple} {theory.label}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {scaleNotes.map((note, i) => (
                    <div key={i} className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border transition-all
                      ${i === 0 ? 'border-primary/60 bg-primary/15' : i === scaleNotes.length-1 ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/40'}`}>
                      <span className="font-mono font-bold text-sm">{note}</span>
                      <span className="text-[9px] text-muted-foreground">{theory.degrees[i] ?? '8'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* All 12 roots */}
              <div className="stat-card">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
                  {theory.label} — En los 12 Tonos
                </p>
                <div className="space-y-1.5">
                  {NOTES_EN.map(n => {
                    const r = n.split('/')[0];
                    const notes = getScaleNotes(r, theoryType);
                    const practiced = practiceCount[`${NOTES_EN.indexOf(n) >= 0 ? '' : ''}${n}-${theoryType}`] ?? 0;
                    return (
                      <div key={n} className="flex items-center gap-2">
                        <span className="font-mono text-xs w-12 shrink-0 text-muted-foreground">{n.split('/')[0]}</span>
                        <div className="flex gap-1 flex-1 flex-wrap">
                          {notes.map((note,i) => (
                            <span key={i} className={`text-xs font-mono px-1.5 py-0.5 rounded ${i===0?'text-primary font-bold':'text-foreground/70'}`}>
                              {note}
                            </span>
                          ))}
                        </div>
                        {practiced > 0 && <span className="text-[9px] text-primary/60 font-mono shrink-0">{practiced}×</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
