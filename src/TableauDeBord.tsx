import { useState } from 'react'
import { Accueil } from './cadre/Accueil'
import { MaSemaine } from './cadre/MaSemaine'
import { MesActions } from './cadre/MesActions'
import { Alertes } from './cadre/Alertes'
import { Activite } from './cadre/Activite'
import { EvenementsCadre } from './cadre/EvenementsCadre'
import { PerformanceCadre } from './cadre/PerformanceCadre'
import { SecretariatSecretaire } from './secretaire/SecretariatSecretaire'
import { Documentation } from './commun/Documentation'
import { Cloche } from './Notifications'
import { Logo, EnteteInfos } from './ui'
import { useNotifsSections } from './useNotifs'

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
    case 'alertes': return (<svg {...c}><path d="M10.3 3.5 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>)
    case 'secretariat': return (<svg {...c}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h4" /></svg>)
    case 'documentation': return (<svg {...c}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>)
    default: return null
  }
}

// Menu selon le rôle
const MENU_CADRE = [
  { id: 'tableau', label: 'Tableau de bord' },
  { id: 'semaine', label: 'Ma semaine' },
  { id: 'actions', label: 'Mes actions du trimestre' },
  { id: 'alertes', label: 'Alertes' },
  { id: 'activites', label: 'Activité' },
  { id: 'evenements', label: "Événement de l'UIF" },
  { id: 'performance', label: "Performance de l'UIF" },
  { id: 'documentation', label: 'Documentation' },
]
const MENU_SECRETAIRE = [
  { id: 'tableau', label: 'Tableau de bord' },
  { id: 'semaine', label: 'Ma semaine' },
  { id: 'actions', label: 'Mes actions du trimestre' },
  { id: 'alertes', label: 'Alertes' },
  { id: 'activites', label: 'Activité' },
  { id: 'evenements', label: "Événement de l'UIF" },
  { id: 'secretariat', label: 'Secrétariat' },
  { id: 'documentation', label: 'Documentation' },
]

// Correspondance section → liens de notification (pour la pastille sur la partie)
const LIENS: Record<string, string[]> = {
  semaine: ['semaine'], actions: ['actions'], alertes: ['alertes'], activites: ['activites'],
  evenements: ['event'], secretariat: ['secretariat'], documentation: ['documentation'],
}

export function TableauDeBord({ nom, role = "Membre de l'UIF", utilisateurId, onDeconnexion }: Props) {
  const [pageActive, setPageActive] = useState('tableau')
  const [menuOuvert, setMenuOuvert] = useState(false)
  const { parLien, marquerLu } = useNotifsSections(utilisateurId)

  const estSecretaire = role === 'secretaire'
  const menu = estSecretaire ? MENU_SECRETAIRE : MENU_CADRE
  const roleLabel = estSecretaire ? 'Secrétaire' : role

  const initiales = nom.split(' ').map((m) => m[0]).slice(0, 2).join('').toUpperCase()
  const titrePage = menu.find((m) => m.id === pageActive)?.label ?? ''

  function ouvrirSection(id: string) {
    setPageActive(id); setMenuOuvert(false)
    if (LIENS[id]) marquerLu(LIENS[id])
  }
  function badge(id: string) { return (LIENS[id] ?? []).reduce((s, l) => s + (parLien[l] ?? 0), 0) }

  return (
    <div className="min-h-screen bg-brh-bg lg:flex">
      {menuOuvert && (<div onClick={() => setMenuOuvert(false)} className="fixed inset-0 z-30 bg-black/40 lg:hidden" />)}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-gradient-to-b from-brh-primary to-brh-deep text-white transition-transform duration-300 lg:static lg:translate-x-0 ${menuOuvert ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
          <Logo />
          <div className="leading-tight">
            <p className="text-sm font-bold">SPS-UIF</p>
            <p className="whitespace-nowrap text-[10px] text-white/50">Banque de la République d'Haïti</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menu.map((m) => {
            const actif = m.id === pageActive
            const n = badge(m.id)
            return (
              <button key={m.id} onClick={() => ouvrirSection(m.id)}
                className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${actif ? 'bg-white/10 font-semibold text-white' : 'font-medium text-white/60 hover:bg-white/5 hover:text-white'}`}>
                {actif && <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brh-gold-light" />}
                <Icone nom={m.id} className="h-5 w-5 shrink-0" />
                <span className="flex-1 text-left">{m.label}</span>
                {n > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brh-danger px-1.5 text-[10px] font-bold text-white">{n}</span>}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-brh-primary shadow-sm" style={{ background: 'linear-gradient(135deg,#C9A227,#E2C766)' }}>{initiales}</div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">{nom}</p>
              <p className="truncate text-[11px] text-white/50">{roleLabel}</p>
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
          <div className="flex items-center gap-2">
            <EnteteInfos />
            <Cloche utilisateurId={utilisateurId} onNaviguer={(l) => ouvrirSection(l === 'event' ? 'evenements' : l)} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
          {pageActive === 'tableau' ? (
            <Accueil nom={nom} utilisateurId={utilisateurId} onVoirActions={() => ouvrirSection('actions')} />
          ) : pageActive === 'semaine' ? (
            <MaSemaine utilisateurId={utilisateurId} nom={nom} />
          ) : pageActive === 'actions' ? (
            <MesActions utilisateurId={utilisateurId} />
          ) : pageActive === 'alertes' ? (
            <Alertes utilisateurId={utilisateurId} />
          ) : pageActive === 'activites' ? (
            <Activite utilisateurId={utilisateurId} />
          ) : pageActive === 'evenements' ? (
            <EvenementsCadre utilisateurId={utilisateurId} />
          ) : pageActive === 'performance' ? (
            <PerformanceCadre />
          ) : pageActive === 'secretariat' ? (
            <SecretariatSecretaire utilisateurId={utilisateurId} />
          ) : pageActive === 'documentation' ? (
            <Documentation utilisateurId={utilisateurId} />
          ) : null}
        </main>
      </div>
    </div>
  )
}
