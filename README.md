# SPS-UIF — Système de Pilotage Stratégique de l'Unité d'Inclusion Financière

Plateforme numérique interne de la **Banque de la République d'Haïti (BRH)** destinée au
suivi stratégique, à la gestion de la performance, à la coordination des activités et à la
production de rapports de l'Unité d'Inclusion Financière.

> Ce dépôt sert de **copie de référence** au projet développé pas à pas. À chaque grande
> étape, une version qui fonctionne y est sauvegardée pour servir de filet de sécurité.

## Technologies

- **React + TypeScript** — interface
- **Vite** — moteur de développement
- **Tailwind CSS v4** — mise en forme (thème BRH)
- **Supabase** — base de données, authentification, stockage (à venir)
- **Recharts** — graphiques (à venir)
- **jsPDF** — export PDF des rapports (à venir)

## Palette officielle BRH

| Usage | Couleur | Code |
|-------|---------|------|
| Primaire | Bleu marine | `#1a365d` |
| Secondaire | Or | `#b8860b` |
| Fond | Gris clair | `#f7fafc` |
| Surface | Blanc | `#ffffff` |
| Texte | Gris foncé | `#2d3748` |
| Succès | Vert | `#276749` |
| Alerte | Rouge | `#9b2c2c` |
| Avertissement | Orange | `#c05621` |

## Démarrer en local

```bash
npm install
npm run dev
```

## Avancement

- [x] **Étape 0** — Fondations : projet Vite + React + TS + Tailwind + thème BRH
- [ ] **Étape 1** — Base de données Supabase (7 tables + sécurité RLS)
- [ ] **Étape 2** — Authentification et rôles (cadre, directrice, admin)
- [ ] **Étape 3** — Actions trimestrielles, scores et alertes
- [ ] **Étape 4** — Tableaux de bord et graphiques
- [ ] **Étape 5** — Contribution stratégique (SNIF / PNEF / Plan BRH)
- [ ] **Étape 6** — Activités externes et rapports PDF
- [ ] **Étape 7** — Finitions (responsive, validation, historique)
