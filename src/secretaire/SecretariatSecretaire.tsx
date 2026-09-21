import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { notifier } from '../notifs'

const serif = { fontFamily: '"Manrope", "Inter", ui-sans-serif, sans-serif' } as const
const champ = 'w-full rounded-lg border border-brh-border bg-white px-3 py-2 text-sm text-brh-text outline-none transition focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'

type Demande = { id: string; type: string; objet: string; description: string | null; echeance: string | null; priorite: string; statut: string; reponse: string | null; created_at: string; created_by: string | null }

const TYPES: Record<string, string> = { suivi: 'Suivi', dossier: 'Demande de dossier', tache: 'Tâche', rdv: 'Rendez-vous', reunion: 'Planifier une réunion' }
const STATUT: Record<string, { label: string; cls: string }> = {
  en_attente: { label: 'À traiter', cls: 'bg-brh-warning/10 text-brh-warning' },
  repondue: { label: 'Répondue', cls: 'bg-brh-success/10 text-brh-success' },
  terminee: { label: 'Terminée', cls: 'bg-gray-100 text-gray-600' },
}
function frDate(d: string | null): string { return d ? d.split('-').reverse().join('/') : '' }

// 📥 Secrétariat (secrétaire) — les demandes envoyées par la direction.
// Elle les reçoit ici, répond, et marque comme terminé.
export function SecretariatSecretaire({}: { utilisateurId?: string }) {
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [chargement, setChargement] = useState(true)
  const [reponses, setReponses] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [filtre, setFiltre] = useState<'toutes' | 'en_attente' | 'repondue' | 'terminee'>('toutes')

  const charger = useCallback(async () => {
    const { data } = await supabase.from('demandes_secretariat').select('*').order('created_at', { ascending: false })
    setDemandes((data ?? []) as Demande[])
    setChargement(false)
  }, [])
  useEffect(() => { charger() }, [charger])

  async function repondre(d: Demande) {
    const txt = (reponses[d.id] ?? '').trim()
    if (txt === '') return
    setBusy(d.id)
    await supabase.from('demandes_secretariat').update({ reponse: txt, statut: 'repondue' }).eq('id', d.id)
    if (d.created_by) await notifier(d.created_by, `La secrétaire a répondu à votre demande « ${d.objet} ».`, 'secretariat')
    setBusy(null); setReponses((p) => ({ ...p, [d.id]: '' }))
    await charger()
  }
  async function marquerTerminee(d: Demande) {
    setBusy(d.id)
    await supabase.from('demandes_secretariat').update({ statut: 'terminee' }).eq('id', d.id)
    if (d.created_by) await notifier(d.created_by, `La demande « ${d.objet} » a été marquée comme terminée.`, 'secretariat')
    setBusy(null)
    await charger()
  }

  const enAttente = demandes.filter((d) => d.statut === 'en_attente').length
  const visibles = filtre === 'toutes' ? demandes : demandes.filter((d) => d.statut === filtre)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="relative overflow-hidden rounded-[22px] px-7 py-6 text-white shadow-md" style={{ background: 'linear-gradient(135deg,#12355B,#081A31)' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(520px 260px at 105% -10%, rgba(201,162,39,0.22), transparent 60%)' }} />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brh-gold-light">Espace secrétariat</p>
          <h1 className="mt-2 text-[26px] font-bold leading-tight" style={serif}>Demandes de la direction</h1>
          <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-white/70">Vous recevez ici les suivis, dossiers, tâches et réunions confiés par la direction. Répondez et marquez comme terminé.</p>
          {enAttente > 0 && <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-brh-secondary px-3 py-1 text-xs font-bold text-brh-primary">{enAttente} demande{enAttente > 1 ? 's' : ''} à traiter</span>}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {([['toutes', 'Toutes'], ['en_attente', 'À traiter'], ['repondue', 'Répondues'], ['terminee', 'Terminées']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFiltre(k)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${filtre === k ? 'bg-brh-primary text-white shadow-sm' : 'border border-brh-border bg-white text-brh-muted hover:bg-brh-bg'}`}>{l}</button>
        ))}
      </div>

      {chargement ? <p className="text-sm text-brh-muted">Chargement…</p> : visibles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brh-border bg-white p-8 text-center text-sm text-brh-muted">Aucune demande {filtre !== 'toutes' ? 'dans cette catégorie' : 'pour le moment'}.</p>
      ) : (
        <div className="space-y-3">
          {visibles.map((d) => {
            const st = STATUT[d.statut] ?? STATUT.en_attente
            return (
              <div key={d.id} className="rounded-2xl border border-brh-border bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0"><p className="text-sm font-semibold text-brh-text">{d.objet}</p><p className="mt-0.5 text-xs text-brh-muted">Reçue le {frDate(d.created_at.slice(0, 10))}{d.echeance ? ' · échéance ' + frDate(d.echeance) : ''}</p></div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">{TYPES[d.type] ?? d.type}</span>
                    {d.priorite === 'urgente' && <span className="rounded-full bg-brh-danger/10 px-2.5 py-0.5 text-[11px] font-medium text-brh-danger">Urgente</span>}
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                  </div>
                </div>
                {d.description && <p className="mt-2 rounded-lg border-l-2 border-brh-secondary bg-brh-bg px-3 py-2 text-xs text-brh-text/90">{d.description}</p>}
                {d.reponse && <p className="mt-2.5 rounded-lg bg-brh-success/10 px-3 py-2 text-sm text-brh-text/90"><span className="font-semibold text-brh-success">Ma réponse : </span>{d.reponse}</p>}

                {d.statut !== 'terminee' && (
                  <div className="mt-3 space-y-2 border-t border-brh-border/60 pt-3">
                    <textarea value={reponses[d.id] ?? ''} onChange={(e) => setReponses((p) => ({ ...p, [d.id]: e.target.value }))} placeholder={d.reponse ? 'Compléter / corriger la réponse…' : 'Écrire une réponse à la direction…'} className={champ + ' min-h-[52px] resize-y'} />
                    <div className="flex flex-wrap justify-end gap-2">
                      <button onClick={() => marquerTerminee(d)} disabled={busy === d.id} className="rounded-lg border border-brh-border px-3.5 py-2 text-xs font-semibold text-brh-text transition hover:bg-brh-bg disabled:opacity-60">Marquer terminée</button>
                      <button onClick={() => repondre(d)} disabled={busy === d.id || (reponses[d.id] ?? '').trim() === ''} className="rounded-lg bg-brh-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-brh-deep disabled:opacity-50">{busy === d.id ? '…' : 'Répondre'}</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
