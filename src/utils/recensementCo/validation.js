// src/utils/recensementCo/validation.js
// Validation côté navigateur du recensement des membres du CO (confort de saisie uniquement : la validation qui
// fait foi est celle de l'API, cf. app/models/recensement_co_schemas.py du dépôt Backend).
// Règles alignées sur l'API : noms 1–80 caractères avec au moins une lettre, âge de 10 à 100 ans, téléphone de
// 10 chiffres (avec ou sans +225 / 00225 / espaces), email valide, textes de santé ≤ 1000 caractères.

export const NOM_MAX = 80;
export const TEXTE_SANTE_MAX = 1000;
export const AGE_MIN = 10;
export const AGE_MAX = 100;
export const INDICATIF_CI = "225";
export const VALEUR_AUCUNE_COMMISSION = "__aucune__";

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

const iso = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Bornes `min` / `max` du champ date (âge de AGE_MIN à AGE_MAX ans). */
export const bornesDateNaissance = (aujourdHui = new Date()) => {
  const max = new Date(aujourdHui.getFullYear() - AGE_MIN, aujourdHui.getMonth(), aujourdHui.getDate());
  const min = new Date(aujourdHui.getFullYear() - AGE_MAX - 1, aujourdHui.getMonth(), aujourdHui.getDate() + 1);
  return { min: iso(min), max: iso(max) };
};

/** Date « AAAA-MM-JJ » → « JJ/MM/AAAA » pour l'affichage. */
export const formaterDate = (valeur) => {
  const date = lireDate(valeur);
  if (!date) {
    return valeur || "";
  }
  return `${String(date.jour).padStart(2, "0")}/${String(date.mois).padStart(2, "0")}/${date.annee}`;
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

export const validerDateNaissance = (valeur, aujourdHui = new Date()) => {
  if (!texte(valeur)) return "La date de naissance est obligatoire.";
  const age = calculerAge(valeur, aujourdHui);
  if (age === null) return "Date invalide (format JJ/MM/AAAA).";
  if (age < AGE_MIN || age > AGE_MAX) return `Date de naissance invalide (âge attendu entre ${AGE_MIN} et ${AGE_MAX} ans).`;
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
export const CHAMPS_IDENTIFICATION = ["nom", "prenoms", "date_naissance", "telephone", "commission_precedente"];
export const CHAMPS_FICHE = [
  "nom", "prenoms", "date_naissance", "sexe", "telephone", "email", "commission", "qualite",
  "allergies", "antecedents_medicaux",
];

/** Erreurs de l'étape 1. `commissionsPrecedentes` : liste de la configuration. */
export const validerIdentification = (valeurs, commissionsPrecedentes = [], aujourdHui = new Date()) =>
  sansVides({
    nom: validerNom(valeurs.nom, "Le nom"),
    prenoms: validerNom(valeurs.prenoms, "Le ou les prénoms"),
    date_naissance: validerDateNaissance(valeurs.date_naissance, aujourdHui),
    telephone: validerTelephone(valeurs.telephone),
    commission_precedente: validerChoix(
      valeurs.commission_precedente,
      [...commissionsPrecedentes, VALEUR_AUCUNE_COMMISSION],
      "Choisissez votre commission de l'édition précédente, ou « Nouveau membre / aucune »."
    ),
  });

/** Erreurs de l'étape 2. `qualites` : codes de la configuration. */
export const validerFiche = (valeurs, { commissions = [], qualites = [] } = {}, aujourdHui = new Date()) =>
  sansVides({
    nom: validerNom(valeurs.nom, "Le nom"),
    prenoms: validerNom(valeurs.prenoms, "Le ou les prénoms"),
    date_naissance: validerDateNaissance(valeurs.date_naissance, aujourdHui),
    sexe: validerChoix(valeurs.sexe, ["M", "F"], "Indiquez votre sexe."),
    telephone: validerTelephone(valeurs.telephone),
    email: validerEmail(valeurs.email),
    commission: validerChoix(valeurs.commission, commissions, "Choisissez votre commission pour cette édition."),
    qualite: validerChoix(valeurs.qualite, qualites, "Choisissez votre qualité."),
    allergies: validerTexteSante(valeurs.allergies),
    antecedents_medicaux: validerTexteSante(valeurs.antecedents_medicaux),
  });

/** Premier champ en erreur selon l'ordre d'affichage. */
export const premierChampEnErreur = (erreurs, ordre) => ordre.find((champ) => erreurs[champ]) || null;
