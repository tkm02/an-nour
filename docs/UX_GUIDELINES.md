# Lignes directrices UX — An-Nour site public

## 1. Utilisateurs et parcours clés
| Utilisateur | Parcours |
|---|---|
| Futur séminariste (souvent sur téléphone, connexion mobile) | accueil → inscription en 5 étapes → reçu de paiement → confirmation + PDF |
| Parent / tuteur aidant à l'inscription | idem, parfois pour plusieurs enfants sur le même appareil |
| Visiteur | accueil → formulaire visiteur |
| Participant après le séminaire | formulaire d'avis |

## 2. Principes
1. **Mobile d'abord** : formulaires utilisables d'une main à 360 px ; clavier adapté (`type="tel"`, `email`, `date`).
2. **Progression visible** : le `Stepper` indique l'étape courante et le nombre d'étapes ; retour à l'étape précédente
   sans perte de saisie.
3. **Prévention des erreurs** : validation au niveau du champ avant de passer à l'étape suivante ; formats d'exemple
   (« 07 00 00 00 00 ») ; tarif et moyens de paiement rappelés à l'étape paiement.
4. **Retour à chaque action** : envoi du reçu → indicateur de chargement (l'OCR serveur peut prendre plusieurs
   secondes, et l'API peut être en veille) → résultat clair (vérifié, rejeté avec motif, en attente de validation).
5. **Messages d'erreur utiles** : expliquer quoi faire (« Le reçu est illisible : reprenez la photo à plat, sans
   reflet ») ; inscriptions closes et limite de débit (429) expliquées en clair.
6. **Confiance et confidentialité** : expliquer pourquoi les informations de santé sont demandées et qui y a accès ;
   effacer les données du navigateur en fin de parcours (ou à l'abandon).
7. **Doublons** : désactiver le bouton d'envoi pendant la requête.

## 3. Accessibilité (WCAG 2.2 AA)
- `lang="fr"` sur le document (actuellement `en`) ; titre de page explicite.
- Libellé associé à chaque champ (`<label for>`), erreurs annoncées (`aria-live`), focus visible.
- Contraste ≥ 4,5:1 pour le texte (cf. `DESIGN_SYSTEM.md` §4) ; information jamais portée par la seule couleur.
- Images informatives avec `alt` ; cibles tactiles ≥ 44×44 px.

## 4. Microcopie
Ton accueillant et respectueux, vouvoiement ; boutons d'action explicites (« Continuer », « Envoyer mon reçu »,
« Télécharger ma confirmation ») ; montants en FCFA ; dates au format français.
