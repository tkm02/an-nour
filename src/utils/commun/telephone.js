// src/utils/commun/telephone.js
// Numéros de téléphone ivoiriens (10 chiffres, avec ou sans +225 / 00225 / espaces), règle alignée sur
// `normaliser_telephone` de l'API. Commun au recensement CO et à la réinscription des séminaristes.

export const INDICATIF_CI = "225";

/** Numéro national à 10 chiffres, ou null si la saisie n'en est pas un. */
export const normaliserTelephone = (valeur) => {
  if (typeof valeur !== "string" || !valeur.trim()) {
    return null;
  }
  let chiffres = valeur.replace(/\D/g, "");
  if (valeur.trim().startsWith("00")) {
    chiffres = chiffres.slice(2);
  }
  if (chiffres.startsWith(INDICATIF_CI) && chiffres.length === 13) {
    chiffres = chiffres.slice(INDICATIF_CI.length);
  }
  return /^\d{10}$/.test(chiffres) ? chiffres : null;
};

/** Affichage lisible « 07 00 00 00 00 » (la saisie est renvoyée telle quelle si elle n'est pas un numéro valide). */
export const formaterTelephone = (valeur) => {
  const numero = normaliserTelephone(valeur);
  return numero ? numero.replace(/(\d{2})(?=\d)/g, "$1 ") : valeur || "";
};

/** Message d'erreur (ou "") pour un numéro obligatoire. */
export const validerTelephone = (valeur) => {
  if (typeof valeur !== "string" || !valeur.trim()) return "Le numéro de téléphone est obligatoire.";
  if (!normaliserTelephone(valeur)) return "Numéro invalide : 10 chiffres, par exemple 07 00 00 00 00.";
  return "";
};
