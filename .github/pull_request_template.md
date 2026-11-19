<!--
Titre de la PR au format Conventional Commits, ex. « feat: export des consultations ».
Branche cible : mDev (main uniquement depuis mDev ou pour un hotfix).
Ne jamais inclure de secret, de token ni de donnée personnelle réelle.
-->

## Résumé
<!-- Quoi et pourquoi, en 2 à 4 phrases. -->

**Spec / issue liée** : `docs/features/<nom>.md` · #<issue>

## Type de changement
- [ ] `feat` — fonctionnalité
- [ ] `fix` — correction de bug
- [ ] `security` — sécurité
- [ ] `refactor` — sans changement de comportement
- [ ] `test` / `docs` / `chore` / `ci`

## Changements
-

## Tests
| Contrôle | Commande | Statut (Réussi / Échoué / Non exécuté / À valider manuellement) |
|---|---|---|
| | | |

Contrôles habituels : CI=false npm run build · suite Jest (cassée, voir docs/TESTING.md).

## Definition of Done
- [ ] Critères d'acceptation remplis
- [ ] Tests ajoutés pour le code nouveau ou modifié, aucune régression
- [ ] `npm run build` sans avertissement ESLint nouveau ; tests Jest verts (quand la suite sera réparée)
- [ ] Aucun constat sécurité 🔴/🟠 introduit
- [ ] Cohérence avec le design system et les lignes directrices UX (si UI)
- [ ] Documentation et `CHANGELOG.md` mis à jour
- [ ] Nouvelles variables d'environnement ajoutées à `.env.example` (publiques : aucun secret)
- [ ] Plan de rollback identifié si changement risqué

## Sécurité et zones sensibles
- [ ] Aucune zone sensible touchée (`CLAUDE.md` §6) — sinon, lesquelles :
- [ ] Revue sécurité faite (`/review`), aucun constat 🔴/🟠 introduit
- [ ] Aucune donnée personnelle, médicale ou financière réelle dans le code, les tests, les logs ou les captures

## Risques et retour arrière
<!-- Migration, configuration, données, déploiement : impact, sauvegarde, plan de retour arrière. « Aucun » sinon. -->

## Captures (si l'interface change)
<!-- Avant / après, mobile et ordinateur. Données FICTIVES uniquement. -->

## PR liées dans les autres dépôts
<!-- Changement de contrat d'API : lien vers la PR Backend / clients concernés. « Aucune » sinon. -->
