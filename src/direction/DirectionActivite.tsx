import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { notifier } from '../notifs'

const serif = { fontFamily: '"Fraunces", Georgia, "Times New Roman", serif' } as const
const champ = 'w-full rounded-lg border border-brh-border bg-white px-3 py-2 text-sm text-brh-text outline-none transition focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'
const flabel = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-brh-muted'

type Cadre = { id: string; nom: string }
type Activite = { id: string; categorie: string; titre: string; type: string | null; date: string | null; lieu: string | null; assigne_a: string | null; etat: string; user_id: string | null }

function frDate(d: string | null): string { return d ? d.split('-').reverse().join('/') : '' }
const ETAT: Record<string, { label: string; cls: string }> = {
  approuvee: { label: 'Approuvée', cls: 'bg-brh-success/10 text-brh-success' },
  refusee: { label: 'Refusée', cls: 'bg-brh-danger/10 text-brh-danger' },
  fermee: { label: 'Fermée', cls: 'bg-gray-100 text-gray-600' },
}

const formVide = { categorie: 'reunion_equipe', assigne_a: '', titre: '', date: '', heure: '', lieu: '' }

// 🗓️ Activité (direction) : planifier des réunions, approuver les activités, demander les rapports
export function DirectionActivite() {
  const [cadres, setCadres] = useState<Cadre[]>([])
  const [noms, setNoms] = useState<Record<string, string>>({})
  const [activites, setActivites] = useState<Activite[]>([])
  const [chargement, setChargement] = useState(true)
  const [ouvert, setOuvert] = useState(false)
  const [f, setF] = useState({ ...formVide })
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)

  const charger = useCallback(async () => {
    const [uRes, aRes] = await Promise.all([
      supabase.from('users').select('id, nom, role'),
      supabase.from('activites').select('id, categorie, titre, type, date, lieu, assigne_a, etat, user_id').order('date', { ascending: false }),
    ])
    const users = (uRes.data ?? []) as any[]
    setNoms(Object.fromEntries(users.map((u) => [u.id, u.nom])))
    setCadres(users.filter((u) => u.role === 'cadre').map((u) => ({ id: u.id, nom: u.nom })))
    setActivites((aRes.data ?? []) as Activite[])
    setChargement(false)
  }, [])
  useEffect(() => { charger() }, [charger])

  async function planifier() {
    if (f.titre.trim() === '') { setMsg({ ok: false, t: 'Donne un intitulé à la réunion.' }); return }
    if (f.categorie === 'reunion_individuelle' && !f.assigne_a) { setMsg({ ok: false, t: 'Choisis le cadre concerné.' }); return }
    setBusy('form'); setMsg(null)
    const { error } = await supabase.from('activites').insert({
      categorie: f.categorie, titre: f.titre.trim(), date: f.date || null, heure: f.heure.trim() || null,
      lieu: f.lieu.trim() || null, assigne_a: f.categorie === 'reunion_individuelle' ? f.assigne_a : null, etat: 'planifiee',
    })
    setBusy(null)
    if (error) { setMsg({ ok: false, t: 'Erreur : ' + error.message }); return }
    if (f.categorie === 'reunion_individuelle' && f.assigne_a) await notifier(f.assigne_a, `Une réunion individuelle « ${f.titre.trim()} » vous a été planifiée${f.date ? ' le ' + frDate(f.date) : ''}.`, 'activites')
    setF({ ...formVide }); setOuvert(false); setMsg({ ok: true, t: 'Réunion planifiée.' })
    await charger()
  }

  async function decider(a: Activite, etat: 'approuvee' | 'refusee') {
    setBusy(a.id)
    await supabase.from('activites').update({ etat }).eq('id', a.id)
    if (a.user_id) await notifier(a.user_id, `Votre activité « ${a.titre} » a été ${etat === 'approuvee' ? 'approuvée' : 'refusée'} par la direction.`, 'activites')
    setBusy(null); await charger()
  }
  async function demanderRapport(a: Activite) {
    setBusy(a.id)
    if (a.user_id) await notifier(a.user_id, `La direction demande un rapport pour l'activité « ${a.titre} ».`, 'activites')
    setBusy(null); setMsg({ ok: true, t: `Rapport demandé à ${noms[a.user_id ?? ''] ?? 'l’auteur'}.` })
  }

  if (chargement) return <p className="text-center text-sm text-brh-muted">Chargement…</p>

  const demandes = activites.filter((a) => a.categorie === 'activite_externe' && a.etat === 'en_attente')
  const enCours = activites.filter((a) => a.categorie === 'activite_externe' && a.etat === 'approuvee')
  const historique = activites.filter((a) => a.categorie === 'activite_externe' && ['refusee', 'fermee'].includes(a.etat))

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-brh-primary" style={serif}>Activité</h1><p className="mt-1 text-sm text-brh-muted">Planifiez des réunions, approuvez les activités et demandez les rapports.</p></div>
        <button onClick={() => { setOuvert((v) => !v); setMsg(null) }} className="inline-flex items-center gap-2 rounded-lg bg-brh-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d={ouvert ? 'M18 6 6 18M6 6l12 12' : 'M12 5v14M5 12h14'} /></svg>{ouvert ? 'Fermer' : 'Planifier une réunion'}
        </button>
      </div>

      {ouvert && (
        <div className="rounded-2xl border border-brh-border bg-white shadow-sm">
          <div className="border-b border-brh-border/70 bg-gradient-to-b from-brh-primary/5 to-transparent px-5 py-3"><p className="font-semibold text-brh-text" style={serif}>Nouvelle réunion</p></div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div><label className={flabel}>Type</label><select value={f.categorie} onChange={(e) => setF({ ...f, categorie: e.target.value })} className={champ}><option value="reunion_equipe">Réunion d'équipe</option><option value="reunion_individuelle">Réunion individuelle</option></select></div>
            {f.categorie === 'reunion_individuelle' && (
              <div><label className={flabel}>Cadre concerné</label><select value={f.assigne_a} onChange={(e) => setF({ ...f, assigne_a: e.target.value })} className={champ}><option value="">— Choisir —</option>{cadres.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
            )}
            <div className="sm:col-span-2"><label className={flabel}>Intitulé</label><input value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} placeholder="Ex. : Point trimestriel avec les champions" className={champ} /></div>
            <div><label className={flabel}>Date</label><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={champ} /></div>
            <div><label className={flabel}>Heure</label><input value={f.heure} onChange={(e) => setF({ ...f, heure: e.target.value })} placeholder="Ex. : 10h00" className={champ} /></div>
            <div className="sm:col-span-2"><label className={flabel}>Lieu</label><input value={f.lieu} onChange={(e) => setF({ ...f, lieu: e.target.value })} placeholder="Ex. : Salle du conseil, BRH" className={champ} /></div>
            {msg && <p className={`sm:col-span-2 rounded-lg px-3 py-2 text-sm ${msg.ok ? 'bg-brh-success/10 text-brh-success' : 'bg-brh-danger/10 text-brh-danger'}`}>{msg.t}</p>}
            <div className="flex justify-end sm:col-span-2"><button onClick={planifier} disabled={busy === 'form'} className="rounded-lg bg-brh-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep disabled:opacity-60">{busy === 'form' ? 'Enregistrement…' : 'Enregistrer la réunion'}</button></div>
          </div>
        </div>
      )}
      {!ouvert && msg && <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? 'bg-brh-success/10 text-brh-success' : 'bg-brh-danger/10 text-brh-danger'}`}>{msg.t}</p>}

      {/* Demandes à traiter */}
      <section>
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brh-text">Demandes à traiter <span className="rounded-full bg-brh-bg px-2 py-0.5 text-[11px] font-medium text-brh-muted">{demandes.length}</span></p>
        {demandes.length === 0 ? <p className="rounded-xl bg-brh-bg px-4 py-3 text-sm text-brh-muted">Aucune activité en attente.</p> : (
          <div className="space-y-3">{demandes.map((a) => (
            <div key={a.id} className="rounded-2xl border border-brh-border bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-brh-text">{a.titre}</p>
              <p className="mt-0.5 text-xs text-brh-muted">{noms[a.user_id ?? ''] ?? '—'}{a.date ? ' · ' + frDate(a.date) : ''}{a.lieu ? ' · ' + a.lieu : ''}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => decider(a, 'approuvee')} disabled={busy === a.id} className="inline-flex items-center gap-1.5 rounded-lg bg-brh-success px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>Accepter</button>
                <button onClick={() => decider(a, 'refusee')} disabled={busy === a.id} className="rounded-lg border border-brh-danger/40 px-3 py-2 text-xs font-semibold text-brh-danger disabled:opacity-60">Refuser</button>
              </div>
            </div>
          ))}</div>
        )}
      </section>

      {/* En cours */}
      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brh-text">Activités en cours (approuvées)</p>
        {enCours.length === 0 ? <p className="rounded-xl bg-brh-bg px-4 py-3 text-sm text-brh-muted">Aucune activité en cours.</p> : (
          <div className="space-y-3">{enCours.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brh-border bg-white p-4 shadow-sm">
              <div><p className="text-sm font-semibold text-brh-text">{a.titre}</p><p className="mt-0.5 text-xs text-brh-muted">{noms[a.user_id ?? ''] ?? '—'}{a.date ? ' · ' + frDate(a.date) : ''}</p></div>
              <button onClick={() => demanderRapport(a)} disabled={busy === a.id} className="inline-flex items-center gap-1.5 rounded-lg bg-brh-secondary px-3 py-2 text-xs font-semibold text-brh-primary disabled:opacity-60"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>Demander le rapport</button>
            </div>
          ))}</div>
        )}
      </section>

      {/* Historique */}
      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brh-text">Historique</p>
        {historique.length === 0 ? <p className="rounded-xl bg-brh-bg px-4 py-3 text-sm text-brh-muted">Aucun historique pour le moment.</p> : (
          <div className="overflow-hidden rounded-2xl border border-brh-border bg-white shadow-sm">
            {historique.map((a, i) => (
              <div key={a.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${i > 0 ? 'border-t border-brh-border/60' : ''}`}>
                <div className="min-w-0"><p className="truncate text-sm font-medium text-brh-text">{a.titre}</p><p className="text-xs text-brh-muted">{noms[a.user_id ?? ''] ?? '—'}{a.date ? ' · ' + frDate(a.date) : ''}</p></div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${(ETAT[a.etat] ?? ETAT.fermee).cls}`}>{(ETAT[a.etat] ?? { label: a.etat }).label}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
