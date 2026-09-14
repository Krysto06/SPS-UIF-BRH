import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { BAREME, etapeDe, etapeCls } from '../bareme'
import { notifier } from '../notifs'

const serif = { fontFamily: '"Fraunces", Georgia, "Times New Roman", serif' } as const
const champ = 'w-full rounded-lg border border-brh-border bg-white px-3 py-2 text-sm text-brh-text outline-none transition placeholder:text-brh-muted/60 focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
function lundiSemaine(): Date {
  const d = new Date()
  const j = d.getDay()
  d.setDate(d.getDate() + (j === 0 ? -6 : 1 - j))
  d.setHours(0, 0, 0, 0)
  return d
}
function iso(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
function libelleSemaine(l: Date): string {
  const v = new Date(l); v.setDate(l.getDate() + 4)
  return `Semaine du ${l.getDate()} au ${v.getDate()} ${MOIS[v.getMonth()]} ${v.getFullYear()}`
}

type Cadre = { id: string; nom: string }
type ActionRef = { id: string; nom: string; pourcentage: number }
type Rapport = {
  user_id: string; actions_semaine: string[] | null; questions: string | null; reponse_direction: string | null
  travaux_realises: string | null; difficultes: string | null; besoins_appui: string | null; recommandations: string | null
  documents: { nom: string; url: string }[] | null; debut_envoi: string | null; fin_envoi: string | null
}

// 📅 Ma semaine (direction) : ce sur quoi les cadres travaillent + validation des rapports
export function DirectionSemaine() {
  const lundi = lundiSemaine()
  const semaineStr = iso(lundi)
  const [cadres, setCadres] = useState<Cadre[]>([])
  const [rapports, setRapports] = useState<Record<string, Rapport>>({})
  const [actions, setActions] = useState<Record<string, ActionRef>>({})
  const [chargement, setChargement] = useState(true)

  const [reponses, setReponses] = useState<Record<string, string>>({})
  const [ajust, setAjust] = useState<Record<string, number>>({})
  const [comm, setComm] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<Record<string, string>>({})

  const charger = useCallback(async () => {
    const [uRes, rRes, aRes] = await Promise.all([
      supabase.from('users').select('id, nom, role').eq('role', 'cadre').order('nom'),
      supabase.from('rapports').select('*').eq('semaine_debut', semaineStr),
      supabase.from('actions').select('id, nom, pourcentage, user_id'),
    ])
    setCadres((uRes.data ?? []).map((u: any) => ({ id: u.id, nom: u.nom })))
    const rap: Record<string, Rapport> = {}; (rRes.data ?? []).forEach((r: any) => { rap[r.user_id] = r }); setRapports(rap)
    const act: Record<string, ActionRef> = {}; (aRes.data ?? []).forEach((a: any) => { act[a.id] = a }); setActions(act)
    setChargement(false)
  }, [semaineStr])
  useEffect(() => { charger() }, [charger])

  async function repondre(c: Cadre) {
    const txt = (reponses[c.id] ?? '').trim()
    if (!txt) return
    setBusy('rep-' + c.id)
    await supabase.from('rapports').update({ reponse_direction: txt }).eq('user_id', c.id).eq('semaine_debut', semaineStr)
    await notifier(c.id, `La direction a répondu à votre question de la semaine : « ${txt} »`, 'semaine')
    setBusy(null); setMsg((m) => ({ ...m, ['rep-' + c.id]: 'Réponse envoyée au cadre.' }))
    await charger()
  }

  async function valider(c: Cadre, a: ActionRef) {
    const nouveau = ajust[a.id] ?? a.pourcentage
    setBusy(a.id)
    await supabase.from('actions').update({ pourcentage: nouveau, updated_at: new Date().toISOString() }).eq('id', a.id)
    const note = (comm[a.id] ?? '').trim()
    await notifier(c.id, `La direction a validé « ${a.nom} » à ${nouveau} %${note ? ' — ' + note : ''}.`, 'actions')
    setBusy(null); setMsg((m) => ({ ...m, [a.id]: `Validé à ${nouveau} %.` }))
    await charger()
  }

  if (chargement) return <p className="text-center text-sm text-brh-muted">Chargement de la semaine…</p>

  const cadresDebut = cadres.filter((c) => rapports[c.id]?.debut_envoi || (rapports[c.id]?.actions_semaine?.length ?? 0) > 0)
  const cadresFin = cadres.filter((c) => rapports[c.id]?.fin_envoi)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brh-primary" style={serif}>Ma semaine</h1>
        <p className="mt-1 text-sm text-brh-muted">{libelleSemaine(lundi)}</p>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
        <span>Le <b>lundi</b>, retrouvez les actions sur lesquelles les cadres travaillent et répondez à leurs questions. Le <b>vendredi</b>, validez ou ajustez l'avancement proposé dans leurs rapports.</span>
      </div>

      {/* Début de semaine */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-brh-primary" style={serif}>Début de semaine</h3>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">Lundi</span>
        </div>
        {cadresDebut.length === 0 ? (
          <p className="rounded-xl bg-brh-bg px-4 py-3 text-sm text-brh-muted">Aucun cadre n'a encore défini ses actions de la semaine.</p>
        ) : (
          <div className="space-y-3">
            {cadresDebut.map((c) => {
              const r = rapports[c.id]
              const noms = (r?.actions_semaine ?? []).map((id) => actions[id]?.nom).filter(Boolean) as string[]
              return (
                <div key={c.id} className="rounded-2xl border border-brh-border bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-brh-text">{c.nom}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {noms.length ? noms.map((n) => <span key={n} className="rounded-full bg-brh-bg px-2.5 py-0.5 text-[11px] font-medium text-brh-muted">{n}</span>) : <span className="text-xs text-brh-muted">Aucune action ciblée.</span>}
                  </div>
                  {r?.questions && (
                    <div className="mt-3 rounded-lg border-l-2 border-brh-secondary bg-brh-bg px-3 py-2">
                      <p className="text-xs font-semibold text-brh-muted">Question du cadre</p>
                      <p className="mt-0.5 text-sm text-brh-text/90">{r.questions}</p>
                    </div>
                  )}
                  {r?.reponse_direction ? (
                    <div className="mt-2 rounded-lg bg-brh-success/10 px-3 py-2">
                      <p className="text-xs font-semibold text-brh-success">Votre réponse</p>
                      <p className="mt-0.5 text-sm text-brh-text/90">{r.reponse_direction}</p>
                    </div>
                  ) : r?.questions ? (
                    <div className="mt-3">
                      <textarea value={reponses[c.id] ?? ''} onChange={(e) => setReponses((p) => ({ ...p, [c.id]: e.target.value }))} placeholder="Votre réponse au cadre…" className={champ + ' min-h-[60px] resize-y'} />
                      <div className="mt-2 flex items-center justify-end gap-3">
                        {msg['rep-' + c.id] && <span className="text-xs font-medium text-brh-success">{msg['rep-' + c.id]}</span>}
                        <button onClick={() => repondre(c)} disabled={busy === 'rep-' + c.id} className="rounded-lg bg-brh-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-brh-deep disabled:opacity-60">{busy === 'rep-' + c.id ? 'Envoi…' : 'Répondre'}</button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Fin de semaine */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-brh-primary" style={serif}>Fin de semaine — rapports à valider</h3>
          <span className="rounded-full bg-brh-secondary/15 px-2.5 py-0.5 text-[11px] font-medium text-brh-secondary">Vendredi</span>
        </div>
        {cadresFin.length === 0 ? (
          <p className="rounded-xl bg-brh-bg px-4 py-3 text-sm text-brh-muted">Aucun rapport de fin de semaine reçu pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {cadresFin.map((c) => {
              const r = rapports[c.id]
              const acts = (r?.actions_semaine ?? []).map((id) => actions[id]).filter(Boolean) as ActionRef[]
              return (
                <div key={c.id} className="rounded-2xl border border-brh-border bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-brh-text">{c.nom}</p>
                  {r?.travaux_realises && <p className="mt-2 text-sm text-brh-text/90"><span className="font-semibold text-brh-muted">Accompli : </span>{r.travaux_realises}</p>}
                  {r?.difficultes && <p className="mt-1 text-sm text-brh-text/90"><span className="font-semibold text-brh-muted">Difficultés : </span>{r.difficultes}</p>}
                  {r?.besoins_appui && <p className="mt-1 text-sm text-brh-text/90"><span className="font-semibold text-brh-muted">Besoins : </span>{r.besoins_appui}</p>}

                  <div className="mt-4 space-y-3 border-t border-brh-border/60 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-brh-muted">Avancement à valider</p>
                    {acts.length === 0 ? <p className="text-sm text-brh-muted">Aucune action ciblée.</p> : acts.map((a) => {
                      const val = ajust[a.id] ?? a.pourcentage
                      const et = etapeDe(a.pourcentage)
                      return (
                        <div key={a.id} className="rounded-xl border border-brh-border/70 bg-brh-bg/40 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-brh-text">{a.nom}</span>
                            <span className="flex items-center gap-2 text-xs"><span className="text-brh-muted">Proposé :</span><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${etapeCls(a.pourcentage)}`}>{et.label} · {a.pourcentage}%</span></span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <select value={val} onChange={(e) => setAjust((p) => ({ ...p, [a.id]: Number(e.target.value) }))} className={champ + ' flex-1'}>
                              {BAREME.map((b) => <option key={b.v} value={b.v}>{b.label} ({b.v} %)</option>)}
                            </select>
                            <button onClick={() => valider(c, a)} disabled={busy === a.id} className="shrink-0 rounded-lg bg-brh-success px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60">{busy === a.id ? '…' : 'Valider'}</button>
                          </div>
                          <input value={comm[a.id] ?? ''} onChange={(e) => setComm((p) => ({ ...p, [a.id]: e.target.value }))} placeholder="Commentaire (optionnel)…" className={champ + ' mt-2'} />
                          {msg[a.id] && <p className="mt-1.5 text-xs font-medium text-brh-success">✓ {msg[a.id]}</p>}
                        </div>
                      )
                    })}
                  </div>

                  {(r?.documents?.length ?? 0) > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-brh-muted">Documents :</span>
                      {(r?.documents ?? []).map((d) => (
                        <a key={d.url} href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-brh-border bg-brh-bg px-2.5 py-1 text-xs font-medium text-brh-primary hover:underline">
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>{d.nom}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
