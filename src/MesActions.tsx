import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const champ =
  'w-full rounded-lg border border-brh-border bg-white px-4 py-2.5 text-sm text-brh-text outline-none transition placeholder:text-brh-muted/60 focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'
const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brh-muted'
const serif = { fontFamily: '"Fraunces", Georgia, "Times New Roman", serif' } as const

const STATUTS: Record<string, { label: string; cls: string }> = {
  en_cours: { label: 'En cours', cls: 'bg-blue-50 text-blue-700' },
  termine: { label: 'Terminé', cls: 'bg-brh-success/10 text-brh-success' },
  en_attente: { label: 'En attente', cls: 'bg-gray-100 text-gray-600' },
  bloque: { label: 'Bloqué', cls: 'bg-gray-200 text-gray-800' },
}

type ActionEdit = {
  id: string
  nom: string
  axe: string
  echeance: string | null
  echeanceFr: string
  statut: string
  pourcentage: number
  commentaire: string
  enregistre: 'ok' | 'erreur' | null
}

function estEnRetard(a: ActionEdit): boolean {
  if (!a.echeance || a.statut === 'termine') return false
  const aujourdhui = new Date(new Date().toDateString())
  return new Date(a.echeance) < aujourdhui
}

// 📋 Page du cadre : suivre et mettre à jour ses propres actions
export function MesActions({ utilisateurId }: { utilisateurId?: string }) {
  const [liste, setListe] = useState<ActionEdit[]>([])
  const [chargement, setChargement] = useState(true)
  const [sauvegarde, setSauvegarde] = useState<string | null>(null)

  useEffect(() => {
    if (!utilisateurId) { setChargement(false); return }
    supabase
      .from('actions')
      .select('id, nom, statut, pourcentage, echeance, commentaire, cadres_strategiques(nom)')
      .eq('user_id', utilisateurId)
      .order('echeance')
      .then(({ data }) => {
        const l = (data ?? []).map((a: any) => ({
          id: a.id,
          nom: a.nom,
          axe: a.cadres_strategiques?.nom ?? '—',
          echeance: a.echeance ?? null,
          echeanceFr: a.echeance ? a.echeance.split('-').reverse().join('/') : '—',
          statut: a.statut ?? 'en_attente',
          pourcentage: a.pourcentage ?? 0,
          commentaire: a.commentaire ?? '',
          enregistre: null as 'ok' | 'erreur' | null,
        }))
        setListe(l)
        setChargement(false)
      })
  }, [utilisateurId])

  function modifier(id: string, champ: 'statut' | 'pourcentage' | 'commentaire', valeur: string | number) {
    setListe((prev) => prev.map((a) => (a.id === id ? { ...a, [champ]: valeur, enregistre: null } : a)))
  }

  async function enregistrer(a: ActionEdit) {
    setSauvegarde(a.id)
    const { error } = await supabase
      .from('actions')
      .update({
        pourcentage: a.pourcentage,
        statut: a.statut,
        commentaire: a.commentaire.trim() === '' ? null : a.commentaire.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', a.id)
    setSauvegarde(null)
    setListe((prev) => prev.map((x) => (x.id === a.id ? { ...x, enregistre: error ? 'erreur' : 'ok' } : x)))
  }

  if (chargement) {
    return <p className="text-center text-sm text-brh-muted">Chargement de vos actions…</p>
  }

  if (liste.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-2xl border border-dashed border-brh-border bg-white p-8 text-center text-sm text-brh-muted">
          Aucune action ne vous a encore été attribuée. L'administrateur vous en confiera prochainement.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brh-primary" style={serif}>Mes actions du trimestre</h1>
        <p className="mt-1 text-sm text-brh-muted">Mettez à jour l'avancement de chaque action. Vos modifications sont enregistrées dans la base.</p>
      </div>

      {liste.map((a) => {
        const st = STATUTS[a.statut]
        const enRetard = estEnRetard(a)
        return (
          <div key={a.id} className={`rounded-2xl border bg-white p-6 shadow-sm ${enRetard ? 'border-brh-danger/40' : 'border-brh-border'}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-brh-text">{a.nom}</p>
                <p className="mt-0.5 text-xs text-brh-muted">{a.axe} · Échéance : {a.echeanceFr}</p>
              </div>
              <div className="flex items-center gap-2">
                {enRetard && <span className="rounded-full bg-brh-danger/10 px-2.5 py-0.5 text-[11px] font-medium text-brh-danger">En retard</span>}
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-1 flex items-center justify-between text-xs font-medium text-brh-muted">
                <span>Avancement</span>
                <span className="text-brh-primary">{a.pourcentage}%</span>
              </div>
              <input type="range" min={0} max={100} step={5} value={a.pourcentage}
                onChange={(e) => modifier(a.id, 'pourcentage', Number(e.target.value))}
                className="w-full accent-brh-primary" />
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-brh-bg">
                <div className="h-full rounded-full bg-brh-primary transition-all" style={{ width: `${a.pourcentage}%` }} />
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Statut</label>
                <select value={a.statut} onChange={(e) => modifier(a.id, 'statut', e.target.value)} className={champ}>
                  <option value="en_attente">En attente</option>
                  <option value="en_cours">En cours</option>
                  <option value="termine">Terminé</option>
                  <option value="bloque">Bloqué</option>
                </select>
              </div>
              <div>
                <label className={label}>Commentaire (optionnel)</label>
                <input type="text" value={a.commentaire} onChange={(e) => modifier(a.id, 'commentaire', e.target.value)}
                  placeholder="Ex. : en attente de données du terrain" className={champ} />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              {a.enregistre === 'ok' && <span className="text-xs font-medium text-brh-success">✓ Enregistré</span>}
              {a.enregistre === 'erreur' && <span className="text-xs font-medium text-brh-danger">Erreur d'enregistrement</span>}
              <button onClick={() => enregistrer(a)} disabled={sauvegarde === a.id}
                className="rounded-lg bg-brh-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep disabled:opacity-60">
                {sauvegarde === a.id ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
