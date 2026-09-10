import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from './supabase'

type Props = { nom: string; role?: string; utilisateurId?: string; onDeconnexion: () => void }
type Action = { titre: string; axe: string; statut: string; pct: number; echeance: string }
type UserLite = { id: string; nom: string; role: string | null }
type CadreLite = { id: string; nom: string }

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

function Icone({ nom, className = 'h-5 w-5' }: { nom: string; className?: string }) {
  const c = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (nom) {
    case 'tableau': return (<svg {...c}><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>)
    case 'actions': return (<svg {...c}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" /><path d="m9 14 2 2 4-4" /></svg>)
    case 'contribution': return (<svg {...c}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></svg>)
    case 'activites': return (<svg {...c}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></svg>)
    case 'veille': return (<svg {...c}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>)
    case 'equipe': return (<svg {...c}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>)
    case 'rapports': return (<svg {...c}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v5h5" /><path d="M8 13h8" /><path d="M8 17h8" /></svg>)
    case 'semaine': return (<svg {...c}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>)
    case 'evenements': return (<svg {...c}><path d="M12 2.5l2.7 5.6 6.1.5-4.6 4 1.4 6-5.6-3.3-5.6 3.3 1.4-6-4.6-4 6.1-.5z" /></svg>)
    case 'performance': return (<svg {...c}><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="7" rx="0.5" /><rect x="12" y="7" width="3" height="11" rx="0.5" /><rect x="17" y="4" width="3" height="14" rx="0.5" /></svg>)
    case 'attribuer': return (<svg {...c}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6" /><path d="M22 11h-6" /></svg>)
    default: return null
  }
}

const MENU = [
  { id: 'tableau', label: 'Tableau de bord' },
  { id: 'semaine', label: 'Ma semaine' },
  { id: 'actions', label: 'Mes actions du trimestre' },
  { id: 'activites', label: 'Activité' },
  { id: 'evenements', label: "Événement de l'UIF" },
  { id: 'performance', label: "Performance de l'UIF" },
]

const STATUTS: Record<string, { label: string; cls: string }> = {
  en_cours: { label: 'En cours', cls: 'bg-blue-50 text-blue-700' },
  termine: { label: 'Terminé', cls: 'bg-brh-success/10 text-brh-success' },
  en_attente: { label: 'En attente', cls: 'bg-gray-100 text-gray-600' },
  bloque: { label: 'Bloqué', cls: 'bg-gray-200 text-gray-800' },
}

const champAdmin =
  'w-full rounded-lg border border-brh-border bg-white px-4 py-2.5 text-sm text-brh-text outline-none transition placeholder:text-brh-muted/60 focus:border-brh-primary focus:ring-4 focus:ring-brh-primary/10'
const labelAdmin = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brh-muted'

// 🛠️ Formulaire réservé à l'Admin : attribuer une action à un collaborateur
function AttribuerAction() {
  const [users, setUsers] = useState<UserLite[]>([])
  const [cadres, setCadres] = useState<CadreLite[]>([])

  const [userId, setUserId] = useState('')
  const [titre, setTitre] = useState('')
  const [cadreId, setCadreId] = useState('')
  const [trimestre, setTrimestre] = useState('T2')
  const [echeance, setEcheance] = useState('')

  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null)

  useEffect(() => {
    supabase.from('users').select('id, nom, role').order('nom').then(({ data }) => {
      const liste = (data ?? []).filter((u: any) => u.role !== 'admin' && u.role !== 'directrice') as UserLite[]
      setUsers(liste)
    })
    supabase.from('cadres_strategiques').select('id, nom').order('nom').then(({ data }) => {
      setCadres((data ?? []) as CadreLite[])
    })
  }, [])

  async function enregistrer(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (!userId || titre.trim() === '' || !cadreId || !echeance) {
      setMessage({ ok: false, texte: 'Merci de remplir tous les champs.' })
      return
    }
    setEnCours(true)
    const { error } = await supabase.from('actions').insert({
      user_id: userId,
      nom: titre.trim(),
      cadre_strategique_id: cadreId,
      trimestre,
      echeance,
      statut: 'en_attente',
      pourcentage: 0,
    })
    setEnCours(false)
    if (error) {
      setMessage({ ok: false, texte: 'Erreur : ' + error.message })
      return
    }
    const personne = users.find((u) => u.id === userId)?.nom ?? 'le collaborateur'
    setMessage({ ok: true, texte: `Action attribuée à ${personne}.` })
    setTitre(''); setCadreId(''); setEcheance(''); setUserId('')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brh-primary">Attribuer une action</h1>
        <p className="mt-1 text-sm text-brh-muted">
          Créez une action et confiez-la à un collaborateur. Il pourra ensuite suivre son avancement depuis son espace.
        </p>
      </div>

      <form onSubmit={enregistrer} className="space-y-5 rounded-2xl border border-brh-border bg-white p-6 shadow-sm">
        <div>
          <label className={labelAdmin}>Collaborateur</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)} className={champAdmin}>
            <option value="">— Choisir une personne —</option>
            {users.map((u) => (<option key={u.id} value={u.id}>{u.nom}</option>))}
          </select>
        </div>

        <div>
          <label className={labelAdmin}>Intitulé de l'action</label>
          <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. : Collecte de données nationales" className={champAdmin} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelAdmin}>Cadre stratégique</label>
            <select value={cadreId} onChange={(e) => setCadreId(e.target.value)} className={champAdmin}>
              <option value="">— Choisir un cadre —</option>
              {cadres.map((c) => (<option key={c.id} value={c.id}>{c.nom}</option>))}
            </select>
          </div>
          <div>
            <label className={labelAdmin}>Trimestre</label>
            <select value={trimestre} onChange={(e) => setTrimestre(e.target.value)} className={champAdmin}>
              <option value="T1">T1 · Oct–Déc</option>
              <option value="T2">T2 · Jan–Mars</option>
              <option value="T3">T3 · Avr–Juin</option>
              <option value="T4">T4 · Juil–Sept</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelAdmin}>Échéance</label>
          <input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} className={champAdmin} />
        </div>

        {message && (
          <p className={`rounded-lg px-3 py-2 text-sm ${message.ok ? 'bg-brh-success/10 text-brh-success' : 'bg-brh-danger/10 text-brh-danger'}`}>
            {message.texte}
          </p>
        )}

        <button type="submit" disabled={enCours}
          className="w-full rounded-lg bg-brh-primary px-6 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-brh-primary/20 transition hover:bg-brh-deep disabled:opacity-60">
          {enCours ? 'Enregistrement…' : "Attribuer l'action"}
        </button>
      </form>
    </div>
  )
}

type ActionEdit = {
  id: string
  nom: string
  axe: string
  echeance: string | null
  echeanceFr: string
  statut: string
  pourcentage: number
  commentaire: string
  enregistre: 'ok' | 'erreur' | null
}

function estEnRetard(a: ActionEdit): boolean {
  if (!a.echeance || a.statut === 'termine') return false
  const aujourdhui = new Date(new Date().toDateString())
  return new Date(a.echeance) < aujourdhui
}

// 📋 Page du cadre : suivre et mettre à jour ses propres actions
function MesActions({ utilisateurId }: { utilisateurId?: string }) {
  const [liste, setListe] = useState<ActionEdit[]>([])
  const [chargement, setChargement] = useState(true)
  const [sauvegarde, setSauvegarde] = useState<string | null>(null)

  useEffect(() => {
    if (!utilisateurId) { setChargement(false); return }
    supabase
      .from('actions')
      .select('id, nom, statut, pourcentage, echeance, commentaire, cadres_strategiques(nom)')
      .eq('user_id', utilisateurId)
      .order('echeance')
      .then(({ data }) => {
        const l = (data ?? []).map((a: any) => ({
          id: a.id,
          nom: a.nom,
          axe: a.cadres_strategiques?.nom ?? '—',
          echeance: a.echeance ?? null,
          echeanceFr: a.echeance ? a.echeance.split('-').reverse().join('/') : '—',
          statut: a.statut ?? 'en_attente',
          pourcentage: a.pourcentage ?? 0,
          commentaire: a.commentaire ?? '',
          enregistre: null as 'ok' | 'erreur' | null,
        }))
        setListe(l)
        setChargement(false)
      })
  }, [utilisateurId])

  function modifier(id: string, champ: 'statut' | 'pourcentage' | 'commentaire', valeur: string | number) {
    setListe((prev) => prev.map((a) => (a.id === id ? { ...a, [champ]: valeur, enregistre: null } : a)))
  }

  async function enregistrer(a: ActionEdit) {
    setSauvegarde(a.id)
    const { error } = await supabase
      .from('actions')
      .update({
        pourcentage: a.pourcentage,
        statut: a.statut,
        commentaire: a.commentaire.trim() === '' ? null : a.commentaire.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', a.id)
    setSauvegarde(null)
    setListe((prev) => prev.map((x) => (x.id === a.id ? { ...x, enregistre: error ? 'erreur' : 'ok' } : x)))
  }

  if (chargement) {
    return <p className="text-center text-sm text-brh-muted">Chargement de vos actions…</p>
  }

  if (liste.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-2xl border border-dashed border-brh-border bg-white p-8 text-center text-sm text-brh-muted">
          Aucune action ne vous a encore été attribuée. L'administrateur vous en confiera prochainement.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brh-primary">Mes actions du trimestre</h1>
        <p className="mt-1 text-sm text-brh-muted">Mettez à jour l'avancement de chaque action. Vos modifications sont enregistrées dans la base.</p>
      </div>

      {liste.map((a) => {
        const st = STATUTS[a.statut]
        const enRetard = estEnRetard(a)
        return (
          <div key={a.id} className={`rounded-2xl border bg-white p-6 shadow-sm ${enRetard ? 'border-brh-danger/40' : 'border-brh-border'}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-brh-text">{a.nom}</p>
                <p className="mt-0.5 text-xs text-brh-muted">{a.axe} · Échéance : {a.echeanceFr}</p>
              </div>
              <div className="flex items-center gap-2">
                {enRetard && <span className="rounded-full bg-brh-danger/10 px-2.5 py-0.5 text-[11px] font-medium text-brh-danger">En retard</span>}
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-1 flex items-center justify-between text-xs font-medium text-brh-muted">
                <span>Avancement</span>
                <span className="text-brh-primary">{a.pourcentage}%</span>
              </div>
              <input type="range" min={0} max={100} step={5} value={a.pourcentage}
                onChange={(e) => modifier(a.id, 'pourcentage', Number(e.target.value))}
                className="w-full accent-brh-primary" />
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-brh-bg">
                <div className="h-full rounded-full bg-brh-primary transition-all" style={{ width: `${a.pourcentage}%` }} />
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelAdmin}>Statut</label>
                <select value={a.statut} onChange={(e) => modifier(a.id, 'statut', e.target.value)} className={champAdmin}>
                  <option value="en_attente">En attente</option>
                  <option value="en_cours">En cours</option>
                  <option value="termine">Terminé</option>
                  <option value="bloque">Bloqué</option>
                </select>
              </div>
              <div>
                <label className={labelAdmin}>Commentaire (optionnel)</label>
                <input type="text" value={a.commentaire} onChange={(e) => modifier(a.id, 'commentaire', e.target.value)}
                  placeholder="Ex. : en attente de données du terrain" className={champAdmin} />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              {a.enregistre === 'ok' && <span className="text-xs font-medium text-brh-success">✓ Enregistré</span>}
              {a.enregistre === 'erreur' && <span className="text-xs font-medium text-brh-danger">Erreur d'enregistrement</span>}
              <button onClick={() => enregistrer(a)} disabled={sauvegarde === a.id}
                className="rounded-lg bg-brh-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brh-deep disabled:opacity-60">
                {sauvegarde === a.id ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function TableauDeBord({ nom, role = "Membre de l'UIF", utilisateurId, onDeconnexion }: Props) {
  const [pageActive, setPageActive] = useState('tableau')
  const [menuOuvert, setMenuOuvert] = useState(false)

  // L'Admin voit une entrée supplémentaire pour attribuer des actions
  const estAdmin = role === 'admin'
  const menu = estAdmin
    ? [...MENU.slice(0, 3), { id: 'attribuer', label: 'Attribuer une action' }, ...MENU.slice(3)]
    : MENU

  const prenom = nom.split(' ')[0]
  const initiales = nom.split(' ').map((m) => m[0]).slice(0, 2).join('').toUpperCase()
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

  const titrePage = menu.find((m) => m.id === pageActive)?.label ?? ''

  return (
    <div className="min-h-screen bg-brh-bg lg:flex">
      {menuOuvert && (<div onClick={() => setMenuOuvert(false)} className="fixed inset-0 z-30 bg-black/40 lg:hidden" />)}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-gradient-to-b from-brh-primary to-brh-deep text-white transition-transform duration-300 lg:static lg:translate-x-0 ${menuOuvert ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
          <div className="flex shrink-0 items-center justify-center rounded-lg bg-white p-1.5" style={{ height: 40, width: 40 }}>
            <img src="/logo-brh.jpg" alt="BRH" className="h-full w-full object-contain" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">SPS-UIF</p>
            <p className="whitespace-nowrap text-[10px] text-white/50">Banque de la République d'Haïti</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {menu.map((m) => {
            const actif = m.id === pageActive
            return (
              <button key={m.id} onClick={() => { setPageActive(m.id); setMenuOuvert(false) }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${actif ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                <Icone nom={m.id} className="h-5 w-5 shrink-0" />
                {m.label}
                {actif && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brh-secondary" />}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brh-secondary text-xs font-bold text-brh-primary">{initiales}</div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">{nom}</p>
              <p className="truncate text-[11px] text-white/50">{role}</p>
            </div>
          </div>
          <button onClick={onDeconnexion} className="mt-3 w-full rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10">Déconnexion</button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-brh-border bg-white/90 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOuvert(true)} className="rounded-lg border border-brh-border p-2 text-brh-text lg:hidden" aria-label="Ouvrir le menu">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h2 className="text-base font-semibold text-brh-primary">{titrePage} <span className="font-normal text-brh-muted">— UIF</span></h2>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-full bg-brh-primary/5 px-3 py-1 text-xs font-medium text-brh-primary">Année fiscale 2026–2027</span>
            <span className="rounded-full bg-brh-bg px-3 py-1 text-xs font-medium text-brh-muted">Trimestre 2</span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
          {pageActive === 'tableau' ? (
            <div className="space-y-6">
              {/* Bandeau inspiration de la semaine */}
              <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-sm" style={{ background: 'linear-gradient(to right, #12355B, #0B2545)' }}>
                <span className="absolute right-4 top-2 text-6xl leading-none text-white/10">”</span>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brh-gold-light">
                  {inspiration.type === 'fait' ? 'Le sais-tu ?' : 'Citation de la semaine'}
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/90 sm:text-base">« {inspiration.texte} »</p>
                <p className="mt-2 text-xs font-medium text-brh-gold-light">— {inspiration.source}</p>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-brh-primary">{salutation}, {prenom}</h1>
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
                  <button onClick={() => setPageActive('actions')} className="text-xs font-medium text-brh-primary hover:underline">Tout voir →</button>
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
          ) : pageActive === 'attribuer' ? (
            <AttribuerAction />
          ) : pageActive === 'actions' ? (
            <MesActions utilisateurId={utilisateurId} />
          ) : (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <Icone nom={pageActive} className="h-10 w-10 text-brh-primary/40" />
              <h3 className="mt-4 text-lg font-semibold text-brh-primary">{titrePage}</h3>
              <p className="mt-1 max-w-xs text-sm text-brh-muted">Cette section arrive bientôt. On la construira ensemble dans une prochaine étape.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
