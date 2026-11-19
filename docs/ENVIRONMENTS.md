# Environnements — An-Nour site public

## 1. État actuel
| Environnement | Où | API | Configuration |
|---|---|---|---|
| Développement | `npm start` (http://localhost:3000) | `REACT_APP_API_URL` de `.env` | `.env` ignoré par Git |
| CI | GitHub Actions (Node 22) | — | secrets GitHub `REACT_APP_API_URL`, `REACT_APP_CLOUDINARY_CLOUD_NAME`, `REACT_APP_CLOUDINARY_UPLOAD_PRESET`, `REACT_APP_API_KEY` injectés au build |
| Production | Vercel (`an-nour25.vercel.app`, origine autorisée par l'API) | API Render | variables injectées au build par le CI |

Pas de préproduction. Le build CRA **fige** les variables `REACT_APP_*` dans le bundle : changer d'API exige un
nouveau build.

## 2. Variables (référence : `.env.example`)
`REACT_APP_API_URL` (sans `/api/v1`), `REACT_APP_CLOUDINARY_CLOUD_NAME`, `REACT_APP_CLOUDINARY_UPLOAD_PRESET`,
`REACT_APP_API_KEY` (non lue par `src/`). Toutes publiques. `REACT_APP_API_URL` est **obligatoire** pour tout build de
production, y compris les déploiements de prévisualisation Vercel (`src/config.js` : erreur explicite sinon) ;
repli sur `http://localhost:8000` en développement et en test uniquement.

## 3. Cible
| Environnement | Données | À mettre en place |
|---|---|---|
| Development | API locale, données fictives | `.env` par défaut sur l'API locale |
| Staging | API de staging, preset Cloudinary de test | déploiement *Preview* Vercel depuis `mDev` |
| Production | réelles | preset Cloudinary de production restreint, distinct du staging |
