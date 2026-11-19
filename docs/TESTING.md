# Tests — An-Nour site public

## 1. Existant
| Type | Outil | Où | État |
|---|---|---|---|
| Unitaires / composants | Jest + Testing Library (via `react-scripts test`) | `src/App.test.js` | 1 test, gabarit CRA (« learn react ») sans rapport avec l'application |
| Lint | ESLint `react-app` (exécuté par `npm run build`) | — | 0 avertissement |
| Build | `react-scripts build` | — | OK |
| CI | `frontend-ci-cd.yml` : `npm test -- --watchAll=false --passWithNoTests` en `continue-on-error` | — | échec masqué |

## 2. Baseline (2026-11-19, Node 22.20 local ; le CI utilisait Node 18, passé en Node 22 en Phase 6)
| Commande | Résultat | Durée |
|---|---|---|
| `npm ls --depth=0` | arbre cohérent | 2 s |
| `CI=true npx react-scripts test --watchAll=false --passWithNoTests` | **Échoué** — `Cannot find module 'react-router/dom' from 'node_modules/react-router-dom/dist/index.js'` (Jest de CRA ne résout pas les exports de React Router 7) ; 0 test exécuté | 19 s |
| `CI=false npm run build` | **Réussi** — « Compiled successfully » | 40 s |
| `npm audit --omit=dev` | 63 vulnérabilités (3 critiques, 36 hautes, 13 modérées, 11 basses) dans l'outillage CRA ; aucune sur `axios` 1.21, `react-router` 7.18.5, `jspdf` 4.2.1 | 21 s |

## 3. Plan de rattrapage
1. Rendre la suite exécutable (configuration Jest `moduleNameMapper` pour React Router 7, ou migration de l'outillage
   — ADR) et remplacer le test gabarit par un test de rendu réel.
2. Retirer `continue-on-error` du CI une fois la suite verte.
3. Tests prioritaires : validation de chaque étape d'inscription, construction de la charge envoyée à
   `POST /api/v1/registrations`, gestion des erreurs de l'API (reçu rejeté, inscriptions closes, 429).
4. E2E (ADR) : parcours d'inscription complet contre une API de test, visiteurs, avis.
5. Couverture : mesurer, puis « pas de baisse » et 80 % sur le nouveau code.

## 4. Intégration continue (ADR 0002 du dépôt Backend — étape 1)
| Contrôle | Mode |
|---|---|
| Tests Jest (`react-scripts test`) | **rapport** tant que la suite est cassée (P-01) — jamais présentés comme réussis |
| Build (`react-scripts build`, ESLint inclus, avertissements = erreurs car `CI=true`) | bloquant |
| gitleaks diff / historique | bloquant / rapport |
| `npm audit --omit=dev` | rapport (63 vulnérabilités d'outillage CRA en baseline) |
Vérifié en local le 2026-11-19 : `npm ci` + `CI=true npm run build` sous Node 22 → Réussi.
