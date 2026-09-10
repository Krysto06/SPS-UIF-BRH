import { useState } from 'react'
import { Accueil } from './cadre/Accueil'
import { MaSemaine } from './cadre/MaSemaine'
import { MesActions } from './cadre/MesActions'
import { AttribuerAction } from './admin/AttribuerAction'

type Props = { nom: string; role?: string; utilisateurId?: string; onDeconnexion: () => void }

function Icone({ nom, className = 'h-5 w-5' }: { nom: string; className?: string }) {
  const c = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (nom) {
    case 'tableau': return (<svg {...c}><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>)
    case 'actions': return (<svg {...c}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" /><path d="m9 14 2 2 4-4" /></svg>)
    case 'activites': return (<svg {...c}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></svg>)
    case 'evenements': return (<svg {...c}><path d="M12 2.5l2.7 5.6 6.1.5-4.6 4 1.4 6-5.6-3.3-5.6 3.3 1.4-6-4.6-4 6.1-.5z" /></svg>)
    case 'performance': return (<svg {...c}><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="7" rx="0.5" /><rect x="12" y="7" width="3" height="11" rx="0.5" /><rect x="17" y="4" width="3" height="14" rx="0.5" /></svg>)
    case 'semaine': return (<svg {...c}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>)
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

export function TableauDeBord({ nom, role = "Membre de l'UIF", utilisateurId, onDeconnexion }: Props) {
  const [pageActive, setPageActive] = useState('tableau')
  const [menuOuvert, setMenuOuvert] = useState(false)

  // L'Admin voit une entrée supplémentaire pour attribuer des actions
  const estAdmin = role === 'admin'
  const menu = estAdmin
    ? [...MENU.slice(0, 3), { id: 'attribuer', label: 'Attribuer une action' }, ...MENU.slice(3)]
    : MENU

  const initiales = nom.split(' ').map((m) => m[0]).slice(0, 2).join('').toUpperCase()
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
            <Accueil nom={nom} utilisateurId={utilisateurId} onVoirActions={() => setPageActive('actions')} />
          ) : pageActive === 'attribuer' ? (
            <AttribuerAction />
          ) : pageActive === 'semaine' ? (
            <MaSemaine utilisateurId={utilisateurId} nom={nom} />
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
