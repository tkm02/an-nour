// src/utils/inscription/photo.js
// Photo d'identité du formulaire d'inscription et de réinscription (décisions du 2026-11-27) : facultative,
// consentement obligatoire dès qu'une photo est retenue, photo de l'an dernier affichée et reprise par défaut en
// réinscription. État gardé EN MÉMOIRE uniquement (jamais dans le stockage du navigateur) ; envoi après la création
// de l'inscription (POST /registrations/photo, jeton `jeton_photo` de 30 min).

import { urlPhotoSure } from "../recensementCo/requetes";

// Texte validé le 2026-11-27
export const TEXTE_CONSENTEMENT_PHOTO =
  "J'autorise l'utilisation de cette photo pour le badge et l'organisation du séminaire An-Nour 8.0.";
export const ERREUR_CONSENTEMENT_PHOTO = "Cochez l'autorisation d'utiliser la photo, ou retirez la photo.";

export const PHOTO_VIDE = Object.freeze({ fichier: null, urlPrecedente: null, reprendre: false, consentement: false });

/** État initial après une recherche de réinscription : photo de l'an dernier proposée si elle existe. */
export const photoDepuisFiche = (fiche) => {
  const url = urlPhotoSure(fiche?.photo_url);
  return url ? { ...PHOTO_VIDE, urlPrecedente: url, reprendre: true } : { ...PHOTO_VIDE };
};

/** "nouvelle" (fichier choisi), "precedente" (photo de l'an dernier reprise) ou null. */
export const photoRetenue = (photo) => {
  if (photo?.fichier) return "nouvelle";
  if (photo?.reprendre && photo?.urlPrecedente) return "precedente";
  return null;
};

/** Message d'erreur de l'étape 1 (chaîne vide si valide). */
export const validerPhoto = (photo) => (photoRetenue(photo) && !photo.consentement ? ERREUR_CONSENTEMENT_PHOTO : "");

/** Nouvelle photo choisie : remplace l'affichage de la photo de l'an dernier (qui reste disponible si on la retire). */
export const choisirFichier = (photo, fichier) => ({ ...photo, fichier });

/** « Retirer la photo » : d'abord le fichier choisi, puis la reprise de la photo de l'an dernier. */
export const retirerPhoto = (photo) =>
  photo.fichier ? { ...photo, fichier: null } : { ...photo, reprendre: false, consentement: false };

/** Champs ajoutés à `reinscription` dans POST /registrations (reprise de la photo de l'an dernier). */
export const optionsReprisePhoto = (photo) =>
  photoRetenue(photo) === "precedente" ? { reprendre_photo: true, consentement_photo: true } : {};

/** Formulaire multipart de POST /registrations/photo. */
export const formulairePhoto = (jeton, fichier) => {
  const formulaire = new FormData();
  formulaire.append("jeton_photo", jeton);
  formulaire.append("consentement_photo", "true");
  formulaire.append("photo", fichier, fichier.name || "photo.jpg");
  return formulaire;
};

/**
 * Statut de la photo après la création de l'inscription :
 * "envoyee" | "reprise" | "a_envoyer" (fichier choisi, envoi à faire) | "absente".
 */
export const statutApresCreation = (photo, reponse) => {
  const retenue = photoRetenue(photo);
  if (retenue === "nouvelle") return reponse?.jeton_photo ? "a_envoyer" : "echec";
  if (retenue === "precedente" && reponse?.photo_url) return "reprise";
  return "absente";
};
