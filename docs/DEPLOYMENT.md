# Déploiement — An-Nour site public

## 1. Actuel (`.github/workflows/frontend-ci-cd.yml`, ADR 0002 du dépôt Backend)
Déclenché sur push et PR vers `main`/`master` **et `mDev`** ; jeton GitHub en lecture seule :
```
build-and-test : Node 22 → npm ci → tests (bloquants) → npm run build (variables REACT_APP_* depuis
                 les secrets ; en CI, un avertissement ESLint fait échouer le build) → npm audit (rapport)
security       : gitleaks (diff bloquant, historique en rapport, .gitleaks.toml)
deploy         : sur push main/master, après build-and-test ET security, environnement GitHub « production »
                 → amondnet/vercel-action épinglée par SHA (v25) --prod (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
```
Un échec des tests ou un secret introduit bloque le déploiement.
Validation humaine : activer **Required reviewers** sur l'environnement GitHub `production`.

## 2. Retour arrière
Vercel → *Deployments* → promouvoir le déploiement précédent, ou `git revert` sur `main`.
Pendant la période d'inscription, privilégier les déploiements hors heures d'affluence et vérifier le parcours
d'inscription complet après chaque mise en production.

## 3. Cible (Phase 6)
```
Push → npm ci → lint → tests (bloquants) → build → scans (gitleaks, npm audit en rapport)
     → Preview (mDev = staging) → validation humaine → Production (main)
```
- **Fait (étape 1)** : Node 22, `npm ci`, gitleaks, action épinglée par SHA, CI sur `mDev`, environnement `production`.
- **Actions manuelles** : *Required reviewers* sur `production` ; staging = prévisualisation Vercel de `mDev`
  (vérifier qu'il n'y a pas en plus un déploiement par l'intégration Git de Vercel, qui doublerait celui du CI).
- **Étape 2** : e2e du parcours d'inscription (ADR), tags SemVer.
