# Déploiement — An-Nour site public

## 1. Actuel (`.github/workflows/frontend-ci-cd.yml`)
Déclenché sur push et PR vers `main`/`master` :
```
build-and-test : Node 18 → npm install → tests (continue-on-error) → npm run build (variables REACT_APP_* depuis les secrets)
deploy         : sur push main/master → amondnet/vercel-action@v25 --prod (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
```
Le job `deploy` reconstruit depuis le dépôt via Vercel ; un échec de tests ne bloque pas le déploiement.

## 2. Retour arrière
Vercel → *Deployments* → promouvoir le déploiement précédent, ou `git revert` sur `main`.
Pendant la période d'inscription, privilégier les déploiements hors heures d'affluence et vérifier le parcours
d'inscription complet après chaque mise en production.

## 3. Cible (Phase 6)
```
Push → npm ci → lint → tests (bloquants) → build → scans (gitleaks, npm audit en rapport)
     → Preview (mDev = staging) → validation humaine → Production (main)
```
Node 22, action de déploiement épinglée par SHA (ou intégration Git native de Vercel), CI aussi sur `mDev`.
