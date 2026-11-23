# Conventions — An-Nour site public

## 1. Conventions observées (état au 2026-11-19)
- **Fichiers** : composants `PascalCase.jsx`, chacun avec son CSS (`Hero.jsx` + `Hero.css`) ; pages dans `src/pages/`,
  composants par section dans `src/components/<Section>/`.
- **Style** : CSS classique par composant, couleurs en dur (pas de variables globales), polices Google Fonts
  (Plus Jakarta Sans, Inter, Playfair Display).
- **Réseau** : mélange de `fetch` direct dans les composants (`StepDormitory`, `StepPayment`) et de `services/api.js`.
- **État** : `useState` local + `localStorage` pour conserver l'inscription entre les étapes.
- **Langue** : interface en français ; `lang="en"` dans `public/index.html`.
- **Qualité** : ESLint CRA (`react-app`) au build : 0 avertissement ; un seul test (gabarit CRA).
- **Commits** : messages courts sans convention (`visiteur`, `avis`, `eng->fr`).

## 2. Règles cibles (nouveau code et code modifié)
1. Appels réseau dans `src/services/api.js`, toujours avec le préfixe `/api/v1`, erreurs traduites en messages
   français.
2. Couleurs via variables CSS (`:root` de `src/index.css`) issues de `DESIGN_SYSTEM.md` ; pas de nouvelle couleur en
   dur.
3. Validation des champs côté client alignée sur les schémas de l'API (mêmes longueurs, formats).
4. Données personnelles/santé : ne stocker en `localStorage` que le nécessaire, et l'effacer à la fin ou à l'abandon.
5. Tests (Jest + Testing Library) pour toute logique nouvelle ou modifiée.
6. Dépendances : pas de nouvelle dépendance sans usage réel ; outils de test en `devDependencies`.
7. Commits : Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `security:`, `ci:`).

## 3. Choix propres au recensement du CO (`/recensement-co`, 2026-11)
- **Service dédié** `src/services/recensementCo.js` (et non `services/api.js`) : appels `fetch` vers `/api/v1/co/*`,
  erreurs typées (`ErreurApi`), délai de 90 s (API en veille). L'URL de l'API est résolue **à l'appel**, **sans URL
  de repli** en production et **HTTPS obligatoire** en production (erreur de configuration explicite, limitée à ce
  formulaire). À rapprocher de `src/config.js` (P-19, branche `fix/dette-technique-vague-1`) une fois fusionnée.
- **Styles mutualisés** dans `src/pages/RecensementCoPage.css` : variables `--rco-*` portées par `.rco-page` (palette
  puis alias sémantiques) et classes partagées du formulaire (`.rco-champ*`, `.rco-bouton*`, `.rco-alerte*`)
  utilisées par toutes les étapes (`components/RecensementCo/Step*.jsx`, `Champ.jsx`), qui n'ont donc pas de CSS
  propre ; seuls les composants réutilisables ou spécifiques (`CoStepper`, `PhotoField`, `IdPhotoPlaceholder`) ont
  leur fichier CSS. Écart assumé à la règle « un CSS par composant ».
- **Progression** dans `sessionStorage` (onglet), jamais téléphone, santé ni jetons (la date de naissance n'est plus
  demandée depuis le 2026-11-22). La réponse « membre du CO l'an passé ? » (`ancien_membre`) choisit le parcours et
  n'est jamais envoyée à l'API.
