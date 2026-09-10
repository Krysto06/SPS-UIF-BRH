import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { notifierRole } from '../notifs'

const champ =
  'w-full rounded-lg border border-brh-border bg-white px-4 py-2.5 text-sm text-brh-text outline-none transition placeholder:text-brh-muted/60 focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'
const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brh-muted'
const zoneTexte = champ + ' min-h-[90px] resize-y leading-relaxed'
const serif = { fontFamily: '"Fraunces", Georgia, "Times New Roman", serif' } as const

const TYPES: Record<string, { label: string; cls: string }> = {
  retard: { label: 'Retard', cls: 'bg-brh-warning/10 text-brh-warning' },
  blocage: { label: 'Blocage', cls: 'bg-brh-danger/10 text-brh-danger' },
}
const STATUTS_ALERTE: Record<string, { label: string; cls: string }> = {
  ouverte: { label: 'Ouverte', cls: 'bg-blue-50 text-blue-700' },
  vue: { label: 'Vue par la direction', cls: 'bg-brh-secondary/15 text-brh-secondary' },
  traitee: { label: 'Traitée', cls: 'bg-brh-success/10 text-brh-success' },
}

type ActionMini = { id: string; nom: string; echeance: string | null; statut: string }
type Alerte = { id: string; action_id: string; type: string; message: string; statut: string; created_at: string; actions: { nom: string } | null }

function estEligible(a: ActionMini): boolean {
  if (a.statut === 'bloque') return true
  if (a.statut !== 'termine' && a.echeance && new Date(a.echeance) < new Date(new Date().toDateString())) return true
  return false
}
function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} à ${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
}

// ⚠️ Page du cadre : signaler un problème (retard/blocage) à la direction
export function Alertes({ utilisateurId }: { utilisateurId?: string }) {
  const [actions, setActions] = useState<ActionMini[]>([])
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [chargement, setChargement] = useState(true)

  const [actionId, setActionId] = useState('')
  const [type, setType] = useState('retard')
  const [message, setMessage] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)

  async function chargerAlertes(uid: string) {
    const { data } = await supabase
      .from('alertes')
      .select('id, action_id, type, message, statut, created_at, actions(nom)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setAlertes((data ?? []) as any)
  }

  useEffect(() => {
    if (!utilisateurId) { setChargement(false); return }
    supabase.from('actions').select('id, nom, echeance, statut').eq('user_id', utilisateurId).order('echeance')
      .then(({ data }) => { setActions((data ?? []) as ActionMini[]); setChargement(false) })
    chargerAlertes(utilisateurId)
  }, [utilisateurId])

  const eligibles = actions.filter(estEligible)

  // Quand on choisit une action, on pré-sélectionne le type le plus probable
  function choisirAction(id: string) {
    setActionId(id)
    const a = actions.find((x) => x.id === id)
    if (a) setType(a.statut === 'bloque' ? 'blocage' : 'retard')
  }

  async function envoyer() {
    if (!utilisateurId) return
    if (!actionId) { setMsg({ ok: false, t: 'Choisis l’action concernée.' }); return }
    if (message.trim() === '') { setMsg({ ok: false, t: 'Décris le problème avant d’envoyer.' }); return }
    setEnvoi(true); setMsg(null)
    const { error } = await supabase.from('alertes').insert({
      action_id: actionId, user_id: utilisateurId, type, message: message.trim(), statut: 'ouverte',
    })
    setEnvoi(false)
    if (error) { setMsg({ ok: false, t: 'Erreur : ' + error.message }); return }
    const action = actions.find((x) => x.id === actionId)
    await notifierRole('direction', `Nouvelle alerte (${type === 'blocage' ? 'blocage' : 'retard'}) sur « ${action?.nom ?? 'une action'} ».`, 'alertes')
    setActionId(''); setType('retard'); setMessage('')
    setMsg({ ok: true, t: 'Alerte transmise à la direction. Une copie apparaît ci-dessous.' })
    await chargerAlertes(utilisateurId)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brh-primary" style={serif}>Alertes</h1>
        <p className="mt-1 text-sm text-brh-muted">Signale un retard ou un blocage à la direction. Une alerte envoyée est définitive (non-effaçable) et tu en gardes une copie.</p>
      </div>

      {/* Formulaire de signalement */}
      <section className="rounded-2xl border border-brh-border bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-brh-primary" style={serif}>Signaler un problème</h3>
        {chargement ? (
          <p className="mt-4 text-sm text-brh-muted">Chargement…</p>
        ) : eligibles.length === 0 ? (
          <p className="mt-4 rounded-lg bg-brh-bg px-4 py-3 text-sm text-brh-muted">
            Aucune action en retard ou bloquée pour le moment. Une alerte se crée à partir d’une action <b>en retard</b> ou <b>bloquée</b> (marque-la comme « Bloqué » dans « Mes actions » si besoin).
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className={label}>Action concernée</label>
              <select value={actionId} onChange={(e) => choisirAction(e.target.value)} className={champ}>
                <option value="">— Choisir une action en retard ou bloquée —</option>
                {eligibles.map((a) => (<option key={a.id} value={a.id}>{a.nom}</option>))}
              </select>
            </div>
            <div>
              <label className={label}>Type de problème</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={champ}>
                <option value="retard">Retard</option>
                <option value="blocage">Blocage</option>
              </select>
            </div>
            <div>
              <label className={label}>Description du problème</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Explique ce qui bloque ou ce qui a pris du retard, et l’appui dont tu as besoin…" className={zoneTexte} />
            </div>
            {msg && <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? 'bg-brh-success/10 text-brh-success' : 'bg-brh-danger/10 text-brh-danger'}`}>{msg.t}</p>}
            <div className="flex justify-end">
              <button onClick={envoyer} disabled={envoi}
                className="rounded-lg bg-brh-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep disabled:opacity-60">
                {envoi ? 'Envoi…' : 'Envoyer l’alerte à la direction'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Copie : mes alertes envoyées */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-brh-primary">Mes alertes envoyées</h3>
        {alertes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-brh-border bg-white p-6 text-center text-sm text-brh-muted">Aucune alerte envoyée pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {alertes.map((al) => {
              const ty = TYPES[al.type] ?? { label: al.type, cls: 'bg-gray-100 text-gray-600' }
              const st = STATUTS_ALERTE[al.statut] ?? { label: al.statut, cls: 'bg-gray-100 text-gray-600' }
              return (
                <div key={al.id} className="rounded-2xl border border-brh-border bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-brh-text">{al.actions?.nom ?? 'Action supprimée'}</p>
                      <p className="mt-0.5 text-xs text-brh-muted">Envoyée le {formatDate(al.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ty.cls}`}>{ty.label}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brh-text/90">{al.message}</p>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
