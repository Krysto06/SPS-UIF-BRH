import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { couleurPct } from '../bareme'

const serif = { fontFamily: '"Fraunces", Georgia, "Times New Roman", serif' } as const

type Item = { pct: number; cadre: string; axe: string }

function moyenne(vals: number[]): number { return vals.length === 0 ? 0 : Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) }
function grouper(items: Item[], cle: 'cadre' | 'axe') {
  const acc: Record<string, number[]> = {}
  items.forEach((i) => { (acc[i[cle]] ??= []).push(i.pct) })
  return Object.entries(acc).map(([nom, vals]) => ({ nom, moy: moyenne(vals) })).sort((a, b) => b.moy - a.moy)
}

// 📈 Performance de l'UIF (direction) : vue globale + par cadre + par axe
export function DirectionPerformance() {
  const [items, setItems] = useState<Item[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    (async () => {
      const [uRes, aRes] = await Promise.all([
        supabase.from('users').select('id, nom'),
        supabase.from('actions').select('pourcentage, user_id, cadres_strategiques(nom)'),
      ])
      const noms: Record<string, string> = {}; (uRes.data ?? []).forEach((u: any) => { noms[u.id] = u.nom })
      setItems((aRes.data ?? []).map((a: any) => ({ pct: a.pourcentage ?? 0, cadre: noms[a.user_id] ?? '—', axe: a.cadres_strategiques?.nom ?? '—' })))
      setChargement(false)
    })()
  }, [])

  if (chargement) return <p className="text-center text-sm text-brh-muted">Chargement de la performance…</p>

  const globale = moyenne(items.map((i) => i.pct))
  const parCadre = grouper(items, 'cadre')
  const parAxe = grouper(items, 'axe')

  // Jauge circulaire
  const rayon = 54, circ = 2 * Math.PI * rayon, offset = circ * (1 - globale / 100), coul = couleurPct(globale)

  const Barres = ({ titre, data }: { titre: string; data: { nom: string; moy: number }[] }) => (
    <div className="rounded-2xl border border-brh-border bg-white p-6 shadow-sm">
      <p className="mb-4 text-xs font-bold uppercase tracking-wide text-brh-text">{titre}</p>
      {data.length === 0 ? <p className="text-sm text-brh-muted">Aucune donnée.</p> : (
        <div className="space-y-3">
          {data.map((d) => (
            <div key={d.nom} className="grid grid-cols-[140px_1fr_44px] items-center gap-3">
              <span className="truncate text-sm font-medium text-brh-text" title={d.nom}>{d.nom}</span>
              <div className="h-2.5 overflow-hidden rounded-full bg-brh-bg"><div className="h-full rounded-full transition-all" style={{ width: `${d.moy}%`, background: couleurPct(d.moy) }} /></div>
              <span className="text-right text-sm font-bold tabular-nums" style={{ color: couleurPct(d.moy) }}>{d.moy}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div><h1 className="text-2xl font-bold text-brh-primary" style={serif}>Performance de l'UIF</h1><p className="mt-1 text-sm text-brh-muted">Performance globale de l'Unité et avancement par cadre et par axe stratégique.</p></div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Jauge globale */}
        <div className="flex items-center gap-5 rounded-2xl border border-brh-border bg-white p-6 shadow-sm">
          <div className="relative shrink-0" style={{ height: 124, width: 124 }}>
            <svg viewBox="0 0 124 124" className="h-31 w-31 -rotate-90" style={{ height: 124, width: 124 }}>
              <circle cx="62" cy="62" r={rayon} fill="none" stroke="#e2e8f0" strokeWidth="12" />
              <circle cx="62" cy="62" r={rayon} fill="none" stroke={coul} strokeWidth="12" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center"><span className="text-3xl font-bold" style={{ ...serif, color: coul }}>{globale}%</span></div>
          </div>
          <div>
            <p className="text-sm font-semibold text-brh-text/80">Performance globale</p>
            <p className="mt-0.5 text-xs text-brh-muted">{items.length} action{items.length > 1 ? 's' : ''} · {parCadre.length} cadre{parCadre.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Par axe (dans la même rangée) */}
        <div className="lg:col-span-2"><Barres titre="Par cadre stratégique (axe)" data={parAxe} /></div>
      </div>

      <Barres titre="Avancement par cadre" data={parCadre} />
    </div>
  )
}
