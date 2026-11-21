// src/utils/recensementCo/contact.js
// Contact d'aide du recensement CO (texte libre public, ex. numéro WhatsApp de l'administration), lu dans
// REACT_APP_RECENSEMENT_CONTACT au moment de l'appel. Absent : aucun contact n'est inventé.

const LONGUEUR_MAX = 200;

export const contactAide = (env = process.env) => {
  const valeur = typeof env.REACT_APP_RECENSEMENT_CONTACT === "string" ? env.REACT_APP_RECENSEMENT_CONTACT.trim() : "";
  return valeur ? valeur.slice(0, LONGUEUR_MAX) : null;
};

/** Ajoute le contact d'aide aux messages qui invitent à contacter l'administration. */
export const completerAvecContact = (message, contact = contactAide()) => {
  if (!contact || typeof message !== "string" || !/contacte[rz] l'administration/i.test(message)) {
    return message;
  }
  return `${message.replace(/\s+$/, "")} Besoin d'aide ? ${contact}`;
};
