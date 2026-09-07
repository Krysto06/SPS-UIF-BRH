import { useState, type FormEvent } from 'react'

// 👥 Liste des utilisateurs affichés dans le menu déroulant.
//    Pour AJOUTER une personne : copie une ligne et change le nom + le rôle.
const UTILISATEURS = [
  { nom: 'Bolivar Ann Chrissy', role: 'Secrétaire' },
  { nom: 'Dorsainvil Jimy', role: 'Cadre' },
  { nom: 'Elien Kaprysky Krystofia', role: 'Cadre' },
  { nom: 'Siguineau Wilbens', role: 'Cadre' },
  { nom: "Unité d'Inclusion Financière", role: 'Directrice' },
]

// Code par défaut fourni par l'administrateur (PROVISOIRE — géré par Supabase plus tard)
const CODE_PAR_DEFAUT = 'BRH2026'

const champ =
  'w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-brh-text shadow-sm outline-none transition placeholder:text-gray-400 focus:border-brh-primary focus:ring-2 focus:ring-brh-primary/20'
const bouton =
  'w-full rounded-lg bg-brh-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brh-primary/90 active:scale-[.99]'
const label = 'mb-1.5 block text-sm font-medium text-brh-text'

function App() {
  const [etape, setEtape] = useState<'connexion' | 'nouveauCode' | 'accueil'>('connexion')
  const [modeAdmin, setModeAdmin] = useState(false) // false = liste, true = saisie manuelle (gestionnaire)
  const [nom, setNom] = useState('')
  const [code, setCode] = useState('')
  const [nouveauCode, setNouveauCode] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')

  function seConnecter(e: FormEvent) {
    e.preventDefault()
    setErreur('')
    if (nom.trim() === '') {
      setErreur(modeAdmin ? 'Veuillez saisir votre nom.' : 'Veuillez sélectionner votre nom.')
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
    setModeAdmin(false)
    setNom('')
    setCode('')
    setNouveauCode('')
    setConfirmation('')
    setErreur('')
  }

  function basculerModeAdmin() {
    setModeAdmin(!modeAdmin)
    setNom('')
    setErreur('')
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

      {/* ───────── PANNEAU GAUCHE : identité BRH (ordinateur) ───────── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brh-primary to-[#0f2748] p-12 text-white md:flex">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border border-brh-secondary/20" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full border border-brh-secondary/10" />

        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-brh-secondary text-3xl">
            🏛️
          </div>
          <h1 className="mt-6 text-2xl font-bold leading-tight">
            Banque de la République d'Haïti
          </h1>
          <p className="mt-1 font-medium text-brh-secondary">
            Unité d'Inclusion Financière
          </p>
        </div>

        <div className="relative">
          <div className="h-px w-16 bg-brh-secondary" />
          <h2 className="mt-5 text-xl font-semibold">
            Système de Pilotage Stratégique interne
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
            Suivez les actions, mesurez la performance et coordonnez les activités
            de l'UIF — dans un espace unique, clair et sécurisé.
          </p>
        </div>

        <p className="relative max-w-sm text-xs leading-relaxed text-white/50">
          Cet outil ne se substitue pas à Bitrix. Il vient en complément, comme
          instrument interne destiné à faciliter et à fluidifier le suivi des
          activités de l'UIF.
        </p>
      </div>

      {/* ───────── PANNEAU DROIT : formulaire ───────── */}
      <div className="flex items-center justify-center bg-brh-bg p-6 sm:p-12">
        <div className="w-full max-w-sm">

          {/* En-tête compact (téléphone) */}
          <div className="mb-8 text-center md:hidden">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-brh-secondary text-2xl">
              🏛️
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
                  {modeAdmin
                    ? 'Accès réservé au gestionnaire de données.'
                    : 'Sélectionnez votre nom pour accéder à votre espace.'}
                </p>
              </div>

              {/* Nom : liste déroulante OU saisie manuelle (gestionnaire) */}
              <div>
                <label className={label}>Nom</label>
                {modeAdmin ? (
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Nom du gestionnaire"
                    className={champ}
                  />
                ) : (
                  <select
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className={champ}
                  >
                    <option value="">— Sélectionnez votre nom —</option>
                    {UTILISATEURS.map((u) => (
                      <option key={u.nom} value={u.nom}>
                        {u.nom} ({u.role})
                      </option>
                    ))}
                  </select>
                )}
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

              <div className="space-y-2 text-center">
                <p className="text-xs text-brh-text/50">
                  Première connexion ? Utilisez le code fourni par l'administrateur.
                </p>
                <button
                  type="button"
                  onClick={basculerModeAdmin}
                  className="text-xs font-medium text-brh-primary underline underline-offset-2 hover:text-brh-primary/80"
                >
                  {modeAdmin
                    ? '← Revenir à la liste des utilisateurs'
                    : 'Vous êtes le gestionnaire de données ? Connectez-vous ici'}
                </button>
              </div>
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
