// 💬 Citations & faits — source unique (cadres + direction). Une par semaine.
export type Inspiration = { type: 'citation' | 'fait'; texte: string; source: string }

export const INSPIRATIONS: Inspiration[] = [
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
export function indexSemaine(): number {
  const d = new Date()
  const anneeDebut = d.getMonth() >= 9 ? d.getFullYear() : d.getFullYear() - 1
  const debut = new Date(anneeDebut, 9, 1)
  return Math.max(0, Math.floor((d.getTime() - debut.getTime()) / (7 * 86400000)))
}

export function citationDeLaSemaine(): Inspiration {
  return INSPIRATIONS[indexSemaine() % INSPIRATIONS.length]
}
