type Props = {
  nom: string
  onDeconnexion: () => void
}

export function TableauDeBord({ nom, onDeconnexion }: Props) {
  // Prénom + initiales (pour l'avatar)
  const prenom = nom.split(' ')[0]
  const initiales = nom.split(' ').map((m) => m[0]).slice(0, 2).join('').toUpperCase()

  // Données d'exemple (deviendront réelles avec Supabase)
  const score = 82
  const stats = [
    { libelle: 'Score trimestriel', valeur: '82 %', accent: 'text-brh-primary' },
    { libelle: 'Actions en cours', valeur: '4', accent: 'text-brh-primary' },
    { libelle: 'Terminées', valeur: '2', accent: 'text-brh-success' },
    { libelle: 'En retard', valeur: '1', accent: 'text-brh-danger' },
  ]
  // Points du mini-graphique (semaines S1→S4)
  const evolution = [
    { s: 'S1', v: 60 },
    { s: 'S2', v: 68 },
    { s: 'S3', v: 73 },
    { s: 'S4', v: 82 },
  ]
  const coord = (v: number, i: number) => ({ x: 12 + i * 92, y: 90 - (v / 100) * 78 })
  const ligne = evolution.map((p, i) => { const c = coord(p.v, i); return `${c.x},${c.y}` }).join(' ')
  const aire = `M12,90 ${ligne} 288,90 Z`

  return (
    <div className="min-h-screen bg-brh-bg">
      {/* ───── Barre du haut ───── */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <img src="/logo-brh.jpg" alt="BRH" style={{ height: 30, width: 'auto' }} className="rounded" />
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-bold text-brh-primary">SPS-UIF</p>
              <p className="text-[11px] text-brh-text/50">Unité d'Inclusion Financière</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-brh-text sm:inline">{nom}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brh-primary text-xs font-semibold text-white">
              {initiales}
            </div>
            <button
              onClick={onDeconnexion}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-brh-text transition hover:bg-brh-bg"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* ───── Contenu ───── */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Titre */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brh-primary">Bonjour, {prenom} 👋</h1>
            <p className="mt-1 text-sm text-brh-text/60">
              Votre performance — Trimestre 2 · Avril–Juin 2026
            </p>
          </div>
          <span className="hidden rounded-full bg-brh-warning/10 px-3 py-1 text-xs font-medium text-brh-warning sm:inline">
            En attente de validation
          </span>
        </div>

        {/* Cartes KPI */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.libelle} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-brh-text/50">{s.libelle}</p>
              <p className={`mt-2 text-3xl font-bold ${s.accent}`}>{s.valeur}</p>
            </div>
          ))}
        </div>

        {/* Score + graphique */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {/* Carte de score */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-brh-text/70">Ma performance trimestrielle</p>
            <p className="mt-2 text-4xl font-bold text-brh-primary">{score} %</p>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-brh-bg">
              <div className="h-full rounded-full bg-brh-primary" style={{ width: `${score}%` }} />
            </div>
            <p className="mt-3 text-xs text-brh-text/50">
              Moyenne de l'avancement de vos actions du trimestre.
            </p>
          </div>

          {/* Graphique d'évolution */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <p className="text-sm font-medium text-brh-text/70">Évolution mensuelle</p>
            <svg viewBox="0 0 300 100" className="mt-4 h-32 w-full" preserveAspectRatio="none">
              <path d={aire} fill="#1a365d" fillOpacity="0.08" />
              <polyline points={ligne} fill="none" stroke="#1a365d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {evolution.map((p, i) => {
                const c = coord(p.v, i)
                return <circle key={p.s} cx={c.x} cy={c.y} r="3" fill="#1a365d" />
              })}
            </svg>
            <div className="mt-2 flex justify-between px-1 text-xs text-brh-text/50">
              {evolution.map((p) => (
                <span key={p.s}>{p.s}</span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
