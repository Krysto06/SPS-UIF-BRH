import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { BAREME, couleurPct, etapeDe, etapeCls } from '../bareme'

const serif = { fontFamily: '"Manrope", "Inter", ui-sans-serif, sans-serif' } as const
const champ = 'w-full rounded-lg border border-brh-border bg-white px-3 py-2 text-sm text-brh-text outline-none transition focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'
const flabel = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-brh-muted'

type Action = {
  id: string; nom: string; user_id: string | null; cadre_strategique_id: string | null
  trimestre: string | null; echeance: string | null; pourcentage: number; statut: string
  description: string | null; livrable: string | null; commentaire: string | null
}
type Membre = { id: string; nom: string; role: string }
type Axe = { id: string; nom: string }

const STATUTS = [
  { v: 'en_attente', l: 'En attente' }, { v: 'en_cours', l: 'En cours' },
  { v: 'termine', l: 'Terminé' }, { v: 'bloque', l: 'Bloqué' },
]
const formVide = { nom: '', user_id: '', cadre_strategique_id: '', trimestre: 'T1', echeance: '', pourcentage: 0, statut: 'en_attente', description: '', livrable: '', commentaire: '' }
function frDate(d: string | null): string { return d ? d.split('-').reverse().join('/') : '—' }

// 🛠️ Gestion des actions (admin + direction) : ajouter, modifier, réattribuer
// et supprimer les actions de chaque membre. Les actions vivent dans la base,
// jamais dans le code.
export function GestionActions() {
  const [actions, setActions] = useState<Action[]>([])
  const [membres, setMembres] = useState<Membre[]>([])
  const [axes, setAxes] = useState<Axe[]>([])
  const [chargement, setChargement] = useState(true)
  const [ouvert, setOuvert] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [f, setF] = useState({ ...formVide })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)

  const charger = useCallback(async () => {
    const [aRes, uRes, cRes] = await Promise.all([
      supabase.from('actions').select('id, nom, user_id, cadre_strategique_id, trimestre, echeance, pourcentage, statut, description, livrable, commentaire').order('created_at', { ascending: true }),
      supabase.from('users').select('id, nom, role'),
      supabase.from('cadres_strategiques').select('id, nom').order('nom'),
    ])
    setActions((aRes.data ?? []) as Action[])
    const users = (uRes.data ?? []) as Membre[]
    setMembres(users.filter((u) => u.role === 'cadre' || u.role === 'secretaire'))
    setAxes((cRes.data ?? []) as Axe[])
    setChargement(false)
  }, [])
  useEffect(() => { charger() }, [charger])

  function nouvelle() { setEditId(null); setF({ ...formVide }); setOuvert(true); setMsg(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function modifier(a: Action) {
    setEditId(a.id)
    setF({
      nom: a.nom ?? '', user_id: a.user_id ?? '', cadre_strategique_id: a.cadre_strategique_id ?? '',
      trimestre: a.trimestre ?? 'T1', echeance: a.echeance ?? '', pourcentage: a.pourcentage ?? 0,
      statut: a.statut ?? 'en_attente', description: a.description ?? '', livrable: a.livrable ?? '', commentaire: a.commentaire ?? '',
    })
    setOuvert(true); setMsg(null); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function enregistrer() {
    if (f.nom.trim() === '' || !f.user_id) { setMsg({ ok: false, t: 'Choisis un membre et donne un intitulé.' }); return }
    setBusy(true); setMsg(null)
    const payload = {
      nom: f.nom.trim(), user_id: f.user_id, cadre_strategique_id: f.cadre_strategique_id || null,
      trimestre: f.trimestre, echeance: f.echeance || null, pourcentage: f.pourcentage, statut: f.statut,
      description: f.description.trim() || null, livrable: f.livrable.trim() || null, commentaire: f.commentaire.trim() || null,
    }
    const { error } = editId
      ? await supabase.from('actions').update(payload).eq('id', editId)
      : await supabase.from('actions').insert(payload)
    setBusy(false)
    if (error) { setMsg({ ok: false, t: 'Erreur : ' + error.message }); return }
    setF({ ...formVide }); setEditId(null); setOuvert(false)
    setMsg({ ok: true, t: editId ? 'Action modifiée.' : 'Action ajoutée.' })
    await charger()
  }
  async function supprimer(a: Action) {
    if (!confirm(`Supprimer l'action « ${a.nom} » ?`)) return
    await supabase.from('actions').delete().eq('id', a.id)
    if (editId === a.id) { setEditId(null); setF({ ...formVide }); setOuvert(false) }
    await charger()
  }

  const moyenne = actions.length === 0 ? 0 : Math.round(actions.reduce((s, a) => s + (a.pourcentage ?? 0), 0) / actions.length)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brh-primary" style={serif}>Gestion des actions</h1>
          <p className="mt-1 text-sm text-brh-muted">Ajoutez, modifiez, réattribuez ou supprimez les actions de chaque membre.</p>
        </div>
        <button onClick={nouvelle} className="inline-flex items-center gap-2 rounded-lg bg-brh-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>Nouvelle action
        </button>
      </div>

      {/* Synthèse */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-brh-border bg-white p-4 text-center shadow-sm"><p className="text-3xl font-bold" style={{ ...serif, color: couleurPct(moyenne) }}>{moyenne}%</p><p className="mt-1 text-[11px] font-medium text-brh-muted">Avancement moyen</p></div>
        <div className="rounded-2xl border border-brh-border bg-white p-4 text-center shadow-sm"><p className="text-3xl font-bold text-brh-primary" style={serif}>{actions.length}</p><p className="mt-1 text-[11px] font-medium text-brh-muted">Actions</p></div>
        <div className="rounded-2xl border border-brh-border bg-white p-4 text-center shadow-sm"><p className="text-3xl font-bold text-brh-success" style={serif}>{actions.filter((a) => a.pourcentage >= 100).length}</p><p className="mt-1 text-[11px] font-medium text-brh-muted">Approuvées</p></div>
      </div>

      {/* Formulaire ajout / édition */}
      {ouvert && (
        <div className="rounded-2xl border border-brh-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-brh-border/70 bg-gradient-to-b from-brh-primary/5 to-transparent px-5 py-3">
            <p className="font-semibold text-brh-text" style={serif}>{editId ? "Modifier l'action" : 'Nouvelle action'}</p>
            <button onClick={() => { setOuvert(false); setEditId(null); setF({ ...formVide }) }} className="text-brh-muted hover:text-brh-text"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div><label className={flabel}>Membre</label><select value={f.user_id} onChange={(e) => setF({ ...f, user_id: e.target.value })} className={champ}><option value="">— Choisir —</option>{membres.map((m) => <option key={m.id} value={m.id}>{m.nom}{m.role === 'secretaire' ? ' (secrétaire)' : ''}</option>)}</select></div>
            <div><label className={flabel}>Axe stratégique (optionnel)</label><select value={f.cadre_strategique_id} onChange={(e) => setF({ ...f, cadre_strategique_id: e.target.value })} className={champ}><option value="">— Aucun —</option>{axes.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}</select></div>
            <div className="sm:col-span-2"><label className={flabel}>Intitulé de l'action</label><input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="Ex. : Faire la veille sur les données financières désagrégées" className={champ} /></div>
            <div className="sm:col-span-2"><label className={flabel}>Attendu du trimestre (description)</label><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Ce qui est attendu ce trimestre…" className={champ + ' min-h-[64px] resize-y'} /></div>
            <div className="sm:col-span-2"><label className={flabel}>Livrable attendu</label><input value={f.livrable} onChange={(e) => setF({ ...f, livrable: e.target.value })} placeholder="Ex. : Note de veille de 2 pages" className={champ} /></div>
            <div><label className={flabel}>Trimestre</label><select value={f.trimestre} onChange={(e) => setF({ ...f, trimestre: e.target.value })} className={champ}><option value="T1">T1 · Oct–Déc</option><option value="T2">T2 · Jan–Mars</option><option value="T3">T3 · Avr–Juin</option><option value="T4">T4 · Juil–Sept</option></select></div>
            <div><label className={flabel}>Échéance</label><input type="date" value={f.echeance} onChange={(e) => setF({ ...f, echeance: e.target.value })} className={champ} /></div>
            <div><label className={flabel}>Avancement</label><select value={f.pourcentage} onChange={(e) => setF({ ...f, pourcentage: Number(e.target.value) })} className={champ}>{BAREME.map((b) => <option key={b.v} value={b.v}>{b.label} ({b.v} %)</option>)}</select></div>
            <div><label className={flabel}>Statut</label><select value={f.statut} onChange={(e) => setF({ ...f, statut: e.target.value })} className={champ}>{STATUTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
            {msg && <p className={`sm:col-span-2 rounded-lg px-3 py-2 text-sm ${msg.ok ? 'bg-brh-success/10 text-brh-success' : 'bg-brh-danger/10 text-brh-danger'}`}>{msg.t}</p>}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button onClick={() => { setOuvert(false); setEditId(null); setF({ ...formVide }) }} className="rounded-lg border border-brh-border px-4 py-2 text-sm font-medium text-brh-text transition hover:bg-brh-bg">Annuler</button>
              <button onClick={enregistrer} disabled={busy} className="rounded-lg bg-brh-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep disabled:opacity-60">{busy ? 'Enregistrement…' : editId ? 'Enregistrer les modifications' : "Ajouter l'action"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Liste par membre */}
      {chargement ? <p className="text-sm text-brh-muted">Chargement…</p> : (
        <div className="space-y-6">
          {membres.filter((m) => actions.some((a) => a.user_id === m.id)).map((m) => {
            const siennes = actions.filter((a) => a.user_id === m.id)
            return (
              <div key={m.id}>
                <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brh-text">{m.nom}<span className="rounded-full bg-brh-bg px-2 py-0.5 text-[11px] font-medium text-brh-muted">{siennes.length}</span></p>
                <div className="space-y-2.5">
                  {siennes.map((a) => {
                    const et = etapeDe(a.pourcentage)
                    const axeNom = axes.find((x) => x.id === a.cadre_strategique_id)?.nom
                    return (
                      <div key={a.id} className="rounded-2xl border border-brh-border bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-brh-text">{a.nom}</p>
                            <p className="mt-0.5 text-xs text-brh-muted">{axeNom ? axeNom + ' · ' : ''}{a.trimestre ?? ''} · Échéance : {frDate(a.echeance)}</p>
                            {a.description && <p className="mt-2 text-sm text-brh-text/75">{a.description}</p>}
                            {a.livrable && <p className="mt-1 text-xs text-brh-muted"><span className="font-semibold">Livrable :</span> {a.livrable}</p>}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-right text-sm font-bold tabular-nums" style={{ color: couleurPct(a.pourcentage) }}>{a.pourcentage}%</span>
                            <button onClick={() => modifier(a)} title="Modifier" className="rounded-md p-1.5 text-brh-muted transition hover:bg-brh-primary/10 hover:text-brh-primary"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg></button>
                            <button onClick={() => supprimer(a)} title="Supprimer" className="rounded-md p-1.5 text-brh-muted transition hover:bg-brh-danger/10 hover:text-brh-danger"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg></button>
                          </div>
                        </div>
                        <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${etapeCls(a.pourcentage)}`}>{et.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {actions.length === 0 && <p className="rounded-2xl border border-dashed border-brh-border bg-white p-8 text-center text-sm text-brh-muted">Aucune action. Ajoute la première avec « Nouvelle action ».</p>}
        </div>
      )}
    </div>
  )
}
