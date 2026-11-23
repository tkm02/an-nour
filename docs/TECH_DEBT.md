# Dette technique — An-Nour site public

> Registre priorisé. Source : audit du 2026-11-19 (`audit/AUDIT_INITIAL.md`) puis rapports des reviewers.
> Les constats préexistants relevés pendant une PR sont ajoutés ici et ne bloquent pas la PR.
> Sévérité : 🔴 Bloquant · 🟠 Important · 🟡 Mineur.

| ID | Sévérité | Constat | Emplacement | Piste | Statut |
|---|---|---|---|---|---|
| P-01 | 🔴 | Suite de tests inexécutable (`Cannot find module 'react-router/dom'`) et masquée par `continue-on-error` ; seul test = gabarit CRA | `src/App.test.js`, CI | `TESTING.md` §3 | ouvert |
| P-02 | 🟠 | Outillage Create React App non maintenu ; 63 avis npm dans l'outillage | `react-scripts` | ADR de migration (ex. Vite) | ouvert |
| P-03 | 🟠 | Upload de reçus non signé vers Cloudinary | `src/utils/cloudinaryUpload.js` | restreindre le preset ; upload via l'API à terme | ouvert |
| P-04 | 🟠 | CI : Node 18, `npm install`, pas de lint ni de scan de secrets, action de déploiement tierce non épinglée, déploiement même si les tests échouent | `.github/workflows/frontend-ci-cd.yml` | Phase 6 | **partiellement résolu** : Node 22, `npm ci`, gitleaks, action épinglée, déploiement après scan ; reste les tests en rapport (P-01) |
| P-05 | 🟠 | Parcours d'inscription (paiement compris) sans aucun test | `src/components/Registration/` | tests de caractérisation | ouvert |
| P-06 | 🟡 | Données de santé et d'identité en `localStorage`, non effacées en cas d'abandon | `StepPayment.jsx`, `StepConfirmation.jsx` | tâche dédiée | ouvert |
| P-07 | 🟡 | Code mort : `createRegistration`, `getRegistrations`, `getRegistration`, `updateRegistration`, `deleteRegistration` (chemins sans `/api/v1`) | `src/services/api.js` | supprimer | ouvert |
| P-08 | 🟡 | Dépendances déclarées sans usage constaté : `tesseract.js`, `scribe.js-ocr`, `cloudinary` (SDK serveur), `@cloudinary/*` ; `@testing-library/*` en `dependencies` | `package.json` | nettoyer | ouvert |
| P-09 | 🟡 | `fetch` direct dans les composants, base URL dupliquée | `StepDormitory.jsx`, `StepPayment.jsx` | centraliser dans `services/api.js` | ouvert |
| P-10 | 🟡 | Variables CSS `:root` (bleues) sans rapport avec les couleurs affichées ; 3 polices | `src/index.css` | `DESIGN_SYSTEM.md` | ouvert |
| P-11 | 🟡 | `lang="en"`, titre « AN-NOUR2025 » | `public/index.html` | corriger | ouvert |
| P-12 | 🟡 | `README.md` = gabarit CRA (complété d'une section projet en Phase 2) ; `REACT_APP_API_KEY` injectée par le CI mais non lue | `README.md`, CI | nettoyer | ouvert |
| P-13 | 🟡 | `GET /registrations/status` non utilisé : le site ne sait pas à l'avance si les inscriptions sont closes | `src/pages/RegistrationPage.jsx` | afficher l'état avant le formulaire | ouvert |
| P-30 | 🟠 | Bug Pépinière : la sélection automatique cherche « Pépinière Homme/Femme » alors que les dortoirs portent « Pépinière – Garçons/Filles » (relevé en revue du recensement CO, 2026-11-21) ; `RegistrationPage.jsx:70` utilise encore `PEPINIERE-G/F` | `src/components/Registration/StepDormitory.jsx:76` et `:258` | aligner les libellés sur l'API (constante unique), test de caractérisation | ouvert |
| P-31 | 🟡 | Repli codé en dur sur l'URL de l'API de production si `REACT_APP_API_URL` est absente (même constat que P-19 de la branche `fix/dette-technique-vague-1`, non fusionnée : fusionner les deux entrées) | `src/services/api.js:2` | base URL unique sans repli (`src/config.js`) | ouvert |
| P-32 | 🟡 | Recensement CO : trois graphies pour le même champ (« Adresse email », « e-mail », « Email ») (revue UX du 2026-11-23) | `StepFiche.jsx`, `StepRecapitulatif.jsx` | une seule graphie (« e-mail ») | ouvert |
| P-33 | 🟡 | Recensement CO : boutons radio en erreur sans `aria-invalid` (seul `aria-describedby`) (revue UX du 2026-11-23) | `StepFiche.jsx`, `StepIdentification.jsx` | `aria-invalid` sur le groupe ou chaque option | ouvert |
| P-14 | 🟡 | Hook pré-commit : détection de secrets seulement si `gitleaks` est installé localement ; le CI les détecte désormais (bloquant sur le diff) | `.husky/pre-commit` | installer gitleaks en local | ouvert |
