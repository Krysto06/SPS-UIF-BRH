function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-brh-surface rounded-xl shadow-lg p-10 max-w-md w-full text-center border-t-4 border-brh-secondary">
        <h1 className="text-3xl font-bold text-brh-primary">SPS-UIF</h1>
        <p className="mt-2 text-brh-text font-medium">
          Système de Pilotage Stratégique
        </p>
        <p className="text-sm text-brh-text/70">
          Unité d'Inclusion Financière — Banque de la République d'Haïti
        </p>
        <button className="mt-8 bg-brh-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brh-primary/90 transition">
          C'est parti 🚀
        </button>
      </div>
    </div>
  )
}

export default App
