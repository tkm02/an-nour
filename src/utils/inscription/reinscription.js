// src/utils/inscription/reinscription.js
// Réinscription des séminaristes de l'édition précédente (TAF lot 2) — logique pure.
// Contrat : dépôt Backend, docs/features/reinscription-seminaristes.md.

import { ErreurApi, formaterDelai, MESSAGE_SERVEUR, texteNonVide } from "../commun/erreursApi";
import { normaliserTelephone, validerTelephone } from "../commun/telephone";
import { normaliserLibelle } from "../recensementCo/requetes";
import { calculerAge, validerNom } from "../recensementCo/validation";
import { COMMUNES_CI, NIVEAUX_ACADEMIQUES } from "./referentiels";

export const MATRICULE_MAX = 40;

export const RECHERCHE_VIDE = { nom: "", prenom: "", telephone: "", matricule_precedent: "" };
export const CHAMPS_RECHERCHE = ["nom", "prenom", "telephone", "matricule_precedent"];

const texte = (valeur) => (typeof valeur === "string" ? valeur.trim() : "");

// ---------------------------------------------------------------- recherche
export const validerRecherche = (valeurs) => {
  const erreurs = {
    nom: validerNom(valeurs.nom, "Le nom"),
    prenom: validerNom(valeurs.prenom, "Le ou les prénoms"),
    telephone: validerTelephone(valeurs.telephone),
    matricule_precedent: texte(valeurs.matricule_precedent).length > MATRICULE_MAX ? `${MATRICULE_MAX} caractères maximum.` : "",
  };
  return Object.fromEntries(Object.entries(erreurs).filter(([, message]) => message));
};

/** POST /registrations/reinscription/recherche (contrat exact). */
export const construireRecherche = (valeurs, jetonFormulaire, siteWeb = "") => ({
  nom: texte(valeurs.nom),
  prenom: texte(valeurs.prenom),
  // Numéro national à 10 chiffres uniquement (« +225 » / « 00225 » et espaces retirés), jamais la saisie brute
  telephone: normaliserTelephone(valeurs.telephone) || "",
  matricule_precedent: texte(valeurs.matricule_precedent) || null,
  jeton_formulaire: jetonFormulaire,
  site_web: typeof siteWeb === "string" ? siteWeb : "",
});

/** Réponse de recherche exploitable, sinon ErreurApi("reponse"). */
export const verifierReponseRecherche = (reponse) => {
  if (
    !reponse ||
    !["trouve", "nouveau"].includes(reponse.resultat) ||
    typeof reponse.jeton_reinscription !== "string" ||
    !reponse.jeton_reinscription
  ) {
    throw new ErreurApi("reponse");
  }
  return reponse;
};

// ---------------------------------------------------------------- pré-remplissage
/** Âge proposé : calculé depuis la date de naissance, sinon âge de l'an dernier + 1 (modifiable). */
export const agePropose = (fiche, aujourdHui = new Date()) => {
  const age = fiche?.date_naissance ? calculerAge(fiche.date_naissance, aujourdHui) : null;
  if (Number.isInteger(age) && age > 0) return String(age);
  const precedent = Number(fiche?.age_precedent);
  return Number.isInteger(precedent) && precedent > 0 ? String(precedent + 1) : "";
};

const niveauConnu = (niveau) =>
  Object.values(NIVEAUX_ACADEMIQUES).some((niveaux) => niveaux.includes(niveau)) ? niveau : "";

const commune = (valeur) => {
  const v = texte(valeur);
  if (!v) return { communeHabitation: "", communeAutre: "" };
  const connue = COMMUNES_CI.find((c) => c !== "Autre" && c.toLowerCase() === v.toLowerCase());
  return connue ? { communeHabitation: connue, communeAutre: "" } : { communeHabitation: "Autre", communeAutre: v };
};

/**
 * Informations personnelles et de santé de l'inscription de l'an dernier (correspondance complète), au format du
 * formulaire existant. Santé absente → valeurs par défaut du formulaire (« RAS », « Néant »).
 */
export const ficheVersFormulaire = (fiche, aujourdHui = new Date()) => ({
  personalInfo: {
    nom: texte(fiche.nom),
    prenom: texte(fiche.prenom),
    sexe: ["M", "F"].includes(fiche.sexe) ? fiche.sexe : "",
    age: agePropose(fiche, aujourdHui),
    contactParent: normaliserTelephone(fiche.contact_parent || "") || "",
    contactSeminariste: normaliserTelephone(fiche.contact_seminariste || "") || "",
    ...commune(fiche.commune_habitation),
    niveauAcademique: niveauConnu(texte(fiche.niveau_academique)),
  },
  healthInfo: {
    allergie: texte(fiche.allergie) || "RAS",
    antecedentMedical: texte(fiche.antecedent_medical) || "Néant",
  },
});

// ---------------------------------------------------------------- envoi de l'inscription
/**
 * Corps de POST /registrations (structure existante) + `reinscription: {jeton}` si la personne a suivi le parcours
 * de réinscription. `source` = inscription complète (mémoire + preuve de paiement conservée).
 */
export const construireInscription = (source, jetonReinscription = null) => {
  const personnel = source.personalInfo || {};
  const corps = {
    personalInfo: {
      nom: personnel.nom,
      prenom: personnel.prenom,
      sexe: personnel.sexe,
      age: personnel.age,
      communeHabitation: personnel.communeHabitation,
      niveauAcademique: personnel.niveauAcademique,
      communeAutre: personnel.communeAutre || "",
      contactParent: personnel.contactParent,
      contactSeminariste: personnel.contactSeminariste || "",
    },
    dormitoryInfo: {
      dortoir: source.dormitoryInfo?.dortoir,
      dortoirId: source.dormitoryInfo?.dortoirCode,
    },
    healthInfo: {
      allergie: source.healthInfo?.allergie,
      antecedentMedical: source.healthInfo?.antecedentMedical,
    },
    paymentInfo: {
      transactionId: source.paymentInfo?.transactionId,
      receiptUrl: source.paymentInfo?.receiptUrl,
      amount: source.paymentInfo?.amount,
    },
  };
  if (jetonReinscription) {
    corps.reinscription = { jeton: jetonReinscription };
  }
  return corps;
};

// ---------------------------------------------------------------- erreurs
export const MESSAGE_FORMULAIRE_EXPIRE =
  "Pour votre sécurité, le formulaire a expiré. Vos réponses sont conservées : appuyez de nouveau sur « Rechercher ».";
export const MESSAGE_REFUS_REPETE =
  "Votre recherche n'a pas pu être vérifiée. Continuez avec une inscription classique ou contactez l'administration.";
export const MESSAGE_INDISPONIBLE =
  "La recherche est momentanément indisponible. Réessayez dans un instant ou continuez avec une inscription classique.";
export const MESSAGE_CLOSES = "Les inscriptions sont closes pour cette édition.";

/**
 * Erreur de la recherche → {action, message, champs}. `action` : "recommencer" (jeton refusé), "ferme" (403),
 * "corriger" (422), "attendre" (429), "reessayer".
 */
export const interpreterErreurRecherche = (erreur, { maintenant = Date.now() } = {}) => {
  if (!(erreur instanceof ErreurApi)) return { action: "reessayer", message: MESSAGE_SERVEUR, champs: {} };
  if (erreur.type !== "http") {
    const messages = {
      reseau: "Impossible de contacter le serveur. Vérifiez votre connexion internet puis réessayez.",
      delai:
        "Le serveur met trop de temps à répondre. Il est peut-être en cours de démarrage : réessayez dans un instant.",
      configuration:
        "Le formulaire est mal configuré (adresse du serveur manquante). Prévenez l'administration du séminaire.",
      reponse: "Réponse inattendue du serveur. Réessayez dans un instant.",
    };
    return { action: "reessayer", message: messages[erreur.type] || MESSAGE_SERVEUR, champs: {} };
  }
  const detail = texteNonVide(erreur.data?.detail) ? erreur.data.detail.trim() : null;
  switch (erreur.status) {
    case 400:
      return { action: "recommencer", message: MESSAGE_FORMULAIRE_EXPIRE, champs: {} };
    case 403:
      return { action: "ferme", message: detail || MESSAGE_CLOSES, champs: {} };
    case 422: {
      const champs = {};
      for (const item of Array.isArray(erreur.data?.detail) ? erreur.data.detail : []) {
        const loc = Array.isArray(item?.loc) ? item.loc : [];
        const champ = String(loc[loc.length - 1] || "");
        if (CHAMPS_RECHERCHE.includes(champ) && !champs[champ]) {
          champs[champ] =
            item?.type === "value_error" && typeof item.msg === "string" && item.msg.startsWith("Value error, ")
              ? item.msg.slice("Value error, ".length)
              : "Valeur invalide.";
        }
      }
      return { action: "corriger", message: detail || "Certaines informations sont invalides.", champs };
    }
    case 429: {
      const delai = formaterDelai(erreur.retryAfter, maintenant);
      return {
        action: "attendre",
        message: delai ? `Trop de tentatives. Réessayez dans ${delai}.` : "Trop de tentatives. Réessayez plus tard.",
        champs: {},
      };
    }
    case 503:
      return { action: "reessayer", message: MESSAGE_INDISPONIBLE, champs: {} };
    default:
      return { action: "reessayer", message: MESSAGE_SERVEUR, champs: {} };
  }
};

export const AVERTISSEMENT_IDENTITE_MODIFIEE =
  "Vous avez modifié le nom ou le prénom de l'inscription retrouvée : votre inscription sera vérifiée par " +
  "l'administration.";

/** Nom ou prénom différent de celui de l'inscription retrouvée (accents, casse et espaces ignorés). */
export const identiteModifiee = (retrouvee, actuelle) =>
  Boolean(retrouvee) &&
  (normaliserLibelle(retrouvee.nom) !== normaliserLibelle(actuelle?.nom) ||
    normaliserLibelle(retrouvee.prenom) !== normaliserLibelle(actuelle?.prenom));

export const MESSAGE_SESSION_REINSCRIPTION =
  "Votre session de réinscription a expiré et n'a pas pu être renouvelée. Votre paiement est conservé : " +
  "appuyez de nouveau sur « Continuer » dans un instant.";

/**
 * Erreur axios de POST /registrations liée à la réinscription : "deja_inscrit" (409 « déjà inscrit »),
 * "session" (400 jeton de réinscription expiré), sinon null (traitement existant).
 */
export const typeErreurReinscription = (erreurAxios) => {
  const statut = erreurAxios?.response?.status;
  const detail = erreurAxios?.response?.data?.detail;
  const texteDetail = typeof detail === "string" ? detail : "";
  if (statut === 409 && /d[ée]j[àa] inscrit/i.test(texteDetail)) return "deja_inscrit";
  if (statut === 400 && /session|recherche/i.test(texteDetail)) return "session";
  return null;
};
