import { useState, type FormEvent } from 'react'

// 👥 Liste des utilisateurs affichés dans le menu déroulant.
const UTILISATEURS = [
  { nom: 'Bolivar Ann Chrissy', role: 'Secrétaire' },
  { nom: 'Dorsainvil Jimy', role: 'Cadre' },
  { nom: 'Elien Kaprysky Krystofia', role: 'Cadre' },
  { nom: "Unité d'Inclusion Financière", role: 'Directrice' },
  { nom: 'Siguineau Wilbens', role: 'Cadre' },
  { nom: 'Victor Ann Valery', role: 'Cadre' },
  { nom: 'Admin', role: 'Gestionnaire de données' },
]

const CODE_PAR_DEFAUT = 'BRH2026'

const champ =
  'w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-brh-text shadow-sm outline-none transition placeholder:text-gray-400 focus:border-brh-primary focus:ring-2 focus:ring-brh-primary/20'
const bouton =
  'w-full rounded-lg bg-brh-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brh-primary/90 active:scale-[.99]'
const label = 'mb-1.5 block text-sm font-medium text-brh-text'

function App() {
  const [etape, setEtape] = useState<'connexion' | 'nouveauCode' | 'accueil'>('connexion')
  const [nom, setNom] = useState('')
  const [code, setCode] = useState('')
  const [nouveauCode, setNouveauCode] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')

  function seConnecter(e: FormEvent) {
    e.preventDefault()
    setErreur('')
    if (nom.trim() === '') {
      setErreur('Veuillez sélectionner votre nom.')
      return
    }
    if (code === CODE_PAR_DEFAUT) {
      setEtape('nouveauCode')
    } else {
      setErreur("Code d'accès incorrect.")
    }
  }

  function definirNouveauCode(e: FormEvent) {
    e.preventDefault()
    setErreur('')
    if (nouveauCode.length < 4) {
      setErreur('Le nouveau code doit contenir au moins 4 caractères.')
      return
    }
    if (nouveauCode !== confirmation) {
      setErreur('Les deux codes ne correspondent pas.')
      return
    }
    setEtape('accueil')
  }

  function seDeconnecter() {
    setEtape('connexion')
    setNom('')
    setCode('')
    setNouveauCode('')
    setConfirmation('')
    setErreur('')
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

      {/* ───────── PANNEAU GAUCHE ───────── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#081428] p-10 text-white md:flex">
        {/* Photo du bâtiment (fond) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'url(/banque-brh.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.35,
          }}
        />
        {/* Voile bleu nuit */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom right, rgba(13,42,82,.82), rgba(11,31,58,.9), rgba(5,13,28,.96))',
          }}
        />
        {/* Lueurs bleues */}
        <div className="pointer-events-none absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />
        {/* Grille bleue */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(120,160,225,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,160,225,.5) 1px, transparent 1px)',
            backgroundSize: '46px 46px',
            maskImage: 'radial-gradient(ellipse at 50% 40%, black 35%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 35%, transparent 75%)',
          }}
        />
        {/* Cercles « radar » (bleus) */}
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/5" />

        {/* Haut : logo (médaillon blanc net) + identité */}
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-2 shadow-lg">
            <img src="/logo-brh.jpg" alt="Logo BRH" className="h-full w-full object-contain" />
          </div>
          <h1 className="mt-5 text-xl font-bold leading-tight">
            Banque de la République d'Haïti
          </h1>
          <p className="mt-1 text-sm font-medium text-brh-secondary">
            Unité d'Inclusion Financière
          </p>
        </div>

        {/* Milieu : accroche + petites cartes */}
        <div className="relative">
          <div className="h-px w-16 bg-gradient-to-r from-white/40 to-transparent" />
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
            Plateforme interne
          </p>
          <h2 className="mt-1 text-base font-semibold">
            Système de Pilotage Stratégique interne
          </h2>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/55">
            Suivez les actions, mesurez la performance et coordonnez les activités
            de l'UIF — dans un espace unique et sécurisé.
          </p>

          <div className="mt-5 space-y-2">
            {[
              'Suivi stratégique en temps réel',
              'Données centralisées et sécurisées',
              'Rapports institutionnels automatisés',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brh-secondary" />
                <span className="text-xs text-white/85">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bas : note + version */}
        <div className="relative space-y-2">
          <p className="max-w-xs text-[11px] leading-relaxed text-white/40">
            Cet outil ne se substitue pas à Bitrix. Il vient en complément, comme
            instrument interne destiné à faciliter le suivi des activités de l'UIF.
          </p>
          <div className="flex items-center justify-between text-[11px] text-white/50">
            <span>© BRH · Unité d'Inclusion Financière</span>
            <span className="rounded-full border border-white/15 px-2 py-0.5">v1.0</span>
          </div>
        </div>
      </div>

      {/* ───────── PANNEAU DROIT : formulaire ───────── */}
      <div className="flex items-center justify-center bg-brh-bg p-6 sm:p-12">
        <div className="w-full max-w-sm">

          {/* En-tête compact (téléphone) */}
          <div className="mb-8 text-center md:hidden">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
              <img src="/logo-brh.jpg" alt="Logo BRH" className="h-full w-full object-contain" />
            </div>
            <h1 className="mt-3 text-sm font-bold uppercase tracking-wide text-brh-primary">
              Banque de la République d'Haïti
            </h1>
            <p className="text-xs font-medium text-brh-secondary">
              Unité d'Inclusion Financière
            </p>
          </div>

          {/* ÉCRAN 1 — Connexion */}
          {etape === 'connexion' && (
            <form onSubmit={seConnecter} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-brh-primary">Connexion</h2>
                <p className="mt-1 text-sm text-brh-text/60">
                  Sélectionnez votre nom pour accéder à votre espace.
                </p>
              </div>

              <div>
                <label className={label}>Nom</label>
                <select
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className={champ}
                >
                  <option value="">— Sélectionnez votre nom —</option>
                  {UTILISATEURS.map((u) => (
                    <option key={u.nom} value={u.nom}>
                      {u.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={label}>Code d'accès</label>
                <input
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="••••••••"
                  className={champ}
                />
              </div>

              {erreur && (
                <p className="rounded-lg bg-brh-danger/10 px-3 py-2 text-sm text-brh-danger">
                  {erreur}
                </p>
              )}

              <button type="submit" className={bouton}>Se connecter</button>

              <p className="text-center text-xs text-brh-text/50">
                Première connexion ? Utilisez le code fourni par l'administrateur.
              </p>
            </form>
          )}

          {/* ÉCRAN 2 — Nouveau code */}
          {etape === 'nouveauCode' && (
            <form onSubmit={definirNouveauCode} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-brh-primary">Choisissez votre code</h2>
                <p className="mt-1 text-sm text-brh-text/60">
                  Pour votre sécurité, définissez un nouveau code personnel.
                </p>
              </div>
              <div>
                <label className={label}>Nouveau code</label>
                <input
                  type="password"
                  value={nouveauCode}
                  onChange={(e) => setNouveauCode(e.target.value)}
                  placeholder="Au moins 4 caractères"
                  className={champ}
                />
              </div>
              <div>
                <label className={label}>Confirmer le code</label>
                <input
                  type="password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="Retapez le nouveau code"
                  className={champ}
                />
              </div>
              {erreur && (
                <p className="rounded-lg bg-brh-danger/10 px-3 py-2 text-sm text-brh-danger">
                  {erreur}
                </p>
              )}
              <button type="submit" className={bouton}>Valider mon code</button>
            </form>
          )}

          {/* ÉCRAN 3 — Accueil */}
          {etape === 'accueil' && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brh-success/10 text-2xl">
                ✅
              </div>
              <div>
                <h2 className="text-xl font-bold text-brh-primary">Bienvenue, {nom}</h2>
                <p className="mt-1 text-sm leading-relaxed text-brh-text/70">
                  Vous êtes connecté(e) au Système de Pilotage Stratégique interne.
                </p>
              </div>
              <button className={bouton}>Accéder à mon tableau de bord</button>
              <button
                onClick={seDeconnecter}
                className="w-full rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-brh-text transition hover:bg-white"
              >
                Se déconnecter
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default App
