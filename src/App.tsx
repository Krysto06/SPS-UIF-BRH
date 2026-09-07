function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl mx-auto overflow-hidden rounded-2xl bg-brh-surface shadow-xl border-t-4 border-brh-secondary">

        {/* En-tête institutionnel */}
        <header className="bg-brh-primary px-8 py-10 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-brh-secondary text-3xl">
            🏛️
          </div>
          <h1 className="text-lg font-bold uppercase tracking-wide">
            Banque de la République d'Haïti
          </h1>
          <p className="mt-1 font-medium text-brh-secondary">
            Unité d'Inclusion Financière
          </p>
        </header>

        {/* Corps */}
        <div className="px-8 py-10 text-center">
          <p className="text-xs uppercase tracking-widest text-brh-text/50">
            Plateforme interne
          </p>
          <h2 className="mt-2 text-2xl font-bold text-brh-primary">
            Système de Pilotage Stratégique interne
          </h2>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-brh-text/80">
            Un espace unique pour suivre les actions, mesurer la performance et
            coordonner les activités de l'Unité d'Inclusion Financière.
          </p>
          <button className="mt-8 rounded-lg bg-brh-primary px-8 py-3 font-medium text-white transition hover:bg-brh-primary/90">
            Accéder à la plateforme
          </button>
        </div>

        {/* Note de bas de page */}
        <footer className="border-t border-brh-bg bg-brh-bg/60 px-8 py-5">
          <p className="text-center text-xs leading-relaxed text-brh-text/60">
            Cet outil ne se substitue pas à <span className="font-semibold">Bitrix</span>.
            Il vient en complément, comme instrument interne destiné à faciliter et à
            fluidifier le suivi des activités et de la performance de l'Unité.
          </p>
        </footer>

      </div>
    </div>
  )
}

export default App
