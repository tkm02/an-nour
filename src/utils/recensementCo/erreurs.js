// src/utils/recensementCo/erreurs.js
// Traduction des erreurs de l'API du recensement CO en messages affichables (français) et en action à proposer.
// Contrat : 400 jeton expiré/invalide · 409 fiche validée · 413 photo trop lourde · 422 validation (`detail` =
// liste Pydantic ou texte) · 429 (`Retry-After`) · 502 stockage photo · 503 recensement fermé.

export const MESSAGE_RESEAU =
  "Impossible de contacter le serveur. Vérifiez votre connexion internet puis réessayez.";
export const MESSAGE_DELAI =
  "Le serveur met trop de temps à répondre. Il est peut-être en cours de démarrage : réessayez dans un instant.";
export const MESSAGE_FERME = "Le recensement n'est pas ouvert pour le moment.";
export const MESSAGE_SESSION =
  "Pour votre sécurité, votre session a expiré. Vos réponses sont conservées : appuyez de nouveau sur « Continuer ».";
export const MESSAGE_FORMULAIRE_EXPIRE =
  "Pour votre sécurité, le formulaire a expiré. Vos réponses sont conservées : appuyez de nouveau sur « Continuer ».";
export const MESSAGE_REFUS_REPETE =
  "Votre demande n'a pas pu être vérifiée. Contactez l'administration du séminaire pour compléter votre fiche.";
export const MESSAGE_REPONSE_INVALIDE =
  "Réponse inattendue du serveur. Réessayez : un nouvel envoi ne crée pas de doublon. Si le problème persiste, " +
  "contactez l'administration.";
export const MESSAGE_VERROUILLEE = "Fiche déjà validée : contactez l'administration pour la modifier.";
export const MESSAGE_VALIDATION = "Certaines informations sont invalides. Corrigez les champs signalés.";
export const MESSAGE_SERVEUR = "Une erreur est survenue sur le serveur. Réessayez dans quelques instants.";
export const MESSAGE_CONFIGURATION =
  "Le formulaire est mal configuré (adresse du serveur manquante). Prévenez l'administration du séminaire.";

/** Erreur levée par le service : `type` = "http" | "reseau" | "delai" | "configuration" | "reponse" (corps inattendu). */
export class ErreurApi extends Error {
  constructor(type, { status = null, data = null, retryAfter = null } = {}) {
    super(`Erreur API (${type}${status ? ` ${status}` : ""})`);
    this.name = "ErreurApi";
    this.type = type;
    this.status = status;
    this.data = data;
    this.retryAfter = retryAfter;
  }
}

const texteNonVide = (valeur) => typeof valeur === "string" && valeur.trim() !== "";

/** Texte comparable : minuscules, sans accents ni ponctuation finale. */
export const normaliser = (texte) =>
  String(texte || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[.!\s]+$/, "");

/** Durée lisible à partir de l'en-tête Retry-After (secondes ou date HTTP). */
export const formaterDelai = (retryAfter, maintenant = Date.now()) => {
  if (retryAfter === null || retryAfter === undefined || retryAfter === "") {
    return null;
  }
  let secondes = Number(retryAfter);
  if (!Number.isFinite(secondes)) {
    const date = Date.parse(retryAfter);
    if (Number.isNaN(date)) return null;
    secondes = (date - maintenant) / 1000;
  }
  secondes = Math.max(1, Math.ceil(secondes));
  if (secondes < 60) {
    return `${secondes} seconde${secondes > 1 ? "s" : ""}`;
  }
  const minutes = Math.ceil(secondes / 60);
  return `${minutes} minute${minutes > 1 ? "s" : ""}`;
};

const MESSAGES_PYDANTIC = {
  missing: "Ce champ est obligatoire.",
  string_too_short: "Ce champ est obligatoire.",
  string_too_long: "Texte trop long.",
  literal_error: "Choix invalide.",
  date_parsing: "Date invalide.",
  date_from_datetime_parsing: "Date invalide.",
  date_type: "Date invalide.",
  bool_parsing: "Valeur invalide.",
};

/** Message en français pour une erreur Pydantic (les validateurs de l'API produisent « Value error, <texte> »). */
const messagePydantic = (erreur, champ) => {
  const message = typeof erreur?.msg === "string" ? erreur.msg : "";
  if (champ === "email") {
    return "Adresse email invalide.";
  }
  if (erreur?.type === "value_error" && message.startsWith("Value error, ")) {
    const texte = message.slice("Value error, ".length).trim();
    return texte.endsWith(".") ? texte : `${texte}.`;
  }
  return MESSAGES_PYDANTIC[erreur?.type] || "Valeur invalide.";
};

/** Erreurs par champ d'un `detail` Pydantic : {champ: message} (champs inconnus ignorés). */
export const erreursParChamp = (detail, champsConnus = []) => {
  if (!Array.isArray(detail)) {
    return {};
  }
  const erreurs = {};
  for (const erreur of detail) {
    const loc = Array.isArray(erreur?.loc) ? erreur.loc : [];
    const champ = loc.length ? String(loc[loc.length - 1]) : "";
    if (champsConnus.includes(champ) && !erreurs[champ]) {
      erreurs[champ] = messagePydantic(erreur, champ);
    }
  }
  return erreurs;
};

/**
 * Interprétation d'une erreur pour l'interface.
 * `action` : "reessayer" (même requête), "recommencer" (jeton refusé : recharger la configuration / revenir à
 * l'identification), "corriger" (validation), "verrouillee", "ferme", "attendre" (429), "aucune".
 * `champsTexte` : {texte normalisé de `detail` → champ} pour rattacher un message texte (ex. « Commission inconnue »).
 */
export const interpreterErreur = (erreur, { champsConnus = [], champsTexte = {}, maintenant = Date.now() } = {}) => {
  if (!(erreur instanceof ErreurApi)) {
    return { action: "reessayer", message: MESSAGE_SERVEUR, champs: {} };
  }
  if (erreur.type === "reseau") return { action: "reessayer", message: MESSAGE_RESEAU, champs: {} };
  if (erreur.type === "delai") return { action: "reessayer", message: MESSAGE_DELAI, champs: {} };
  if (erreur.type === "configuration") return { action: "aucune", message: MESSAGE_CONFIGURATION, champs: {} };
  if (erreur.type === "reponse") return { action: "reessayer", message: MESSAGE_REPONSE_INVALIDE, champs: {} };

  const detail = erreur.data?.detail;
  const detailTexte = texteNonVide(detail) ? detail.trim() : null;
  switch (erreur.status) {
    case 400:
      return { action: "recommencer", message: detailTexte || MESSAGE_SESSION, champs: {} };
    case 409:
      // Deux cas côté API : fiche déjà validée (verrouillée) ou envoi concurrent en cours (« patientez »)
      if (!detailTexte || /valid/.test(normaliser(detailTexte))) {
        return { action: "verrouillee", message: detailTexte || MESSAGE_VERROUILLEE, champs: {} };
      }
      return { action: "attendre", message: detailTexte, champs: {} };
    case 413:
      return { action: "corriger", message: detailTexte || "La photo est trop lourde (5 Mo maximum).", champs: {} };
    case 422: {
      const champs = erreursParChamp(detail, champsConnus);
      const champTexte = detailTexte ? champsTexte[normaliser(detailTexte)] : null;
      if (champTexte && champsConnus.includes(champTexte)) {
        champs[champTexte] = `${detailTexte.replace(/\.$/, "")} : choisissez une valeur dans la liste.`;
      }
      return {
        action: "corriger",
        message: detailTexte || MESSAGE_VALIDATION,
        champs,
      };
    }
    case 429: {
      const delai = formaterDelai(erreur.retryAfter, maintenant);
      return {
        action: "attendre",
        message: delai
          ? `Trop de tentatives. Réessayez dans ${delai}.`
          : "Trop de tentatives. Réessayez dans quelques minutes.",
        champs: {},
      };
    }
    case 503:
      return { action: "ferme", message: MESSAGE_FERME, champs: {} };
    default:
      if (erreur.status >= 500) {
        return { action: "reessayer", message: detailTexte && erreur.status !== 500 ? detailTexte : MESSAGE_SERVEUR, champs: {} };
      }
      return { action: "reessayer", message: detailTexte || MESSAGE_SERVEUR, champs: {} };
  }
};

export const MESSAGE_PHOTO_DELAI =
  "Le délai d'envoi de la photo est dépassé : renvoyez votre fiche pour ajouter la photo, ou contactez " +
  "l'administration.";
export const MESSAGE_PHOTO_FICHE_VALIDEE =
  "Votre fiche a été validée entre-temps : la photo ne peut plus être ajoutée en ligne. Contactez l'administration.";

/**
 * Échec de POST /co/photo (la fiche est déjà enregistrée) : message et possibilité de réessayer avec le même
 * `jeton_photo`. Jeton expiré (400), fiche validée (409), recensement fermé (503) ou fichier refusé (400 image,
 * 413) : réessayer ne servirait à rien.
 */
export const interpreterErreurPhoto = (erreur) => {
  const interpretation = interpreterErreur(erreur);
  if (!(erreur instanceof ErreurApi) || erreur.type !== "http") {
    return { message: interpretation.message, reessayable: true };
  }
  const detail = typeof erreur.data?.detail === "string" ? erreur.data.detail.trim() : "";
  switch (erreur.status) {
    case 400:
      return /image/i.test(detail)
        ? { message: detail, reessayable: false }
        : { message: MESSAGE_PHOTO_DELAI, reessayable: false };
    case 409:
      return { message: MESSAGE_PHOTO_FICHE_VALIDEE, reessayable: false };
    case 413:
    case 503:
      return { message: interpretation.message, reessayable: false };
    default:
      return { message: interpretation.message, reessayable: true };
  }
};
