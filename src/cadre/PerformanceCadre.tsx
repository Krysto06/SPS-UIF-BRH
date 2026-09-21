import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { couleurPct } from '../bareme'

const serif = { fontFamily: '"Manrope", "Inter", ui-sans-serif, sans-serif' } as const

type Item = { pct: number; axe: string }
function moyenne(vals: number[]): number { return vals.length === 0 ? 0 : Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) }

// 📊 Performance de l'UIF (cadre) — VISION GLOBALE de l'Unité.
// Volontairement sans détail par collègue : seule la direction voit
// l'avancement individuel. Ici, chacun voit où en est l'Unité.
export function PerformanceCadre() {
  const [items, setItems] = useState<Item[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('actions').select('pourcentage, cadres_strategiques(nom)')
      setItems((data ?? []).map((a: any) => ({ pct: a.pourcentage ?? 0, axe: a.cadres_strategiques?.nom ?? 'Sans axe' })))
      setChargement(false)
    })()
  }, [])

  if (chargement) return <p className="text-center text-sm text-brh-muted">Chargement de la performance…</p>

  const globale = moyenne(items.map((i) => i.pct))
  const total = items.length
  const approuvees = items.filter((i) => i.pct >= 100).length
  const enCours = items.filter((i) => i.pct > 0 && i.pct < 100).length
  const nonEntamees = items.filter((i) => i.pct === 0).length

  const axeAcc: Record<string, number[]> = {}
  items.forEach((i) => { (axeAcc[i.axe] ??= []).push(i.pct) })
  const parAxe = Object.entries(axeAcc).map(([nom, vals]) => ({ nom, moy: moyenne(vals), nb: vals.length })).sort((a, b) => b.moy - a.moy)

  const R = 78, C = 2 * Math.PI * R, off = C * (1 - globale / 100)

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      {/* Bandeau héro : jauge globale de l'Unité */}
      <div className="relative overflow-hidden rounded-[26px] px-6 py-7 text-white shadow-lg sm:px-9" style={{ background: 'linear-gradient(135deg,#12355B,#081A31)' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(600px 320px at 108% -20%, rgba(201,162,39,0.28), transparent 60%)' }} />
        <div className="relative flex flex-col items-center gap-7 sm:flex-row sm:gap-10">
          <div className="relative shrink-0" style={{ height: 196, width: 196 }}>
            <div className="pointer-events-none absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(201,162,39,0.30), transparent 62%)', filter: 'blur(7px)' }} />
            <svg width="196" height="196" viewBox="0 0 196 196" style={{ transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="perfCadreGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F1DA8C" /><stop offset="0.55" stopColor="#E2C766" /><stop offset="1" stopColor="#C9A227" /></linearGradient>
                <filter id="perfCadreGlow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#C9A227" floodOpacity="0.55" /></filter>
              </defs>
              <circle cx="98" cy="98" r={R + 12} fill="none" stroke="rgba(201,162,39,0.22)" strokeWidth="1" />
              <circle cx="98" cy="98" r={R} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="13" />
              <circle cx="98" cy="98" r={R} fill="none" stroke="url(#perfCadreGrad)" strokeWidth="13" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} filter="url(#perfCadreGlow)" style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)' }} />
            </svg>
            <svg width="196" height="196" viewBox="0 0 196 196" className="absolute inset-0">
              <circle cx={98 + R * Math.cos((-90 + 3.6 * globale) * Math.PI / 180)} cy={98 + R * Math.sin((-90 + 3.6 * globale) * Math.PI / 180)} r="5.5" fill="#fff" stroke="#C9A227" strokeWidth="1.5" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[56px] font-extrabold leading-none tracking-tight" style={serif}>{globale}<span className="align-top text-xl font-bold text-brh-gold-light">%</span></span>
              <span className="mt-2.5 h-px w-9 bg-brh-gold-light/60" />
              <span className="mt-2 text-[9.5px] font-semibold uppercase tracking-[0.28em] text-brh-gold-light">Avancement de l'Unité</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brh-gold-light">Unité d'Inclusion Financière · Trimestre 2</p>
            <h1 className="mt-2 text-[26px] font-bold leading-tight" style={serif}>Où en est l'Unité</h1>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/70">La vision d'ensemble de l'avancement collectif du trimestre. Le détail individuel reste suivi par la direction.</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { v: total, l: 'Actions au total' },
                { v: approuvees, l: 'Approuvées' },
                { v: enCours, l: 'En cours' },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur">
                  <p className="text-2xl font-bold leading-none" style={serif}>{s.v}</p>
                  <p className="mt-1 text-[10.5px] leading-tight text-white/60">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Répartition simple */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { v: approuvees, l: 'Approuvées', c: '#1E7A46' },
          { v: enCours, l: 'En cours', c: '#2563EB' },
          { v: nonEntamees, l: 'Pas commencées', c: '#DC6B6B' },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-brh-border bg-white p-4 text-center shadow-sm">
            <p className="text-3xl font-bold leading-none" style={{ ...serif, color: s.c }}>{s.v}</p>
            <p className="mt-1.5 text-[11px] font-medium text-brh-muted">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Par axe stratégique */}
      <div className="rounded-2xl border border-brh-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-[2px] w-3.5 rounded-full bg-brh-secondary" style={{ boxShadow: '0 0 0 3px rgba(201,162,39,0.18)' }} />
          <h3 className="text-[17px] font-semibold text-brh-text" style={serif}>Avancement par axe stratégique</h3>
        </div>
        {parAxe.length === 0 ? <p className="text-sm text-brh-muted">Aucune donnée.</p> : (
          <div className="grid gap-4 sm:grid-cols-2">
            {parAxe.map((a) => {
              const coul = couleurPct(a.moy)
              const r = 30, c = 2 * Math.PI * r, o = c * (1 - a.moy / 100)
              return (
                <div key={a.nom} className="flex items-center gap-4 rounded-2xl border border-brh-border bg-brh-bg/40 p-4">
                  <div className="relative shrink-0" style={{ height: 76, width: 76 }}>
                    <svg width="76" height="76" viewBox="0 0 76 76" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="38" cy="38" r={r} fill="none" stroke="#E6EBF2" strokeWidth="8" />
                      <circle cx="38" cy="38" r={r} fill="none" stroke={coul} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={o} style={{ transition: 'stroke-dashoffset 0.9s ease' }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-bold tabular-nums" style={{ ...serif, color: coul }}>{a.moy}%</span></div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug text-brh-text">{a.nom}</p>
                    <p className="mt-0.5 text-[11px] text-brh-muted">{a.nb} action{a.nb > 1 ? 's' : ''}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
