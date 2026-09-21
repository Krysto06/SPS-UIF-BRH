import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

const serif = { fontFamily: '"Manrope", "Inter", ui-sans-serif, sans-serif' } as const

type Evenement = { id: string; titre: string; date: string | null; lieu: string | null; description: string | null; statut: string; type: string }
type Tache = { id: string; evenement_id: string; titre: string; assigne_a: string | null; fait: boolean }

function frDate(d: string | null): string { return d ? d.split('-').reverse().join('/') : '' }
const STATUT: Record<string, { label: string; cls: string }> = {
  a_venir: { label: 'À venir', cls: 'bg-brh-secondary/15 text-brh-secondary' },
  en_cours: { label: 'En cours', cls: 'bg-blue-50 text-blue-700' },
  termine: { label: 'Terminé', cls: 'bg-brh-success/10 text-brh-success' },
}

// 🎉 Événement de l'UIF (cadre / secrétaire) — vue de suivi.
// Affiche les événements créés par la direction ou l'admin, et met en
// évidence les tâches confiées à la personne connectée (qu'elle peut cocher).
export function EvenementsCadre({ utilisateurId }: { utilisateurId?: string }) {
  const [events, setEvents] = useState<Evenement[]>([])
  const [taches, setTaches] = useState<Record<string, Tache[]>>({})
  const [chargement, setChargement] = useState(true)

  const charger = useCallback(async () => {
    const [eRes, tRes] = await Promise.all([
      supabase.from('evenements').select('*').order('date', { ascending: true }),
      supabase.from('taches_evenement').select('*').order('created_at', { ascending: true }),
    ])
    setEvents((eRes.data ?? []) as Evenement[])
    const gr: Record<string, Tache[]> = {}; ((tRes.data ?? []) as Tache[]).forEach((t) => { (gr[t.evenement_id] ??= []).push(t) }); setTaches(gr)
    setChargement(false)
  }, [])
  useEffect(() => { charger() }, [charger])

  async function basculerTache(t: Tache) {
    setTaches((prev) => ({ ...prev, [t.evenement_id]: (prev[t.evenement_id] ?? []).map((x) => x.id === t.id ? { ...x, fait: !x.fait } : x) }))
    await supabase.from('taches_evenement').update({ fait: !t.fait }).eq('id', t.id)
  }

  const mesTaches = Object.values(taches).flat().filter((t) => t.assigne_a === utilisateurId)
  const mesEnCours = mesTaches.filter((t) => !t.fait).length

  if (chargement) return <p className="text-center text-sm text-brh-muted">Chargement des événements…</p>

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brh-primary" style={serif}>Événement de l'UIF</h1>
        <p className="mt-1 text-sm text-brh-muted">Les événements et réunions organisés par l'Unité, et les tâches qui vous sont confiées.</p>
      </div>

      {/* Rappel : mes tâches à faire */}
      {mesEnCours > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-brh-secondary/30 bg-brh-secondary/10 px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brh-secondary/20 text-brh-primary"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg></span>
          <p className="text-sm text-brh-text">Vous avez <span className="font-semibold">{mesEnCours} tâche{mesEnCours > 1 ? 's' : ''}</span> à réaliser sur les événements en cours.</p>
        </div>
      )}

      {events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brh-border bg-white p-8 text-center text-sm text-brh-muted">Aucun événement pour le moment.</p>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => {
            const ts = taches[ev.id] ?? []
            const miennes = ts.filter((t) => t.assigne_a === utilisateurId)
            const st = STATUT[ev.statut] ?? STATUT.a_venir
            return (
              <div key={ev.id} className="rounded-2xl border border-brh-border bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="font-semibold text-brh-text" style={serif}>{ev.titre}</p><p className="mt-0.5 text-xs text-brh-muted">{frDate(ev.date)}{ev.lieu ? ' · ' + ev.lieu : ''}</p></div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    {ev.type === 'reunion' && <span className="rounded-full bg-brh-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-brh-primary">Réunion</span>}
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                  </div>
                </div>
                {ev.description && <p className="mt-2 text-sm text-brh-text/80">{ev.description}</p>}

                {miennes.length > 0 && (
                  <div className="mt-4 border-t border-brh-border/60 pt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brh-muted">Mes tâches sur cet événement</p>
                    <ul className="space-y-1.5">{miennes.map((t) => (
                      <li key={t.id} className="flex items-center gap-2.5">
                        <button onClick={() => basculerTache(t)} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${t.fait ? 'border-brh-success bg-brh-success' : 'border-slate-400 bg-white hover:border-brh-primary'}`}>
                          {t.fait && <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M20 6 9 17l-5-5" /></svg>}
                        </button>
                        <span className={`flex-1 text-sm ${t.fait ? 'text-brh-muted line-through' : 'text-brh-text'}`}>{t.titre}</span>
                      </li>
                    ))}</ul>
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
