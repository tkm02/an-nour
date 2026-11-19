# Tests — An-Nour site public

## 1. Existant
| Type | Outil | Où | État |
|---|---|---|---|
| Unitaires / composants | Jest + Testing Library (via `react-scripts test`) | `src/**/*.test.js` | suite exécutable (P-01) : test de fumée du routage (`src/App.test.js`) |
| Lint | ESLint `react-app` (exécuté par `npm run build`) | — | 0 avertissement |
| Build | `react-scripts build` | — | OK |
| CI | `frontend-ci-cd.yml` : `npm test -- --watchAll=false` | — | bloquant (déploiement conditionné) |

## 2. Baseline (2026-11-19, Node 22.20 local ; le CI utilisait Node 18, passé en Node 22 en Phase 6)
| Commande | Résultat | Durée |
|---|---|---|
| `npm ls --depth=0` | arbre cohérent | 2 s |
| `CI=true npx react-scripts test --watchAll=false --passWithNoTests` | **Échoué** — `Cannot find module 'react-router/dom' from 'node_modules/react-router-dom/dist/index.js'` (Jest de CRA ne résout pas les exports de React Router 7) ; 0 test exécuté | 19 s |
| `CI=false npm run build` | **Réussi** — « Compiled successfully » | 40 s |
| `npm audit --omit=dev` | 63 vulnérabilités (3 critiques, 36 hautes, 13 modérées, 11 basses) dans l'outillage CRA ; aucune sur `axios` 1.21, `react-router` 7.18.5, `jspdf` 4.2.1 | 21 s |

Vague 1 de dette (2026-11-19, P-01) : `jest.moduleNameMapper` (`package.json`) fait pointer `react-router/dom` vers
son build CommonJS (Jest 27 de CRA ignore le champ `exports`) et `src/setupTests.js` expose `TextEncoder`/`TextDecoder`
de Node (absents de jsdom). Résultats après correction : section 5.

## 3. Plan de rattrapage
1. ~~Rendre la suite exécutable et remplacer le test gabarit~~ (fait, P-01).
2. ~~Retirer `continue-on-error` du CI~~ (fait, P-01).
3. Tests prioritaires : validation de chaque étape d'inscription, construction de la charge envoyée à
   `POST /api/v1/registrations`, gestion des erreurs de l'API (reçu rejeté, inscriptions closes, 429).
4. E2E (ADR) : parcours d'inscription complet contre une API de test, visiteurs, avis.
5. Couverture : mesurer, puis « pas de baisse » et 80 % sur le nouveau code.

## 4. Intégration continue (ADR 0002 du dépôt Backend — étape 1)
| Contrôle | Mode |
|---|---|
| Tests Jest (`react-scripts test`) | **bloquant** (P-01, vague 1) |
| Build (`react-scripts build`, ESLint inclus, avertissements = erreurs car `CI=true`) | bloquant |
| gitleaks diff / historique | bloquant / rapport |
| `npm audit --omit=dev` | rapport (63 vulnérabilités d'outillage CRA en baseline) |
Vérifié en local le 2026-11-19 : `npm ci` + `CI=true npm run build` sous Node 22 → Réussi.

## 5. Résultats après la vague 1 de dette (2026-11-19, Node 22.20 local)
| Commande | Résultat |
|---|---|
| `CI=true npx react-scripts test --watchAll=false` | **Réussi** — 1 suite, 1 test (fumée du routage) après P-01 |
| `CI=true npm run build` | **Réussi** — « Compiled successfully » |
