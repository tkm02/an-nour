# Sécurité — An-Nour site public

> Politique commune, modèle de menace global et checklist : dépôt Backend, `docs/SECURITY.md` (source de vérité).
> Ce document ne garde que ce qui est propre au site public.

## 1. Points propres à ce dépôt
| Sujet | État actuel | Règle |
|---|---|---|
| Variables `REACT_APP_*` | publiques, incluses dans le bundle | aucun secret (le secret Cloudinary ne doit jamais apparaître ici) |
| Upload des reçus | upload **non signé** direct vers Cloudinary (preset) | restreindre le preset (formats image, taille, dossier, pas d'écrasement) ; à terme, upload via l'API |
| Données de santé et d'identité | identité conservée dans le `sessionStorage` de l'onglet entre le paiement et la confirmation ; **santé jamais stockée** dans le navigateur, gardée en mémoire (lot 2, `src/utils/inscription/stockage.js`) ; ancienne sauvegarde `localStorage` supprimée au chargement ; consentement santé envoyé seulement avec une donnée de santé (revue des lots 3-4) | ne rien journaliser |
| Photo d'identité du séminariste (2026-11-27) | facultative ; fichier et jeton `jeton_photo` gardés **en mémoire** (jamais dans le stockage du navigateur), compression et suppression des métadonnées dans le navigateur, envoi par l'API (`POST /registrations/photo`, contrôle et recompression côté serveur) ; photo de l'an dernier affichée sur correspondance complète (URL `https` uniquement) ; consentement obligatoire (texte validé le 2026-11-27) | ne jamais envoyer la photo directement à Cloudinary depuis le navigateur |
| Abus (spam d'inscriptions, d'avis) | limitation de débit côté API | pas de logique de sécurité côté navigateur |
| Dépendances | 63 avis npm, tous dans l'outillage `react-scripts` (non embarqué) | migration hors CRA (ADR) |
| CI | gitleaks bloquant sur le diff, action Vercel épinglée par SHA, environnement `production` ; tests bloquants (P-01) ; `VERCEL_TOKEN` à passer en secret d'environnement | ADR 0002 (dépôt Backend) |

## 2. Constats ouverts (audit du 2026-11-19)
| # | Sévérité | Constat | Piste |
|---|---|---|---|
| P-S1 | 🟠 | `.env.example` contenait des valeurs réelles (nom de cloud, preset, clé d'API Cloudinary, URL) — **remplacées par des marqueurs en Phase 2**, mais présentes dans l'historique Git | la clé d'API Cloudinary seule n'est pas le secret ; vérifier les restrictions du preset et, par prudence, renouveler le preset s'il est trop permissif |
| P-S2 | 🟠 | Preset d'upload non signé utilisable par n'importe qui | restrictions Cloudinary + surveillance du quota |
| P-S3 | 🟠 | Workflow : Node 18 (fin de vie), `npm install`, tests en `continue-on-error`, pas de gitleaks, `amondnet/vercel-action@v25` non épinglé par SHA | **traité** (ADR 0002 du Backend ; vague 1 de dette, 2026-11-19) : Node 22, `npm ci`, gitleaks, action épinglée, tests bloquants (P-01) |
| P-S4 | ✅ | ~~`localStorage` contenant des données de santé non effacé en cas d'abandon du parcours~~ : résolu au lot 2 (santé gardée en mémoire, `sessionStorage` sans santé, ancienne clé supprimée) ; constaté par la revue de sécurité des lots 3-4 (2026-11-28) | — |
| P-S5 | 🟡 | SDK serveur `cloudinary` dans les dépendances d'une application navigateur | retirer s'il est inutilisé |
