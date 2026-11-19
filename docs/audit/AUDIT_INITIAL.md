# Audit initial — An-Nour site public (extrait)

> Extrait, pour ce dépôt, de l'audit transverse du 2026-11-19 (Phase 1, lecture seule). Audit complet des 4 dépôts :
> dépôt Backend, `docs/audit/AUDIT_INITIAL.md`. Instantané : le suivi vivant est dans `docs/TECH_DEBT.md`.

## 1. Identification
Remote `tkm02/an-nour` · branche d'intégration `mDev` (branches distantes aussi : `master`, `test`) · 30 commits ·
contributeurs : MAMADOU TUO, ym-0-bm · arbre propre au moment de l'audit.

## 2. Stack constatée
Create React App 5.0.1 · React 19.2 · React Router 7.18.5 · axios 1.21 · jspdf 4.2.1 · Cloudinary (upload navigateur) ·
Jest/Testing Library (CRA) · Vercel. Détail : `docs/ARCHITECTURE.md`.

## 3. Baseline
| Commande | Résultat | Durée |
|---|---|---|
| `npm ls --depth=0` | arbre cohérent | 2 s |
| `CI=true npx react-scripts test --watchAll=false --passWithNoTests` | **Échoué** — `Cannot find module 'react-router/dom'` | 19 s |
| `CI=false npm run build` | **Réussi** — 0 avertissement ESLint | 40 s |
| `npm audit --omit=dev` | 63 avis (3 critiques, 36 hauts), tous dans l'outillage CRA | 21 s |

## 4. Constats principaux
- 🔴 Tests inexécutables, échec masqué en CI.
- 🟠 `.env.example` avec valeurs réelles (traité en Phase 2 : marqueurs) ; preset Cloudinary non signé ; CI fragile
  (Node 18, `npm install`, pas de scan de secrets, déploiement même en cas d'échec) ; CRA non maintenu ; parcours
  d'inscription non testé.
- 🟡 Données de santé en `localStorage` à l'abandon ; code mort dans `services/api.js` ; dépendances inutilisées ;
  variables CSS sans rapport avec les couleurs affichées ; `lang="en"`.
- Points positifs : build propre sans avertissement, parcours découpé en étapes lisibles, vérification du reçu
  déléguée à l'API.

Détail et priorités : `docs/TECH_DEBT.md`, `docs/SECURITY.md`, `docs/DESIGN_SYSTEM.md`.
