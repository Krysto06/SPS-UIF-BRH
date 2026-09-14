import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { couleurPct } from '../bareme'
import { notifier } from '../notifs'
import { citationDeLaSemaine } from '../citations'

const serif = { fontFamily: '"Fraunces", Georgia, "Times New Roman", serif' } as const

type Cadre = { id: string; nom: string }
type Action = { id: string; pourcentage: number; user_id: string | null }
type Alerte = { id: string; type: string; message: string; created_at: string; user_id: string | null; actions: { nom: string } | null }
type Activite = { id: string; titre: string; type: string | null; date: string | null; user_id: string | null }
type Rapport = { user_id: string; semaine_debut: string; fin_envoi: string | null }

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
function lundiSemaine(): string {
  const d = new Date()
  const j = d.getDay()
  d.setDate(d.getDate() + (j === 0 ? -6 : 1 - j))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function formatCourt(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getDate()} ${MOIS[d.getMonth()]} · ${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
}
function ilYa(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 3600) return `il y a ${Math.max(1, Math.floor(s / 60))} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
  return `il y a ${Math.floor(s / 86400)} j`
}
const TYPE_ALERTE: Record<string, { label: string; cls: string }> = {
  blocage: { label: 'Blocage', cls: 'bg-brh-danger/10 text-brh-danger' },
  retard: { label: 'Retard', cls: 'bg-brh-warning/10 text-brh-warning' },
}

// 🏛️ Tableau de bord de la direction — vue d'ensemble (données réelles)
export function DirectionAccueil({ nom, utilisateurId }: { nom: string; utilisateurId?: string }) {
  const [cadres, setCadres] = useState<Cadre[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [activites, setActivites] = useState<Activite[]>([])
  const [rapports, setRapports] = useState<Rapport[]>([])
  const [chargement, setChargement] = useState(true)
  const [enCours, setEnCours] = useState<string | null>(null)
  const [noms, setNoms] = useState<Record<string, string>>({})

  const charger = useCallback(async () => {
    const [uRes, aRes, alRes, acRes, rRes] = await Promise.all([
      supabase.from('users').select('id, nom, role'),
      supabase.from('actions').select('id, pourcentage, user_id'),
      supabase.from('alertes').select('id, type, message, created_at, user_id, actions(nom)').eq('statut', 'ouverte').order('created_at', { ascending: false }),
      supabase.from('activites').select('id, titre, type, date, user_id').eq('categorie', 'activite_externe').eq('etat', 'en_attente').order('date'),
      supabase.from('rapports').select('user_id, semaine_debut, fin_envoi'),
    ])
    const users = (uRes.data ?? []) as { id: string; nom: string; role: string }[]
    setNoms(Object.fromEntries(users.map((u) => [u.id, u.nom])))
    setCadres(users.filter((u) => u.role === 'cadre').map((u) => ({ id: u.id, nom: u.nom })))
    setActions((aRes.data ?? []) as Action[])
    setAlertes((alRes.data ?? []) as any)
    setActivites((acRes.data ?? []) as Activite[])
    setRapports((rRes.data ?? []) as Rapport[])
    setChargement(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  const lundi = lundiSemaine()
  const moyenneEquipe = actions.length === 0 ? 0 : Math.round(actions.reduce((s, a) => s + (a.pourcentage ?? 0), 0) / actions.length)
  const rapportsRecus = rapports.filter((r) => r.semaine_debut === lundi && r.fin_envoi).length

  function statsCadre(id: string) {
    const acts = actions.filter((a) => a.user_id === id)
    const moy = acts.length === 0 ? 0 : Math.round(acts.reduce((s, a) => s + (a.pourcentage ?? 0), 0) / acts.length)
    const rapSem = rapports.find((r) => r.user_id === id && r.semaine_debut === lundi && r.fin_envoi)
    const nbAlertes = alertes.filter((a) => a.user_id === id).length
    return { moy, nbActions: acts.length, dernierRapport: rapSem?.fin_envoi ?? null, nbAlertes }
  }

  async function approuverActivite(a: Activite, decision: 'approuvee' | 'refusee') {
    setEnCours(a.id)
    await supabase.from('activites').update({ etat: decision }).eq('id', a.id)
    if (a.user_id) await notifier(a.user_id, `Votre activité « ${a.titre} » a été ${decision === 'approuvee' ? 'approuvée' : 'refusée'} par la direction.`, 'activites')
    setEnCours(null)
    await charger()
  }
  async function traiterAlerte(al: Alerte) {
    setEnCours(al.id)
    await supabase.from('alertes').update({ statut: 'traitee' }).eq('id', al.id)
    if (al.user_id) await notifier(al.user_id, `Votre alerte sur « ${al.actions?.nom ?? 'une action'} » a été traitée par la direction.`, 'alertes')
    setEnCours(null)
    await charger()
  }
  async function relancer(cadreId: string, cadreNom: string) {
    setEnCours(cadreId)
    await notifier(cadreId, 'Rappel : votre rapport de fin de semaine est attendu par la direction.', 'semaine')
    setEnCours(null)
    alert(`Relance envoyée à ${cadreNom}.`)
  }

  const salut = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir'
  const insp = citationDeLaSemaine()

  if (chargement) return <p className="text-center text-sm text-brh-muted">Chargement du tableau de bord…</p>

  return (
    <div className="space-y-6">
      {/* Citation de la semaine */}
      <div className="relative overflow-hidden rounded-xl px-4 py-3 text-white shadow-sm" style={{ background: 'linear-gradient(to right, #12355B, #0B2545)' }}>
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brh-gold-light">{insp.type === 'fait' ? 'Le sais-tu ?' : 'Citation'}</span>
          <span className="truncate text-[11px] text-brh-gold-light/80">— {insp.source}</span>
        </div>
        <p className="mt-1 max-w-3xl text-sm leading-snug text-white/90">« {insp.texte} »</p>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-brh-primary" style={serif}>{salut}, {nom}</h1>
        <p className="mt-1 text-sm text-brh-muted">Voici la vue d'ensemble du pilotage de l'Unité d'Inclusion Financière.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { l: 'Cadres suivis', v: String(cadres.length) },
          { l: 'Avancement moyen équipe', v: `${moyenneEquipe}%` },
          { l: 'Alertes ouvertes', v: String(alertes.length), c: 'text-brh-danger' },
          { l: 'À approuver', v: String(activites.length), c: 'text-brh-warning' },
          { l: 'Rapports reçus (sem.)', v: `${rapportsRecus}/${cadres.length}` },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl border border-brh-border bg-white p-4 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wide text-brh-muted">{k.l}</p>
            <p className={`mt-1.5 text-2xl font-bold ${k.c ?? 'text-brh-primary'}`} style={serif}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* À traiter */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Activités à approuver */}
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brh-text">Activités à approuver <span className="rounded-full bg-brh-bg px-2 py-0.5 text-[11px] font-medium text-brh-muted">{activites.length}</span></p>
          {activites.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-brh-border bg-white p-5 text-center text-sm text-brh-muted">Aucune activité en attente.</p>
          ) : (
            <div className="space-y-3">
              {activites.map((a) => (
                <div key={a.id} className="rounded-2xl border border-brh-border bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-brh-text">{a.titre}</p>
                  <p className="mt-0.5 text-xs text-brh-muted">{noms[a.user_id ?? ''] ?? '—'}{a.date ? ' · ' + a.date.split('-').reverse().join('/') : ''}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => approuverActivite(a, 'approuvee')} disabled={enCours === a.id} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brh-success px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>Approuver
                    </button>
                    <button onClick={() => approuverActivite(a, 'refusee')} disabled={enCours === a.id} className="rounded-lg border border-brh-danger/40 px-3 py-2 text-xs font-semibold text-brh-danger transition hover:bg-brh-danger/5 disabled:opacity-60">Refuser</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertes ouvertes */}
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brh-text">Alertes ouvertes <span className="rounded-full bg-brh-bg px-2 py-0.5 text-[11px] font-medium text-brh-muted">{alertes.length}</span></p>
          {alertes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-brh-border bg-white p-5 text-center text-sm text-brh-muted">Aucune alerte ouverte.</p>
          ) : (
            <div className="space-y-3">
              {alertes.map((al) => {
                const ty = TYPE_ALERTE[al.type] ?? { label: al.type, cls: 'bg-gray-100 text-gray-600' }
                return (
                  <div key={al.id} className="rounded-2xl border border-brh-border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brh-text">{al.actions?.nom ?? 'Action'}</p>
                        <p className="mt-0.5 text-xs text-brh-muted">{noms[al.user_id ?? ''] ?? '—'} · {ilYa(al.created_at)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ty.cls}`}>{ty.label}</span>
                    </div>
                    <p className="mt-2 rounded-lg border-l-2 border-brh-secondary bg-brh-bg px-3 py-2 text-xs text-brh-text/90">« {al.message} »</p>
                    <button onClick={() => traiterAlerte(al)} disabled={enCours === al.id} className="mt-3 rounded-lg bg-brh-secondary px-3 py-2 text-xs font-semibold text-brh-primary transition hover:opacity-90 disabled:opacity-60">Marquer traitée</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Avancement moyen par cadre */}
      <div className="rounded-2xl border border-brh-border bg-white p-6 shadow-sm">
        <p className="mb-4 text-xs font-bold uppercase tracking-wide text-brh-text">Avancement moyen par cadre</p>
        {cadres.length === 0 ? (
          <p className="text-sm text-brh-muted">Aucun cadre enregistré.</p>
        ) : (
          <div className="space-y-3">
            {cadres.map((c) => {
              const s = statsCadre(c.id)
              return (
                <div key={c.id} className="grid grid-cols-[130px_1fr_44px] items-center gap-3">
                  <span className="truncate text-sm font-medium text-brh-text" title={c.nom}>{c.nom}</span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-brh-bg"><div className="h-full rounded-full transition-all" style={{ width: `${s.moy}%`, background: couleurPct(s.moy) }} /></div>
                  <span className="text-right text-sm font-bold tabular-nums" style={{ color: couleurPct(s.moy) }}>{s.moy}%</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Suivi des cadres — rapports */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brh-text">Suivi des cadres — rapports</p>
        <div className="overflow-hidden rounded-2xl border border-brh-border bg-white shadow-sm">
          {cadres.map((c, i) => {
            const s = statsCadre(c.id)
            const initiales = c.nom.split(' ').map((m) => m[0]).slice(0, 2).join('').toUpperCase()
            return (
              <div key={c.id} className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${i > 0 ? 'border-t border-brh-border' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brh-primary text-[11px] font-bold text-white">{initiales}</div>
                  <div><p className="text-sm font-semibold text-brh-text">{c.nom}</p><p className="text-[11px] text-brh-muted">{s.nbActions} action{s.nbActions > 1 ? 's' : ''}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  {s.nbAlertes > 0 && <span className="rounded-full bg-brh-danger/10 px-2.5 py-0.5 text-[11px] font-medium text-brh-danger">{s.nbAlertes} alerte{s.nbAlertes > 1 ? 's' : ''}</span>}
                  {s.dernierRapport ? (
                    <span className="rounded-full bg-brh-success/10 px-2.5 py-0.5 text-[11px] font-medium text-brh-success">Rapport reçu · {formatCourt(s.dernierRapport)}</span>
                  ) : (
                    <>
                      <span className="rounded-full bg-brh-warning/10 px-2.5 py-0.5 text-[11px] font-medium text-brh-warning">Aucun rapport cette semaine</span>
                      <button onClick={() => relancer(c.id, c.nom)} disabled={enCours === c.id} className="inline-flex items-center gap-1.5 rounded-lg bg-brh-secondary px-3 py-1.5 text-[11px] font-semibold text-brh-primary transition hover:opacity-90 disabled:opacity-60">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /></svg>Relancer
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
