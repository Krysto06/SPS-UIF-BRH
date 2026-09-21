import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { notifierTous } from '../notifs'
import { TitreSection } from '../ui'

const serif = { fontFamily: '"Manrope", "Inter", ui-sans-serif, sans-serif' } as const
const champ = 'w-full rounded-lg border border-brh-border bg-white px-3 py-2 text-sm text-brh-text outline-none transition focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'
const flabel = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-brh-muted'

type Doc = { id: string; titre: string; type: string; url: string | null; description: string | null; categorie: string | null; created_at: string }

const CATEGORIES = ['Stratégie', 'Procédures', 'Modèles', 'Références', 'Autre']
const TYPES: Record<string, { label: string; couleur: string }> = {
  document: { label: 'Document', couleur: '#2563EB' },
  lien: { label: 'Lien', couleur: '#1E7A46' },
  note: { label: 'Note', couleur: '#C9A227' },
}
const formVide = { titre: '', type: 'document', url: '', description: '', categorie: 'Stratégie' }

function IconeType({ type }: { type: string }) {
  const c = { className: 'h-5 w-5', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (type === 'lien') return (<svg {...c}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" /></svg>)
  if (type === 'note') return (<svg {...c}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>)
  return (<svg {...c}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h4" /></svg>)
}

// 📚 Espace de documentation partagé (tout le monde le voit).
// `peutGerer` = admin ou direction : ajout / suppression de documents et liens.
export function Documentation({ utilisateurId, peutGerer = false }: { utilisateurId?: string; peutGerer?: boolean }) {
  const [docs, setDocs] = useState<Doc[]>([])
  const [chargement, setChargement] = useState(true)
  const [ouvert, setOuvert] = useState(false)
  const [f, setF] = useState({ ...formVide })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [filtre, setFiltre] = useState('Tout')

  const charger = useCallback(async () => {
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
    setDocs((data ?? []) as Doc[])
    setChargement(false)
  }, [])
  useEffect(() => { charger() }, [charger])

  async function ajouter() {
    if (f.titre.trim() === '') { setMsg('Donne un titre.'); return }
    if (f.type !== 'note' && f.url.trim() === '') { setMsg('Ajoute le lien ou l’adresse du document.'); return }
    setBusy(true); setMsg(null)
    const { error } = await supabase.from('documents').insert({
      titre: f.titre.trim(), type: f.type, url: f.url.trim() || null,
      description: f.description.trim() || null, categorie: f.categorie, created_by: utilisateurId ?? null,
    })
    setBusy(false)
    if (error) { setMsg('Erreur : ' + error.message); return }
    await notifierTous(`Nouveau dans la documentation : « ${f.titre.trim()} ».`, 'documentation', utilisateurId)
    setF({ ...formVide }); setOuvert(false)
    await charger()
  }
  async function supprimer(id: string) {
    if (!confirm('Supprimer ce document de la documentation ?')) return
    await supabase.from('documents').delete().eq('id', id)
    await charger()
  }

  const categories = ['Tout', ...CATEGORIES.filter((c) => docs.some((d) => (d.categorie ?? 'Autre') === c))]
  const visibles = filtre === 'Tout' ? docs : docs.filter((d) => (d.categorie ?? 'Autre') === filtre)

  function normaliserUrl(u: string) { return /^https?:\/\//i.test(u) ? u : `https://${u}` }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* En-tête */}
      <div className="relative overflow-hidden rounded-[22px] px-7 py-6 text-white shadow-md" style={{ background: 'linear-gradient(135deg,#12355B,#081A31)' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(520px 260px at 105% -10%, rgba(201,162,39,0.22), transparent 60%)' }} />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brh-gold-light">Espace partagé</p>
            <h1 className="mt-2 text-[26px] font-bold leading-tight" style={serif}>Documentation de l'UIF</h1>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-white/70">Retrouvez les documents de référence, procédures, modèles et liens utiles de l'Unité, au même endroit.</p>
          </div>
          {peutGerer && (
            <button onClick={() => { setOuvert((v) => !v); setMsg(null) }} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brh-secondary px-4 py-2 text-sm font-semibold text-brh-primary shadow-sm transition hover:opacity-90">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2"><path d={ouvert ? 'M18 6 6 18M6 6l12 12' : 'M12 5v14M5 12h14'} /></svg>{ouvert ? 'Fermer' : 'Ajouter'}
            </button>
          )}
        </div>
      </div>

      {/* Formulaire (gestionnaires) */}
      {peutGerer && ouvert && (
        <div className="rounded-2xl border border-brh-border bg-white shadow-sm">
          <div className="border-b border-brh-border/70 bg-gradient-to-b from-brh-primary/5 to-transparent px-5 py-3"><p className="font-semibold text-brh-text" style={serif}>Nouveau document / lien</p></div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div><label className={flabel}>Type</label><select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className={champ}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
            <div><label className={flabel}>Catégorie</label><select value={f.categorie} onChange={(e) => setF({ ...f, categorie: e.target.value })} className={champ}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="sm:col-span-2"><label className={flabel}>Titre</label><input value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} placeholder="Ex. : Stratégie Nationale d'Inclusion Financière (SNIF)" className={champ} /></div>
            {f.type !== 'note' && <div className="sm:col-span-2"><label className={flabel}>Lien / adresse {f.type === 'document' ? '(Google Drive, PDF…)' : ''}</label><input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://…" className={champ} /></div>}
            <div className="sm:col-span-2"><label className={flabel}>Description {f.type === 'note' ? '' : '(optionnel)'}</label><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder={f.type === 'note' ? 'Écris la note ici…' : 'À quoi sert ce document ?'} className={champ + ' min-h-[64px] resize-y'} /></div>
            {msg && <p className="sm:col-span-2 rounded-lg bg-brh-danger/10 px-3 py-2 text-sm text-brh-danger">{msg}</p>}
            <div className="flex justify-end sm:col-span-2"><button onClick={ajouter} disabled={busy} className="rounded-lg bg-brh-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep disabled:opacity-60">{busy ? 'Ajout…' : 'Ajouter à la documentation'}</button></div>
          </div>
        </div>
      )}

      {/* Filtres */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c} onClick={() => setFiltre(c)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${filtre === c ? 'bg-brh-primary text-white shadow-sm' : 'border border-brh-border bg-white text-brh-muted hover:bg-brh-bg'}`}>{c}</button>
          ))}
        </div>
      )}

      {/* Liste */}
      <div>
        <TitreSection titre="Ressources" n={visibles.length} />
        {chargement ? <p className="text-sm text-brh-muted">Chargement…</p> : visibles.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-brh-border bg-white p-8 text-center text-sm text-brh-muted">Aucun document pour le moment.{peutGerer ? ' Ajoute-en un avec le bouton « Ajouter ».' : ''}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibles.map((d) => {
              const ty = TYPES[d.type] ?? TYPES.document
              return (
                <div key={d.id} className="group flex flex-col rounded-2xl border border-brh-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${ty.couleur}14`, color: ty.couleur }}><IconeType type={d.type} /></span>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${ty.couleur}14`, color: ty.couleur }}>{ty.label}</span>
                      {peutGerer && <button onClick={() => supprimer(d.id)} title="Supprimer" className="rounded-md p-1 text-brh-muted opacity-0 transition hover:bg-brh-danger/10 hover:text-brh-danger group-hover:opacity-100"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg></button>}
                    </div>
                  </div>
                  <p className="mt-3 font-semibold leading-snug text-brh-text">{d.titre}</p>
                  {d.categorie && <p className="mt-0.5 text-[11px] font-medium text-brh-muted">{d.categorie}</p>}
                  {d.description && <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-brh-text/75">{d.description}</p>}
                  {d.type !== 'note' && d.url && (
                    <a href={normaliserUrl(d.url)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 self-start rounded-lg border border-brh-border px-3 py-1.5 text-xs font-semibold text-brh-primary transition hover:bg-brh-bg">
                      Ouvrir<svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7M8 7h9v9" /></svg>
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
