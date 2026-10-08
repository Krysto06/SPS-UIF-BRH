import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { notifierRole } from '../notifs'

const champ = 'w-full rounded-lg border border-brh-border bg-white px-3 py-2 text-sm text-brh-text outline-none transition focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'

type Demande = { id: string; periode: string; libelle: string; echeance: string | null; statut: string }
type Rapport = { id: string; demande_id: string; contenu: string | null }

const PERIODE_LABEL: Record<string, string> = { mensuel: 'mensuel', trimestriel: 'trimestriel', annuel: 'annuel' }
function frDate(d: string | null): string { return d ? d.split('-').reverse().join('/') : '' }

// 📝 Bandeau « Rapport demandé » affiché en haut de Mes actions du trimestre.
// Quand la direction/l'admin ouvre une demande, le cadre rédige et envoie
// ici son rapport pour la période concernée.
export function RapportPeriodeBanner({ utilisateurId }: { utilisateurId?: string }) {
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [mesRapports, setMesRapports] = useState<Rapport[]>([])
  const [textes, setTextes] = useState<Record<string, string>>({})
  const [ouvertId, setOuvertId] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const charger = useCallback(async () => {
    if (!utilisateurId) return
    const [dRes, rRes] = await Promise.all([
      supabase.from('demandes_rapport').select('*').eq('statut', 'ouverte').order('created_at', { ascending: false }),
      supabase.from('rapports_periode').select('id, demande_id, contenu').eq('user_id', utilisateurId),
    ])
    setDemandes((dRes.data ?? []) as Demande[])
    setMesRapports((rRes.data ?? []) as Rapport[])
  }, [utilisateurId])
  useEffect(() => { charger() }, [charger])

  async function envoyer(d: Demande) {
    const contenu = (textes[d.id] ?? '').trim()
    if (contenu === '') return
    setBusy(d.id)
    await supabase.from('rapports_periode').insert({ demande_id: d.id, user_id: utilisateurId ?? null, contenu })
    await notifierRole('direction', `Un cadre a envoyé son rapport ${PERIODE_LABEL[d.periode] ?? ''} : « ${d.libelle} ».`, 'rapport')
    await notifierRole('admin', `Un cadre a envoyé son rapport ${PERIODE_LABEL[d.periode] ?? ''} : « ${d.libelle} ».`, 'rapport')
    setBusy(null); setOuvertId(null)
    await charger()
  }

  if (demandes.length === 0) return null
  const aRepondu = (id: string) => mesRapports.some((r) => r.demande_id === id)

  return (
    <div className="space-y-3">
      {demandes.map((d) => {
        const repondu = aRepondu(d.id)
        const ouvert = ouvertId === d.id
        return (
          <div key={d.id} className={`rounded-2xl border p-4 shadow-sm ${repondu ? 'border-brh-success/40 bg-brh-success/5' : 'border-brh-secondary/50 bg-brh-secondary/10'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${repondu ? 'bg-brh-success/15 text-brh-success' : 'bg-brh-secondary/20 text-brh-primary'}`}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 13v4M12 10v7M16 14v3" /></svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-brh-text">{repondu ? 'Rapport envoyé' : `Rapport ${PERIODE_LABEL[d.periode] ?? ''} demandé`}</p>
                  <p className="text-xs text-brh-muted">{d.libelle}{d.echeance ? ' · échéance ' + frDate(d.echeance) : ''}</p>
                </div>
              </div>
              {repondu ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brh-success/15 px-3 py-1 text-xs font-semibold text-brh-success"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>Envoyé</span>
              ) : (
                <button onClick={() => setOuvertId(ouvert ? null : d.id)} className="rounded-lg bg-brh-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-brh-deep">{ouvert ? 'Fermer' : 'Rédiger mon rapport'}</button>
              )}
            </div>

            {!repondu && ouvert && (
              <div className="mt-3 space-y-2 border-t border-brh-secondary/30 pt-3">
                <textarea value={textes[d.id] ?? ''} onChange={(e) => setTextes((p) => ({ ...p, [d.id]: e.target.value }))} placeholder="Résumé de la période : travaux réalisés, résultats, difficultés, perspectives…" className={champ + ' min-h-[120px] resize-y'} />
                <div className="flex justify-end">
                  <button onClick={() => envoyer(d)} disabled={busy === d.id || (textes[d.id] ?? '').trim() === ''} className="rounded-lg bg-brh-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep disabled:opacity-50">{busy === d.id ? 'Envoi…' : 'Envoyer à la direction'}</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
