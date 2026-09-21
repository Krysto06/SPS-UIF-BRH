import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { notifier, notifierRole } from '../notifs'
import { Avatar } from '../ui'

const serif = { fontFamily: '"Manrope", "Inter", ui-sans-serif, sans-serif' } as const
const champ = 'w-full rounded-lg border border-brh-border bg-white px-3 py-2 text-sm text-brh-text outline-none transition focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'
const flabel = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-brh-muted'

type Reunion = { id: string; objet: string; date: string | null; heure: string | null; lieu: string | null; champion_id: string | null; ordre_du_jour: string | null; notes: string | null; statut: string; created_at: string }
type Membre = { id: string; nom: string }

function frDate(d: string | null): string { return d ? d.split('-').reverse().join('/') : '' }
const STATUT: Record<string, { label: string; cls: string }> = {
  a_venir: { label: 'À venir', cls: 'bg-brh-secondary/15 text-brh-secondary' },
  tenue: { label: 'Tenue', cls: 'bg-brh-success/10 text-brh-success' },
}
const formVide = { objet: '', date: '', heure: '', lieu: '', champion_id: '', ordre_du_jour: '' }

// 🗓️ Fiches de réunion avec champion.
// `peutGerer` (secrétaire, direction, admin) : voit TOUTES les réunions et
// peut en créer / désigner un champion. Un cadre non-gestionnaire ne voit que
// les réunions dont il est le champion.
export function Reunions({ utilisateurId, peutGerer = false }: { utilisateurId?: string; peutGerer?: boolean }) {
  const [reunions, setReunions] = useState<Reunion[]>([])
  const [membres, setMembres] = useState<Membre[]>([])
  const [noms, setNoms] = useState<Record<string, string>>({})
  const [chargement, setChargement] = useState(true)
  const [ouvert, setOuvert] = useState(false)
  const [f, setF] = useState({ ...formVide })
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const charger = useCallback(async () => {
    const [rRes, uRes] = await Promise.all([
      supabase.from('reunions').select('*').order('date', { ascending: true }),
      supabase.from('users').select('id, nom, role'),
    ])
    const rs = (rRes.data ?? []) as Reunion[]
    setReunions(rs)
    setNotes(Object.fromEntries(rs.map((r) => [r.id, r.notes ?? ''])))
    const users = (uRes.data ?? []) as any[]
    setNoms(Object.fromEntries(users.map((u) => [u.id, u.nom])))
    setMembres(users.filter((u) => u.role === 'cadre' || u.role === 'secretaire').map((u) => ({ id: u.id, nom: u.nom })))
    setChargement(false)
  }, [])
  useEffect(() => { charger() }, [charger])

  async function creer() {
    if (f.objet.trim() === '') { setMsg('Donne un objet à la réunion.'); return }
    setBusy('form'); setMsg(null)
    const { error } = await supabase.from('reunions').insert({
      objet: f.objet.trim(), date: f.date || null, heure: f.heure.trim() || null, lieu: f.lieu.trim() || null,
      champion_id: f.champion_id || null, ordre_du_jour: f.ordre_du_jour.trim() || null,
      statut: 'a_venir', created_by: utilisateurId ?? null,
    })
    setBusy(null)
    if (error) { setMsg('Erreur : ' + error.message); return }
    if (f.champion_id) await notifier(f.champion_id, `Vous êtes champion de la réunion « ${f.objet.trim()} ».`, 'reunions')
    await notifierRole('secretaire', `Nouvelle réunion planifiée : « ${f.objet.trim()} ».`, 'reunions')
    setF({ ...formVide }); setOuvert(false)
    await charger()
  }
  async function enregistrerNotes(r: Reunion) {
    setBusy(r.id)
    await supabase.from('reunions').update({ notes: notes[r.id] ?? '' }).eq('id', r.id)
    setBusy(null)
    await charger()
  }
  async function basculerStatut(r: Reunion) {
    const nv = r.statut === 'tenue' ? 'a_venir' : 'tenue'
    setBusy(r.id)
    await supabase.from('reunions').update({ statut: nv }).eq('id', r.id)
    setBusy(null)
    await charger()
  }
  async function supprimer(id: string) {
    if (!confirm('Supprimer cette réunion ?')) return
    await supabase.from('reunions').delete().eq('id', id)
    await charger()
  }

  const visibles = peutGerer ? reunions : reunions.filter((r) => r.champion_id === utilisateurId)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* En-tête */}
      <div className="relative overflow-hidden rounded-[22px] px-7 py-6 text-white shadow-md" style={{ background: 'linear-gradient(135deg,#12355B,#081A31)' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(520px 260px at 105% -10%, rgba(201,162,39,0.22), transparent 60%)' }} />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brh-gold-light">Réunions</p>
            <h1 className="mt-2 text-[26px] font-bold leading-tight" style={serif}>Fiches de réunion</h1>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-white/70">{peutGerer ? 'Planifiez les réunions, désignez un champion et gardez l’ordre du jour et les décisions.' : 'Les réunions dont vous êtes le champion : préparez-les et notez les décisions.'}</p>
          </div>
          {peutGerer && (
            <button onClick={() => { setOuvert((v) => !v); setMsg(null) }} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brh-secondary px-4 py-2 text-sm font-semibold text-brh-primary shadow-sm transition hover:opacity-90">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2"><path d={ouvert ? 'M18 6 6 18M6 6l12 12' : 'M12 5v14M5 12h14'} /></svg>{ouvert ? 'Fermer' : 'Nouvelle réunion'}
            </button>
          )}
        </div>
      </div>

      {/* Formulaire (gestionnaires) */}
      {peutGerer && ouvert && (
        <div className="rounded-2xl border border-brh-border bg-white shadow-sm">
          <div className="border-b border-brh-border/70 bg-gradient-to-b from-brh-primary/5 to-transparent px-5 py-3"><p className="font-semibold text-brh-text" style={serif}>Nouvelle fiche de réunion</p></div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className={flabel}>Objet de la réunion</label><input value={f.objet} onChange={(e) => setF({ ...f, objet: e.target.value })} placeholder="Ex. : Coordination des champions — SNIF" className={champ} /></div>
            <div><label className={flabel}>Date</label><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={champ} /></div>
            <div><label className={flabel}>Heure</label><input value={f.heure} onChange={(e) => setF({ ...f, heure: e.target.value })} placeholder="Ex. : 10h00" className={champ} /></div>
            <div><label className={flabel}>Lieu</label><input value={f.lieu} onChange={(e) => setF({ ...f, lieu: e.target.value })} placeholder="Ex. : Salle de réunion, 3e étage" className={champ} /></div>
            <div><label className={flabel}>Champion</label><select value={f.champion_id} onChange={(e) => setF({ ...f, champion_id: e.target.value })} className={champ}><option value="">— Désigner un champion —</option>{membres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}</select></div>
            <div className="sm:col-span-2"><label className={flabel}>Ordre du jour</label><textarea value={f.ordre_du_jour} onChange={(e) => setF({ ...f, ordre_du_jour: e.target.value })} placeholder="Points à aborder…" className={champ + ' min-h-[64px] resize-y'} /></div>
            {msg && <p className="sm:col-span-2 rounded-lg bg-brh-danger/10 px-3 py-2 text-sm text-brh-danger">{msg}</p>}
            <div className="flex justify-end sm:col-span-2"><button onClick={creer} disabled={busy === 'form'} className="rounded-lg bg-brh-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep disabled:opacity-60">{busy === 'form' ? 'Création…' : 'Créer la fiche'}</button></div>
          </div>
        </div>
      )}

      {/* Liste */}
      {chargement ? <p className="text-sm text-brh-muted">Chargement…</p> : visibles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brh-border bg-white p-8 text-center text-sm text-brh-muted">{peutGerer ? 'Aucune réunion planifiée. Crée la première avec « Nouvelle réunion ».' : 'Aucune réunion où vous êtes champion pour le moment.'}</p>
      ) : (
        <div className="space-y-4">
          {visibles.map((r) => {
            const st = STATUT[r.statut] ?? STATUT.a_venir
            const peutEditer = peutGerer || r.champion_id === utilisateurId
            const jeSuisChampion = r.champion_id === utilisateurId
            return (
              <div key={r.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${jeSuisChampion ? 'border-brh-secondary/50 ring-1 ring-brh-secondary/20' : 'border-brh-border'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-brh-text" style={serif}>{r.objet}</p>
                    <p className="mt-0.5 text-xs text-brh-muted">{frDate(r.date)}{r.heure ? ' · ' + r.heure : ''}{r.lieu ? ' · ' + r.lieu : ''}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                    {peutGerer && <button onClick={() => supprimer(r.id)} title="Supprimer" className="rounded-md p-1 text-brh-muted transition hover:bg-brh-danger/10 hover:text-brh-danger"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg></button>}
                  </div>
                </div>

                {/* Champion */}
                <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-brh-bg/60 px-3 py-2">
                  {r.champion_id ? <Avatar nom={noms[r.champion_id] ?? '?'} gold size={30} /> : <span className="flex h-[30px] w-[30px] items-center justify-center rounded-xl bg-brh-border text-brh-muted"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg></span>}
                  <div className="leading-tight">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-brh-muted">Champion</p>
                    <p className="text-sm font-semibold" style={{ color: r.champion_id ? '#B8860B' : '#94a3b8' }}>{r.champion_id ? (noms[r.champion_id] ?? '—') : 'Non désigné'}{jeSuisChampion ? ' · vous' : ''}</p>
                  </div>
                </div>

                {r.ordre_du_jour && (
                  <div className="mt-3"><p className="text-[11px] font-bold uppercase tracking-wide text-brh-muted">Ordre du jour</p><p className="mt-1 whitespace-pre-wrap text-sm text-brh-text/85">{r.ordre_du_jour}</p></div>
                )}

                {/* Notes / décisions */}
                <div className="mt-3 border-t border-brh-border/60 pt-3">
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-brh-muted">Notes & décisions</p>
                  {peutEditer ? (
                    <>
                      <textarea value={notes[r.id] ?? ''} onChange={(e) => setNotes((p) => ({ ...p, [r.id]: e.target.value }))} placeholder="Compte-rendu, décisions prises…" className={champ + ' min-h-[56px] resize-y'} />
                      <div className="mt-2 flex flex-wrap justify-end gap-2">
                        <button onClick={() => basculerStatut(r)} disabled={busy === r.id} className="rounded-lg border border-brh-border px-3.5 py-2 text-xs font-semibold text-brh-text transition hover:bg-brh-bg disabled:opacity-60">{r.statut === 'tenue' ? 'Rouvrir' : 'Marquer tenue'}</button>
                        <button onClick={() => enregistrerNotes(r)} disabled={busy === r.id} className="rounded-lg bg-brh-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-brh-deep disabled:opacity-60">{busy === r.id ? '…' : 'Enregistrer'}</button>
                      </div>
                    </>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm text-brh-text/85">{r.notes || <span className="text-brh-muted">Aucune note pour le moment.</span>}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
