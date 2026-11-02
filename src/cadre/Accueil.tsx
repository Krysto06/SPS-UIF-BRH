import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { BAREME, couleurPct, etapeDe } from '../bareme'
import { Hero, Kpi, TitreSection, TRIMESTRE, ANNEE_FISCALE } from '../ui'

const STATUTS: Record<string, { label: string; cls: string }> = {
  en_cours: { label: 'En cours', cls: 'bg-blue-50 text-blue-700' },
  termine: { label: 'Terminé', cls: 'bg-brh-success/10 text-brh-success' },
  en_attente: { label: 'En attente', cls: 'bg-gray-100 text-gray-600' },
  bloque: { label: 'Bloqué', cls: 'bg-gray-200 text-gray-800' },
}

type Action = { titre: string; axe: string; statut: string; pct: number; echeanceIso: string | null; echeance: string }

// 🏠 Page d'accueil du cadre : score réel, répartition par étape, compteurs
// et actions récentes — toutes les valeurs viennent de la base.
export function Accueil({ nom, utilisateurId, onVoirActions }: { nom: string; utilisateurId?: string; onVoirActions: () => void }) {
  const prenom = nom.split(' ')[0]
  const salutation = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir'

  const [actions, setActions] = useState<Action[]>([])
  const [charge, setCharge] = useState(false)
  useEffect(() => {
    if (!utilisateurId) { setCharge(true); return }
    supabase
      .from('actions')
      .select('nom, statut, pourcentage, echeance, cadres_strategiques(nom)')
      .eq('user_id', utilisateurId)
      .order('echeance')
      .then(({ data }) => {
        setActions((data ?? []).map((a: any) => ({
          titre: a.nom,
          axe: a.cadres_strategiques?.nom ?? '—',
          statut: a.statut,
          pct: a.pourcentage ?? 0,
          echeanceIso: a.echeance ?? null,
          echeance: a.echeance ? a.echeance.split('-').reverse().join('/') : '',
        })))
        setCharge(true)
      })
  }, [utilisateurId])

  // Score réel = moyenne de l'avancement de mes actions
  const score = actions.length === 0 ? 0 : Math.round(actions.reduce((s, a) => s + a.pct, 0) / actions.length)
  const couleurScore = couleurPct(score)
  const rayon = 52, circ = 2 * Math.PI * rayon, offset = circ * (1 - score / 100)

  // Compteurs réels
  const today = new Date(new Date().toDateString())
  const enCours = actions.filter((a) => a.pct > 0 && a.pct < 100).length
  const terminees = actions.filter((a) => a.pct >= 100).length
  const enRetard = actions.filter((a) => a.echeanceIso && new Date(a.echeanceIso) < today && a.pct < 100 && a.statut !== 'termine').length
  const bloquees = actions.filter((a) => a.statut === 'bloque').length

  // Répartition par étape du barème
  const maxEtape = Math.max(1, ...BAREME.map((b) => actions.filter((a) => etapeDe(a.pct).v === b.v).length))

  return (
    <div className="space-y-6">
      <Hero salutation={salutation} nom={prenom} eyebrow={`Unité d'Inclusion Financière · ${TRIMESTRE}`} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Score réel */}
        <div className="flex items-center gap-6 rounded-2xl border border-brh-border bg-white p-6 shadow-sm">
          <div className="relative shrink-0" style={{ height: 128, width: 128 }}>
            <svg viewBox="0 0 128 128" className="h-32 w-32 -rotate-90">
              <circle cx="64" cy="64" r={rayon} fill="none" stroke="#e2e8f0" strokeWidth="12" />
              <circle cx="64" cy="64" r={rayon} fill="none" stroke={couleurScore} strokeWidth="12" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.9s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: couleurScore }}>{score}%</span>
              <span className="text-[11px] text-brh-muted">mon avancement</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-brh-text/70">Ma performance trimestrielle</p>
            <p className="mt-1 text-xs text-brh-muted">{TRIMESTRE} · année fiscale {ANNEE_FISCALE}</p>
            <span className="mt-3 inline-block rounded-full bg-brh-primary/5 px-3 py-1 text-xs font-medium text-brh-primary">{actions.length} action{actions.length > 1 ? 's' : ''} suivie{actions.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Répartition par étape (données réelles) */}
        <div className="rounded-2xl border border-brh-border bg-white p-6 shadow-sm lg:col-span-2">
          <p className="text-sm font-medium text-brh-text/70">Répartition de mes actions par étape</p>
          <div className="mt-4 space-y-2.5">
            {BAREME.map((b) => {
              const nb = actions.filter((a) => etapeDe(a.pct).v === b.v).length
              const coul = couleurPct(b.v === 0 ? 1 : b.v)
              return (
                <div key={b.v} className="grid grid-cols-[150px_1fr_28px] items-center gap-3">
                  <span className="truncate text-xs text-brh-text" title={b.label}>{b.label}</span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-brh-bg"><div className="h-full rounded-full transition-all" style={{ width: `${(nb / maxEtape) * 100}%`, background: nb ? coul : 'transparent' }} /></div>
                  <span className="text-right text-xs font-bold tabular-nums" style={{ color: nb ? coul : '#94a3b8' }}>{nb}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Compteurs réels */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi tone="info" value={enCours} label="Actions en cours" icon={<svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>} />
        <Kpi tone="success" value={terminees} label="Terminées" icon={<svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" /></svg>} />
        <Kpi tone="amber" value={enRetard} label="En retard" icon={<svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M10.3 3.5 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>} />
        <Kpi tone="danger" value={bloquees} label="Bloquées" icon={<svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>} />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <TitreSection titre="Mes actions récentes" />
          <button onClick={onVoirActions} className="text-xs font-medium text-brh-primary hover:underline">Tout voir →</button>
        </div>
        {charge && actions.length === 0 && (
          <p className="rounded-2xl border border-dashed border-brh-border bg-white p-6 text-center text-sm text-brh-muted">
            Aucune action ne vous a encore été attribuée.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          {actions.slice(0, 6).map((a) => {
            const st = STATUTS[a.statut] ?? STATUTS.en_attente
            return (
              <div key={a.titre} className="rounded-2xl border border-brh-border bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-brh-text">{a.titre}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                </div>
                <p className="mt-1 text-xs text-brh-muted">{a.axe}</p>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-brh-bg">
                  <div className="h-full rounded-full transition-all" style={{ width: `${a.pct}%`, background: couleurPct(a.pct) }} />
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
