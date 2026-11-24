# Exploitation — An-Nour site public

> Logs serveur, sauvegardes, gestion d'incident et post-mortem : dépôt Backend, `docs/OPERATIONS.md`.

## 1. Actuel
- Site statique sur Vercel ; aucune donnée persistée côté site (hors `localStorage` du visiteur pendant l'inscription).
- Aucun suivi d'erreurs navigateur ni mesure d'audience constatés.
- Dépendances externes en production : API Render (`/health` surveillé par le backend), Cloudinary, Google Fonts.

## 2. Points de vigilance pendant les inscriptions
- Quota Cloudinary (uploads non signés) et taux de reçus rejetés par l'OCR (tableau de bord finances).
- Mise en veille de l'API sur le plan gratuit Render : premier appel lent → prévoir un message d'attente.
- Fermeture des inscriptions : `REGISTRATIONS_OPEN=false` côté API ; vérifier le message affiché par le site.

## 3. Cible
Suivi des erreurs JavaScript sans données personnelles ; alerte sur pic d'échecs d'inscription ; rollback :
`DEPLOYMENT.md` §2.
