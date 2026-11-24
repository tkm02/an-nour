# Architecture — An-Nour site public

> Architecture **constatée** (2026-11-19). Vue des 4 applications : dépôt Backend, `docs/SYSTEME_GLOBAL.md`.

## 1. Arborescence
```
public/index.html            # gabarit CRA (titre « AN-NOUR2025 », lang="en")
src/
├── index.js                 # createBrowserRouter : / · /inscription · /visiteurs · /avis (enfants de App)
├── App.js                   # mise en page : <Outlet />
├── pages/                   # LandingPage, RegistrationPage, VisitorRegistrationPage, FeedbackPage (+ CSS)
├── components/
│   ├── Landing/             # Hero, ProgramSection, PricingSection, FAQ
│   ├── Registration/        # Stepper + StepPersonalInfo, StepHealthInfo, StepDormitory, StepPayment, StepConfirmation
│   ├── PDFGenerator.jsx     # PDF de confirmation (jspdf)
│   └── ReviewSummary.jsx
├── services/api.js          # createVisitor, createFeedback (+ fonctions inutilisées getRegistrations, update…)
├── utils/cloudinaryUpload.js# upload non signé vers Cloudinary
└── images/                  # logos
```

## 2. Parcours d'inscription
```
StepPersonalInfo → StepHealthInfo → StepDormitory ──GET /api/v1/registrations/dortoirs──► API
      │                                   │
      └──── état local + localStorage("an-nour-registration") ◄────┘
StepPayment : photo du reçu ──upload non signé──► Cloudinary (URL)
            └─POST /api/v1/registrations/verify-receipt (OCR serveur) → POST /api/v1/registrations
StepConfirmation : lecture du localStorage → PDF (jspdf) → effacement du localStorage
```
Visiteurs : `POST /api/v1/visiteurs` ; avis : `POST /api/v1/feedback` (routes publiques limitées en débit par l'API).

## 3. Configuration
`REACT_APP_API_URL` = URL de base **sans** `/api/v1` (les composants ajoutent `/api/v1/...`) ; repli codé en dur sur
l'API de production dans `services/api.js`. `REACT_APP_CLOUDINARY_CLOUD_NAME`, `REACT_APP_CLOUDINARY_UPLOAD_PRESET`.

## 4. Points d'attention
- Les fonctions `createRegistration`, `getRegistrations`, `getRegistration`, `updateRegistration`,
  `deleteRegistration` de `services/api.js` appellent `/registrations` **sans** `/api/v1` et ne sont importées nulle
  part (code mort).
- `tesseract.js`, `scribe.js-ocr`, le SDK serveur `cloudinary` et `@cloudinary/*` sont déclarés sans usage constaté
  dans `src/` (sauf l'upload maison) ; `@testing-library/*` est en `dependencies`.
- Outil de build CRA non maintenu. Décisions existantes : `adr/0001-etat-initial-et-choix-existants.md`.
