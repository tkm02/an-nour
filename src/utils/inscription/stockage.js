// src/utils/inscription/stockage.js
// Conservation de l'inscription en cours (clé historique « an-nour-registration ») entre l'étape Paiement et la
// confirmation. Sécurité (TAF lot 2) :
// - stockage de l'ONGLET (sessionStorage) au lieu de localStorage ; l'ancienne clé localStorage est supprimée ;
// - jamais les informations de santé (saisies ou renvoyées par la recherche de réinscription) ni le jeton de
//   réinscription : elles restent en mémoire (état de RegistrationPage) et sont lues depuis celle-ci à l'envoi
//   et à la confirmation.

export const CLE_INSCRIPTION = "an-nour-registration";
const CHAMPS_EXCLUS = ["healthInfo", "reinscription"];

const stockage = (nom) => {
  try {
    return typeof window !== "undefined" ? window[nom] : null;
  } catch {
    return null;
  }
};

/** Copie sans santé ni jeton (clés exclues et toute clé contenant « jeton »). */
export const nettoyerPourStockage = (donnees) => {
  if (!donnees || typeof donnees !== "object") return {};
  return Object.fromEntries(
    Object.entries(donnees).filter(([cle]) => !CHAMPS_EXCLUS.includes(cle) && !/jeton/i.test(cle))
  );
};

/** Supprime l'ancienne sauvegarde localStorage (elle pouvait contenir des données de santé). */
export const migrerAncienneInscription = () => {
  const ancien = stockage("localStorage");
  if (!ancien) return;
  try {
    ancien.removeItem(CLE_INSCRIPTION);
  } catch {
    // stockage indisponible
  }
};

export const lireInscription = () => {
  const s = stockage("sessionStorage");
  if (!s) return {};
  try {
    const donnees = JSON.parse(s.getItem(CLE_INSCRIPTION) || "{}");
    return donnees && typeof donnees === "object" ? nettoyerPourStockage(donnees) : {};
  } catch {
    return {};
  }
};

export const ecrireInscription = (donnees) => {
  const s = stockage("sessionStorage");
  if (!s) return false;
  try {
    s.setItem(CLE_INSCRIPTION, JSON.stringify(nettoyerPourStockage(donnees)));
    return true;
  } catch {
    return false;
  }
};

/** Fusionne des informations (ex. preuve de paiement, réponse de l'API) dans l'inscription conservée. */
export const completerInscription = (partiel) => ecrireInscription({ ...lireInscription(), ...partiel });

export const effacerInscription = () => {
  for (const nom of ["sessionStorage", "localStorage"]) {
    const s = stockage(nom);
    if (!s) continue;
    try {
      s.removeItem(CLE_INSCRIPTION);
    } catch {
      // stockage indisponible
    }
  }
};

/**
 * Données complètes de l'inscription : informations conservées (paiement, matricule…) + données en mémoire
 * (identité, dortoir, santé). Sans données en mémoire (rechargement), la santé est vide.
 */
export const inscriptionComplete = (enMemoire) => {
  const conservees = lireInscription();
  return {
    ...conservees,
    personalInfo: enMemoire?.personalInfo || conservees.personalInfo || {},
    dormitoryInfo: enMemoire?.dormitoryInfo || conservees.dormitoryInfo || {},
    healthInfo: enMemoire?.healthInfo || {},
  };
};
