import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { couleurPct, etapeDe, BAREME } from '../bareme'

const serif = { fontFamily: '"Manrope", "Inter", ui-sans-serif, sans-serif' } as const
function moyenne(vals: number[]): number { return vals.length === 0 ? 0 : Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) }

// 📊 Performance de l'UIF (cadre / secrétaire) — uniquement le % global de
// l'Unité, présenté de façon vivante : jauge animée + parcours du trimestre.
export function PerformanceCadre() {
  const [globale, setGlobale] = useState(0)
  const [affiche, setAffiche] = useState(0)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('actions').select('pourcentage')
      setGlobale(moyenne((data ?? []).map((a: any) => a.pourcentage ?? 0)))
      setChargement(false)
    })()
  }, [])

  // Compteur animé 0 → global
  useEffect(() => {
    if (chargement) return
    let raf = 0
    const t0 = performance.now(), dur = 950
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      setAffiche(Math.round(globale * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [chargement, globale])

  if (chargement) return <p className="text-center text-sm text-brh-muted">Chargement de la performance…</p>

  const R = 90, C = 2 * Math.PI * R, off = C * (1 - globale / 100)
  const etape = etapeDe(globale)
  const reste = 100 - globale
  // index de l'étape actuelle (la plus haute atteinte)
  let idxActuel = 0
  BAREME.forEach((b, i) => { if (globale >= b.v) idxActuel = i })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ── Héro : jauge animée + état ── */}
      <div className="relative overflow-hidden rounded-[28px] px-6 py-9 text-white shadow-lg sm:px-10" style={{ background: 'linear-gradient(135deg,#12355B,#081A31)' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(700px 380px at 112% -25%, rgba(201,162,39,0.30), transparent 60%)' }} />
        <div className="pointer-events-none absolute -left-10 -bottom-16 h-56 w-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(201,162,39,0.10), transparent 70%)' }} />
        <div className="relative flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-12">
          {/* Jauge */}
          <div className="relative shrink-0" style={{ height: 224, width: 224 }}>
            <div className="pointer-events-none absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(201,162,39,0.32), transparent 62%)', filter: 'blur(8px)' }} />
            <svg width="224" height="224" viewBox="0 0 224 224" style={{ transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="pcGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F1DA8C" /><stop offset="0.55" stopColor="#E2C766" /><stop offset="1" stopColor="#C9A227" /></linearGradient>
                <filter id="pcGlow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#C9A227" floodOpacity="0.55" /></filter>
              </defs>
              <circle cx="112" cy="112" r={R + 14} fill="none" stroke="rgba(201,162,39,0.20)" strokeWidth="1" />
              {Array.from({ length: 40 }).map((_, i) => {
                const a = (i / 40) * 2 * Math.PI
                const r1 = R + 9, r2 = R + 12
                return <line key={i} x1={112 + r1 * Math.cos(a)} y1={112 + r1 * Math.sin(a)} x2={112 + r2 * Math.cos(a)} y2={112 + r2 * Math.sin(a)} stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
              })}
              <circle cx="112" cy="112" r={R} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="15" />
              <circle cx="112" cy="112" r={R} fill="none" stroke="url(#pcGrad)" strokeWidth="15" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} filter="url(#pcGlow)" style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)' }} />
            </svg>
            <svg width="224" height="224" viewBox="0 0 224 224" className="absolute inset-0">
              <circle cx={112 + R * Math.cos((-90 + 3.6 * globale) * Math.PI / 180)} cy={112 + R * Math.sin((-90 + 3.6 * globale) * Math.PI / 180)} r="6.5" fill="#fff" stroke="#C9A227" strokeWidth="1.5" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[66px] font-extrabold leading-none tracking-tight" style={serif}>{affiche}<span className="align-top text-2xl font-bold text-brh-gold-light">%</span></span>
              <span className="mt-2.5 h-px w-11 bg-brh-gold-light/60" />
              <span className="mt-2.5 flex flex-col items-center gap-0.5 text-center text-[10px] font-semibold uppercase leading-none tracking-[0.22em] text-brh-gold-light">
                <span className="pl-[0.22em]">Avancement</span>
                <span className="pl-[0.22em]">de l'Unité</span>
              </span>
            </div>
          </div>

          {/* État */}
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brh-gold-light">Unité d'Inclusion Financière · Trimestre 2</p>
            <h1 className="mt-2 text-[27px] font-bold leading-tight" style={serif}>Où en est l'Unité</h1>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: couleurPct(globale) }} />
              <span className="text-sm font-semibold">{etape.label}</span>
            </div>
            <div className="mt-5 flex justify-center gap-3 sm:justify-start">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-center backdrop-blur">
                <p className="text-2xl font-bold leading-none" style={serif}>{globale}%</p>
                <p className="mt-1 text-[10.5px] text-white/60">Chemin parcouru</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-center backdrop-blur">
                <p className="text-2xl font-bold leading-none text-brh-gold-light" style={serif}>{reste}%</p>
                <p className="mt-1 text-[10.5px] text-white/60">Reste à parcourir</p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">Ce pourcentage reflète l'avancement collectif de toutes les actions du trimestre. Le détail de chacun reste suivi par la direction.</p>
          </div>
        </div>
      </div>

      {/* ── Parcours du trimestre (étapes du barème) ── */}
      <div className="rounded-2xl border border-brh-border bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-[2px] w-3.5 rounded-full bg-brh-secondary" style={{ boxShadow: '0 0 0 3px rgba(201,162,39,0.18)' }} />
          <h3 className="text-[17px] font-semibold text-brh-text" style={serif}>Le parcours du trimestre</h3>
        </div>

        <div>
          {BAREME.map((b, i) => {
            const atteint = globale >= b.v
            const actuel = i === idxActuel
            const coul = couleurPct(b.v === 0 ? 1 : b.v)
            const segmentPasse = i < BAREME.length - 1 && globale >= BAREME[i + 1].v
            const dernier = i === BAREME.length - 1
            return (
              <div key={b.v} className="flex gap-4">
                {/* rail : pastille + trait */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center rounded-full border-2 bg-white transition-all"
                    style={{ height: actuel ? 26 : 20, width: actuel ? 26 : 20, borderColor: atteint ? coul : '#cbd5e1', boxShadow: actuel ? `0 0 0 4px ${coul}22` : 'none' }}>
                    {atteint && (actuel
                      ? <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" style={{ color: coul }} fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="6" fill="currentColor" stroke="none" /></svg>
                      : <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="4" style={{ background: coul, borderRadius: 999 }}><path d="M20 6 9 17l-5-5" /></svg>)}
                  </div>
                  {!dernier && <div className="my-1 w-0.5 flex-1" style={{ minHeight: 26, background: segmentPasse ? coul : '#e6ebf2' }} />}
                </div>

                {/* contenu */}
                <div className={`flex-1 ${dernier ? 'pb-0' : 'pb-5'}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-semibold ${atteint ? 'text-brh-text' : 'text-brh-muted'}`}>{b.label}</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums" style={{ background: atteint ? `${coul}16` : '#f1f5f9', color: atteint ? coul : '#94a3b8' }}>{b.v}%</span>
                    {actuel && <span className="rounded-full bg-brh-primary px-2 py-0.5 text-[10px] font-bold text-white">Étape actuelle</span>}
                  </div>
                  <p className={`mt-0.5 text-xs ${atteint ? 'text-brh-muted' : 'text-brh-muted/70'}`}>{b.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
