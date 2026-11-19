# Sécurité — An-Nour site public

> Politique commune, modèle de menace global et checklist : dépôt Backend, `docs/SECURITY.md` (source de vérité).
> Ce document ne garde que ce qui est propre au site public.

## 1. Points propres à ce dépôt
| Sujet | État actuel | Règle |
|---|---|---|
| Variables `REACT_APP_*` | publiques, incluses dans le bundle | aucun secret (le secret Cloudinary ne doit jamais apparaître ici) |
| Upload des reçus | upload **non signé** direct vers Cloudinary (preset) | restreindre le preset (formats image, taille, dossier, pas d'écrasement) ; à terme, upload via l'API |
| Données de santé et d'identité | conservées dans `localStorage` pendant le parcours, effacées à la confirmation | minimiser ; effacer aussi en cas d'abandon ; ne rien journaliser |
| Abus (spam d'inscriptions, d'avis) | limitation de débit côté API | pas de logique de sécurité côté navigateur |
| Dépendances | 63 avis npm, tous dans l'outillage `react-scripts` (non embarqué) | migration hors CRA (ADR) |
| CI | gitleaks bloquant sur le diff, action Vercel épinglée par SHA, environnement `production` ; tests encore en rapport (P-01) ; `VERCEL_TOKEN` à passer en secret d'environnement | ADR 0002 (dépôt Backend) |

## 2. Constats ouverts (audit du 2026-11-19)
| # | Sévérité | Constat | Piste |
|---|---|---|---|
| P-S1 | 🟠 | `.env.example` contenait des valeurs réelles (nom de cloud, preset, clé d'API Cloudinary, URL) — **remplacées par des marqueurs en Phase 2**, mais présentes dans l'historique Git | la clé d'API Cloudinary seule n'est pas le secret ; vérifier les restrictions du preset et, par prudence, renouveler le preset s'il est trop permissif |
| P-S2 | 🟠 | Preset d'upload non signé utilisable par n'importe qui | restrictions Cloudinary + surveillance du quota |
| P-S3 | 🟠 | Workflow : Node 18 (fin de vie), `npm install`, tests en `continue-on-error`, pas de gitleaks, `amondnet/vercel-action@v25` non épinglé par SHA | **partiellement traité** (ADR 0002 du Backend) : Node 22, `npm ci`, gitleaks, action épinglée ; tests encore en rapport (P-01) |
| P-S4 | 🟡 | `localStorage` contenant des données de santé non effacé en cas d'abandon du parcours | tâche dédiée |
| P-S5 | 🟡 | SDK serveur `cloudinary` dans les dépendances d'une application navigateur | retirer s'il est inutilisé |
