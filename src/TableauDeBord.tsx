import { useState } from 'react'

type Props = {
  nom: string
  role?: string
  onDeconnexion: () => void
}

// Menu de navigation (les sections en construction s'ouvriront plus tard)
const MENU = [
  { id: 'tableau', label: 'Tableau de bord', icone: '📊' },
  { id: 'actions', label: 'Mes actions', icone: '✅' },
  { id: 'contribution', label: 'Contribution stratégique', icone: '🎯' },
  { id: 'activites', label: 'Activités', icone: '📅' },
  { id: 'veille', label: 'Veille', icone: '🔎' },
  { id: 'equipe', label: "Performance d'équipe", icone: '👥' },
  { id: 'rapports', label: 'Rapports', icone: '📄' },
]

// Configuration visuelle des statuts d'action
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

  // Données d'exemple (réelles avec Supabase plus tard)
  const score = 82
  const stats = [
    { libelle: 'Actions en cours', valeur: '4', icone: '🔵' },
    { libelle: 'Terminées', valeur: '2', icone: '✅' },
    { libelle: 'En retard', valeur: '1', icone: '⚠️' },
    { libelle: 'Bloquées', valeur: '1', icone: '⛔' },
  ]
  const evolution = [
    { s: 'S1', v: 60 },
    { s: 'S2', v: 68 },
    { s: 'S3', v: 73 },
    { s: 'S4', v: 82 },
  ]
  const actions = [
    { titre: 'Collecte de données', axe: 'SNIF · Domaine 6', statut: 'en_cours', pct: 75, echeance: '15/08/2026' },
    { titre: 'Guide pédagogique', axe: 'PNEF · Axe 2', statut: 'termine', pct: 100, echeance: '01/07/2026' },
    { titre: 'Rapport trimestriel', axe: 'Plan BRH · Objectif 3', statut: 'en_cours', pct: 90, echeance: '30/07/2026' },
  ]

  // Jauge circulaire
  const rayon = 52
  const circ = 2 * Math.PI * rayon
  const offset = circ * (1 - score / 100)

  // Mini-graphique
  const coord = (v: number, i: number) => ({ x: 12 + i * 92, y: 90 - (v / 100) * 78 })
  const ligne = evolution.map((p, i) => { const c = coord(p.v, i); return `${c.x},${c.y}` }).join(' ')
  const aire = `M12,90 ${ligne} 288,90 Z`

  const titrePage = MENU.find((m) => m.id === pageActive)?.label ?? ''

  return (
    <div className="min-h-screen bg-brh-bg lg:flex">
      {/* ═══════════ SIDEBAR ═══════════ */}
      {menuOuvert && (
        <div
          onClick={() => setMenuOuvert(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-gradient-to-b from-brh-primary to-brh-deep text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          menuOuvert ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo + nom */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex items-center justify-center rounded-lg bg-white p-1.5" style={{ height: 40, width: 40 }}>
            <img src="/logo-brh.jpg" alt="BRH" className="h-full w-full object-contain" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">SPS-UIF</p>
            <p className="text-[11px] text-white/50">Banque de la République d'Haïti</p>
          </div>
        </div>

        {/* Navigation */}
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
                <span className="text-base">{m.icone}</span>
                {m.label}
                {actif && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brh-secondary" />}
              </button>
            )
          })}
        </nav>

        {/* Profil en bas */}
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
          <button
            onClick={onDeconnexion}
            className="mt-3 w-full rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ═══════════ ZONE PRINCIPALE ═══════════ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre du haut */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-brh-border bg-white/90 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOuvert(true)}
              className="rounded-lg border border-brh-border p-2 text-brh-text lg:hidden"
              aria-label="Ouvrir le menu"
            >
              ☰
            </button>
            <h2 className="text-base font-semibold text-brh-primary">{titrePage}</h2>
          </div>
          <span className="rounded-full bg-brh-bg px-3 py-1 text-xs font-medium text-brh-text/70">
            Trimestre 2 · 2026
          </span>
        </header>

        {/* Contenu */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
          {pageActive === 'tableau' ? (
            <div className="space-y-6">
              {/* En-tête */}
              <div>
                <h1 className="text-2xl font-bold text-brh-primary">Bonjour, {prenom} 👋</h1>
                <p className="mt-1 text-sm text-brh-text/60">
                  Voici votre performance au sein de l'Unité d'Inclusion Financière.
                </p>
              </div>

              {/* Performance trimestrielle (jauge) */}
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="flex items-center gap-6 rounded-2xl border border-brh-border bg-white p-6 shadow-sm">
                  <div className="relative shrink-0" style={{ height: 128, width: 128 }}>
                    <svg viewBox="0 0 128 128" className="h-32 w-32 -rotate-90">
                      <circle cx="64" cy="64" r={rayon} fill="none" stroke="#e2e8f0" strokeWidth="12" />
                      <circle
                        cx="64" cy="64" r={rayon} fill="none" stroke="#12355B" strokeWidth="12"
                        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-brh-primary">{score}%</span>
                      <span className="text-[11px] text-brh-muted">provisoire</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brh-text/70">Ma performance trimestrielle</p>
                    <p className="mt-1 text-xs text-brh-muted">Trimestre 2 · Avril–Juin 2026</p>
                    <span className="mt-3 inline-block rounded-full bg-brh-warning/10 px-3 py-1 text-xs font-medium text-brh-warning">
                      En attente de validation
                    </span>
                  </div>
                </div>

                {/* Graphique */}
                <div className="rounded-2xl border border-brh-border bg-white p-6 shadow-sm lg:col-span-2">
                  <p className="text-sm font-medium text-brh-text/70">Évolution mensuelle</p>
                  <svg viewBox="0 0 300 100" className="mt-4 h-32 w-full" preserveAspectRatio="none">
                    <path d={aire} fill="#12355B" fillOpacity="0.08" />
                    <polyline points={ligne} fill="none" stroke="#12355B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {evolution.map((p, i) => {
                      const c = coord(p.v, i)
                      return <circle key={p.s} cx={c.x} cy={c.y} r="3.5" fill="#12355B" />
                    })}
                  </svg>
                  <div className="mt-2 flex justify-between px-1 text-xs text-brh-muted">
                    {evolution.map((p) => <span key={p.s}>{p.s}</span>)}
                  </div>
                </div>
              </div>

              {/* Cartes KPI */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {stats.map((s) => (
                  <div
                    key={s.libelle}
                    className="rounded-2xl border border-brh-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-wide text-brh-muted">{s.libelle}</p>
                      <span className="text-lg">{s.icone}</span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-brh-primary">{s.valeur}</p>
                  </div>
                ))}
              </div>

              {/* Aperçu des actions */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-brh-primary">Mes actions récentes</h3>
                  <button
                    onClick={() => setPageActive('actions')}
                    className="text-xs font-medium text-brh-primary hover:underline"
                  >
                    Tout voir →
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {actions.map((a) => {
                    const st = STATUTS[a.statut]
                    return (
                      <div
                        key={a.titre}
                        className="rounded-2xl border border-brh-border bg-white p-5 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-brh-text">{a.titre}</p>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${st.cls}`}>
                            {st.label}
                          </span>
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
            /* Sections en construction */
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <div className="text-5xl">🚧</div>
              <h3 className="mt-4 text-lg font-semibold text-brh-primary">{titrePage}</h3>
              <p className="mt-1 max-w-xs text-sm text-brh-text/60">
                Cette section arrive bientôt. On la construira ensemble dans une prochaine étape.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
