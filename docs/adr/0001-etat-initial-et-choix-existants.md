# ADR 0001 — État initial et choix existants (site public)

- **Statut** : accepté (documentation a posteriori)
- **Date** : 2026-11-19
- **Dépôts concernés** : an-nour (décisions transverses : dépôt Backend, ADR 0001)

## Contexte
Le site public tourne en production avant la mise en place de ce cadre. Cet ADR consigne les choix **déjà faits**,
sans les remettre en cause ; toute évolution passera par un nouvel ADR.

## Décisions constatées
| # | Décision | Conséquences |
|---|---|---|
| 1 | **Create React App** (JavaScript, sans TypeScript) | démarrage rapide ; outillage aujourd'hui non maintenu |
| 2 | **React Router 7** en mode `createBrowserRouter`, 4 routes publiques | incompatibilité avec le Jest de CRA (tests cassés) |
| 3 | Inscription en **5 étapes** avec état conservé en `localStorage` | reprise possible après rechargement ; données sensibles dans le navigateur |
| 4 | **Upload direct vers Cloudinary** avec preset non signé, puis vérification du reçu par l'API (OCR serveur) | pas de transit de l'image par l'API ; preset ouvert au public |
| 5 | PDF de confirmation généré dans le navigateur (jspdf) | aucune donnée stockée côté serveur pour le PDF |
| 6 | **Vercel** déployé par GitHub Actions (`amondnet/vercel-action`) | jeton Vercel dans les secrets GitHub |
| 7 | CSS classique par composant, sans framework UI | identité visuelle propre, différente des autres applications |

## Suivi
`TECH_DEBT.md`, `SECURITY.md`. ADR attendus : migration de l'outillage, upload signé, palette commune.
