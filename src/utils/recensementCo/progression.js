// src/utils/recensementCo/progression.js
// Sauvegarde de la progression du recensement CO dans le stockage de l'ONGLET (sessionStorage : effacé à la
// fermeture de l'onglet, jamais partagé entre onglets), pour survivre à un rechargement ou à une coupure.
// Minimisation (revue de sécurité S1) :
// - seulement ce que l'utilisateur a saisi lui-même (jamais les données renvoyées par le serveur) ;
// - jamais la date de naissance, le téléphone, les champs de santé, les jetons ni la photo ;
// - expiration après 72 h, effacement après un envoi réussi ou à la demande.
// L'ancienne sauvegarde en localStorage (première version du formulaire) est supprimée au chargement.

import { normaliserLibelle } from "./requetes";
import { normaliserTelephone } from "./validation";

export const CLE_PROGRESSION = "annour.recensementCo.v1";
export const DUREE_CONSERVATION_MS = 72 * 3600 * 1000;

// Listes blanches : date de naissance, téléphone et santé n'y figurent volontairement pas
export const CHAMPS_IDENTIFICATION_CONSERVES = ["nom", "prenoms", "commission_precedente"];
export const CHAMPS_FICHE_CONSERVES = ["nom", "prenoms", "sexe", "email", "commission", "qualite"];

const filtrer = (valeurs, champs) => {
  const resultat = {};
  for (const champ of champs) {
    const valeur = valeurs?.[champ];
    if (typeof valeur === "string") {
      resultat[champ] = valeur.slice(0, 254);
    }
  }
  return resultat;
};

const stockage = (nom = "sessionStorage") => {
  try {
    return typeof window !== "undefined" ? window[nom] : null;
  } catch {
    return null; // accès refusé (navigation privée, cookies bloqués)
  }
};

/** Supprime la sauvegarde de la première version (localStorage), qui pouvait contenir date et téléphone. */
export const migrerAncienneProgression = () => {
  const ancien = stockage("localStorage");
  if (!ancien) return;
  try {
    ancien.removeItem(CLE_PROGRESSION);
  } catch {
    // stockage indisponible : rien à supprimer
  }
};

/** Contenu sérialisable (exporté pour les tests). `fiche` = champs saisis par l'utilisateur à l'étape 2. */
export const preparerProgression = ({ identification, fiche } = {}, maintenant = Date.now()) => {
  const ficheFiltree = fiche ? filtrer(fiche, CHAMPS_FICHE_CONSERVES) : {};
  return {
    version: 1,
    enregistreLe: maintenant,
    identification: filtrer(identification, CHAMPS_IDENTIFICATION_CONSERVES),
    fiche: Object.keys(ficheFiltree).length ? ficheFiltree : null,
  };
};

export const enregistrerProgression = (donnees, maintenant = Date.now()) => {
  const s = stockage();
  if (!s) return false;
  try {
    s.setItem(CLE_PROGRESSION, JSON.stringify(preparerProgression(donnees, maintenant)));
    return true;
  } catch {
    return false; // quota dépassé ou stockage indisponible : la saisie continue sans sauvegarde
  }
};

export const effacerProgression = () => {
  const s = stockage();
  if (!s) return;
  try {
    s.removeItem(CLE_PROGRESSION);
  } catch {
    // stockage indisponible : rien à effacer
  }
};

/** Progression valide et non expirée, sinon null (une sauvegarde illisible ou expirée est effacée). */
export const chargerProgression = (maintenant = Date.now()) => {
  migrerAncienneProgression();
  const s = stockage();
  if (!s) return null;
  let brut;
  try {
    brut = s.getItem(CLE_PROGRESSION);
  } catch {
    return null;
  }
  if (!brut) return null;
  try {
    const donnees = JSON.parse(brut);
    const valide =
      donnees &&
      donnees.version === 1 &&
      Number.isFinite(donnees.enregistreLe) &&
      maintenant - donnees.enregistreLe <= DUREE_CONSERVATION_MS &&
      donnees.identification &&
      typeof donnees.identification === "object";
    if (!valide) {
      effacerProgression();
      return null;
    }
    return {
      identification: filtrer(donnees.identification, CHAMPS_IDENTIFICATION_CONSERVES),
      fiche:
        donnees.fiche && typeof donnees.fiche === "object" ? filtrer(donnees.fiche, CHAMPS_FICHE_CONSERVES) : null,
    };
  } catch {
    effacerProgression();
    return null;
  }
};

/**
 * Même identité que la référence `a` : nom et prénoms identiques (accents, casse et espaces ignorés) ; date de
 * naissance et téléphone comparés seulement s'ils sont connus des deux côtés (la sauvegarde de l'onglet ne les
 * contient pas).
 */
export const memeIdentite = (a, b) => {
  if (!a || !b || normaliserLibelle(a.nom) === "") return false;
  const memeSiConnu = (x, y) => !x || !y || x === y;
  return (
    normaliserLibelle(a.nom) === normaliserLibelle(b.nom) &&
    normaliserLibelle(a.prenoms) === normaliserLibelle(b.prenoms) &&
    memeSiConnu(a.date_naissance, b.date_naissance) &&
    memeSiConnu(normaliserTelephone(a.telephone), normaliserTelephone(b.telephone))
  );
};

/**
 * Valeurs de l'étape 2 complétées par les champs saisis par l'utilisateur (sauvegarde de l'onglet) : chaque
 * valeur saisie l'emporte, y compris une valeur volontairement vidée.
 */
export const appliquerFicheSauvegardee = (valeurs, ficheSauvegardee) => {
  if (!ficheSauvegardee) return valeurs;
  const resultat = { ...valeurs };
  for (const champ of Object.keys(valeurs)) {
    if (typeof ficheSauvegardee[champ] === "string") {
      resultat[champ] = ficheSauvegardee[champ];
    }
  }
  return resultat;
};
