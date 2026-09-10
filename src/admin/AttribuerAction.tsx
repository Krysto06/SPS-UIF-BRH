import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '../supabase'

const champ =
  'w-full rounded-lg border border-brh-border bg-white px-4 py-2.5 text-sm text-brh-text outline-none transition placeholder:text-brh-muted/60 focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'
const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brh-muted'
const serif = { fontFamily: '"Fraunces", Georgia, "Times New Roman", serif' } as const

type UserLite = { id: string; nom: string; role: string | null }
type CadreLite = { id: string; nom: string }

// 🛠️ Formulaire réservé à l'Admin : attribuer une action à un collaborateur
export function AttribuerAction() {
  const [users, setUsers] = useState<UserLite[]>([])
  const [cadres, setCadres] = useState<CadreLite[]>([])

  const [userId, setUserId] = useState('')
  const [titre, setTitre] = useState('')
  const [cadreId, setCadreId] = useState('')
  const [trimestre, setTrimestre] = useState('T2')
  const [echeance, setEcheance] = useState('')

  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null)

  useEffect(() => {
    supabase.from('users').select('id, nom, role').order('nom').then(({ data }) => {
      const liste = (data ?? []).filter((u: any) => u.role !== 'admin' && u.role !== 'directrice') as UserLite[]
      setUsers(liste)
    })
    supabase.from('cadres_strategiques').select('id, nom').order('nom').then(({ data }) => {
      setCadres((data ?? []) as CadreLite[])
    })
  }, [])

  async function enregistrer(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (!userId || titre.trim() === '' || !cadreId || !echeance) {
      setMessage({ ok: false, texte: 'Merci de remplir tous les champs.' })
      return
    }
    setEnCours(true)
    const { error } = await supabase.from('actions').insert({
      user_id: userId,
      nom: titre.trim(),
      cadre_strategique_id: cadreId,
      trimestre,
      echeance,
      statut: 'en_attente',
      pourcentage: 0,
    })
    setEnCours(false)
    if (error) {
      setMessage({ ok: false, texte: 'Erreur : ' + error.message })
      return
    }
    const personne = users.find((u) => u.id === userId)?.nom ?? 'le collaborateur'
    setMessage({ ok: true, texte: `Action attribuée à ${personne}.` })
    setTitre(''); setCadreId(''); setEcheance(''); setUserId('')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brh-primary" style={serif}>Attribuer une action</h1>
        <p className="mt-1 text-sm text-brh-muted">
          Créez une action et confiez-la à un collaborateur. Il pourra ensuite suivre son avancement depuis son espace.
        </p>
      </div>

      <form onSubmit={enregistrer} className="space-y-5 rounded-2xl border border-brh-border bg-white p-6 shadow-sm">
        <div>
          <label className={label}>Collaborateur</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)} className={champ}>
            <option value="">— Choisir une personne —</option>
            {users.map((u) => (<option key={u.id} value={u.id}>{u.nom}</option>))}
          </select>
        </div>

        <div>
          <label className={label}>Intitulé de l'action</label>
          <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. : Collecte de données nationales" className={champ} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label}>Cadre stratégique</label>
            <select value={cadreId} onChange={(e) => setCadreId(e.target.value)} className={champ}>
              <option value="">— Choisir un cadre —</option>
              {cadres.map((c) => (<option key={c.id} value={c.id}>{c.nom}</option>))}
            </select>
          </div>
          <div>
            <label className={label}>Trimestre</label>
            <select value={trimestre} onChange={(e) => setTrimestre(e.target.value)} className={champ}>
              <option value="T1">T1 · Oct–Déc</option>
              <option value="T2">T2 · Jan–Mars</option>
              <option value="T3">T3 · Avr–Juin</option>
              <option value="T4">T4 · Juil–Sept</option>
            </select>
          </div>
        </div>

        <div>
          <label className={label}>Échéance</label>
          <input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} className={champ} />
        </div>

        {message && (
          <p className={`rounded-lg px-3 py-2 text-sm ${message.ok ? 'bg-brh-success/10 text-brh-success' : 'bg-brh-danger/10 text-brh-danger'}`}>
            {message.texte}
          </p>
        )}

        <button type="submit" disabled={enCours}
          className="w-full rounded-lg bg-brh-primary px-6 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-brh-primary/20 transition hover:bg-brh-deep disabled:opacity-60">
          {enCours ? 'Enregistrement…' : "Attribuer l'action"}
        </button>
      </form>
    </div>
  )
}
