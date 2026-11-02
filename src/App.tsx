import { useState, useEffect, type FormEvent } from 'react'
import { TableauDeBord } from './TableauDeBord'
import { DirectionShell } from './direction/DirectionShell'
import { AdminShell } from './admin/AdminShell'
import { Logo } from './ui'
import { supabase } from './supabase'

type Utilisateur = { id: string; nom: string; role: string | null }

const champ =
  'w-full rounded-lg border border-brh-border bg-brh-bg/40 px-4 py-3 text-sm text-brh-text outline-none transition placeholder:text-brh-muted/60 focus:border-brh-primary focus:bg-white focus:ring-4 focus:ring-brh-primary/10'
const bouton =
  'w-full rounded-lg bg-brh-primary px-6 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-brh-primary/20 transition hover:bg-brh-deep hover:shadow-xl active:scale-[.99] disabled:opacity-60'
const label = 'mb-2 block text-xs font-semibold uppercase tracking-wide text-brh-muted'

function App() {
  const [etape, setEtape] = useState<'connexion' | 'code' | 'tableauDeBord'>('connexion')
  const [nom, setNom] = useState('')
  const [premiereFois, setPremiereFois] = useState(false)
  const [code, setCode] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState(false)

  // 🔎 Connexion à la base + lecture des utilisateurs
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [dbStatut, setDbStatut] = useState<'test' | 'ok' | 'erreur'>('test')
  const [dbErreur, setDbErreur] = useState('')
  useEffect(() => {
    supabase.from('users').select('id, nom, role').order('nom').then(({ data, error }) => {
      if (error) { setDbStatut('erreur'); setDbErreur(error.message) }
      else { setUtilisateurs((data ?? []) as Utilisateur[]); setDbStatut('ok') }
    })
  }, [])

  const utilisateur = utilisateurs.find((u) => u.nom === nom)

  // Étape 1 : choisir son nom → vérifier s'il a déjà un code
  async function choisirNom(e: FormEvent) {
    e.preventDefault()
    setErreur('')
    if (nom.trim() === '') { setErreur('Veuillez sélectionner votre nom.'); return }
    const u = utilisateurs.find((x) => x.nom === nom)
    if (!u) { setErreur('Utilisateur introuvable.'); return }
    setOccupe(true)
    const { data, error } = await supabase.rpc('a_un_pin', { p_user_id: u.id })
    setOccupe(false)
    if (error) { setErreur('Erreur de connexion : ' + error.message); return }
    setPremiereFois(!data)
    setCode(''); setConfirmation('')
    setEtape('code')
  }

  // Étape 2 : saisir (ou définir) son code à 6 chiffres
  async function validerCode(e: FormEvent) {
    e.preventDefault()
    setErreur('')
    if (!utilisateur) { setErreur('Session expirée, recommencez.'); setEtape('connexion'); return }
    if (!/^[0-9]{6}$/.test(code)) { setErreur('Le code doit contenir 6 chiffres.'); return }

    setOccupe(true)
    if (premiereFois) {
      if (code !== confirmation) { setOccupe(false); setErreur('Les deux codes ne correspondent pas.'); return }
      const { data, error } = await supabase.rpc('definir_pin_initial', { p_user_id: utilisateur.id, p_pin: code })
      setOccupe(false)
      if (error) { setErreur('Erreur : ' + error.message); return }
      if (!data) { setErreur('Impossible de définir le code. Réessayez.'); return }
      setEtape('tableauDeBord')
    } else {
      const { data, error } = await supabase.rpc('verifier_pin', { p_user_id: utilisateur.id, p_pin: code })
      setOccupe(false)
      if (error) { setErreur('Erreur : ' + error.message); return }
      if (!data) { setErreur('Code incorrect.'); return }
      setEtape('tableauDeBord')
    }
  }

  function seDeconnecter() {
    setEtape('connexion'); setNom(''); setCode(''); setConfirmation(''); setErreur(''); setPremiereFois(false)
  }

  if (etape === 'tableauDeBord') {
    if (utilisateur?.role === 'direction') {
      return <DirectionShell nom={nom} utilisateurId={utilisateur?.id} onDeconnexion={seDeconnecter} />
    }
    if (utilisateur?.role === 'admin') {
      return <AdminShell nom={nom} utilisateurId={utilisateur?.id} onDeconnexion={seDeconnecter} />
    }
    return <TableauDeBord nom={nom} role={utilisateur?.role ?? undefined} utilisateurId={utilisateur?.id} onDeconnexion={seDeconnecter} />
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">

      {/* ═══════ PANNEAU GAUCHE ═══════ */}
      <div className="relative hidden flex-col justify-start overflow-hidden p-14 pt-16 text-white md:flex">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #12355B 0%, #0B2545 100%)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 25% 25%, rgba(201,162,39,0.10), transparent 45%)' }} />

        <div className="relative max-w-md">
          <Logo size={56} />
          <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight">Banque de la République d'Haïti</h1>
          <p className="mt-2 text-lg font-medium text-brh-gold-light">Unité d'Inclusion Financière</p>
          <div className="mt-6 h-px w-14 bg-brh-secondary/60" />
          <h2 className="mt-6 text-lg font-semibold text-white/95">Système de Pilotage Stratégique interne</h2>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Pourquoi cette plateforme ?</p>
          <ul className="mt-3 space-y-3 text-sm text-white/70">
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brh-secondary" />Centraliser le suivi des actions et des engagements trimestriels</li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brh-secondary" />Mesurer et faire valider la performance en toute transparence</li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brh-secondary" />Relier le travail quotidien aux stratégies nationales (SNIF, PNEF, Plan BRH)</li>
          </ul>
        </div>

        <div className="absolute bottom-8 left-14 right-14 space-y-2 text-xs leading-relaxed text-white/40">
          <p>Cet outil ne remplace pas Bitrix. Il vient en complément, comme un moyen simple de faciliter le suivi et le travail de l'Unité d'Inclusion Financière.</p>
          <p>© BRH · Unité d'Inclusion Financière · v1.0</p>
        </div>
      </div>

      {/* ═══════ PANNEAU DROIT ═══════ */}
      <div className="flex items-center justify-center bg-brh-bg p-6 sm:p-12">
        <div className="w-full max-w-sm rounded-2xl border border-brh-border bg-white p-8 shadow-[0_20px_50px_-20px_rgba(18,53,91,0.30)]">

          <div className="mb-6 flex justify-center md:hidden">
            <Logo size={48} />
          </div>

          <div className="mb-6 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-brh-muted">
            <span>🔒</span> Espace sécurisé
          </div>

          <div className="mb-6 text-center text-xs">
            {dbStatut === 'test' && <span className="text-brh-muted">Vérification de la base…</span>}
            {dbStatut === 'ok' && <span className="font-medium text-brh-success">● Base de données connectée</span>}
            {dbStatut === 'erreur' && <span className="font-medium text-brh-danger">● Base non connectée : {dbErreur}</span>}
          </div>

          {etape === 'connexion' && (
            <form onSubmit={choisirNom} className="space-y-5">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-brh-primary">Connexion</h2>
                <p className="mt-1 text-sm text-brh-muted">Sélectionnez votre nom pour accéder à votre espace.</p>
              </div>
              <div>
                <label className={label}>Nom</label>
                <select value={nom} onChange={(e) => setNom(e.target.value)} className={champ}>
                  <option value="">
                    {utilisateurs.length === 0 ? 'Chargement…' : '— Sélectionnez votre nom —'}
                  </option>
                  {utilisateurs.map((u) => (<option key={u.nom} value={u.nom}>{u.nom}</option>))}
                </select>
              </div>
              {erreur && (<p className="rounded-lg bg-brh-danger/10 px-3 py-2 text-sm text-brh-danger">{erreur}</p>)}
              <button type="submit" disabled={occupe} className={bouton}>{occupe ? 'Vérification…' : 'Continuer'}</button>
              <p className="text-center text-xs text-brh-muted">Première connexion ? Vous choisirez votre code à 6 chiffres à l'étape suivante.</p>
            </form>
          )}

          {etape === 'code' && (
            <form onSubmit={validerCode} className="space-y-5">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-brh-primary">{premiereFois ? 'Choisissez votre code' : 'Bonjour, ' + nom.split(' ')[0]}</h2>
                <p className="mt-1 text-sm text-brh-muted">{premiereFois ? 'Première connexion : définissez un code personnel à 6 chiffres.' : 'Entrez votre code à 6 chiffres.'}</p>
              </div>
              <div>
                <label className={label}>Code à 6 chiffres</label>
                <input type="password" inputMode="numeric" autoComplete="off" maxLength={6}
                  value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••" className={champ + ' text-center text-lg tracking-[0.5em]'} autoFocus />
              </div>
              {premiereFois && (
                <div>
                  <label className={label}>Confirmez le code</label>
                  <input type="password" inputMode="numeric" autoComplete="off" maxLength={6}
                    value={confirmation} onChange={(e) => setConfirmation(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••" className={champ + ' text-center text-lg tracking-[0.5em]'} />
                </div>
              )}
              {erreur && (<p className="rounded-lg bg-brh-danger/10 px-3 py-2 text-sm text-brh-danger">{erreur}</p>)}
              <button type="submit" disabled={occupe} className={bouton}>{occupe ? 'Patientez…' : premiereFois ? 'Valider mon code' : 'Se connecter'}</button>
              <button type="button" onClick={seDeconnecter} className="w-full text-center text-xs text-brh-muted hover:text-brh-text">← Changer de nom</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
