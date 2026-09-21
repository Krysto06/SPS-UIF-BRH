import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { notifierTous } from '../notifs'
import { TitreSection } from '../ui'

const serif = { fontFamily: '"Manrope", "Inter", ui-sans-serif, sans-serif' } as const
const champ = 'w-full rounded-lg border border-brh-border bg-white px-3 py-2 text-sm text-brh-text outline-none transition focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'
const flabel = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-brh-muted'

type Veille = { id: string; titre: string; theme: string | null; source_url: string | null; resume: string | null; date: string | null; created_by: string | null; created_at: string }

const THEMES: Record<string, string> = {
  'Réglementation': '#2563EB', 'Marché': '#1E7A46', 'Technologie / Fintech': '#7C3AED',
  'International': '#0891B2', 'Concurrence': '#D97706', 'Autre': '#64748B',
}
const formVide = { titre: '', theme: 'Réglementation', source_url: '', resume: '', date: '' }
function frDate(d: string | null): string { return d ? d.split('-').reverse().join('/') : '' }

// 🔭 Veille UIF (partagée) — tout le monde peut déposer une veille
// (réglementaire, marché, technologique…) avec sa source, et consulter les autres.
export function VeilleUIF({ utilisateurId, peutGerer = false }: { utilisateurId?: string; peutGerer?: boolean }) {
  const [veilles, setVeilles] = useState<Veille[]>([])
  const [noms, setNoms] = useState<Record<string, string>>({})
  const [chargement, setChargement] = useState(true)
  const [ouvert, setOuvert] = useState(false)
  const [f, setF] = useState({ ...formVide })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [filtre, setFiltre] = useState('Tout')

  const charger = useCallback(async () => {
    const [vRes, uRes] = await Promise.all([
      supabase.from('veilles').select('*').order('created_at', { ascending: false }),
      supabase.from('users').select('id, nom'),
    ])
    setVeilles((vRes.data ?? []) as Veille[])
    setNoms(Object.fromEntries((uRes.data ?? []).map((u: any) => [u.id, u.nom])))
    setChargement(false)
  }, [])
  useEffect(() => { charger() }, [charger])

  async function ajouter() {
    if (f.titre.trim() === '') { setMsg('Donne un titre à la veille.'); return }
    setBusy(true); setMsg(null)
    const { error } = await supabase.from('veilles').insert({
      titre: f.titre.trim(), theme: f.theme, source_url: f.source_url.trim() || null,
      resume: f.resume.trim() || null, date: f.date || null, created_by: utilisateurId ?? null,
    })
    setBusy(false)
    if (error) { setMsg('Erreur : ' + error.message); return }
    await notifierTous(`Nouvelle veille UIF : « ${f.titre.trim()} ».`, 'veille', utilisateurId)
    setF({ ...formVide }); setOuvert(false)
    await charger()
  }
  async function supprimer(id: string) {
    if (!confirm('Supprimer cette veille ?')) return
    await supabase.from('veilles').delete().eq('id', id)
    await charger()
  }

  const themesPresents = ['Tout', ...Object.keys(THEMES).filter((t) => veilles.some((v) => (v.theme ?? 'Autre') === t))]
  const visibles = filtre === 'Tout' ? veilles : veilles.filter((v) => (v.theme ?? 'Autre') === filtre)
  function normaliserUrl(u: string) { return /^https?:\/\//i.test(u) ? u : `https://${u}` }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* En-tête */}
      <div className="relative overflow-hidden rounded-[22px] px-7 py-6 text-white shadow-md" style={{ background: 'linear-gradient(135deg,#12355B,#081A31)' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(520px 260px at 105% -10%, rgba(201,162,39,0.22), transparent 60%)' }} />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brh-gold-light">Intelligence & suivi</p>
            <h1 className="mt-2 text-[26px] font-bold leading-tight" style={serif}>Veille UIF</h1>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-white/70">Partagez ce que vous repérez sur l'inclusion financière : réglementation, marché, technologies, tendances internationales.</p>
          </div>
          <button onClick={() => { setOuvert((v) => !v); setMsg(null) }} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brh-secondary px-4 py-2 text-sm font-semibold text-brh-primary shadow-sm transition hover:opacity-90">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2"><path d={ouvert ? 'M18 6 6 18M6 6l12 12' : 'M12 5v14M5 12h14'} /></svg>{ouvert ? 'Fermer' : 'Ajouter une veille'}
          </button>
        </div>
      </div>

      {/* Fiche de saisie */}
      {ouvert && (
        <div className="rounded-2xl border border-brh-border bg-white shadow-sm">
          <div className="border-b border-brh-border/70 bg-gradient-to-b from-brh-primary/5 to-transparent px-5 py-3"><p className="font-semibold text-brh-text" style={serif}>Nouvelle veille</p></div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div><label className={flabel}>Thème</label><select value={f.theme} onChange={(e) => setF({ ...f, theme: e.target.value })} className={champ}>{Object.keys(THEMES).map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className={flabel}>Date (optionnel)</label><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={champ} /></div>
            <div className="sm:col-span-2"><label className={flabel}>Titre</label><input value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} placeholder="Ex. : Nouvelle circulaire sur la monnaie mobile" className={champ} /></div>
            <div className="sm:col-span-2"><label className={flabel}>Résumé</label><textarea value={f.resume} onChange={(e) => setF({ ...f, resume: e.target.value })} placeholder="En quelques lignes : de quoi s'agit-il, pourquoi c'est utile pour l'UIF…" className={champ + ' min-h-[64px] resize-y'} /></div>
            <div className="sm:col-span-2"><label className={flabel}>Source / document (lien)</label><input value={f.source_url} onChange={(e) => setF({ ...f, source_url: e.target.value })} placeholder="https://… (article, PDF, page officielle)" className={champ} /></div>
            {msg && <p className="sm:col-span-2 rounded-lg bg-brh-danger/10 px-3 py-2 text-sm text-brh-danger">{msg}</p>}
            <div className="flex justify-end sm:col-span-2"><button onClick={ajouter} disabled={busy} className="rounded-lg bg-brh-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep disabled:opacity-60">{busy ? 'Ajout…' : 'Publier la veille'}</button></div>
          </div>
        </div>
      )}

      {/* Filtres */}
      {themesPresents.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {themesPresents.map((t) => (
            <button key={t} onClick={() => setFiltre(t)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${filtre === t ? 'bg-brh-primary text-white shadow-sm' : 'border border-brh-border bg-white text-brh-muted hover:bg-brh-bg'}`}>{t}</button>
          ))}
        </div>
      )}

      {/* Liste */}
      <div>
        <TitreSection titre="Veilles publiées" n={visibles.length} />
        {chargement ? <p className="text-sm text-brh-muted">Chargement…</p> : visibles.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-brh-border bg-white p-8 text-center text-sm text-brh-muted">Aucune veille pour le moment. Sois le premier à en partager une.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visibles.map((v) => {
              const coul = THEMES[v.theme ?? 'Autre'] ?? THEMES.Autre
              const peutSupprimer = peutGerer || v.created_by === utilisateurId
              return (
                <div key={v.id} className="flex flex-col rounded-2xl border border-brh-border bg-white p-4 shadow-sm transition hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: `${coul}14`, color: coul }}>{v.theme ?? 'Autre'}</span>
                    <div className="flex items-center gap-1.5">
                      {v.date && <span className="text-[11px] text-brh-muted">{frDate(v.date)}</span>}
                      {peutSupprimer && <button onClick={() => supprimer(v.id)} title="Supprimer" className="rounded-md p-1 text-brh-muted transition hover:bg-brh-danger/10 hover:text-brh-danger"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg></button>}
                    </div>
                  </div>
                  <p className="mt-2.5 font-semibold leading-snug text-brh-text">{v.titre}</p>
                  {v.resume && <p className="mt-1.5 text-sm leading-relaxed text-brh-text/75">{v.resume}</p>}
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-brh-border/60 pt-2.5">
                    <span className="truncate text-[11px] text-brh-muted">Par {noms[v.created_by ?? ''] ?? '—'}</span>
                    {v.source_url && <a href={normaliserUrl(v.source_url)} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brh-primary hover:underline">Source<svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7M8 7h9v9" /></svg></a>}
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
