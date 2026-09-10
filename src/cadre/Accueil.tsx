import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const serif = { fontFamily: '"Fraunces", Georgia, "Times New Roman", serif' } as const

const STATUTS: Record<string, { label: string; cls: string }> = {
  en_cours: { label: 'En cours', cls: 'bg-blue-50 text-blue-700' },
  termine: { label: 'Terminé', cls: 'bg-brh-success/10 text-brh-success' },
  en_attente: { label: 'En attente', cls: 'bg-gray-100 text-gray-600' },
  bloque: { label: 'Bloqué', cls: 'bg-gray-200 text-gray-800' },
}

// 💬 Citations & faits — une par semaine (modifie librement cette liste)
const INSPIRATIONS: { type: 'citation' | 'fait'; texte: string; source: string }[] = [
  { type: 'citation', texte: "En me renversant, on n'a abattu que le tronc de l'arbre de la liberté des Noirs ; il repoussera par les racines, car elles sont profondes et nombreuses.", source: 'Toussaint Louverture (1802)' },
  { type: 'citation', texte: "Nous avons osé être libres, osons l'être par nous-mêmes et pour nous-mêmes.", source: "Déclaration d'indépendance d'Haïti (1804)" },
  { type: 'citation', texte: 'Nous sommes ce pays, et il ne serait rien sans nous, rien du tout.', source: 'Jacques Roumain, Gouverneurs de la rosée' },
  { type: 'fait', texte: "Haïti est la première république noire indépendante au monde, proclamée le 1er janvier 1804.", source: 'Le sais-tu ?' },
  { type: 'citation', texte: "Le secret de l'existence humaine ne consiste pas seulement à vivre, mais à trouver un motif de vivre.", source: 'Fiodor Dostoïevski' },
  { type: 'citation', texte: "On résiste à l'invasion des armées ; on ne résiste pas à l'invasion des idées.", source: 'Victor Hugo' },
  { type: 'fait', texte: "La Banque de la République d'Haïti (BRH) est la banque centrale du pays ; elle a succédé en 1979 à la Banque Nationale de la République d'Haïti.", source: 'Le sais-tu ?' },
  { type: 'citation', texte: "Un pessimiste voit la difficulté dans chaque opportunité ; un optimiste voit l'opportunité dans chaque difficulté.", source: 'Winston Churchill' },
  { type: 'citation', texte: "La seule chose dont nous devons avoir peur, c'est la peur elle-même.", source: 'Franklin D. Roosevelt (1933)' },
  { type: 'citation', texte: 'Faites ce que vous pouvez, avec ce que vous avez, là où vous êtes.', source: 'Theodore Roosevelt' },
  { type: 'fait', texte: "Le Parc national historique — Citadelle, Sans-Souci, Ramiers — est inscrit au patrimoine mondial de l'UNESCO depuis 1982.", source: 'Le sais-tu ?' },
  { type: 'citation', texte: "Cela paraît toujours impossible, jusqu'à ce qu'on le fasse.", source: 'Nelson Mandela' },
  { type: 'citation', texte: 'Nous sommes celles et ceux que nous attendions.', source: 'Barack Obama (2008)' },
]

// Semaine de l'année fiscale (1er octobre → 30 septembre) pour la rotation
function indexSemaine(): number {
  const d = new Date()
  const anneeDebut = d.getMonth() >= 9 ? d.getFullYear() : d.getFullYear() - 1
  const debut = new Date(anneeDebut, 9, 1)
  return Math.max(0, Math.floor((d.getTime() - debut.getTime()) / (7 * 86400000)))
}

type Action = { titre: string; axe: string; statut: string; pct: number; echeance: string }

// 🏠 Page d'accueil : citation, score, évolution, KPI et actions récentes
export function Accueil({ nom, utilisateurId, onVoirActions }: { nom: string; utilisateurId?: string; onVoirActions: () => void }) {
  const prenom = nom.split(' ')[0]
  const inspiration = INSPIRATIONS[indexSemaine() % INSPIRATIONS.length]
  const salutation = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir'

  const score = 82
  const couleurScore = score < 50 ? '#E39B9B' : '#12355B' // rouge pâle sous 50 %

  const stats = [
    { libelle: 'Actions en cours', valeur: '4', carte: 'bg-blue-50 border-blue-100', chiffre: 'text-blue-700' },
    { libelle: 'Terminées', valeur: '2', carte: 'bg-green-50 border-green-100', chiffre: 'text-brh-success' },
    { libelle: 'En retard', valeur: '1', carte: 'bg-orange-50 border-orange-100', chiffre: 'text-brh-warning' },
    { libelle: 'Bloquées', valeur: '1', carte: 'bg-red-50 border-red-100', chiffre: 'text-brh-danger' },
  ]

  // Évolution : 3 mois en semaines (Avril, Mai, Juin)
  const evolution = [55, 58, 60, 63, 64, 67, 70, 72, 74, 77, 80, 82]
  const n = evolution.length
  const cx = (i: number) => 14 + (i * (332 / (n - 1)))
  const cy = (v: number) => 108 - (v / 100) * 86
  const pts = evolution.map((v, i) => `${cx(i)},${cy(v)}`).join(' ')
  const aire = `M${cx(0)},108 L${pts.replaceAll(' ', ' L')} L${cx(n - 1)},108 Z`

  const rayon = 52
  const circ = 2 * Math.PI * rayon
  const offset = circ * (1 - score / 100)

  // 📥 Actions du cadre, lues depuis Supabase
  const [actions, setActions] = useState<Action[]>([])
  useEffect(() => {
    if (!utilisateurId) return
    supabase
      .from('actions')
      .select('nom, statut, pourcentage, echeance, cadres_strategiques(nom)')
      .eq('user_id', utilisateurId)
      .order('echeance')
      .then(({ data }) => {
        const liste = (data ?? []).map((a: any) => ({
          titre: a.nom,
          axe: a.cadres_strategiques?.nom ?? '—',
          statut: a.statut,
          pct: a.pourcentage ?? 0,
          echeance: a.echeance ? a.echeance.split('-').reverse().join('/') : '',
        }))
        setActions(liste)
      })
  }, [utilisateurId])

  return (
    <div className="space-y-6">
      {/* Bandeau inspiration de la semaine */}
      <div className="relative overflow-hidden rounded-xl px-4 py-3 text-white shadow-sm" style={{ background: 'linear-gradient(to right, #12355B, #0B2545)' }}>
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brh-gold-light">
            {inspiration.type === 'fait' ? 'Le sais-tu ?' : 'Citation'}
          </span>
          <span className="truncate text-[11px] text-brh-gold-light/80">— {inspiration.source}</span>
        </div>
        <p className="mt-1 max-w-3xl text-sm leading-snug text-white/90">« {inspiration.texte} »</p>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-brh-primary" style={serif}>{salutation}, {prenom}</h1>
        <p className="mt-1 text-sm text-brh-muted">Voici votre performance au sein de l'Unité d'Inclusion Financière.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex items-center gap-6 rounded-2xl border border-brh-border bg-white p-6 shadow-sm">
          <div className="relative shrink-0" style={{ height: 128, width: 128 }}>
            <svg viewBox="0 0 128 128" className="h-32 w-32 -rotate-90">
              <circle cx="64" cy="64" r={rayon} fill="none" stroke="#e2e8f0" strokeWidth="12" />
              <circle cx="64" cy="64" r={rayon} fill="none" stroke={couleurScore} strokeWidth="12" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: couleurScore }}>{score}%</span>
              <span className="text-[11px] text-brh-muted">provisoire</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-brh-text/70">Ma performance trimestrielle</p>
            <p className="mt-1 text-xs text-brh-muted">Trimestre 2 · Avril–Juin 2026</p>
            <span className="mt-3 inline-block rounded-full bg-brh-warning/10 px-3 py-1 text-xs font-medium text-brh-warning">En attente de validation</span>
          </div>
        </div>

        <div className="rounded-2xl border border-brh-border bg-white p-6 shadow-sm lg:col-span-2">
          <p className="text-sm font-medium text-brh-text/70">Évolution — 3 mois (par semaine)</p>
          <svg viewBox="0 0 360 120" className="mt-4 h-36 w-full">
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#12355B" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#12355B" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={aire} fill="url(#grad)" />
            <polyline points={pts} fill="none" stroke="#12355B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {evolution.map((v, i) => (
              <circle key={i} cx={cx(i)} cy={cy(v)} r={i === n - 1 ? 4.5 : 2.8} fill={i === n - 1 ? '#C9A227' : '#12355B'} />
            ))}
          </svg>
          <div className="mt-1 flex justify-around text-xs font-medium text-brh-muted">
            <span>Avril</span><span>Mai</span><span>Juin</span>
          </div>
        </div>
      </div>

      {/* Cartes KPI colorées */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.libelle} className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${s.carte}`}>
            <p className="text-xs font-medium uppercase tracking-wide text-brh-muted">{s.libelle}</p>
            <p className={`mt-2 text-3xl font-bold ${s.chiffre}`}>{s.valeur}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-brh-primary">Mes actions récentes</h3>
          <button onClick={onVoirActions} className="text-xs font-medium text-brh-primary hover:underline">Tout voir →</button>
        </div>
        {actions.length === 0 && (
          <p className="rounded-2xl border border-dashed border-brh-border bg-white p-6 text-center text-sm text-brh-muted">
            Aucune action enregistrée pour le moment.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          {actions.map((a) => {
            const st = STATUTS[a.statut]
            return (
              <div key={a.titre} className="rounded-2xl border border-brh-border bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-brh-text">{a.titre}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                </div>
                <p className="mt-1 text-xs text-brh-muted">{a.axe}</p>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-brh-bg">
                  <div className="h-full rounded-full bg-brh-primary" style={{ width: `${a.pct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-brh-muted">
                  <span>{a.pct}%</span><span>Échéance : {a.echeance}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
