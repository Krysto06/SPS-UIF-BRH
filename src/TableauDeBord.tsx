type Props = {
  nom: string
  onDeconnexion: () => void
}

export function TableauDeBord({ nom, onDeconnexion }: Props) {
  const score = 82 // donnée d'exemple (deviendra réelle avec Supabase)

  return (
    <div className="min-h-screen bg-brh-bg">
      {/* Barre du haut */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white p-1">
            <img src="/logo-brh.jpg" alt="BRH" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-brh-primary">
              Système de Pilotage Stratégique
            </p>
            <p className="text-xs text-brh-text/60">
              Unité d'Inclusion Financière — BRH
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-brh-text sm:inline">{nom}</span>
          <button
            onClick={onDeconnexion}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-brh-text transition hover:bg-brh-bg"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Contenu */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-xl font-bold text-brh-primary">Bonjour, {nom} 👋</h1>
        <p className="mt-1 text-sm text-brh-text/60">
          Voici votre performance au sein de l'Unité d'Inclusion Financière.
        </p>

        {/* Carte de score */}
        <div className="mt-6 max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-brh-text/70">Ma performance trimestrielle</p>
          <p className="mt-2 text-4xl font-bold text-brh-primary">{score} %</p>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-brh-bg">
            <div className="h-full rounded-full bg-brh-primary" style={{ width: `${score}%` }} />
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-brh-text/60">Trimestre 2 · Avril–Juin 2026</span>
            <span className="rounded-full bg-brh-warning/10 px-2.5 py-0.5 text-xs font-medium text-brh-warning">
              En attente de validation
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
