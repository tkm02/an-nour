# Changelog — An-Nour site public

Toutes les évolutions notables de ce dépôt sont consignées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · versions : [SemVer](https://semver.org/lang/fr/).

## [Non publié]
### Corrigé
- Tests (P-01) : suite Jest exécutable (`moduleNameMapper` pour `react-router/dom`, `TextEncoder` fourni en test),
  test gabarit CRA remplacé par un test de fumée du routage ; tests bloquants en CI (`continue-on-error` retiré).
- Sécurité (P-16) : l'étape Paiement ne journalise plus en console la charge d'inscription (identité, santé), la
  réponse de l'API ni les erreurs axios qui les contiennent.
### Ajouté
- Sécurité du cadre (revues du 2026-11-19) : hook `PreToolUse` de protection des secrets, permissions de l'assistant
  resserrées (`git branch`, `git diff --no-index`, exports, réécritures), CI durcie (SHA-256 de gitleaks épinglé,
  `persist-credentials: false`, expressions via `env:`, repli si le commit précédent est introuvable).
- Script `prepare` tolérant (`.husky/install.mjs`) : ignoré en CI, en production et sans devDependencies.
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
