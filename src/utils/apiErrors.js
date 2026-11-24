// src/utils/apiErrors.js
// Traduit une erreur axios de l'API An-Nour en message lisible (français) pour l'interface.
// L'API renvoie {"detail": "<texte>"} ; une erreur de validation FastAPI (422) renvoie un tableau dans
// `detail` : il ne doit jamais être rendu tel quel (React ne peut pas afficher un tableau d'objets).

export const MESSAGE_SERVEUR_INJOIGNABLE =
  "Impossible de contacter le serveur. Vérifiez votre connexion puis réessayez.";

export const MESSAGE_DONNEES_INVALIDES =
  "Certaines informations de l'inscription sont invalides. Vérifiez les étapes précédentes puis réessayez.";

const texteNonVide = (valeur) => typeof valeur === "string" && valeur.trim() !== "";

export const getApiErrorMessage = (error, messageParDefaut) => {
  const response = error?.response;
  if (!response) {
    return MESSAGE_SERVEUR_INJOIGNABLE;
  }

  const { message, detail } = response.data || {};
  if (texteNonVide(message)) {
    return message;
  }
  if (texteNonVide(detail)) {
    return detail;
  }
  if (response.status === 422 || Array.isArray(detail)) {
    return MESSAGE_DONNEES_INVALIDES;
  }
  return messageParDefaut;
};
