// src/utils/recensementCo/validation.js
// Validation côté navigateur du recensement des membres du CO (confort de saisie uniquement : la validation qui
// fait foi est celle de l'API, cf. app/models/recensement_co_schemas.py du dépôt Backend).
// Règles alignées sur l'API : noms 1–80 caractères avec au moins une lettre, téléphone de 10 chiffres (avec ou
// sans +225 / 00225 / espaces), email valide, textes de santé ≤ 1000 caractères. La date de naissance n'est plus
// demandée (décision du 2026-11-22) ; `calculerAge` est conservé pour la réinscription des séminaristes (lot 2).

export const NOM_MAX = 80;
export const TEXTE_SANTE_MAX = 1000;
export const INDICATIF_CI = "225";
// Ancienne option « Nouveau membre / aucune » (sauvegardes d'onglet antérieures) : envoyée comme `null`
export const VALEUR_AUCUNE_COMMISSION = "__aucune__";
// Réponse à « Étiez-vous membre du CO l'an passé ? »
export const ANCIEN_OUI = "oui";
export const ANCIEN_NON = "non";

const LETTRE = /[A-Za-zÀ-ÖØ-öø-ÿ]/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

const texte = (valeur) => (typeof valeur === "string" ? valeur.trim() : "");

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

/** Date « AAAA-MM-JJ » réellement existante → objet {annee, mois, jour}, sinon null. */
const lireDate = (valeur) => {
  const correspondance = DATE_ISO.exec(texte(valeur));
  if (!correspondance) {
    return null;
  }
  const [annee, mois, jour] = correspondance.slice(1).map(Number);
  const date = new Date(Date.UTC(annee, mois - 1, jour));
  if (date.getUTCFullYear() !== annee || date.getUTCMonth() !== mois - 1 || date.getUTCDate() !== jour) {
    return null;
  }
  return { annee, mois, jour };
};

export const calculerAge = (valeur, aujourdHui = new Date()) => {
  const date = lireDate(valeur);
  if (!date) {
    return null;
  }
  const mois = aujourdHui.getMonth() + 1;
  const jour = aujourdHui.getDate();
  const anniversairePasse = mois > date.mois || (mois === date.mois && jour >= date.jour);
  return aujourdHui.getFullYear() - date.annee - (anniversairePasse ? 0 : 1);
};

// ---------------------------------------------------------------------------
// Validateurs de champ : message d'erreur en français, ou "" si la valeur est acceptable
// ---------------------------------------------------------------------------

export const validerNom = (valeur, libelle = "Ce champ") => {
  const v = texte(valeur);
  if (!v) return `${libelle} est obligatoire.`;
  if (v.length > NOM_MAX) return `${NOM_MAX} caractères maximum.`;
  if (!LETTRE.test(v)) return "Ce champ doit contenir des lettres.";
  return "";
};

export const validerTelephone = (valeur) => {
  if (!texte(valeur)) return "Le numéro de téléphone est obligatoire.";
  if (!normaliserTelephone(valeur)) return "Numéro invalide : 10 chiffres, par exemple 07 00 00 00 00.";
  return "";
};

export const validerEmail = (valeur) => {
  const v = texte(valeur);
  if (!v) return "L'adresse email est obligatoire.";
  if (v.length > 254 || !EMAIL.test(v)) return "Adresse email invalide, par exemple nom@exemple.com.";
  return "";
};

export const validerChoix = (valeur, options, message) => {
  const v = texte(valeur);
  if (!v || (Array.isArray(options) && !options.includes(v))) return message;
  return "";
};

export const validerTexteSante = (valeur) =>
  texte(valeur).length > TEXTE_SANTE_MAX ? `${TEXTE_SANTE_MAX} caractères maximum.` : "";

const sansVides = (erreurs) => Object.fromEntries(Object.entries(erreurs).filter(([, message]) => message));

// Ordre des champs = ordre d'affichage (le focus va sur la première erreur)
export const CHAMPS_IDENTIFICATION = ["ancien_membre", "nom", "prenoms", "telephone", "commission_precedente"];
export const CHAMPS_FICHE = [
  "nom", "prenoms", "sexe", "telephone", "email", "commission", "qualite",
  "allergies", "antecedents_medicaux",
];

/**
 * Erreurs de l'étape 1. Réponse « non » : aucun autre champ (la fiche s'ouvre vide). Réponse « oui » : identité,
 * téléphone et commission de l'an passé (`commissionsPrecedentes` : liste de la configuration).
 */
export const validerIdentification = (valeurs, commissionsPrecedentes = []) => {
  const ancien = validerChoix(
    valeurs.ancien_membre,
    [ANCIEN_OUI, ANCIEN_NON],
    "Indiquez si vous étiez membre du CO l'an passé."
  );
  if (ancien || valeurs.ancien_membre === ANCIEN_NON) return sansVides({ ancien_membre: ancien });
  return sansVides({
    nom: validerNom(valeurs.nom, "Le nom"),
    prenoms: validerNom(valeurs.prenoms, "Le ou les prénoms"),
    telephone: validerTelephone(valeurs.telephone),
    commission_precedente: validerChoix(
      valeurs.commission_precedente,
      commissionsPrecedentes,
      "Choisissez votre commission de l'an passé."
    ),
  });
};

/**
 * Codes de qualité proposés pour une commission (`[]` : aucune commission choisie, ou commission sans qualité).
 * `qualitesParCommission` (configuration) : libellé → codes ; commission absente de la table (configuration
 * antérieure à cette règle) : toutes les qualités (`codes`).
 */
export const qualitesPourCommission = (commission, codes = [], qualitesParCommission = null) => {
  if (!texte(commission)) return [];
  if (qualitesParCommission && Object.prototype.hasOwnProperty.call(qualitesParCommission, commission)) {
    const proposees = qualitesParCommission[commission];
    return Array.isArray(proposees) ? proposees : [];
  }
  return codes;
};

/** Vrai si la commission choisie ne demande aucune qualité (Secrétaire Régional, Superviseur…). */
export const commissionSansQualite = (commission, codes = [], qualitesParCommission = null) =>
  Boolean(texte(commission)) && qualitesPourCommission(commission, codes, qualitesParCommission).length === 0;

/**
 * Erreurs de l'étape 2. `qualites` : codes proposés pour la commission choisie (`qualitesPourCommission`) ; liste
 * vide → aucune qualité demandée (commission sans qualité, ou commission non choisie : son erreur suffit).
 */
export const validerFiche = (valeurs, { commissions = [], qualites = [] } = {}) =>
  sansVides({
    nom: validerNom(valeurs.nom, "Le nom"),
    prenoms: validerNom(valeurs.prenoms, "Le ou les prénoms"),
    sexe: validerChoix(valeurs.sexe, ["M", "F"], "Indiquez votre sexe."),
    telephone: validerTelephone(valeurs.telephone),
    email: validerEmail(valeurs.email),
    commission: validerChoix(valeurs.commission, commissions, "Choisissez votre commission pour cette édition."),
    qualite: qualites.length ? validerChoix(valeurs.qualite, qualites, "Choisissez votre qualité.") : "",
    allergies: validerTexteSante(valeurs.allergies),
    antecedents_medicaux: validerTexteSante(valeurs.antecedents_medicaux),
  });

/** Premier champ en erreur selon l'ordre d'affichage. */
export const premierChampEnErreur = (erreurs, ordre) => ordre.find((champ) => erreurs[champ]) || null;
