# Changelog — An-Nour site public

Toutes les évolutions notables de ce dépôt sont consignées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · versions : [SemVer](https://semver.org/lang/fr/).

## [Non publié]
### Modifié
- Recensement CO (branche `feature/co-qualites-par-commission`, 2026-11-24) : surtitre « Séminaire An-Nour 8.0 —
  An-Nour 2026 » agrandi ; qualités proposées selon la commission (`qualites_par_commission` de l'API : Comité
  Managérial → Manager Général / Manager Général Adjoint ; Secrétaire Régional, Président de Sous-Comité,
  Superviseur → champ « Qualité » masqué, `qualite: null` envoyé, ligne absente du récapitulatif) ; qualité remise à
  choisir quand la commission change ; sur grand écran, libellés, aides, champs et erreurs alignés d'une colonne à
  l'autre (CSS `subgrid`, plus de décalage Commission / Qualité). **Nécessite le backend
  `feature/co-qualites-par-commission` déployé AVANT ce site.**

### Sécurité
- Recensement CO (branche `fix/recensement-co-securite`, revue du 2026-11-23) : le champ piège anti-robot rempli à
  l'étape 1 est transmis à l'identification du parcours « non » (il partait toujours vide) ; santé non réaffichée
  par l'API au-delà de 3 lectures (`sante_masquee`) expliquée à l'étape 2 et au récapitulatif.
  **Nécessite le backend `fix/recensement-co-securite` (et la PR #9) déployé AVANT ce site** : le site n'envoie plus
  `date_naissance`, exigée par les versions antérieures de l'API.

### Corrigé
- Tests (P-01) : suite Jest exécutable (`moduleNameMapper` pour `react-router/dom`, `TextEncoder` fourni en test),
  test gabarit CRA remplacé par un test de fumée du routage ; tests bloquants en CI (`continue-on-error` retiré).
- Sécurité (P-16) : l'étape Paiement ne journalise plus en console la charge d'inscription (identité, santé), la
  réponse de l'API ni les erreurs axios qui les contiennent.
- Paiement (P-17) : une erreur de validation 422 (`detail` tableau) ou une erreur réseau à l'envoi final est
  traduite en message lisible en français (`src/utils/apiErrors.js`) au lieu d'être rendue telle quelle.
- Paiement (P-23) : l'échec de l'envoi final de l'inscription est affiché quel que soit l'état de l'étape, avec un
  bouton « Réessayer » qui relance l'envoi sans redemander de paiement.
- Accessibilité (P-25) : cartes dortoir, étoiles et échelle de la page Avis utilisables au clavier (radios natifs
  nommés, masqués visuellement) ; champ du reçu atteignable au clavier ; contour de focus visible.
- Configuration (P-19) : URL de l'API lue par un module unique (`src/config.js`) ; plus de repli silencieux sur l'API
  de production : erreur explicite si `REACT_APP_API_URL` manque au build de production, repli sur
  `http://localhost:8000` en développement et en test. Journal de l'URL au chargement de l'étape Dortoir retiré.
- Recensement CO : passer de « Oui » à « Non » après une erreur du serveur ne bloque plus « Continuer » ; focus et
  annonce de l'alerte « fiche déjà validée » dans le parcours « non » ; « Retour » inactif pendant la vérification ;
  saisie conservée en changeant de réponse (Oui ↔ Non) ; message « déjà envoyée » dans le parcours « non » ;
  libellés (« l'an passé », « Complétez votre fiche », exemple de téléphone, texte alternatif « avatar ») ; une
  ancienne sauvegarde « Nouveau membre / aucune » est reprise comme la réponse « Non ».
- Manifeste PWA : icônes `logo192.png` / `logo512.png` absentes (erreur « Download error or resource isn't a valid
  image ») — icônes carrées générées depuis `ANNOUR_LOGO.png`, entrée `image/x-icon` erronée retirée.

### Modifié
- Recensement CO (branche `fix/recensement-co-retours`) : l'étape 1 commence par « Étiez-vous membre du comité
  d'organisation l'an passé ? » — oui : nom, prénoms, téléphone et commission de l'an passé (option « Nouveau
  membre / aucune » retirée) pour retrouver la fiche ; non : fiche vide, l'identification est envoyée au passage au
  récapitulatif. Champ date de naissance retiré (identification, fiche, récapitulatif).
- Recensement CO : photo par défaut = avatars `avatar-homme-transparent.png` / `avatar-femme-transparent.png`
  (`public/`) au lieu des silhouettes dessinées (silhouette neutre conservée sans sexe choisi) ; mention « Il servira
  à créer votre compte… » retirée de l'aide du champ e-mail.

### Ajouté
- Recensement des membres du CO : formulaire public `/recensement-co` en 3 étapes (identification, vérification /
  saisie, récapitulatif + consentement), API `/api/v1/co/*`, photo facultative compressée dans le navigateur,
  silhouette `IdPhotoPlaceholder`, progression conservée dans l'onglet (`sessionStorage`, sans date de naissance,
  téléphone, santé ni jetons), contact d'aide facultatif `REACT_APP_RECENSEMENT_CONTACT`, et tests (logique pure,
  service, parcours de la page). Aucun lien depuis la page d'accueil.
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
