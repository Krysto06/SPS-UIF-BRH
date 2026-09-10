import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const champ =
  'w-full rounded-lg border border-brh-border bg-white px-4 py-2.5 text-sm text-brh-text outline-none transition placeholder:text-brh-muted/60 focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'
const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brh-muted'
const zoneTexte = champ + ' min-h-[80px] resize-y leading-relaxed'
const serif = { fontFamily: '"Fraunces", Georgia, "Times New Roman", serif' } as const
const orFonce = '#8A6D16' // jaune foncé pour la mise en évidence « Pour vous »

// Types d'activité externe (liste déroulante)
const TYPES_ACTIVITE = [
  'Réunion avec une autre unité / direction',
  'Formation',
  'Atelier / Séminaire',
  'Conférence',
  'Étude',
  'Mission de terrain',
  'Représentation externe',
  'Rencontre avec un partenaire (bailleur, ONG…)',
  'Autre',
]

// Pastille courte + couleur par type
const CHIP_TYPE: Record<string, { court: string; cls: string }> = {
  'Réunion avec une autre unité / direction': { court: 'Autre unité', cls: 'bg-violet-50 text-violet-700' },
  'Formation': { court: 'Formation', cls: 'bg-teal-50 text-teal-700' },
  'Atelier / Séminaire': { court: 'Atelier', cls: 'bg-blue-50 text-blue-700' },
  'Conférence': { court: 'Conférence', cls: 'bg-blue-50 text-blue-700' },
  'Étude': { court: 'Étude', cls: 'bg-brh-secondary/15 text-brh-secondary' },
  'Mission de terrain': { court: 'Mission terrain', cls: 'bg-teal-50 text-teal-700' },
  'Représentation externe': { court: 'Représentation', cls: 'bg-rose-50 text-rose-700' },
  'Rencontre avec un partenaire (bailleur, ONG…)': { court: 'Partenaire', cls: 'bg-brh-secondary/15 text-brh-secondary' },
  'Autre': { court: 'Autre', cls: 'bg-gray-100 text-gray-600' },
}

// États d'une activité déclarée (le reste du cycle viendra avec l'espace direction)
const ETATS: Record<string, { label: string; cls: string }> = {
  en_attente: { label: "En attente d'approbation", cls: 'bg-brh-warning/10 text-brh-warning' },
  approuvee: { label: 'Approuvée', cls: 'bg-brh-success/10 text-brh-success' },
  refusee: { label: 'Refusée', cls: 'bg-brh-danger/10 text-brh-danger' },
  en_retard: { label: 'En retard', cls: 'bg-brh-danger/10 text-brh-danger' },
  fermee: { label: 'Fermée', cls: 'bg-gray-100 text-gray-600' },
  reconduite: { label: 'Reconduite', cls: 'bg-blue-50 text-blue-700' },
  archivee: { label: 'Archivée', cls: 'bg-gray-100 text-gray-500' },
}

const MOIS_COURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
function partsDate(iso: string | null): { jour: string; mois: string; annee: string } {
  if (!iso) return { jour: '—', mois: '', annee: '' }
  const d = new Date(iso + 'T00:00:00')
  return { jour: String(d.getDate()), mois: MOIS_COURT[d.getMonth()], annee: String(d.getFullYear()) }
}

type Activite = {
  id: string
  categorie: string
  type: string | null
  titre: string
  precision: string | null
  date: string | null
  heure: string | null
  lieu: string | null
  participants: string | null
  description: string | null
  assigne_a: string | null
  etat: string
  user_id: string | null
}

const formVide = { type: TYPES_ACTIVITE[0], precision: '', titre: '', date: '', lieu: '', participants: '', description: '' }

// 📅 Page « Activité » : réunions d'équipe, individuelles, et activités externes
export function Activite({ utilisateurId }: { utilisateurId?: string }) {
  const [toutes, setToutes] = useState<Activite[]>([])
  const [noms, setNoms] = useState<Record<string, string>>({})
  const [chargement, setChargement] = useState(true)

  const [ouvertForm, setOuvertForm] = useState(false)
  const [f, setF] = useState({ ...formVide })
  const [envoi, setEnvoi] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)

  async function charger() {
    const { data } = await supabase.from('activites').select('*').order('date', { ascending: true })
    setToutes((data ?? []) as Activite[])
  }

  useEffect(() => {
    supabase.from('users').select('id, nom').then(({ data }) => {
      setNoms(Object.fromEntries((data ?? []).map((u: any) => [u.id, u.nom])))
    })
    charger().then(() => setChargement(false))
  }, [])

  const reunionsEquipe = toutes.filter((a) => a.categorie === 'reunion_equipe')
  const reunionsIndiv = toutes.filter((a) => a.categorie === 'reunion_individuelle')
  const mesActivites = toutes.filter((a) => a.categorie === 'activite_externe' && a.user_id === utilisateurId)

  async function declarer() {
    if (!utilisateurId) return
    if (f.titre.trim() === '') { setMsg({ ok: false, t: "Donne un intitulé à l'activité." }); return }
    if (f.date === '') { setMsg({ ok: false, t: 'Choisis une date.' }); return }
    setEnvoi(true); setMsg(null)
    const { error } = await supabase.from('activites').insert({
      categorie: 'activite_externe',
      type: f.type,
      titre: f.titre.trim(),
      precision: f.precision.trim() || null,
      date: f.date,
      lieu: f.lieu.trim() || null,
      participants: f.participants.trim() || null,
      description: f.description.trim() || null,
      etat: 'en_attente',
      user_id: utilisateurId,
    })
    setEnvoi(false)
    if (error) { setMsg({ ok: false, t: 'Erreur : ' + error.message }); return }
    setF({ ...formVide }); setOuvertForm(false)
    setMsg({ ok: true, t: "Activité envoyée à la direction (en attente d'approbation)." })
    await charger()
  }

  // Carte de réunion (équipe ou individuelle)
  function carteReunion(r: Activite) {
    const p = partsDate(r.date)
    const pourMoi = r.assigne_a && r.assigne_a === utilisateurId
    const nomAssigne = r.assigne_a ? (noms[r.assigne_a] ?? '—') : null
    return (
      <div key={r.id} className={`relative overflow-hidden rounded-2xl border p-4 pl-5 shadow-sm ${pourMoi ? 'border-brh-secondary/50 bg-brh-secondary/5' : 'border-brh-border bg-white'}`}>
        <span className="absolute inset-y-0 left-0 w-1 bg-brh-secondary" />
        {pourMoi && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: orFonce, background: 'rgba(201,162,39,0.18)' }}>
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
            Pour vous
          </span>
        )}
        <div className="flex items-baseline gap-2">
          <span className="font-bold leading-none text-brh-primary" style={{ ...serif, fontSize: 22 }}>{p.jour}</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brh-muted">{p.mois} {p.annee}</span>
        </div>
        <p className="mb-1.5 mt-2.5 text-sm font-semibold text-brh-text">{r.titre}</p>
        {r.heure && <p className="flex items-center gap-1.5 text-xs text-brh-muted"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>{r.heure}</p>}
        {r.lieu && <p className="mt-0.5 flex items-center gap-1.5 text-xs text-brh-muted"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>{r.lieu}</p>}
        {nomAssigne && (
          <p className="mt-2 text-xs text-brh-muted">Concerne : {pourMoi ? <b style={{ color: orFonce }}>{nomAssigne}</b> : <span className="font-medium text-brh-text">{nomAssigne}</span>}</p>
        )}
      </div>
    )
  }

  // Carte d'activité déclarée
  function carteActivite(a: Activite) {
    const p = partsDate(a.date)
    const ct = a.type ? (CHIP_TYPE[a.type] ?? { court: a.type, cls: 'bg-gray-100 text-gray-600' }) : null
    const et = ETATS[a.etat] ?? { label: a.etat, cls: 'bg-gray-100 text-gray-600' }
    return (
      <div key={a.id} className="flex gap-4 rounded-2xl border border-brh-border bg-white p-4 shadow-sm">
        <div className="w-13 shrink-0 rounded-xl border border-brh-border bg-brh-bg px-2 py-1.5 text-center" style={{ width: 52 }}>
          <div className="font-bold leading-none text-brh-primary" style={{ ...serif, fontSize: 19 }}>{p.jour}</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-brh-muted">{p.mois}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-semibold text-brh-text">{a.titre}</p>
            <div className="flex flex-wrap justify-end gap-1.5">
              {ct && <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ct.cls}`}>{ct.court}</span>}
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${et.cls}`}>{et.label}</span>
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brh-muted">
            {a.lieu && <span className="inline-flex items-center gap-1.5"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>{a.lieu}</span>}
            {a.precision && <span className="inline-flex items-center gap-1.5"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7h18M3 12h18M3 17h12" /></svg>{a.precision}</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brh-primary" style={serif}>Activité</h1>
        <p className="mt-1 text-sm text-brh-muted">Réunions de l'équipe, réunions individuelles et activités externes de l'Unité.</p>
      </div>

      {/* 1) Réunions d'équipe */}
      <section>
        <h2 className="text-base font-semibold text-brh-primary" style={serif}>Réunions d'équipe</h2>
        <p className="mt-0.5 text-xs text-brh-muted">Les réunions avec les champions planifiées ce trimestre — visibles par toute l'équipe.</p>
        {chargement ? (
          <p className="mt-4 text-sm text-brh-muted">Chargement…</p>
        ) : reunionsEquipe.length === 0 ? (
          <p className="mt-4 rounded-xl bg-brh-bg px-4 py-3 text-sm text-brh-muted">Aucune réunion d'équipe planifiée pour le moment.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{reunionsEquipe.map(carteReunion)}</div>
        )}
      </section>

      {/* 2) Réunions individuelles */}
      <section>
        <h2 className="text-base font-semibold text-brh-primary" style={serif}>Réunions individuelles</h2>
        <p className="mt-0.5 text-xs text-brh-muted">Quand une réunion vous concerne, votre nom apparaît en surbrillance.</p>
        {chargement ? (
          <p className="mt-4 text-sm text-brh-muted">Chargement…</p>
        ) : reunionsIndiv.length === 0 ? (
          <p className="mt-4 rounded-xl bg-brh-bg px-4 py-3 text-sm text-brh-muted">Aucune réunion individuelle planifiée pour le moment.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{reunionsIndiv.map(carteReunion)}</div>
        )}
      </section>

      {/* 3) Activités externes */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-brh-primary" style={serif}>Activités externes</h2>
            <p className="mt-0.5 text-xs text-brh-muted">Déclarez vos activités externes afin d'obtenir la validation de la direction.</p>
          </div>
          <button onClick={() => { setOuvertForm((v) => !v); setMsg(null) }}
            className="inline-flex items-center gap-2 rounded-lg bg-brh-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d={ouvertForm ? 'M18 6 6 18M6 6l12 12' : 'M12 5v14M5 12h14'} /></svg>
            {ouvertForm ? 'Fermer' : 'Déclarer une activité'}
          </button>
        </div>

        {/* Fiche de déclaration */}
        {ouvertForm && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-brh-border bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-brh-border/70 bg-gradient-to-b from-brh-primary/5 to-transparent px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brh-primary text-white"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg></div>
              <div><p className="font-semibold text-brh-text" style={serif}>Fiche d'activité</p><p className="text-[11px] text-brh-muted">À envoyer à la direction pour approbation</p></div>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <label className={label}>Type d'activité</label>
                <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className={champ}>
                  {TYPES_ACTIVITE.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div>
                <label className={label}>Préciser</label>
                <input value={f.precision} onChange={(e) => setF({ ...f, precision: e.target.value })} placeholder="Ex. : Direction de la Supervision, l'organisme concerné…" className={champ} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Intitulé de l'activité</label>
                <input value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} placeholder="Ex. : Réunion de coordination sur le reporting prudentiel" className={champ} />
              </div>
              <div>
                <label className={label}>Date</label>
                <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={champ} />
              </div>
              <div>
                <label className={label}>Lieu</label>
                <input value={f.lieu} onChange={(e) => setF({ ...f, lieu: e.target.value })} placeholder="Ex. : Siège BRH, 5e étage" className={champ} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Participants (optionnel)</label>
                <input value={f.participants} onChange={(e) => setF({ ...f, participants: e.target.value })} placeholder="Qui participe à l'activité" className={champ} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Objectif / notes (optionnel)</label>
                <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="But de l'activité, points à traiter…" className={zoneTexte} />
              </div>
              {msg && <p className={`sm:col-span-2 rounded-lg px-3 py-2 text-sm ${msg.ok ? 'bg-brh-success/10 text-brh-success' : 'bg-brh-danger/10 text-brh-danger'}`}>{msg.t}</p>}
              <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                <span className="flex items-center gap-1.5 text-xs text-brh-muted">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-brh-warning" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 2" /></svg>
                  Sera « En attente d'approbation » jusqu'à la validation de la direction.
                </span>
                <button onClick={declarer} disabled={envoi}
                  className="inline-flex items-center gap-2 rounded-lg bg-brh-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep disabled:opacity-60">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                  {envoi ? 'Envoi…' : 'Envoyer pour approbation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation hors formulaire */}
        {!ouvertForm && msg && <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${msg.ok ? 'bg-brh-success/10 text-brh-success' : 'bg-brh-danger/10 text-brh-danger'}`}>{msg.t}</p>}

        {/* Mes activités déclarées */}
        <div className="mt-6">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-brh-text">
            Mes activités déclarées
            <span className="rounded-full border border-brh-border bg-brh-bg px-2 py-0.5 text-[11px] font-medium text-brh-muted">{mesActivites.length}</span>
          </p>
          {mesActivites.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-brh-border bg-white p-6 text-center text-sm text-brh-muted">Aucune activité déclarée pour le moment.</p>
          ) : (
            <div className="space-y-3">{mesActivites.map(carteActivite)}</div>
          )}
        </div>
      </section>
    </div>
  )
}
