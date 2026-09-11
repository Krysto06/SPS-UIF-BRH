import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { BAREME, etapeDe, etapeCls, couleurPct } from '../bareme'
import { chargerSousActions, ajouterSousAction, basculerSousAction, supprimerSousAction, grouper, type SousAction } from '../sousActions'

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

// 📊 Bandeau de synthèse : avancement moyen + une barre par action
function Synthese({ liste }: { liste: ActionEdit[] }) {
  const n = liste.length
  const moyenne = n === 0 ? 0 : Math.round(liste.reduce((s, a) => s + a.pourcentage, 0) / n)
  const enRetard = liste.filter(estEnRetard).length
  const terminees = liste.filter((a) => a.pourcentage >= 100).length

  // Jauge circulaire de la moyenne
  const rayon = 46
  const circ = 2 * Math.PI * rayon
  const offset = circ * (1 - moyenne / 100)
  const couleur = couleurPct(moyenne)

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Jauge de la moyenne */}
      <div className="flex items-center gap-5 rounded-2xl border border-brh-border bg-white p-6 shadow-sm">
        <div className="relative shrink-0" style={{ height: 112, width: 112 }}>
          <svg viewBox="0 0 112 112" className="h-28 w-28 -rotate-90">
            <circle cx="56" cy="56" r={rayon} fill="none" stroke="#e2e8f0" strokeWidth="11" />
            <circle cx="56" cy="56" r={rayon} fill="none" stroke={couleur} strokeWidth="11" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color: couleur }}>{moyenne}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-brh-text/80">Avancement moyen</p>
          <p className="mt-0.5 text-xs text-brh-muted">{n} action{n > 1 ? 's' : ''} suivie{n > 1 ? 's' : ''}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {terminees > 0 && <span className="rounded-full bg-brh-success/10 px-2.5 py-0.5 text-[11px] font-medium text-brh-success">{terminees} approuvée{terminees > 1 ? 's' : ''}</span>}
            {enRetard > 0 && <span className="rounded-full bg-brh-danger/10 px-2.5 py-0.5 text-[11px] font-medium text-brh-danger">{enRetard} en retard</span>}
          </div>
        </div>
      </div>

      {/* Graphe : une barre par action, repère sur la moyenne */}
      <div className="rounded-2xl border border-brh-border bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-brh-text/80">Avancement par action</p>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-brh-secondary">
            <span className="inline-block h-3 w-px border-l border-dashed border-brh-secondary" /> moyenne {moyenne}%
          </span>
        </div>
        <div className="mt-4 grid grid-cols-[38%_1fr_2.25rem] items-center gap-x-3 gap-y-2.5 text-xs">
          {liste.map((a) => (
            <div key={a.id} className="contents">
              <span className="truncate text-brh-text" title={a.nom}>{a.nom}</span>
              <div className="relative h-3 overflow-hidden rounded-full bg-brh-bg">
                <div className="h-full rounded-full transition-all" style={{ width: `${a.pourcentage}%`, background: couleurPct(a.pourcentage) }} />
                {/* Repère de la moyenne — même largeur de piste sur chaque ligne, donc aligné */}
                <div className="absolute inset-y-0 w-px bg-brh-secondary" style={{ left: `${moyenne}%` }} />
              </div>
              <span className="text-right font-bold tabular-nums" style={{ color: couleurPct(a.pourcentage) }}>{a.pourcentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 📋 Page du cadre : suivre et mettre à jour ses propres actions
export function MesActions({ utilisateurId }: { utilisateurId?: string }) {
  const [liste, setListe] = useState<ActionEdit[]>([])
  const [chargement, setChargement] = useState(true)
  const [sauvegarde, setSauvegarde] = useState<string | null>(null)
  const [sous, setSous] = useState<Record<string, SousAction[]>>({})
  const [nouveau, setNouveau] = useState<Record<string, string>>({})

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
        chargerSousActions(l.map((x) => x.id)).then((s) => setSous(grouper(s)))
      })
  }, [utilisateurId])

  async function ajouterSous(actionId: string) {
    const titre = (nouveau[actionId] ?? '').trim()
    if (titre === '') return
    setNouveau((prev) => ({ ...prev, [actionId]: '' }))
    const cree = await ajouterSousAction(actionId, titre)
    if (cree) setSous((prev) => ({ ...prev, [actionId]: [...(prev[actionId] ?? []), cree] }))
  }
  async function basculerSous(s: SousAction) {
    const fait = !s.fait
    setSous((prev) => ({ ...prev, [s.action_id]: (prev[s.action_id] ?? []).map((x) => (x.id === s.id ? { ...x, fait } : x)) }))
    await basculerSousAction(s.id, fait)
  }
  async function supprimerSous(s: SousAction) {
    setSous((prev) => ({ ...prev, [s.action_id]: (prev[s.action_id] ?? []).filter((x) => x.id !== s.id) }))
    await supprimerSousAction(s.id)
  }

  // Bloc « sous-actions » d'une action (fonction, pas composant → garde le focus de l'input)
  function blocSousActions(actionId: string) {
    const items = sous[actionId] ?? []
    const faites = items.filter((s) => s.fait).length
    return (
      <div className="mt-5 border-t border-brh-border/60 pt-4">
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brh-muted">
          Sous-actions
          {items.length > 0 && <span className="rounded-full bg-brh-bg px-2 py-0.5 text-[11px] font-medium normal-case text-brh-muted">{faites}/{items.length} faites</span>}
        </p>
        {items.length > 0 && (
          <ul className="mb-2.5 space-y-1.5">
            {items.map((s) => (
              <li key={s.id} className="flex items-center gap-2.5">
                <button onClick={() => basculerSous(s)} aria-label="Cocher"
                  className={`flex shrink-0 items-center justify-center rounded-[5px] border-[2.5px] transition ${s.fait ? 'border-brh-success bg-brh-success' : 'border-brh-muted bg-white hover:border-brh-primary'}`}
                  style={{ height: 18, width: 18 }}>
                  {s.fait && <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M20 6 9 17l-5-5" /></svg>}
                </button>
                <span className={`flex-1 text-sm ${s.fait ? 'text-brh-muted line-through' : 'text-brh-text'}`}>{s.titre}</span>
                <button onClick={() => supprimerSous(s)} className="shrink-0 text-brh-muted transition hover:text-brh-danger" aria-label="Supprimer">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input value={nouveau[actionId] ?? ''} onChange={(e) => setNouveau((prev) => ({ ...prev, [actionId]: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') ajouterSous(actionId) }}
            placeholder="Ajouter une sous-action…" className={champ + ' flex-1'} />
          <button onClick={() => ajouterSous(actionId)} className="shrink-0 rounded-lg border border-brh-border bg-white px-4 py-2 text-sm font-semibold text-brh-primary transition hover:bg-brh-bg">Ajouter</button>
        </div>
      </div>
    )
  }

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
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brh-primary" style={serif}>Mes actions du trimestre</h1>
        <p className="mt-1 text-sm text-brh-muted">Mettez à jour l'avancement de chaque action selon le barème. Vos modifications sont enregistrées dans la base.</p>
      </div>

      <Synthese liste={liste} />

      <div className="space-y-5">
        {liste.map((a) => {
          const st = STATUTS[a.statut]
          const enRetard = estEnRetard(a)
          const et = etapeDe(a.pourcentage)
          return (
            <div key={a.id} className={`rounded-2xl border bg-white p-6 shadow-sm ${enRetard ? 'border-brh-danger/40' : 'border-brh-border'}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-brh-text">{a.nom}</p>
                  <p className="mt-0.5 text-xs text-brh-muted">{a.axe} · Échéance : {a.echeanceFr}</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {enRetard && <span className="rounded-full bg-brh-danger/10 px-2.5 py-0.5 text-[11px] font-medium text-brh-danger">En retard</span>}
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${etapeCls(a.pourcentage)}`}>{et.label}</span>
                  <span className="text-sm font-bold text-brh-primary">{a.pourcentage}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-brh-bg">
                  <div className="h-full rounded-full bg-brh-primary transition-all" style={{ width: `${a.pourcentage}%` }} />
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>Avancement (barème)</label>
                  <select value={a.pourcentage} onChange={(e) => modifier(a.id, 'pourcentage', Number(e.target.value))} className={champ}>
                    {BAREME.map((b) => (<option key={b.v} value={b.v}>{b.label} ({b.v} %)</option>))}
                  </select>
                </div>
                <div>
                  <label className={label}>Statut</label>
                  <select value={a.statut} onChange={(e) => modifier(a.id, 'statut', e.target.value)} className={champ}>
                    <option value="en_attente">En attente</option>
                    <option value="en_cours">En cours</option>
                    <option value="termine">Terminé</option>
                    <option value="bloque">Bloqué</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className={label}>Commentaire — visible par la direction (optionnel)</label>
                <input type="text" value={a.commentaire} onChange={(e) => modifier(a.id, 'commentaire', e.target.value)}
                  placeholder="Ex. : en attente des données de la BNC" className={champ} />
              </div>

              {blocSousActions(a.id)}

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
    </div>
  )
}
