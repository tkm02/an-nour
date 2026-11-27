# Fonctionnalités — An-Nour site public

> Index des fonctionnalités **existantes** (2026-11-19). État apparent, à confirmer par recette (navigateur).
> Nouvelles fonctionnalités : spec dans `docs/features/` (modèle `_template.md`).

| Fonctionnalité | Route | Fichiers | API (`/api/v1`) | Tests | État |
|---|---|---|---|---|---|
| Accueil : présentation, programme, tarifs, FAQ | `/` | `pages/LandingPage.jsx`, `components/Landing/*` | — | aucun | stable (contenu statique) |
| Inscription — réinscription (inscrit l'an dernier ?) | `/inscription` (écran préalable) | `pages/RegistrationPage.jsx`, `Registration/ReinscriptionRecherche.jsx`, `services/inscription.js`, `utils/inscription/*` | `GET /registrations/status`, `GET /registrations/reinscription/configuration`, `POST /registrations/reinscription/recherche`, `POST /registrations` (`reinscription`) | Jest (logique, service, parcours, paiement) | nouveau — recette navigateur à faire |
| Inscription — photo d'identité (facultative) | `/inscription` (étape 1, confirmation) | `Registration/PhotoInscription.jsx`, `utils/inscription/photo.js`, `StepPayment.jsx`, `StepConfirmation.jsx` | `POST /registrations` (`jeton_photo`, `reinscription.reprendre_photo`), `POST /registrations/photo` | Jest (logique, composant, paiement, parcours) | nouveau — recette navigateur (téléphone) à faire ; texte de consentement à valider |
| Inscription — identité | `/inscription` (étape 1) | `StepPersonalInfo.jsx` | — | aucun | partiel |
| Inscription — informations de santé | étape 2 | `StepHealthInfo.jsx` | — | aucun | partiel (données sensibles en `localStorage`) |
| Inscription — choix du dortoir | étape 3 | `StepDormitory.jsx` | `GET /registrations/dortoirs` | aucun | partiel |
| Inscription — paiement et reçu | étape 4 | `StepPayment.jsx`, `utils/cloudinaryUpload.js` | upload Cloudinary, `POST /registrations/verify-receipt`, `POST /registrations` | aucun | à risque (non testé, upload non signé) |
| Inscription — confirmation et PDF | étape 5 | `StepConfirmation.jsx`, `PDFGenerator.jsx` | — | aucun | partiel |
| Inscription des visiteurs | `/visiteurs` | `VisitorRegistrationPage.jsx` | `POST /visiteurs` | aucun | partiel |
| Avis | `/avis` | `FeedbackPage.jsx` | `POST /feedback` | aucun | partiel |
| Recensement des membres du CO (lien diffusé aux membres, sans lien public) | `/recensement-co` | `pages/RecensementCoPage.jsx`, `components/RecensementCo/*`, `services/recensementCo.js`, `utils/recensementCo/*` | `GET /co/configuration`, `POST /co/identification`, `POST /co/fiche`, `POST /co/photo` | Jest (logique, service, parcours) | nouveau — recette navigateur à faire |

Comportement attendu côté API lorsque les inscriptions sont closes (`REGISTRATIONS_OPEN=false`) : refus de
`POST /registrations` pour le public — affichage côté site **à vérifier** (`GET /registrations/status` n'est pas
appelé par le site).
