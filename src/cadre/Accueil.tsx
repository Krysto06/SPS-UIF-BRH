import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Hero, Kpi, TitreSection } from '../ui'

const STATUTS: Record<string, { label: string; cls: string }> = {
  en_cours: { label: 'En cours', cls: 'bg-blue-50 text-blue-700' },
  termine: { label: 'Terminé', cls: 'bg-brh-success/10 text-brh-success' },
  en_attente: { label: 'En attente', cls: 'bg-gray-100 text-gray-600' },
  bloque: { label: 'Bloqué', cls: 'bg-gray-200 text-gray-800' },
}

type Action = { titre: string; axe: string; statut: string; pct: number; echeance: string }

// 🏠 Page d'accueil : citation, score, évolution, KPI et actions récentes
export function Accueil({ nom, utilisateurId, onVoirActions }: { nom: string; utilisateurId?: string; onVoirActions: () => void }) {
  const prenom = nom.split(' ')[0]
  const salutation = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir'

  const score = 82
  const couleurScore = score < 50 ? '#E39B9B' : '#12355B' // rouge pâle sous 50 %

  // Évolution : 3 mois en semaines (Avril, Mai, Juin)
  const evolution = [55, 58, 60, 63, 64, 67, 70, 72, 74, 77, 80, 82]
  const n = evolution.length
  const cx = (i: number) => 14 + (i * (332 / (n - 1)))
  const cy = (v: number) => 108 - (v / 100) * 86
  const pts = evolution.map((v, i) => `${cx(i)},${cy(v)}`).join(' ')
  const aire = `M${cx(0)},108 L${pts.split(' ').join(' L')} L${cx(n - 1)},108 Z`

  const rayon = 52
  const circ = 2 * Math.PI * rayon
  const offset = circ * (1 - score / 100)

  // 📥 Actions du cadre, lues depuis Supabase
  const [actions, setActions] = useState<Action[]>([])
  useEffect(() => {
    if (!utilisateurId) return
    supabase
      .from('actions')
      .select('nom, statut, pourcentage, echeance, cadres_strategiques(nom)')
      .eq('user_id', utilisateurId)
      .order('echeance')
      .then(({ data }) => {
        const liste = (data ?? []).map((a: any) => ({
          titre: a.nom,
          axe: a.cadres_strategiques?.nom ?? '—',
          statut: a.statut,
          pct: a.pourcentage ?? 0,
          echeance: a.echeance ? a.echeance.split('-').reverse().join('/') : '',
        }))
        setActions(liste)
      })
  }, [utilisateurId])

  return (
    <div className="space-y-6">
      <Hero salutation={salutation} nom={prenom} eyebrow="Unité d'Inclusion Financière" />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex items-center gap-6 rounded-2xl border border-brh-border bg-white p-6 shadow-sm">
          <div className="relative shrink-0" style={{ height: 128, width: 128 }}>
            <svg viewBox="0 0 128 128" className="h-32 w-32 -rotate-90">
              <circle cx="64" cy="64" r={rayon} fill="none" stroke="#e2e8f0" strokeWidth="12" />
              <circle cx="64" cy="64" r={rayon} fill="none" stroke={couleurScore} strokeWidth="12" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: couleurScore }}>{score}%</span>
              <span className="text-[11px] text-brh-muted">provisoire</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-brh-text/70">Ma performance trimestrielle</p>
            <p className="mt-1 text-xs text-brh-muted">Trimestre 2 · Avril–Juin 2026</p>
            <span className="mt-3 inline-block rounded-full bg-brh-warning/10 px-3 py-1 text-xs font-medium text-brh-warning">En attente de validation</span>
          </div>
        </div>

        <div className="rounded-2xl border border-brh-border bg-white p-6 shadow-sm lg:col-span-2">
          <p className="text-sm font-medium text-brh-text/70">Évolution — 3 mois (par semaine)</p>
          <svg viewBox="0 0 360 120" className="mt-4 h-36 w-full">
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#12355B" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#12355B" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={aire} fill="url(#grad)" />
            <polyline points={pts} fill="none" stroke="#12355B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {evolution.map((v, i) => (
              <circle key={i} cx={cx(i)} cy={cy(v)} r={i === n - 1 ? 4.5 : 2.8} fill={i === n - 1 ? '#C9A227' : '#12355B'} />
            ))}
          </svg>
          <div className="mt-1 flex justify-around text-xs font-medium text-brh-muted">
            <span>Avril</span><span>Mai</span><span>Juin</span>
          </div>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi tone="info" value="4" label="Actions en cours" icon={<svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>} />
        <Kpi tone="success" value="2" label="Terminées" icon={<svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" /></svg>} />
        <Kpi tone="amber" value="1" label="En retard" icon={<svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M10.3 3.5 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>} />
        <Kpi tone="danger" value="1" label="Bloquées" icon={<svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>} />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <TitreSection titre="Mes actions récentes" />
          <button onClick={onVoirActions} className="text-xs font-medium text-brh-primary hover:underline">Tout voir →</button>
        </div>
        {actions.length === 0 && (
          <p className="rounded-2xl border border-dashed border-brh-border bg-white p-6 text-center text-sm text-brh-muted">
            Aucune action enregistrée pour le moment.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          {actions.map((a) => {
            const st = STATUTS[a.statut]
            return (
              <div key={a.titre} className="rounded-2xl border border-brh-border bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-brh-text">{a.titre}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                </div>
                <p className="mt-1 text-xs text-brh-muted">{a.axe}</p>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-brh-bg">
                  <div className="h-full rounded-full bg-brh-primary" style={{ width: `${a.pct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-brh-muted">
                  <span>{a.pct}%</span><span>Échéance : {a.echeance}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
