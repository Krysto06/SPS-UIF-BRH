import type { ReactNode } from 'react'
import { citationDeLaSemaine } from './citations'

const serif = { fontFamily: '"Fraunces", Georgia, "Times New Roman", serif' } as const

// ✨ Bandeau citation premium (dégradé navy + souffle d'or, texte Fraunces italique)
export function BandeauCitation() {
  const i = citationDeLaSemaine()
  return (
    <div className="relative overflow-hidden rounded-2xl px-6 py-5 text-white shadow-md" style={{ background: 'linear-gradient(120deg,#12355B,#0B2545)' }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(360px 190px at 100% 0, rgba(201,162,39,0.20), transparent 62%)' }} />
      <div className="relative">
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-brh-gold-light">{i.type === 'fait' ? 'Le sais-tu ?' : 'Citation de la semaine'}</span>
        <p className="mt-2 max-w-3xl text-lg italic leading-snug text-white/95" style={serif}>« {i.texte} »</p>
        {i.type === 'citation' && <p className="mt-1.5 text-xs text-white/60">— {i.source}</p>}
      </div>
    </div>
  )
}

const TONES: Record<string, { chip: string; val: string }> = {
  navy: { chip: 'bg-brh-primary/10 text-brh-primary', val: 'text-brh-primary' },
  gold: { chip: 'bg-brh-secondary/15 text-brh-secondary', val: 'text-brh-primary' },
  danger: { chip: 'bg-brh-danger/10 text-brh-danger', val: 'text-brh-danger' },
  amber: { chip: 'bg-brh-warning/10 text-brh-warning', val: 'text-brh-warning' },
  info: { chip: 'bg-blue-50 text-blue-700', val: 'text-brh-primary' },
  success: { chip: 'bg-brh-success/10 text-brh-success', val: 'text-brh-success' },
}

// 📊 Carte KPI premium (icône colorée + grand chiffre Fraunces + effet de survol)
export function Kpi({ icon, value, label, tone = 'navy' }: { icon: ReactNode; value: ReactNode; label: string; tone?: string }) {
  const t = TONES[tone] ?? TONES.navy
  return (
    <div className="rounded-2xl border border-brh-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.chip}`}>{icon}</div>
      <p className={`mt-3 text-3xl font-bold leading-none ${t.val}`} style={serif}>{value}</p>
      <p className="mt-1.5 text-[11px] font-medium leading-tight text-brh-muted">{label}</p>
    </div>
  )
}

// 🏷️ Titre de section (repère doré + Fraunces + compteur optionnel)
export function TitreSection({ titre, n }: { titre: string; n?: number }) {
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <span className="h-4 w-1 rounded-full bg-brh-secondary" />
      <h3 className="text-base font-semibold text-brh-primary" style={serif}>{titre}</h3>
      {n !== undefined && <span className="rounded-full border border-brh-border bg-brh-bg px-2 py-0.5 text-[11px] font-medium text-brh-muted">{n}</span>}
    </div>
  )
}

// 👤 Avatar rond avec dégradé (initiales)
export function Avatar({ nom, gold = false }: { nom: string; gold?: boolean }) {
  const initiales = nom.split(' ').map((m) => m[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold shadow-sm"
      style={gold ? { background: 'linear-gradient(135deg,#C9A227,#E2C766)', color: '#12355B' } : { background: 'linear-gradient(135deg,#12355B,#1b4a7a)', color: '#fff' }}>
      {initiales}
    </div>
  )
}
