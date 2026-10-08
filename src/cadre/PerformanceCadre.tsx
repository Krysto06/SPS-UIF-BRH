import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const serif = { fontFamily: '"Manrope", "Inter", ui-sans-serif, sans-serif' } as const

function moyenne(vals: number[]): number { return vals.length === 0 ? 0 : Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) }

// 📊 Performance de l'UIF (cadre / secrétaire) — UNIQUEMENT le pourcentage
// global de l'Unité. Aucun détail par action ni par collègue : seule la
// direction voit l'avancement individuel.
export function PerformanceCadre() {
  const [globale, setGlobale] = useState(0)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('actions').select('pourcentage')
      setGlobale(moyenne((data ?? []).map((a: any) => a.pourcentage ?? 0)))
      setChargement(false)
    })()
  }, [])

  if (chargement) return <p className="text-center text-sm text-brh-muted">Chargement de la performance…</p>

  const R = 84, C = 2 * Math.PI * R, off = C * (1 - globale / 100)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative overflow-hidden rounded-[26px] px-6 py-10 text-white shadow-lg sm:px-10" style={{ background: 'linear-gradient(135deg,#12355B,#081A31)' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(640px 360px at 110% -20%, rgba(201,162,39,0.26), transparent 60%)' }} />
        <div className="relative flex flex-col items-center text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brh-gold-light">Unité d'Inclusion Financière · Trimestre 2</p>
          <h1 className="mt-2 text-[26px] font-bold leading-tight" style={serif}>Où en est l'Unité</h1>

          {/* Grande jauge — le pourcentage global de l'Unité */}
          <div className="relative my-7" style={{ height: 212, width: 212 }}>
            <div className="pointer-events-none absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(201,162,39,0.32), transparent 62%)', filter: 'blur(8px)' }} />
            <svg width="212" height="212" viewBox="0 0 212 212" style={{ transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="perfCadreGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F1DA8C" /><stop offset="0.55" stopColor="#E2C766" /><stop offset="1" stopColor="#C9A227" /></linearGradient>
                <filter id="perfCadreGlow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#C9A227" floodOpacity="0.55" /></filter>
              </defs>
              <circle cx="106" cy="106" r={R + 13} fill="none" stroke="rgba(201,162,39,0.22)" strokeWidth="1" />
              <circle cx="106" cy="106" r={R} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="14" />
              <circle cx="106" cy="106" r={R} fill="none" stroke="url(#perfCadreGrad)" strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} filter="url(#perfCadreGlow)" style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)' }} />
            </svg>
            <svg width="212" height="212" viewBox="0 0 212 212" className="absolute inset-0">
              <circle cx={106 + R * Math.cos((-90 + 3.6 * globale) * Math.PI / 180)} cy={106 + R * Math.sin((-90 + 3.6 * globale) * Math.PI / 180)} r="6" fill="#fff" stroke="#C9A227" strokeWidth="1.5" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[62px] font-extrabold leading-none tracking-tight" style={serif}>{globale}<span className="align-top text-2xl font-bold text-brh-gold-light">%</span></span>
              <span className="mt-2.5 h-px w-10 bg-brh-gold-light/60" />
              <span className="mt-2.5 flex flex-col items-center gap-0.5 text-center text-[10px] font-semibold uppercase leading-none tracking-[0.22em] text-brh-gold-light">
                <span className="pl-[0.22em]">Avancement</span>
                <span className="pl-[0.22em]">de l'Unité</span>
              </span>
            </div>
          </div>

          <p className="max-w-md text-sm leading-relaxed text-white/75">Ce pourcentage reflète l'avancement collectif de toutes les actions du trimestre. Le détail de chacun reste suivi par la direction.</p>
        </div>
      </div>
    </div>
  )
}
