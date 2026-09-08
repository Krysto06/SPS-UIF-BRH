import { useState, type FormEvent } from 'react'
import { TableauDeBord } from './TableauDeBord'

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
  'w-full rounded-lg border border-brh-border bg-brh-bg/40 px-4 py-3 text-sm text-brh-text outline-none transition placeholder:text-brh-muted/60 focus:border-brh-primary focus:bg-white focus:ring-4 focus:ring-brh-primary/10'
const bouton =
  'w-full rounded-lg bg-brh-primary px-6 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-brh-primary/20 transition hover:bg-brh-deep hover:shadow-xl active:scale-[.99]'
const label = 'mb-2 block text-xs font-semibold uppercase tracking-wide text-brh-muted'

function App() {
  const [etape, setEtape] = useState<'connexion' | 'nouveauCode' | 'accueil' | 'tableauDeBord'>('connexion')
  const [nom, setNom] = useState('')
  const [code, setCode] = useState('')
  const [nouveauCode, setNouveauCode] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')

  function seConnecter(e: FormEvent) {
    e.preventDefault()
    setErreur('')
    if (nom.trim() === '') { setErreur('Veuillez sélectionner votre nom.'); return }
    if (code === CODE_PAR_DEFAUT) { setEtape('nouveauCode') } else { setErreur("Code d'accès incorrect.") }
  }

  function definirNouveauCode(e: FormEvent) {
    e.preventDefault()
    setErreur('')
    if (nouveauCode.length < 4) { setErreur('Le nouveau code doit contenir au moins 4 caractères.'); return }
    if (nouveauCode !== confirmation) { setErreur('Les deux codes ne correspondent pas.'); return }
    setEtape('accueil')
  }

  function seDeconnecter() {
    setEtape('connexion'); setNom(''); setCode(''); setNouveauCode(''); setConfirmation(''); setErreur('')
  }

  if (etape === 'tableauDeBord') {
    const utilisateur = UTILISATEURS.find((u) => u.nom === nom)
    return <TableauDeBord nom={nom} role={utilisateur?.role} onDeconnexion={seDeconnecter} />
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">

      {/* ═══════ PANNEAU GAUCHE : identité, motifs subtils ═══════ */}
      <div className="relative hidden flex-col justify-center overflow-hidden p-14 text-white md:flex">
        {/* Dégradé bleu institutionnel */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #12355B 0%, #0B2545 100%)' }} />
        {/* Motif géométrique très subtil (grille de points) */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        {/* Halo doux pour la profondeur */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at 25% 25%, rgba(201,162,39,0.10), transparent 45%)' }}
        />

        {/* Contenu (hiérarchie BRH → UIF → Système) */}
        <div className="relative max-w-md">
          <div className="inline-flex items-center justify-center rounded-xl bg-white p-2 shadow-lg ring-1 ring-brh-secondary/40" style={{ height: 52, width: 52 }}>
            <img src="/logo-brh.jpg" alt="Logo BRH" className="h-full w-full object-contain" />
          </div>

          <h1 className="mt-8 text-3xl font-bold leading-tight tracking-tight">
            Banque de la République d'Haïti
          </h1>
          <p className="mt-2 text-lg font-medium text-brh-gold-light">
            Unité d'Inclusion Financière
          </p>

          <div className="mt-8 h-px w-14 bg-brh-secondary/60" />
          <h2 className="mt-6 text-lg font-semibold text-white/95">
            Système de Pilotage Stratégique interne
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            Suivre les actions, mesurer la performance et coordonner les activités
            de l'Unité — dans un espace unique, clair et sécurisé.
          </p>
        </div>

        {/* Bas de page discret */}
        <div className="absolute bottom-8 left-14 right-14 space-y-2 text-xs leading-relaxed text-white/40">
          <p>
            Cet outil ne remplace pas Bitrix. Il vient en complément, comme un moyen
            simple de faciliter le suivi et le travail de l'Unité d'Inclusion Financière.
          </p>
          <p>© BRH · Unité d'Inclusion Financière · v1.0</p>
        </div>
      </div>

      {/* ═══════ PANNEAU DROIT : bloc de connexion raffiné ═══════ */}
      <div className="flex items-center justify-center bg-brh-bg p-6 sm:p-12">
        <div className="w-full max-w-sm rounded-2xl border border-brh-border bg-white p-8 shadow-[0_20px_50px_-20px_rgba(18,53,91,0.30)]">

          {/* Logo (téléphone) */}
          <div className="mb-6 flex justify-center md:hidden">
            <div className="flex items-center justify-center rounded-xl border border-brh-border bg-white p-2 shadow-sm" style={{ height: 48, width: 48 }}>
              <img src="/logo-brh.jpg" alt="Logo BRH" className="h-full w-full object-contain" />
            </div>
          </div>

          {/* Mention sécurité */}
          <div className="mb-6 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-brh-muted">
            <span>🔒</span> Espace sécurisé
          </div>

          {/* ÉCRAN 1 — Connexion */}
          {etape === 'connexion' && (
            <form onSubmit={seConnecter} className="space-y-5">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-brh-primary">Connexion</h2>
                <p className="mt-1 text-sm text-brh-muted">
                  Sélectionnez votre nom pour accéder à votre espace.
                </p>
              </div>

              <div>
                <label className={label}>Nom</label>
                <select value={nom} onChange={(e) => setNom(e.target.value)} className={champ}>
                  <option value="">— Sélectionnez votre nom —</option>
                  {UTILISATEURS.map((u) => (
                    <option key={u.nom} value={u.nom}>{u.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={label}>Code d'accès</label>
                <input type="password" value={code} onChange={(e) => setCode(e.target.value)} placeholder="••••••••" className={champ} />
              </div>

              {erreur && (
                <p className="rounded-lg bg-brh-danger/10 px-3 py-2 text-sm text-brh-danger">{erreur}</p>
              )}

              <button type="submit" className={bouton}>Se connecter</button>

              <p className="text-center text-xs text-brh-muted">
                Première connexion ? Utilisez le code fourni par l'administrateur.
              </p>
            </form>
          )}

          {/* ÉCRAN 2 — Nouveau code */}
          {etape === 'nouveauCode' && (
            <form onSubmit={definirNouveauCode} className="space-y-5">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-brh-primary">Choisissez votre code</h2>
                <p className="mt-1 text-sm text-brh-muted">Définissez un nouveau code personnel.</p>
              </div>
              <div>
                <label className={label}>Nouveau code</label>
                <input type="password" value={nouveauCode} onChange={(e) => setNouveauCode(e.target.value)} placeholder="Au moins 4 caractères" className={champ} />
              </div>
              <div>
                <label className={label}>Confirmer le code</label>
                <input type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="Retapez le nouveau code" className={champ} />
              </div>
              {erreur && (
                <p className="rounded-lg bg-brh-danger/10 px-3 py-2 text-sm text-brh-danger">{erreur}</p>
              )}
              <button type="submit" className={bouton}>Valider mon code</button>
            </form>
          )}

          {/* ÉCRAN 3 — Accueil */}
          {etape === 'accueil' && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brh-success/10 text-2xl">✅</div>
              <div>
                <h2 className="text-2xl font-bold text-brh-primary">Bienvenue, {nom}</h2>
                <p className="mt-1 text-sm text-brh-muted">Vous êtes connecté(e) au Système de Pilotage Stratégique interne.</p>
              </div>
              <button onClick={() => setEtape('tableauDeBord')} className={bouton}>Accéder à mon tableau de bord</button>
              <button onClick={seDeconnecter} className="w-full rounded-lg border border-brh-border px-6 py-3 text-sm font-medium text-brh-text transition hover:bg-brh-bg">
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
