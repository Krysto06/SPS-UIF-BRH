import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { notifier } from '../notifs'

const serif = { fontFamily: '"Fraunces", Georgia, "Times New Roman", serif' } as const
const champ = 'w-full rounded-lg border border-brh-border bg-white px-3 py-2 text-sm text-brh-text outline-none transition focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'
const flabel = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-brh-muted'

type Evenement = { id: string; titre: string; date: string | null; lieu: string | null; description: string | null; statut: string }
type Tache = { id: string; evenement_id: string; titre: string; assigne_a: string | null; fait: boolean }
type Cadre = { id: string; nom: string }

function frDate(d: string | null): string { return d ? d.split('-').reverse().join('/') : '' }
const STATUT: Record<string, { label: string; cls: string }> = {
  a_venir: { label: 'À venir', cls: 'bg-brh-secondary/15 text-brh-secondary' },
  en_cours: { label: 'En cours', cls: 'bg-blue-50 text-blue-700' },
  termine: { label: 'Terminé', cls: 'bg-brh-success/10 text-brh-success' },
}

// 🎉 Événement de l'UIF (direction) : créer des événements, attribuer des tâches
export function DirectionEvenements() {
  const [events, setEvents] = useState<Evenement[]>([])
  const [taches, setTaches] = useState<Record<string, Tache[]>>({})
  const [cadres, setCadres] = useState<Cadre[]>([])
  const [noms, setNoms] = useState<Record<string, string>>({})
  const [chargement, setChargement] = useState(true)

  const [ouvert, setOuvert] = useState(false)
  const [f, setF] = useState({ titre: '', date: '', lieu: '', description: '' })
  const [nvTache, setNvTache] = useState<Record<string, { titre: string; assigne: string }>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const charger = useCallback(async () => {
    const [eRes, tRes, uRes] = await Promise.all([
      supabase.from('evenements').select('*').order('date', { ascending: true }),
      supabase.from('taches_evenement').select('*').order('created_at', { ascending: true }),
      supabase.from('users').select('id, nom, role'),
    ])
    setEvents((eRes.data ?? []) as Evenement[])
    const gr: Record<string, Tache[]> = {}; ((tRes.data ?? []) as Tache[]).forEach((t) => { (gr[t.evenement_id] ??= []).push(t) }); setTaches(gr)
    const users = (uRes.data ?? []) as any[]
    setNoms(Object.fromEntries(users.map((u) => [u.id, u.nom])))
    setCadres(users.filter((u) => u.role === 'cadre').map((u) => ({ id: u.id, nom: u.nom })))
    setChargement(false)
  }, [])
  useEffect(() => { charger() }, [charger])

  async function creerEvenement() {
    if (f.titre.trim() === '') { setMsg('Donne un titre à l’événement.'); return }
    setBusy('form')
    await supabase.from('evenements').insert({ titre: f.titre.trim(), date: f.date || null, lieu: f.lieu.trim() || null, description: f.description.trim() || null, statut: 'a_venir' })
    setBusy(null); setF({ titre: '', date: '', lieu: '', description: '' }); setOuvert(false); setMsg(null)
    await charger()
  }
  async function ajouterTache(ev: Evenement) {
    const nv = nvTache[ev.id]
    if (!nv || nv.titre.trim() === '') return
    setBusy('t-' + ev.id)
    await supabase.from('taches_evenement').insert({ evenement_id: ev.id, titre: nv.titre.trim(), assigne_a: nv.assigne || null })
    if (nv.assigne) await notifier(nv.assigne, `Une tâche vous a été attribuée pour « ${ev.titre} » : ${nv.titre.trim()}.`, 'event')
    setNvTache((p) => ({ ...p, [ev.id]: { titre: '', assigne: '' } }))
    setBusy(null); await charger()
  }
  async function basculerTache(t: Tache) {
    setTaches((prev) => ({ ...prev, [t.evenement_id]: (prev[t.evenement_id] ?? []).map((x) => x.id === t.id ? { ...x, fait: !x.fait } : x) }))
    await supabase.from('taches_evenement').update({ fait: !t.fait }).eq('id', t.id)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-brh-primary" style={serif}>Événement de l'UIF</h1><p className="mt-1 text-sm text-brh-muted">Créez des événements, attribuez des tâches et suivez ceux en cours.</p></div>
        <button onClick={() => { setOuvert((v) => !v); setMsg(null) }} className="inline-flex items-center gap-2 rounded-lg bg-brh-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d={ouvert ? 'M18 6 6 18M6 6l12 12' : 'M12 5v14M5 12h14'} /></svg>{ouvert ? 'Fermer' : 'Nouvel événement'}
        </button>
      </div>

      {ouvert && (
        <div className="rounded-2xl border border-brh-border bg-white shadow-sm">
          <div className="border-b border-brh-border/70 bg-gradient-to-b from-brh-primary/5 to-transparent px-5 py-3"><p className="font-semibold text-brh-text" style={serif}>Nouvel événement</p></div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className={flabel}>Titre de l'événement</label><input value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} placeholder="Ex. : Journée nationale de l'inclusion financière" className={champ} /></div>
            <div><label className={flabel}>Date</label><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={champ} /></div>
            <div><label className={flabel}>Lieu</label><input value={f.lieu} onChange={(e) => setF({ ...f, lieu: e.target.value })} placeholder="Ex. : Karibe Convention Center" className={champ} /></div>
            <div className="sm:col-span-2"><label className={flabel}>Description / objectif</label><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={champ + ' min-h-[60px] resize-y'} /></div>
            {msg && <p className="sm:col-span-2 rounded-lg bg-brh-danger/10 px-3 py-2 text-sm text-brh-danger">{msg}</p>}
            <div className="flex justify-end sm:col-span-2"><button onClick={creerEvenement} disabled={busy === 'form'} className="rounded-lg bg-brh-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep disabled:opacity-60">{busy === 'form' ? 'Création…' : 'Créer l’événement'}</button></div>
          </div>
        </div>
      )}

      {chargement ? <p className="text-sm text-brh-muted">Chargement…</p> : events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brh-border bg-white p-8 text-center text-sm text-brh-muted">Aucun événement pour le moment. Crée le premier avec « Nouvel événement ».</p>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => {
            const ts = taches[ev.id] ?? []
            const faites = ts.filter((t) => t.fait).length
            const st = STATUT[ev.statut] ?? STATUT.a_venir
            const nv = nvTache[ev.id] ?? { titre: '', assigne: '' }
            return (
              <div key={ev.id} className="rounded-2xl border border-brh-border bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="font-semibold text-brh-text" style={serif}>{ev.titre}</p><p className="mt-0.5 text-xs text-brh-muted">{frDate(ev.date)}{ev.lieu ? ' · ' + ev.lieu : ''}</p></div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                </div>
                {ev.description && <p className="mt-2 text-sm text-brh-text/80">{ev.description}</p>}

                <div className="mt-4 border-t border-brh-border/60 pt-4">
                  <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brh-muted">Tâches {ts.length > 0 && <span className="rounded-full bg-brh-bg px-2 py-0.5 text-[11px] font-medium normal-case">{faites}/{ts.length}</span>}</p>
                  {ts.length > 0 && (
                    <ul className="mb-3 space-y-1.5">{ts.map((t) => (
                      <li key={t.id} className="flex items-center gap-2.5">
                        <button onClick={() => basculerTache(t)} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${t.fait ? 'border-brh-success bg-brh-success' : 'border-slate-400 bg-white hover:border-brh-primary'}`}>
                          {t.fait && <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M20 6 9 17l-5-5" /></svg>}
                        </button>
                        <span className={`flex-1 text-sm ${t.fait ? 'text-brh-muted line-through' : 'text-brh-text'}`}>{t.titre}</span>
                        {t.assigne_a && <span className="shrink-0 rounded-full bg-brh-bg px-2 py-0.5 text-[10px] font-medium text-brh-muted">{noms[t.assigne_a] ?? '—'}</span>}
                      </li>
                    ))}</ul>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <input value={nv.titre} onChange={(e) => setNvTache((p) => ({ ...p, [ev.id]: { ...nv, titre: e.target.value } }))} placeholder="Nouvelle tâche…" className={champ + ' flex-1'} />
                    <select value={nv.assigne} onChange={(e) => setNvTache((p) => ({ ...p, [ev.id]: { ...nv, assigne: e.target.value } }))} className={champ + ' w-auto'}><option value="">— Cadre —</option>{cadres.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select>
                    <button onClick={() => ajouterTache(ev)} disabled={busy === 't-' + ev.id} className="shrink-0 rounded-lg border border-brh-border bg-white px-4 py-2 text-sm font-semibold text-brh-primary transition hover:bg-brh-bg disabled:opacity-60">Ajouter</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
