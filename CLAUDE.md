# CLAUDE.md — An-Nour site public (inscription)

Constitution du dépôt pour l'IA et les contributeurs. Elle reprend les règles communes du projet An-Nour
(`CLAUDE.md` du dossier de travail parent) et les adapte à ce dépôt. Détails : `docs/`, sans duplication ici.

## 1. Projet
Site public du **Séminaire Islamique et Managérial An-Nour** : page d'accueil (programme, tarifs, FAQ), **inscription
des séminaristes** en 5 étapes (identité, santé, dortoir, paiement avec reçu, confirmation + PDF), inscription des
visiteurs, dépôt d'avis. Public anonyme, aucune authentification. Consomme l'API FastAPI (`ym-0-bm/An-Nour-Backend`).
Vue d'ensemble des 4 dépôts et docs transverses : dépôt Backend, `docs/SYSTEME_GLOBAL.md`.

Stack **réelle** : Create React App (`react-scripts` 5.0.1) · React 19.2 · React Router 7 (`createBrowserRouter`) ·
JavaScript (JSX) · CSS par composant · axios/fetch · Cloudinary (upload navigateur, preset non signé) · jspdf ·
Jest + Testing Library (via CRA) · Vercel.

## 2. Principes
1. **Think before code** — analyser et planifier avant d'implémenter.
2. **One task at a time** — tâches petites et indépendantes.
3. **Single source of truth** — `docs/` fait foi et reste à jour.
4. **Small iterations** — incréments petits et testables.
5. **Test everything** — toute logique nouvelle ou modifiée est testée.
6. **Review everything** — aucun code généré accepté sans relecture.
7. **Security first** — dès la conception.
8. **Keep it simple** — la solution la plus simple qui fonctionne.
9. **Git everywhere** — un commit atomique et explicite par évolution cohérente.
10. **Production mindset** — monitoring, sauvegardes, rollback dès la conception.
- **Boy scout rule** : laisser le code un peu plus propre, *uniquement dans le périmètre de la tâche*.
- **Pas de refonte cachée** : toute refactorisation significative = tâche et PR séparées.

## 3. Commandes essentielles
```bash
npm ci                                   # installation stricte (lockfile)
cp .env.example .env                     # REACT_APP_API_URL=http://localhost:8000 (sans /api/v1)
npm start                                # http://localhost:3000
CI=true npx react-scripts test --watchAll=false   # tests (suite actuellement cassée : docs/TESTING.md)
npm run build                            # build de production (ESLint CRA inclus) → build/
```

## 4. Carte du code — « pour X, regarde dans Y »
| Pour… | Regarde dans… |
|---|---|
| Routes (`/`, `/inscription`, `/visiteurs`, `/avis`) | `src/index.js` |
| Page d'accueil | `src/pages/LandingPage.jsx`, `src/components/Landing/` (Hero, Programme, Tarifs, FAQ) |
| Parcours d'inscription | `src/pages/RegistrationPage.jsx`, `src/components/Registration/Step*.jsx`, `Stepper.jsx` |
| Reçu de paiement (upload, vérification) | `src/components/Registration/StepPayment.jsx`, `src/utils/cloudinaryUpload.js` |
| PDF de confirmation | `src/components/PDFGenerator.jsx` |
| Visiteurs, avis | `src/pages/VisitorRegistrationPage.jsx`, `FeedbackPage.jsx`, `src/services/api.js` |
| CI/CD | `.github/workflows/frontend-ci-cd.yml` (build + déploiement Vercel) |

## 5. Conventions
Voir `docs/CONVENTIONS.md`, `docs/DESIGN_SYSTEM.md`, `docs/UX_GUIDELINES.md`. En bref : composants `PascalCase.jsx` +
un CSS par composant, appels à l'API avec le préfixe `/api/v1`, textes en français.

## 6. Zones sensibles (validation humaine obligatoire avant modification)
- `src/components/Registration/StepPayment.jsx`, `src/utils/cloudinaryUpload.js` (paiement, reçus, upload public).
- `src/components/Registration/StepHealthInfo.jsx` et toute donnée de santé collectée.
- `.env.example`, `package.json`/`package-lock.json`, `.github/workflows/*` (déploiement production).

## 7. Sécurité non négociable (détail : `docs/SECURITY.md`)
- Aucun secret dans le code ni dans `REACT_APP_*` (publiques). Ne **jamais** lire les fichiers `.env*` réels.
  Un secret exposé doit être révoqué/renouvelé : le retirer du dépôt ne suffit pas.
- Site public : toute validation côté navigateur est un confort ; la validation qui compte est celle de l'API.
- Minimiser les données personnelles et de santé conservées dans le navigateur (`localStorage`) et les effacer
  dès qu'elles ne sont plus utiles ; aucun `console.log` de données ; données **fictives** dans les tests.

## 8. Règles Git
- Branches : `main` = production (déploiement Vercel par le CI) ; `mDev` = intégration ; `feature/<id>-<nom>`,
  `fix/…`, `hotfix/…`, `chore/…` créées depuis `mDev`.
- **Conventional Commits** à partir de maintenant : `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`,
  `security:`, `ci:` (historique non réécrit).
- Les commits sont faits avec l'identité Git du contributeur ; l'IA n'ajoute **aucune** ligne d'attribution.
- Pas de push direct sur `main` : PR + 1 relecture humaine + CI verte. Commit, push, merge et déploiement
  uniquement sur demande explicite.

## 9. Interdits
Secrets en dur · code de debug commité · désactiver un test, `continue-on-error` ou une règle ESLint pour « faire
passer » · dépendance sans justification · refactorisation hors périmètre · plusieurs fonctionnalités dans un commit.

## 10. Workflow d'une évolution
```
1. /plan → ✋ validation   2. /design → ✋ validation   3. branche feature/<id>-<nom> depuis mDev
4. tests de caractérisation   5. /implement (1 tâche = 1 commit + tests)   6. /test   7. /review
8. /ux-review   9. corrections (retour à 5 si 🔴/🟠 introduit)   10. /document puis /ship → PR vers mDev
```
Une fonctionnalité n'est terminée qu'après validation du parcours interface → API → réponse → affichage (erreurs,
doublons, limites, rechargement compris). Rapport final distinguant **Réussi / Échoué / Non exécuté / À valider
manuellement**. Ordre des chantiers : `CLAUDE.md` du dossier parent.

Commandes (`.claude/commands/`) et agents (`.claude/agents/`) : `/plan` → `architect` · `/design` → `ui-designer` ·
`/implement` → `developer` · `/fix` → `qa` puis `developer` · `/test` → `qa` · `/review` → `code-reviewer` +
`security-reviewer` · `/ux-review [global]` → `ux-reviewer` · `/onboard`, `/document`, `/ship`, `/adr` : session
principale. Chaque ✋ est un arrêt jusqu'à validation explicite.

## 11. Documentation
`docs/ARCHITECTURE.md` · `CONVENTIONS.md` · `FEATURES.md` · `SECURITY.md` · `TESTING.md` · `ENVIRONMENTS.md` ·
`DEPLOYMENT.md` · `OPERATIONS.md` · `DESIGN_SYSTEM.md` · `UX_GUIDELINES.md` · `TECH_DEBT.md` · `audit/` · `adr/` ·
`features/` · `reviews/`.
