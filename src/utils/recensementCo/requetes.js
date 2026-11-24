// src/utils/recensementCo/requetes.js
// Construction des corps de requête du recensement CO, strictement selon le contrat d'API
// (dépôt Backend, docs/features/recensement-co.md, section « Public ») : aucun champ supplémentaire.

import { normaliserTelephone, qualitesPourCommission, VALEUR_AUCUNE_COMMISSION } from "./validation";

const texte = (valeur) => (typeof valeur === "string" ? valeur.trim() : "");

export const IDENTIFICATION_VIDE = {
  ancien_membre: "", // « oui » / « non » : choix du parcours, jamais envoyé à l'API
  nom: "",
  prenoms: "",
  telephone: "",
  commission_precedente: "",
};

export const FICHE_VIDE = {
  nom: "",
  prenoms: "",
  sexe: "",
  telephone: "",
  email: "",
  commission: "",
  qualite: "",
  allergies: "",
  antecedents_medicaux: "",
};

/** Libellé comparable (accents, casse et espaces ignorés), comme la normalisation des commissions côté API. */
export const normaliserLibelle = (valeur) =>
  texte(valeur)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");

/** Libellé officiel de la liste correspondant à `valeur`, ou "" s'il n'y en a pas. */
export const libelleOfficiel = (valeur, options = []) => {
  const cible = normaliserLibelle(valeur);
  return (cible && options.find((option) => normaliserLibelle(option) === cible)) || "";
};

/** POST /co/identification. `siteWeb` : valeur du champ piège (vide pour un humain). */
export const construireIdentification = (valeurs, jetonFormulaire, siteWeb = "") => ({
  nom: texte(valeurs.nom),
  prenoms: texte(valeurs.prenoms),
  telephone: normaliserTelephone(valeurs.telephone) || texte(valeurs.telephone),
  commission_precedente:
    !valeurs.commission_precedente || valeurs.commission_precedente === VALEUR_AUCUNE_COMMISSION
      ? null
      : valeurs.commission_precedente,
  jeton_formulaire: jetonFormulaire,
  site_web: typeof siteWeb === "string" ? siteWeb : "",
});

/** POST /co/fiche. Les champs de santé vides sont omis (facultatifs pour l'API). */
export const construireFiche = (valeurs, jetonSession, { supprimerPhoto = false } = {}) => {
  const corps = {
    jeton_session: jetonSession,
    nom: texte(valeurs.nom),
    prenoms: texte(valeurs.prenoms),
    sexe: valeurs.sexe,
    telephone: normaliserTelephone(valeurs.telephone) || texte(valeurs.telephone),
    email: texte(valeurs.email).toLowerCase(),
    commission: valeurs.commission,
    qualite: valeurs.qualite || null, // null : commission sans qualité
    consentement: true,
    supprimer_photo: Boolean(supprimerPhoto),
  };
  for (const champ of ["allergies", "antecedents_medicaux"]) {
    if (texte(valeurs[champ])) {
      corps[champ] = texte(valeurs[champ]);
    }
  }
  return corps;
};

/** POST /co/photo (multipart). */
export const construirePhoto = (jetonPhoto, fichier) => {
  const formulaire = new FormData();
  formulaire.append("jeton_photo", jetonPhoto);
  formulaire.append("photo", fichier, fichier.name || "photo.jpg");
  return formulaire;
};

/** URL de photo affichable : https uniquement (jamais de schéma javascript:, data:, etc.). */
export const urlPhotoSure = (url) => (typeof url === "string" && /^https:\/\//i.test(url) ? url : null);

/**
 * Valeurs de l'étape 2 à partir de la réponse d'identification. Fiche retrouvée : toutes ses informations (santé
 * comprise) ; champs `null` (fiches 2025 incomplètes) complétés par la saisie de l'étape 1. Commission et qualité
 * ramenées aux options de la configuration (sinon vides : à choisir) ; la qualité doit convenir à la commission.
 */
export const valeursFicheInitiales = (
  identification,
  fiche,
  { commissions = [], qualites = [], qualitesParCommission = null } = {}
) => {
  const source = fiche || {};
  const valeur = (champ) => (typeof source[champ] === "string" ? source[champ] : "");
  const valeurs = { ...FICHE_VIDE };
  for (const champ of Object.keys(FICHE_VIDE)) {
    valeurs[champ] = valeur(champ);
  }
  for (const champ of ["nom", "prenoms", "telephone"]) {
    if (!texte(valeurs[champ])) {
      valeurs[champ] = identification[champ] || "";
    }
  }
  valeurs.sexe = ["M", "F"].includes(valeurs.sexe) ? valeurs.sexe : "";
  valeurs.commission = libelleOfficiel(valeurs.commission, commissions);
  valeurs.qualite = qualitesPourCommission(valeurs.commission, qualites, qualitesParCommission).includes(
    valeurs.qualite
  )
    ? valeurs.qualite
    : "";
  return valeurs;
};
