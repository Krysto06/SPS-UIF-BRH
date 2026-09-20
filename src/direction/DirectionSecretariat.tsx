import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { notifierRole } from '../notifs'

const serif = { fontFamily: '"Manrope", "Inter", ui-sans-serif, sans-serif' } as const
const champ = 'w-full rounded-lg border border-brh-border bg-white px-3 py-2 text-sm text-brh-text outline-none transition focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'
const flabel = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-brh-muted'

type Demande = { id: string; type: string; objet: string; description: string | null; echeance: string | null; priorite: string; statut: string; reponse: string | null; created_at: string }

const TYPES: Record<string, string> = { suivi: 'Suivi', dossier: 'Demande de dossier', tache: 'Tâche', rdv: 'Rendez-vous', reunion: 'Planifier une réunion' }
const STATUT: Record<string, { label: string; cls: string }> = {
  en_attente: { label: 'En attente', cls: 'bg-brh-warning/10 text-brh-warning' },
  repondue: { label: 'Répondue', cls: 'bg-brh-success/10 text-brh-success' },
  terminee: { label: 'Terminée', cls: 'bg-gray-100 text-gray-600' },
}
function frDate(d: string | null): string { return d ? d.split('-').reverse().join('/') : '' }

const formVide = { type: 'suivi', priorite: 'normale', objet: '', description: '', echeance: '' }

// 🗂️ Secrétariat (direction) : demandes et suivis confiés à la secrétaire
export function DirectionSecretariat({ utilisateurId }: { utilisateurId?: string }) {
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [chargement, setChargement] = useState(true)
  const [f, setF] = useState({ ...formVide })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)

  const charger = useCallback(async () => {
    const { data } = await supabase.from('demandes_secretariat').select('*').order('created_at', { ascending: false })
    setDemandes((data ?? []) as Demande[])
    setChargement(false)
  }, [])
  useEffect(() => { charger() }, [charger])

  async function envoyer() {
    if (f.objet.trim() === '') { setMsg({ ok: false, t: 'Donne un objet à la demande.' }); return }
    setBusy(true); setMsg(null)
    const { error } = await supabase.from('demandes_secretariat').insert({
      type: f.type, priorite: f.priorite, objet: f.objet.trim(),
      description: f.description.trim() || null, echeance: f.echeance || null,
      statut: 'en_attente', created_by: utilisateurId ?? null,
    })
    setBusy(false)
    if (error) { setMsg({ ok: false, t: 'Erreur : ' + error.message }); return }
    await notifierRole('secretaire', `Nouvelle demande de la direction : « ${f.objet.trim()} ».`, 'secretariat')
    setF({ ...formVide }); setMsg({ ok: true, t: 'Demande envoyée au secrétariat.' })
    await charger()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><h1 className="text-2xl font-bold text-brh-primary" style={serif}>Secrétariat</h1><p className="mt-1 text-sm text-brh-muted">Créez des suivis et des demandes pour la secrétaire, et suivez ses réponses.</p></div>

      <div className="flex items-start gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
        <span>Chaque demande est transmise à la secrétaire, qui la traite dans son espace : elle répond, joint un dossier ou marque comme fait.</span>
      </div>

      {/* Fiche */}
      <div className="rounded-2xl border border-brh-border bg-white shadow-sm">
        <div className="border-b border-brh-border/70 bg-gradient-to-b from-brh-primary/5 to-transparent px-5 py-3"><p className="font-semibold text-brh-text" style={serif}>Nouvelle demande</p></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div><label className={flabel}>Type de demande</label><select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className={champ}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label className={flabel}>Priorité</label><select value={f.priorite} onChange={(e) => setF({ ...f, priorite: e.target.value })} className={champ}><option value="normale">Normale</option><option value="urgente">Urgente</option></select></div>
          <div className="sm:col-span-2"><label className={flabel}>Objet</label><input value={f.objet} onChange={(e) => setF({ ...f, objet: e.target.value })} placeholder="Ex. : Préparer le dossier de la réunion du 18 sept." className={champ} /></div>
          <div className="sm:col-span-2"><label className={flabel}>Description</label><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Précisez ce qui est attendu…" className={champ + ' min-h-[60px] resize-y'} /></div>
          <div><label className={flabel}>{f.type === 'reunion' ? 'Date de la réunion' : f.type === 'rdv' ? 'Date du rendez-vous' : 'Échéance'}</label><input type="date" value={f.echeance} onChange={(e) => setF({ ...f, echeance: e.target.value })} className={champ} /></div>
          {msg && <p className={`sm:col-span-2 rounded-lg px-3 py-2 text-sm ${msg.ok ? 'bg-brh-success/10 text-brh-success' : 'bg-brh-danger/10 text-brh-danger'}`}>{msg.t}</p>}
          <div className="flex items-end justify-end sm:col-span-2"><button onClick={envoyer} disabled={busy} className="rounded-lg bg-brh-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep disabled:opacity-60">{busy ? 'Envoi…' : 'Envoyer au secrétariat'}</button></div>
        </div>
      </div>

      {/* Liste */}
      <div>
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brh-text">Mes demandes au secrétariat <span className="rounded-full bg-brh-bg px-2 py-0.5 text-[11px] font-medium text-brh-muted">{demandes.length}</span></p>
        {chargement ? <p className="text-sm text-brh-muted">Chargement…</p> : demandes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-brh-border bg-white p-6 text-center text-sm text-brh-muted">Aucune demande envoyée pour le moment.</p>
        ) : (
          <div className="space-y-3">{demandes.map((d) => {
            const st = STATUT[d.statut] ?? STATUT.en_attente
            return (
              <div key={d.id} className="rounded-2xl border border-brh-border bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0"><p className="text-sm font-semibold text-brh-text">{d.objet}</p><p className="mt-0.5 text-xs text-brh-muted">Envoyée le {frDate(d.created_at.slice(0, 10))}{d.echeance ? ' · échéance ' + frDate(d.echeance) : ''}</p></div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">{TYPES[d.type] ?? d.type}</span>
                    {d.priorite === 'urgente' && <span className="rounded-full bg-brh-danger/10 px-2.5 py-0.5 text-[11px] font-medium text-brh-danger">Urgente</span>}
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                  </div>
                </div>
                {d.reponse && <p className="mt-2.5 rounded-lg bg-brh-success/10 px-3 py-2 text-sm text-brh-text/90"><span className="font-semibold text-brh-success">Réponse : </span>{d.reponse}</p>}
              </div>
            )
          })}</div>
        )}
      </div>
    </div>
  )
}
