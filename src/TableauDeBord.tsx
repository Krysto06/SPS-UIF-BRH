import { useState } from 'react'

type Props = {
  nom: string
  role?: string
  onDeconnexion: () => void
}

// Icônes vectorielles (style ligne, sobres et professionnelles)
function Icone({ nom, className = 'h-5 w-5' }: { nom: string; className?: string }) {
  const c = {
    className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
  switch (nom) {
    case 'tableau':
      return (<svg {...c}><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>)
    case 'actions':
      return (<svg {...c}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" /><path d="m9 14 2 2 4-4" /></svg>)
    case 'contribution':
      return (<svg {...c}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></svg>)
    case 'activites':
      return (<svg {...c}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></svg>)
    case 'veille':
      return (<svg {...c}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>)
    case 'equipe':
      return (<svg {...c}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>)
    case 'rapports':
      return (<svg {...c}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v5h5" /><path d="M8 13h8" /><path d="M8 17h8" /></svg>)
    default:
      return null
  }
}

const MENU = [
  { id: 'tableau', label: 'Tableau de bord' },
  { id: 'actions', label: 'Mes actions' },
  { id: 'contribution', label: 'Contribution stratégique' },
  { id: 'activites', label: 'Activités' },
  { id: 'veille', label: 'Veille' },
  { id: 'equipe', label: "Performance d'équipe" },
  { id: 'rapports', label: 'Rapports' },
]

const STATUTS: Record<string, { label: string; cls: string }> = {
  en_cours: { label: 'En cours', cls: 'bg-blue-50 text-blue-700' },
  termine: { label: 'Terminé', cls: 'bg-brh-success/10 text-brh-success' },
  en_attente: { label: 'En attente', cls: 'bg-gray-100 text-gray-600' },
  bloque: { label: 'Bloqué', cls: 'bg-gray-200 text-gray-800' },
}

export function TableauDeBord({ nom, role = "Membre de l'UIF", onDeconnexion }: Props) {
  const [pageActive, setPageActive] = useState('tableau')
  const [menuOuvert, setMenuOuvert] = useState(false)

  const prenom = nom.split(' ')[0]
  const initiales = nom.split(' ').map((m) => m[0]).slice(0, 2).join('').toUpperCase()

  const score = 82
  const stats = [
    { libelle: 'Actions en cours', valeur: '4', accent: 'bg-brh-primary' },
    { libelle: 'Terminées', valeur: '2', accent: 'bg-brh-success' },
    { libelle: 'En retard', valeur: '1', accent: 'bg-brh-warning' },
    { libelle: 'Bloquées', valeur: '1', accent: 'bg-brh-danger' },
  ]
  const evolution = [
    { s: 'S1', v: 60 }, { s: 'S2', v: 68 }, { s: 'S3', v: 73 }, { s: 'S4', v: 82 },
  ]
  const actions = [
    { titre: 'Collecte de données', axe: 'SNIF · Domaine 6', statut: 'en_cours', pct: 75, echeance: '15/08/2026' },
    { titre: 'Guide pédagogique', axe: 'PNEF · Axe 2', statut: 'termine', pct: 100, echeance: '01/07/2026' },
    { titre: 'Rapport trimestriel', axe: 'Plan BRH · Objectif 3', statut: 'en_cours', pct: 90, echeance: '30/07/2026' },
  ]

  const rayon = 52
  const circ = 2 * Math.PI * rayon
  const offset = circ * (1 - score / 100)

  const coord = (v: number, i: number) => ({ x: 12 + i * 92, y: 90 - (v / 100) * 78 })
  const ligne = evolution.map((p, i) => { const c = coord(p.v, i); return `${c.x},${c.y}` }).join(' ')
  const aire = `M12,90 ${ligne} 288,90 Z`

  const titrePage = MENU.find((m) => m.id === pageActive)?.label ?? ''

  return (
    <div className="min-h-screen bg-brh-bg lg:flex">
      {menuOuvert && (
        <div onClick={() => setMenuOuvert(false)} className="fixed inset-0 z-30 bg-black/40 lg:hidden" />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-gradient-to-b from-brh-primary to-brh-deep text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          menuOuvert ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex items-center justify-center rounded-lg bg-white p-1.5" style={{ height: 40, width: 40 }}>
            <img src="/logo-brh.jpg" alt="BRH" className="h-full w-full object-contain" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">SPS-UIF</p>
            <p className="text-[11px] text-white/50">Banque de la République d'Haïti</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {MENU.map((m) => {
            const actif = m.id === pageActive
            return (
              <button
                key={m.id}
                onClick={() => { setPageActive(m.id); setMenuOuvert(false) }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  actif ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icone nom={m.id} className="h-5 w-5 shrink-0" />
                {m.label}
                {actif && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brh-secondary" />}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brh-secondary text-xs font-bold text-brh-primary">
              {initiales}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">{nom}</p>
              <p className="truncate text-[11px] text-white/50">{role}</p>
            </div>
          </div>
          <button onClick={onDeconnexion} className="mt-3 w-full rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10">
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-brh-border bg-white/90 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOuvert(true)} className="rounded-lg border border-brh-border p-2 text-brh-text lg:hidden" aria-label="Ouvrir le menu">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h2 className="text-base font-semibold text-brh-primary">{titrePage}</h2>
          </div>
          <span className="rounded-full bg-brh-bg px-3 py-1 text-xs font-medium text-brh-muted">Trimestre 2 · 2026</span>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
          {pageActive === 'tableau' ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-brh-primary">Bonjour, {prenom}</h1>
                <p className="mt-1 text-sm text-brh-muted">Voici votre performance au sein de l'Unité d'Inclusion Financière.</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="flex items-center gap-6 rounded-2xl border border-brh-border bg-white p-6 shadow-sm">
                  <div className="relative shrink-0" style={{ height: 128, width: 128 }}>
                    <svg viewBox="0 0 128 128" className="h-32 w-32 -rotate-90">
                      <circle cx="64" cy="64" r={rayon} fill="none" stroke="#e2e8f0" strokeWidth="12" />
                      <circle cx="64" cy="64" r={rayon} fill="none" stroke="#12355B" strokeWidth="12" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-brh-primary">{score}%</span>
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
                  <p className="text-sm font-medium text-brh-text/70">Évolution mensuelle</p>
                  <svg viewBox="0 0 300 100" className="mt-4 h-32 w-full" preserveAspectRatio="none">
                    <path d={aire} fill="#12355B" fillOpacity="0.08" />
                    <polyline points={ligne} fill="none" stroke="#12355B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {evolution.map((p, i) => { const cc = coord(p.v, i); return <circle key={p.s} cx={cc.x} cy={cc.y} r="3.5" fill="#12355B" /> })}
                  </svg>
                  <div className="mt-2 flex justify-between px-1 text-xs text-brh-muted">
                    {evolution.map((p) => <span key={p.s}>{p.s}</span>)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.libelle} className="rounded-2xl border border-brh-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${s.accent}`} />
                      <p className="text-xs font-medium uppercase tracking-wide text-brh-muted">{s.libelle}</p>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-brh-primary">{s.valeur}</p>
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-brh-primary">Mes actions récentes</h3>
                  <button onClick={() => setPageActive('actions')} className="text-xs font-medium text-brh-primary hover:underline">Tout voir →</button>
                </div>
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
                          <span>{a.pct}%</span>
                          <span>Échéance : {a.echeance}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <Icone nom={pageActive} className="h-10 w-10 text-brh-primary/40" />
              <h3 className="mt-4 text-lg font-semibold text-brh-primary">{titrePage}</h3>
              <p className="mt-1 max-w-xs text-sm text-brh-muted">Cette section arrive bientôt. On la construira ensemble dans une prochaine étape.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
