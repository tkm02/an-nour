# Fonctionnalités — An-Nour site public

> Index des fonctionnalités **existantes** (2026-11-19). État apparent, à confirmer par recette (navigateur).
> Nouvelles fonctionnalités : spec dans `docs/features/` (modèle `_template.md`).

| Fonctionnalité | Route | Fichiers | API (`/api/v1`) | Tests | État |
|---|---|---|---|---|---|
| Accueil : présentation, programme, tarifs, FAQ | `/` | `pages/LandingPage.jsx`, `components/Landing/*` | — | aucun | stable (contenu statique) |
| Inscription — identité | `/inscription` (étape 1) | `StepPersonalInfo.jsx` | — | aucun | partiel |
| Inscription — informations de santé | étape 2 | `StepHealthInfo.jsx` | — | aucun | partiel (données sensibles en `localStorage`) |
| Inscription — choix du dortoir | étape 3 | `StepDormitory.jsx` | `GET /registrations/dortoirs` | aucun | partiel |
| Inscription — paiement et reçu | étape 4 | `StepPayment.jsx`, `utils/cloudinaryUpload.js` | upload Cloudinary, `POST /registrations/verify-receipt`, `POST /registrations` | aucun | à risque (non testé, upload non signé) |
| Inscription — confirmation et PDF | étape 5 | `StepConfirmation.jsx`, `PDFGenerator.jsx` | — | aucun | partiel |
| Inscription des visiteurs | `/visiteurs` | `VisitorRegistrationPage.jsx` | `POST /visiteurs` | aucun | partiel |
| Avis | `/avis` | `FeedbackPage.jsx` | `POST /feedback` | aucun | partiel |

Comportement attendu côté API lorsque les inscriptions sont closes (`REGISTRATIONS_OPEN=false`) : refus de
`POST /registrations` pour le public — affichage côté site **à vérifier** (`GET /registrations/status` n'est pas
appelé par le site).
