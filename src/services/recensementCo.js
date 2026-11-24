// src/services/recensementCo.js
// Appels publics du recensement des membres du CO (préfixe /api/v1, sans authentification).
// Contrat : dépôt Backend, docs/features/recensement-co.md (section « Public »). Photo : envoyée à l'API
// uniquement (aucun téléversement direct vers Cloudinary).

import { requete } from "./clientApi";

// Client commun (URL de l'API, délai, erreurs) ré-exporté pour les tests existants
export { DELAI_REQUETE_MS, resoudreUrlApi, URL_API_DEVELOPPEMENT } from "./clientApi";

/** GET /co/configuration → {ouvert, edition, commissions, commissions_precedentes, qualites, jeton_formulaire, …} */
export const chargerConfiguration = () => requete("/co/configuration");

/** POST /co/identification → {resultat, jeton_session, fiche, deja_soumise, verrouillee} */
export const identifierMembre = (corps) => requete("/co/identification", { methode: "POST", json: corps });

/** POST /co/fiche → 201 {message, reference, jeton_photo} */
export const soumettreFiche = (corps) => requete("/co/fiche", { methode: "POST", json: corps });

/** POST /co/photo (multipart : jeton_photo, photo) → {photo_url} */
export const envoyerPhoto = (formulaire) => requete("/co/photo", { methode: "POST", formulaire });
