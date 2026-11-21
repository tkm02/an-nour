# Changelog — An-Nour site public

Toutes les évolutions notables de ce dépôt sont consignées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · versions : [SemVer](https://semver.org/lang/fr/).

## [Non publié]
### Ajouté
- Recensement des membres du CO : formulaire public `/recensement-co` en 3 étapes (identification, vérification /
  saisie, récapitulatif + consentement), API `/api/v1/co/*`, photo facultative compressée dans le navigateur,
  silhouette `IdPhotoPlaceholder`, progression conservée dans l'onglet (`sessionStorage`, sans date de naissance,
  téléphone, santé ni jetons), contact d'aide facultatif `REACT_APP_RECENSEMENT_CONTACT`, et tests (logique pure,
  service, parcours de la page). Aucun lien depuis la page d'accueil.
- CI : Node 22, `npm ci`, scan des secrets gitleaks (`.gitleaks.toml`), audit npm en rapport, contrôles sur `mDev`,
  action Vercel épinglée par SHA, déploiement après le scan et sous l'environnement GitHub `production`.
- Règles de collaboration : `.claude/settings.json` (permissions partagées de l'assistant), modèles de PR et
  d'issues, `CODEOWNERS`, hook pré-commit Husky + lint-staged (ESLint sur les fichiers indexés, gitleaks si installé).
- Agents spécialisés (`.claude/agents/`) et commandes partagées du workflow (`.claude/commands/`).
- Documentation de référence du projet existant : `CLAUDE.md`, `CONTRIBUTING.md`, `CHANGELOG.md` et `docs/`
  (architecture, conventions, fonctionnalités, sécurité, tests, environnements, déploiement, exploitation,
  design system, lignes directrices UX, dette technique, audit initial, ADR, modèles).
- `README.md` : section de présentation du projet (le guide Create React App est conservé).
### Sécurité
- `.env.example` : valeurs réelles (Cloudinary, URL de l'API) remplacées par des marqueurs ; variables documentées.

## [0.1.0] — état au 2026-11-19
Version de `package.json` (`an-nour25`) au moment de la mise en place du cadre de travail (aucun tag Git n'existait).
Fonctionnalités existantes : voir `docs/FEATURES.md`.
