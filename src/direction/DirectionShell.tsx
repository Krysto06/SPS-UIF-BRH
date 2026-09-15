import { useState } from 'react'
import { Cloche } from '../Notifications'
import { DirectionAccueil } from './DirectionAccueil'
import { DirectionSemaine } from './DirectionSemaine'
import { DirectionActions } from './DirectionActions'
import { DirectionActivite } from './DirectionActivite'
import { DirectionSecretariat } from './DirectionSecretariat'
import { DirectionEvenements } from './DirectionEvenements'
import { DirectionPerformance } from './DirectionPerformance'

type Props = { nom: string; utilisateurId?: string; onDeconnexion: () => void }

// Menu de l'espace direction
const MENU = [
  { id: 'tableau', label: 'Tableau de bord' },
  { id: 'semaine', label: 'Ma semaine' },
  { id: 'actions', label: 'Mes actions du trimestre' },
  { id: 'activite', label: 'Activité' },
  { id: 'secretariat', label: 'Secrétariat' },
  { id: 'event', label: "Événement de l'UIF" },
  { id: 'perf', label: "Performance de l'UIF" },
]

function Icone({ nom }: { nom: string }) {
  const c = { className: 'h-5 w-5 shrink-0', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (nom) {
    case 'tableau': return (<svg {...c}><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>)
    case 'semaine': return (<svg {...c}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>)
    case 'actions': return (<svg {...c}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" /><path d="m9 14 2 2 4-4" /></svg>)
    case 'activite': return (<svg {...c}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>)
    case 'secretariat': return (<svg {...c}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h4" /></svg>)
    case 'event': return (<svg {...c}><path d="M12 2.5l2.7 5.6 6.1.5-4.6 4 1.4 6-5.6-3.3-5.6 3.3 1.4-6-4.6-4 6.1-.5z" /></svg>)
    case 'perf': return (<svg {...c}><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="7" rx="0.5" /><rect x="12" y="7" width="3" height="11" rx="0.5" /><rect x="17" y="4" width="3" height="14" rx="0.5" /></svg>)
    default: return null
  }
}

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
function dateDuJour(): string {
  const d = new Date()
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`
}

// Placeholder pour les pages pas encore construites
function EnConstruction({ titre }: { titre: string }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brh-primary/10 text-brh-primary">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-brh-primary">{titre}</h3>
      <p className="mt-1 max-w-xs text-sm text-brh-muted">Cette page arrive bientôt. On la construit ensemble, une étape à la fois.</p>
    </div>
  )
}

// 🏛️ Coquille de l'espace direction : menu latéral + en-tête + routage
export function DirectionShell({ nom, utilisateurId, onDeconnexion }: Props) {
  const [pageActive, setPageActive] = useState('tableau')
  const [menuOuvert, setMenuOuvert] = useState(false)
  const initiales = nom.split(' ').map((m) => m[0]).slice(0, 2).join('').toUpperCase()
  const titrePage = MENU.find((m) => m.id === pageActive)?.label ?? ''

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
            <p className="whitespace-nowrap text-[10px] text-white/50">Espace direction</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {MENU.map((m) => {
            const actif = m.id === pageActive
            return (
              <button key={m.id} onClick={() => { setPageActive(m.id); setMenuOuvert(false) }}
                className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${actif ? 'bg-white/10 font-semibold text-white' : 'font-medium text-white/60 hover:bg-white/5 hover:text-white'}`}>
                {actif && <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brh-gold-light" />}
                <Icone nom={m.id} />
                {m.label}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-brh-primary shadow-sm" style={{ background: 'linear-gradient(135deg,#C9A227,#E2C766)' }}>{initiales}</div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">{nom}</p>
              <p className="truncate text-[11px] text-white/50">Directrice</p>
            </div>
          </div>
          <button onClick={onDeconnexion} className="mt-3 w-full rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10">Déconnexion</button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-brh-border bg-white/90 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOuvert(true)} className="rounded-lg border border-brh-border p-2 text-brh-text lg:hidden" aria-label="Ouvrir le menu">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h2 className="text-base font-semibold text-brh-primary">{titrePage} <span className="font-normal text-brh-muted">— UIF</span></h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-brh-bg px-3 py-1 text-xs font-medium text-brh-muted sm:inline-flex">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              {dateDuJour()}
            </span>
            <Cloche utilisateurId={utilisateurId} onNaviguer={(l) => {
              const map: Record<string, string> = { activites: 'activite', alertes: 'tableau', semaine: 'semaine', secretariat: 'secretariat', event: 'event', actions: 'actions', tableau: 'tableau' }
              setPageActive(map[l] ?? 'tableau')
            }} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
          {pageActive === 'tableau' ? <DirectionAccueil nom={nom} utilisateurId={utilisateurId} />
            : pageActive === 'semaine' ? <DirectionSemaine />
            : pageActive === 'actions' ? <DirectionActions />
            : pageActive === 'activite' ? <DirectionActivite />
            : pageActive === 'secretariat' ? <DirectionSecretariat utilisateurId={utilisateurId} />
            : pageActive === 'event' ? <DirectionEvenements />
            : pageActive === 'perf' ? <DirectionPerformance />
            : <EnConstruction titre={titrePage} />}
        </main>
      </div>
    </div>
  )
}
