import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { notifierRole } from '../notifs'
import { TitreSection, Avatar } from '../ui'

const serif = { fontFamily: '"Manrope", "Inter", ui-sans-serif, sans-serif' } as const
const champ = 'w-full rounded-lg border border-brh-border bg-white px-3 py-2 text-sm text-brh-text outline-none transition focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'
const flabel = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-brh-muted'

type Demande = { id: string; periode: string; libelle: string; echeance: string | null; statut: string; created_at: string }
type Rapport = { id: string; demande_id: string; user_id: string | null; contenu: string | null; created_at: string }

const PERIODES: Record<string, { label: string; cls: string }> = {
  mensuel: { label: 'Mensuel', cls: 'bg-blue-50 text-blue-700' },
  trimestriel: { label: 'Trimestriel', cls: 'bg-brh-secondary/15 text-brh-secondary' },
  annuel: { label: 'Annuel', cls: 'bg-brh-success/10 text-brh-success' },
}
function frDate(d: string | null): string { return d ? d.split('-').reverse().join('/') : '' }

// 📑 Rapport trimestriel (admin / direction) : demander un rapport (mensuel,
// trimestriel ou annuel) à tous les cadres, et lire les rapports reçus.
export function RapportTrimestriel({ utilisateurId }: { utilisateurId?: string }) {
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [rapports, setRapports] = useState<Rapport[]>([])
  const [cadres, setCadres] = useState<{ id: string; nom: string }[]>([])
  const [noms, setNoms] = useState<Record<string, string>>({})
  const [chargement, setChargement] = useState(true)
  const [ouvert, setOuvert] = useState(false)
  const [f, setF] = useState({ periode: 'trimestriel', libelle: '', echeance: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [deplie, setDeplie] = useState<string | null>(null)

  const charger = useCallback(async () => {
    const [dRes, rRes, uRes] = await Promise.all([
      supabase.from('demandes_rapport').select('*').order('created_at', { ascending: false }),
      supabase.from('rapports_periode').select('*').order('created_at', { ascending: true }),
      supabase.from('users').select('id, nom, role'),
    ])
    setDemandes((dRes.data ?? []) as Demande[])
    setRapports((rRes.data ?? []) as Rapport[])
    const users = (uRes.data ?? []) as any[]
    setNoms(Object.fromEntries(users.map((u) => [u.id, u.nom])))
    setCadres(users.filter((u) => u.role === 'cadre').map((u) => ({ id: u.id, nom: u.nom })))
    setChargement(false)
  }, [])
  useEffect(() => { charger() }, [charger])

  async function demander() {
    const libelle = f.libelle.trim() || PERIODES[f.periode].label + ' — ' + new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    setBusy(true); setMsg(null)
    const { error } = await supabase.from('demandes_rapport').insert({
      periode: f.periode, libelle, echeance: f.echeance || null, statut: 'ouverte', created_by: utilisateurId ?? null,
    })
    setBusy(false)
    if (error) { setMsg('Erreur : ' + error.message); return }
    await notifierRole('cadre', `La direction demande un rapport ${PERIODES[f.periode].label.toLowerCase()} : « ${libelle} ».`, 'rapport')
    setF({ periode: 'trimestriel', libelle: '', echeance: '' }); setOuvert(false)
    await charger()
  }
  async function cloturer(d: Demande) {
    await supabase.from('demandes_rapport').update({ statut: d.statut === 'cloturee' ? 'ouverte' : 'cloturee' }).eq('id', d.id)
    await charger()
  }
  async function supprimer(id: string) {
    if (!confirm('Supprimer cette demande de rapport et les rapports reçus ?')) return
    await supabase.from('demandes_rapport').delete().eq('id', id)
    await charger()
  }

  function rapportsDe(demandeId: string) { return rapports.filter((r) => r.demande_id === demandeId) }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* En-tête */}
      <div className="relative overflow-hidden rounded-[22px] px-7 py-6 text-white shadow-md" style={{ background: 'linear-gradient(135deg,#12355B,#081A31)' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(520px 260px at 105% -10%, rgba(201,162,39,0.22), transparent 60%)' }} />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brh-gold-light">Reddition de comptes</p>
            <h1 className="mt-2 text-[26px] font-bold leading-tight" style={serif}>Rapport trimestriel</h1>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-white/70">Demandez à tous les cadres un rapport mensuel, trimestriel ou annuel, et consultez leurs réponses.</p>
          </div>
          <button onClick={() => { setOuvert((v) => !v); setMsg(null) }} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brh-secondary px-4 py-2 text-sm font-semibold text-brh-primary shadow-sm transition hover:opacity-90">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2"><path d={ouvert ? 'M18 6 6 18M6 6l12 12' : 'M12 5v14M5 12h14'} /></svg>{ouvert ? 'Fermer' : 'Demander un rapport'}
          </button>
        </div>
      </div>

      {/* Formulaire de demande */}
      {ouvert && (
        <div className="rounded-2xl border border-brh-border bg-white shadow-sm">
          <div className="border-b border-brh-border/70 bg-gradient-to-b from-brh-primary/5 to-transparent px-5 py-3"><p className="font-semibold text-brh-text" style={serif}>Nouvelle demande de rapport</p></div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div><label className={flabel}>Période</label><select value={f.periode} onChange={(e) => setF({ ...f, periode: e.target.value })} className={champ}>{Object.entries(PERIODES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
            <div><label className={flabel}>Échéance (optionnel)</label><input type="date" value={f.echeance} onChange={(e) => setF({ ...f, echeance: e.target.value })} className={champ} /></div>
            <div className="sm:col-span-2"><label className={flabel}>Intitulé</label><input value={f.libelle} onChange={(e) => setF({ ...f, libelle: e.target.value })} placeholder="Ex. : Rapport du Trimestre 2 · 2026–2027" className={champ} /></div>
            {msg && <p className="sm:col-span-2 rounded-lg bg-brh-danger/10 px-3 py-2 text-sm text-brh-danger">{msg}</p>}
            <div className="flex justify-end sm:col-span-2"><button onClick={demander} disabled={busy} className="rounded-lg bg-brh-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep disabled:opacity-60">{busy ? 'Envoi…' : 'Demander à tous les cadres'}</button></div>
          </div>
        </div>
      )}

      {/* Liste des demandes */}
      <div>
        <TitreSection titre="Demandes de rapport" n={demandes.length} />
        {chargement ? <p className="text-sm text-brh-muted">Chargement…</p> : demandes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-brh-border bg-white p-8 text-center text-sm text-brh-muted">Aucune demande pour le moment. Lance la première avec « Demander un rapport ».</p>
        ) : (
          <div className="space-y-3">
            {demandes.map((d) => {
              const pr = PERIODES[d.periode] ?? PERIODES.trimestriel
              const reps = rapportsDe(d.id)
              const estDeplie = deplie === d.id
              return (
                <div key={d.id} className="rounded-2xl border border-brh-border bg-white shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${pr.cls}`}>{pr.label}</span>
                        {d.statut === 'cloturee' && <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">Clôturée</span>}
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-brh-text">{d.libelle}</p>
                      <p className="mt-0.5 text-xs text-brh-muted">Demandée le {frDate(d.created_at.slice(0, 10))}{d.echeance ? ' · échéance ' + frDate(d.echeance) : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-brh-primary/5 px-2.5 py-1 text-[11px] font-semibold text-brh-primary">{reps.length}/{cadres.length} reçus</span>
                      <button onClick={() => cloturer(d)} className="rounded-lg border border-brh-border px-3 py-1.5 text-[11px] font-semibold text-brh-text transition hover:bg-brh-bg">{d.statut === 'cloturee' ? 'Rouvrir' : 'Clôturer'}</button>
                      <button onClick={() => supprimer(d.id)} title="Supprimer" className="rounded-md p-1.5 text-brh-muted transition hover:bg-brh-danger/10 hover:text-brh-danger"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg></button>
                    </div>
                  </div>

                  <div className="border-t border-brh-border/60 px-4 py-2.5">
                    <button onClick={() => setDeplie(estDeplie ? null : d.id)} className="flex items-center gap-1.5 text-xs font-semibold text-brh-primary">
                      <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${estDeplie ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                      {estDeplie ? 'Masquer les rapports' : 'Voir les rapports reçus'}
                    </button>
                    {estDeplie && (
                      <div className="mt-3 space-y-3 pb-1">
                        {reps.length === 0 ? <p className="text-sm text-brh-muted">Aucun rapport reçu pour le moment.</p> : reps.map((r) => (
                          <div key={r.id} className="rounded-xl border border-brh-border bg-brh-bg/40 p-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar nom={noms[r.user_id ?? ''] ?? '?'} size={30} />
                              <div><p className="text-sm font-semibold text-brh-text">{noms[r.user_id ?? ''] ?? '—'}</p><p className="text-[11px] text-brh-muted">Envoyé le {frDate(r.created_at.slice(0, 10))}</p></div>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-brh-text/85">{r.contenu || <span className="text-brh-muted">(vide)</span>}</p>
                          </div>
                        ))}
                        {/* cadres n'ayant pas répondu */}
                        {cadres.filter((c) => !reps.some((r) => r.user_id === c.id)).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-brh-muted">En attente :</span>
                            {cadres.filter((c) => !reps.some((r) => r.user_id === c.id)).map((c) => (
                              <span key={c.id} className="rounded-full bg-brh-warning/10 px-2 py-0.5 text-[11px] font-medium text-brh-warning">{c.nom}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
