import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { notifierRole } from '../notifs'
import { etapeDe } from '../bareme'
import { chargerLogoBRH, telechargerRapportTrimestrielPdf } from '../pdf'

const champ = 'w-full rounded-lg border border-brh-border bg-white px-3 py-2 text-sm text-brh-text outline-none transition focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'

type Demande = { id: string; periode: string; libelle: string; echeance: string | null; statut: string }
type Rapport = { id: string; demande_id: string; contenu: string | null; lien: string | null; pourcentage: number | null }
type Act = { nom: string; axe: string; pct: number; etape: string }

const PERIODE_LABEL: Record<string, string> = { mensuel: 'mensuel', trimestriel: 'trimestriel', annuel: 'annuel' }
function frDate(d: string | null): string { return d ? d.split('-').reverse().join('/') : '' }
function moyenne(vals: number[]): number { return vals.length === 0 ? 0 : Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) }

// 📝 Bandeau « Rapport demandé » en haut de Mes actions du trimestre.
// Le pourcentage d'avancement du trimestre est intégré AUTOMATIQUEMENT ;
// le cadre est invité à rédiger son rapport (Word / Google Docs) et à joindre
// le lien. Un bouton permet de télécharger un PDF de synthèse.
export function RapportPeriodeBanner({ utilisateurId, nom }: { utilisateurId?: string; nom?: string }) {
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [mesRapports, setMesRapports] = useState<Rapport[]>([])
  const [actions, setActions] = useState<Act[]>([])
  const [liens, setLiens] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [ouvertId, setOuvertId] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const charger = useCallback(async () => {
    if (!utilisateurId) return
    const [dRes, rRes, aRes] = await Promise.all([
      supabase.from('demandes_rapport').select('*').eq('statut', 'ouverte').order('created_at', { ascending: false }),
      supabase.from('rapports_periode').select('id, demande_id, contenu, lien, pourcentage').eq('user_id', utilisateurId),
      supabase.from('actions').select('nom, pourcentage, cadres_strategiques(nom)').eq('user_id', utilisateurId),
    ])
    setDemandes((dRes.data ?? []) as Demande[])
    setMesRapports((rRes.data ?? []) as Rapport[])
    setActions((aRes.data ?? []).map((a: any) => ({ nom: a.nom, axe: a.cadres_strategiques?.nom ?? '—', pct: a.pourcentage ?? 0, etape: etapeDe(a.pourcentage ?? 0).label })))
  }, [utilisateurId])
  useEffect(() => { charger() }, [charger])

  const monPct = moyenne(actions.map((a) => a.pct))

  async function envoyer(d: Demande) {
    const lien = (liens[d.id] ?? '').trim()
    const note = (notes[d.id] ?? '').trim()
    if (lien === '' && note === '') return
    setBusy(d.id)
    await supabase.from('rapports_periode').insert({ demande_id: d.id, user_id: utilisateurId ?? null, contenu: note || null, lien: lien || null, pourcentage: monPct })
    await notifierRole('direction', `Rapport ${PERIODE_LABEL[d.periode] ?? ''} reçu : « ${d.libelle} » (${monPct} %).`, 'rapport')
    await notifierRole('admin', `Rapport ${PERIODE_LABEL[d.periode] ?? ''} reçu : « ${d.libelle} » (${monPct} %).`, 'rapport')
    setBusy(null); setOuvertId(null); setLiens((p) => ({ ...p, [d.id]: '' })); setNotes((p) => ({ ...p, [d.id]: '' }))
    await charger()
  }

  async function pdf(d: Demande, rap?: Rapport) {
    const logo = await chargerLogoBRH()
    telechargerRapportTrimestrielPdf({
      cadre: nom ?? 'Cadre',
      periode: d.libelle,
      emisLe: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      pourcentage: rap?.pourcentage ?? monPct,
      actions,
      note: rap?.contenu ?? '',
      lien: rap?.lien ?? '',
      logo,
    })
  }

  if (demandes.length === 0) return null
  const rapportDe = (id: string) => mesRapports.find((r) => r.demande_id === id)

  return (
    <div className="space-y-3">
      {demandes.map((d) => {
        const rap = rapportDe(d.id)
        const repondu = !!rap
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
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-brh-primary/5 px-2.5 py-1 text-xs font-bold text-brh-primary">Avancement : {monPct}%</span>
                {repondu ? (
                  <button onClick={() => pdf(d, rap)} className="inline-flex items-center gap-1.5 rounded-lg border border-brh-border bg-white px-3 py-2 text-xs font-semibold text-brh-primary transition hover:bg-brh-bg">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>PDF
                  </button>
                ) : (
                  <button onClick={() => setOuvertId(ouvert ? null : d.id)} className="rounded-lg bg-brh-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-brh-deep">{ouvert ? 'Fermer' : 'Envoyer mon rapport'}</button>
                )}
              </div>
            </div>

            {!repondu && ouvert && (
              <div className="mt-3 space-y-3 border-t border-brh-secondary/30 pt-3">
                <div className="flex items-start gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs leading-relaxed text-brh-text/80">
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-brh-secondary" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                  <span>Rédigez votre rapport <b>dans Word ou Google Docs</b>, au format professionnel, puis <b>collez le lien ci-dessous</b>. Votre <b>avancement du trimestre ({monPct}%)</b> est ajouté automatiquement.</span>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-brh-muted">Lien du rapport (Word, Google Docs, PDF…)</label>
                  <input value={liens[d.id] ?? ''} onChange={(e) => setLiens((p) => ({ ...p, [d.id]: e.target.value }))} placeholder="https://docs.google.com/… ou lien du fichier partagé" className={champ} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-brh-muted">Note (optionnel) — l'essentiel de l'essentiel</label>
                  <textarea value={notes[d.id] ?? ''} onChange={(e) => setNotes((p) => ({ ...p, [d.id]: e.target.value }))} placeholder="Quelques lignes si vous le souhaitez…" className={champ + ' min-h-[80px] resize-y'} />
                </div>
                <div className="flex justify-end">
                  <button onClick={() => envoyer(d)} disabled={busy === d.id || ((liens[d.id] ?? '').trim() === '' && (notes[d.id] ?? '').trim() === '')} className="rounded-lg bg-brh-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep disabled:opacity-50">{busy === d.id ? 'Envoi…' : 'Envoyer à la direction'}</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
