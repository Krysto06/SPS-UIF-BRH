import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { couleurPct, etapeDe, etapeCls } from '../bareme'

const serif = { fontFamily: '"Manrope", "Inter", ui-sans-serif, sans-serif' } as const

type Ligne = { id: string; nom: string; pct: number; cadre: string; axe: string }

// 📊 Mes actions du trimestre (direction) : toutes les actions de tous les cadres
export function DirectionActions() {
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    (async () => {
      const [uRes, aRes] = await Promise.all([
        supabase.from('users').select('id, nom'),
        supabase.from('actions').select('id, nom, pourcentage, user_id, cadres_strategiques(nom)'),
      ])
      const noms: Record<string, string> = {}; (uRes.data ?? []).forEach((u: any) => { noms[u.id] = u.nom })
      setLignes((aRes.data ?? []).map((a: any) => ({
        id: a.id, nom: a.nom, pct: a.pourcentage ?? 0,
        cadre: noms[a.user_id] ?? '—', axe: a.cadres_strategiques?.nom ?? '—',
      })))
      setChargement(false)
    })()
  }, [])

  if (chargement) return <p className="text-center text-sm text-brh-muted">Chargement des actions…</p>

  const moyenne = lignes.length === 0 ? 0 : Math.round(lignes.reduce((s, l) => s + l.pct, 0) / lignes.length)

  // Moyenne par cadre stratégique (axe)
  const parAxe = Object.entries(lignes.reduce((acc, l) => {
    (acc[l.axe] ??= []).push(l.pct); return acc
  }, {} as Record<string, number[]>)).map(([axe, vals]) => ({ axe, moy: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length), n: vals.length }))

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brh-primary" style={serif}>Actions du trimestre — équipe</h1>
        <p className="mt-1 text-sm text-brh-muted">L'avancement de toutes les actions de tous les cadres.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-brh-border bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-brh-muted">Avancement moyen</p>
          <p className="mt-1 text-3xl font-bold" style={{ ...serif, color: couleurPct(moyenne) }}>{moyenne}%</p>
        </div>
        <div className="rounded-2xl border border-brh-border bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-brh-muted">Actions suivies</p>
          <p className="mt-1 text-3xl font-bold text-brh-primary" style={serif}>{lignes.length}</p>
        </div>
        <div className="rounded-2xl border border-brh-border bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-brh-muted">Approuvées (100 %)</p>
          <p className="mt-1 text-3xl font-bold text-brh-success" style={serif}>{lignes.filter((l) => l.pct >= 100).length}</p>
        </div>
      </div>

      {/* Avancement par cadre stratégique */}
      <div className="rounded-2xl border border-brh-border bg-white p-6 shadow-sm">
        <p className="mb-4 text-xs font-bold uppercase tracking-wide text-brh-text">Avancement moyen par cadre stratégique</p>
        {parAxe.length === 0 ? <p className="text-sm text-brh-muted">Aucune donnée.</p> : (
          <div className="space-y-3">
            {parAxe.map((a) => (
              <div key={a.axe} className="grid grid-cols-[140px_1fr_44px] items-center gap-3">
                <span className="truncate text-sm font-medium text-brh-text" title={a.axe}>{a.axe}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-brh-bg"><div className="h-full rounded-full" style={{ width: `${a.moy}%`, background: couleurPct(a.moy) }} /></div>
                <span className="text-right text-sm font-bold tabular-nums" style={{ color: couleurPct(a.moy) }}>{a.moy}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tableau des actions */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brh-text">Détail des actions</p>
        <div className="overflow-hidden rounded-2xl border border-brh-border bg-white shadow-sm">
          <div className="grid grid-cols-[1fr_100px_110px_70px] gap-2 border-b border-brh-border bg-brh-bg px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-brh-muted">
            <span>Action</span><span>Cadre</span><span>Axe</span><span className="text-right">%</span>
          </div>
          {lignes.length === 0 ? <p className="px-4 py-4 text-sm text-brh-muted">Aucune action.</p> : lignes.map((l) => {
            const et = etapeDe(l.pct)
            return (
              <div key={l.id} className="grid grid-cols-[1fr_100px_110px_70px] items-center gap-2 border-b border-brh-border/60 px-4 py-3 text-sm last:border-b-0">
                <div className="min-w-0"><p className="truncate font-medium text-brh-text">{l.nom}</p><span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${etapeCls(l.pct)}`}>{et.label}</span></div>
                <span className="truncate text-xs text-brh-muted">{l.cadre}</span>
                <span className="truncate text-xs text-brh-muted">{l.axe}</span>
                <span className="text-right font-bold tabular-nums" style={{ color: couleurPct(l.pct) }}>{l.pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
