// ─────────────────────────────────────────────────────────────
//  Barème d'avancement — SOURCE UNIQUE de vérité
//  Tous les calculs, graphes et affichages de % lisent d'ici.
//  Pour changer un seuil ou un libellé, ne le change QU'ICI.
// ─────────────────────────────────────────────────────────────

export type Etape = { v: number; label: string; desc: string }

export const BAREME: Etape[] = [
  { v: 0, label: 'Pas encore commencée', desc: "rien d'entamé" },
  { v: 25, label: 'Démarrée', desc: 'travail engagé' },
  { v: 50, label: 'Bien avancée', desc: 'à mi-parcours' },
  { v: 75, label: 'Terminée — attente de révision', desc: 'le travail est fait (direction)' },
  { v: 90, label: "Révisée — attente d'approbation", desc: 'validée par la direction (conseil)' },
  { v: 100, label: 'Approuvée', desc: 'approuvée par le conseil' },
]

// Étape correspondant à un pourcentage (la plus haute atteinte)
export function etapeDe(pct: number): Etape {
  let r = BAREME[0]
  for (const b of BAREME) if (pct >= b.v) r = b
  return r
}

// Classes Tailwind pour la pastille d'étape (couleur selon l'avancement)
export function etapeCls(pct: number): string {
  if (pct >= 100) return 'bg-brh-success/10 text-brh-success'
  if (pct >= 90) return 'bg-brh-secondary/15 text-brh-secondary'
  if (pct >= 75) return 'bg-orange-50 text-brh-warning'
  if (pct >= 25) return 'bg-blue-50 text-blue-700'
  return 'bg-gray-100 text-gray-600'
}

// Couleur (hex) d'un pourcentage — pour les barres et chiffres colorés
export function couleurPct(pct: number): string {
  if (pct >= 100) return '#1E7A46' // vert — approuvée
  if (pct >= 90) return '#7C3AED'  // violet — attente d'approbation
  if (pct >= 75) return '#2563EB'  // bleu — attente de révision
  if (pct >= 50) return '#C9A227'  // or — bien avancée
  if (pct >= 25) return '#D97706'  // orange — démarrée
  return '#DC6B6B'                 // rouge doux — pas commencée
}
