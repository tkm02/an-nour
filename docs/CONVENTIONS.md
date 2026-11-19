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
