// src/services/inscription.js
// Appels publics liés à l'inscription des séminaristes via le client commun (fetch, /api/v1, erreurs typées).
// Contrat : dépôt Backend, docs/features/reinscription-seminaristes.md. L'envoi final (POST /registrations) reste
// dans StepPayment.jsx (axios, parcours existant).

import { requete } from "./clientApi";

/** GET /registrations/status → {open, fee, close_at} */
export const chargerStatutInscriptions = () => requete("/registrations/status");

/** GET /registrations/reinscription/configuration → {ouvert, jeton_formulaire} */
export const chargerConfigurationReinscription = () => requete("/registrations/reinscription/configuration");

/** POST /registrations/reinscription/recherche → {resultat, jeton_reinscription, fiche, deja_inscrit, matricule_actuel} */
export const rechercherInscription = (corps) =>
  requete("/registrations/reinscription/recherche", { methode: "POST", json: corps });
