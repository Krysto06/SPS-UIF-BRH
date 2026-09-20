import { useState, type ReactNode } from 'react'
import { citationDeLaSemaine } from './citations'

// Police d'affichage — Manrope : géométrique, droite, professionnelle
const serif = { fontFamily: '"Manrope", "Inter", ui-sans-serif, sans-serif' } as const

// ── Repères temporels partagés (date du jour · année fiscale · trimestre) ──
const MOIS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const JOURS_LONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
export const ANNEE_FISCALE = '2026–2027'
export const TRIMESTRE = 'Trimestre 2'
export function dateDuJour(): string {
  const d = new Date()
  return `${JOURS_LONG[d.getDay()]} ${d.getDate()} ${MOIS_LONG[d.getMonth()]} ${d.getFullYear()}`
}

// Bandeau d'en-tête commun à toutes les interfaces (cadre + direction)
export function EnteteInfos() {
  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-brh-border bg-white px-3 py-1 text-xs font-medium text-brh-text shadow-sm">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brh-secondary" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
        <span className="capitalize">{dateDuJour()}</span>
      </span>
      <span className="rounded-full bg-brh-primary/5 px-3 py-1 text-xs font-medium text-brh-primary">Année fiscale {ANNEE_FISCALE}</span>
      <span className="rounded-full bg-brh-secondary/15 px-3 py-1 text-xs font-medium text-brh-primary">{TRIMESTRE}</span>
    </div>
  )
}

// 🏛️ Logo BRH : affiche l'image si elle existe (public/logo-brh.jpg), sinon un écusson « BRH »
export function Logo({ size = 40 }: { size?: number }) {
  const [cassee, setCassee] = useState(false)
  if (cassee) {
    return (
      <div className="flex shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold tracking-wide text-brh-primary shadow-sm" style={{ height: size, width: size, background: 'linear-gradient(135deg,#ffffff,#e9eef5)' }}>BRH</div>
    )
  }
  return (
    <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-sm" style={{ height: size, width: size }}>
      <img src="/logo-brh.jpg" alt="BRH" className="h-full w-full object-contain" onError={() => setCassee(true)} />
    </div>
  )
}

// ── Anneau de performance (dégradé navy → or) ──
export function AnneauPerf({ value, titre, sousTitre }: { value: number; titre: string; sousTitre?: string }) {
  const r = 56, circ = 2 * Math.PI * r, offset = circ * (1 - Math.max(0, Math.min(100, value)) / 100)
  return (
    <div className="flex items-center gap-5 rounded-[22px] border border-brh-border bg-white p-5 shadow-sm">
      <div className="relative shrink-0" style={{ height: 128, width: 128 }}>
        <svg width="128" height="128" viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
          <defs><linearGradient id="anneauGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#12355B" /><stop offset="1" stopColor="#C9A227" /></linearGradient></defs>
          <circle cx="64" cy="64" r={r} fill="none" stroke="#EEF1F7" strokeWidth="12" />
          <circle cx="64" cy="64" r={r} fill="none" stroke="url(#anneauGrad)" strokeWidth="12" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-brh-primary" style={serif}>{value}%</span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-brh-muted">Global</span>
        </div>
      </div>
      <div>
        <h3 className="text-[15px] font-semibold text-brh-text" style={serif}>{titre}</h3>
        {sousTitre && <p className="mt-1 text-xs leading-relaxed text-brh-muted">{sousTitre}</p>}
      </div>
    </div>
  )
}

// ── Hero : salutation + citation élégante (gauche) + emplacement (droite) ──
export function Hero({ salutation, nom, eyebrow, right }: { salutation: string; nom: string; eyebrow?: string; right?: ReactNode }) {
  const c = citationDeLaSemaine()
  return (
    <div className={`grid gap-5 ${right ? 'lg:grid-cols-[1.5fr_1fr]' : ''}`}>
      <div className="relative overflow-hidden rounded-[22px] px-7 py-6 text-white shadow-md" style={{ background: 'linear-gradient(135deg,#12355B,#081A31)' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(520px 260px at 105% -10%, rgba(201,162,39,0.22), transparent 60%)' }} />
        <div className="relative">
          {eyebrow && <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brh-gold-light">{eyebrow}</p>}
          <h1 className="mt-2.5 text-[30px] font-medium leading-tight tracking-tight" style={serif}>{salutation}, {nom}</h1>
          <div className="mt-4 border-t border-white/15 pt-4">
            <p className="max-w-[46ch] text-[15px] italic leading-relaxed text-white/85" style={serif}>« {c.texte} »</p>
            <p className="mt-1.5 text-[11.5px] text-white/50">— {c.type === 'fait' ? 'Le sais-tu ?' : c.source}</p>
          </div>
        </div>
      </div>
      {right}
    </div>
  )
}

const TONES: Record<string, { chip: string; val: string; bar: string }> = {
  navy: { chip: 'bg-brh-primary/10 text-brh-primary', val: 'text-brh-primary', bar: '#12355B' },
  gold: { chip: 'bg-brh-secondary/15 text-brh-secondary', val: 'text-brh-primary', bar: '#C9A227' },
  danger: { chip: 'bg-brh-danger/10 text-brh-danger', val: 'text-brh-danger', bar: '#B4232A' },
  amber: { chip: 'bg-brh-warning/10 text-brh-warning', val: 'text-brh-warning', bar: '#B45309' },
  info: { chip: 'bg-blue-50 text-blue-700', val: 'text-brh-primary', bar: '#1D4ED8' },
  success: { chip: 'bg-brh-success/10 text-brh-success', val: 'text-brh-success', bar: '#1E7A46' },
}

// ── Tuile / KPI premium (icône + grand chiffre + pied optionnel) ──
export function Kpi({ icon, value, label, tone = 'navy', progress }: { icon: ReactNode; value: ReactNode; label: string; tone?: string; progress?: number }) {
  const t = TONES[tone] ?? TONES.navy
  return (
    <div className="rounded-2xl border border-brh-border bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.chip}`}>{icon}</div>
      <p className={`mt-3.5 text-[32px] font-bold leading-none ${t.val}`} style={serif}>{value}</p>
      <p className="mt-1.5 text-[11px] font-medium leading-tight text-brh-muted">{label}</p>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brh-bg"><div className="h-full rounded-full" style={{ width: `${progress}%`, background: t.bar }} /></div>
      )}
    </div>
  )
}

// ── Bandeau citation (pour les pages sans hero) ──
export function BandeauCitation() {
  const c = citationDeLaSemaine()
  return (
    <div className="relative overflow-hidden rounded-2xl px-6 py-5 text-white shadow-md" style={{ background: 'linear-gradient(120deg,#12355B,#081A31)' }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(360px 190px at 100% 0, rgba(201,162,39,0.20), transparent 62%)' }} />
      <div className="relative">
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-brh-gold-light">{c.type === 'fait' ? 'Le sais-tu ?' : 'Citation de la semaine'}</span>
        <p className="mt-2 max-w-3xl text-lg italic leading-snug text-white/95" style={serif}>« {c.texte} »</p>
        {c.type === 'citation' && <p className="mt-1.5 text-xs text-white/60">— {c.source}</p>}
      </div>
    </div>
  )
}

// ── Titre de section (repère doré lumineux + compteur / action) ──
export function TitreSection({ titre, n, action }: { titre: string; n?: number; action?: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center gap-3">
      <span className="h-[2px] w-3.5 rounded-full bg-brh-secondary" style={{ boxShadow: '0 0 0 3px rgba(201,162,39,0.18)' }} />
      <h3 className="text-[17px] font-semibold text-brh-text" style={serif}>{titre}</h3>
      {n !== undefined && <span className="rounded-full border border-brh-border bg-brh-bg px-2 py-0.5 text-[11px] font-medium text-brh-muted">{n}</span>}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  )
}

// ── Avatar carré arrondi avec dégradé (initiales) ──
// `couleur` : impose la couleur d'identité de la personne (prioritaire sur `gold`).
export function Avatar({ nom, gold = false, size = 36, couleur }: { nom: string; gold?: boolean; size?: number; couleur?: string }) {
  const initiales = nom.split(' ').map((m) => m[0]).slice(0, 2).join('').toUpperCase()
  const fond = couleur
    ? { background: `linear-gradient(135deg,${couleur},${couleur}cc)`, color: '#fff' }
    : gold
      ? { background: 'linear-gradient(135deg,#C9A227,#E2C766)', color: '#12355B' }
      : { background: 'linear-gradient(135deg,#12355B,#1d4c7c)', color: '#fff' }
  return (
    <div className="flex shrink-0 items-center justify-center rounded-xl text-[11px] font-bold shadow-sm" style={{ height: size, width: size, ...fond }}>
      {initiales}
    </div>
  )
}
