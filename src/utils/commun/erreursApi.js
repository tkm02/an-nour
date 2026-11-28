// src/utils/commun/erreursApi.js
// Erreurs de l'API An-Nour communes aux formulaires publics (recensement CO, réinscription des séminaristes) :
// type d'erreur levée par le client HTTP (src/services/clientApi.js), messages génériques, délai Retry-After et
// erreurs de validation Pydantic (422) par champ.

export const MESSAGE_RESEAU =
  "Impossible de contacter le serveur. Vérifiez votre connexion internet puis réessayez.";
export const MESSAGE_DELAI =
  "Le serveur met trop de temps à répondre. Il est peut-être en cours de démarrage : réessayez dans un instant.";
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

export const texteNonVide = (valeur) => typeof valeur === "string" && valeur.trim() !== "";

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

