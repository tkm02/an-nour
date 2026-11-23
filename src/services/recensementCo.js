// src/services/recensementCo.js
// Appels publics du recensement des membres du CO (préfixe /api/v1, sans authentification).
// Contrat : dépôt Backend, docs/features/recensement-co.md (section « Public »). Photo : envoyée à l'API
// uniquement (aucun téléversement direct vers Cloudinary).

import { ErreurApi } from "../utils/recensementCo/erreurs";

// L'API gratuite (Render) peut mettre ~50 s à démarrer : délai généreux avant d'abandonner la requête
export const DELAI_REQUETE_MS = 90000;
export const URL_API_DEVELOPPEMENT = "http://localhost:8000";

/**
 * URL de base de l'API (sans /api/v1). Mêmes règles que la centralisation prévue (P-19) : variable obligatoire en
 * production, sans URL de repli, et HTTPS obligatoire en production (données personnelles et de santé).
 * Résolue à l'appel (et non au chargement du module) pour qu'une configuration manquante n'affecte que ce
 * formulaire, avec un message explicite.
 */
export const resoudreUrlApi = ({ REACT_APP_API_URL, NODE_ENV } = {}) => {
  const url = (REACT_APP_API_URL || "").trim().replace(/\/+$/, "");
  if (NODE_ENV === "production" && !/^https:\/\/[^/\s]+/i.test(url)) throw new ErreurApi("configuration");
  return url || URL_API_DEVELOPPEMENT;
};

const urlApi = () =>
  resoudreUrlApi({ REACT_APP_API_URL: process.env.REACT_APP_API_URL, NODE_ENV: process.env.NODE_ENV });

const NON_JSON = Symbol("non-json");

const lireJson = async (reponse) => {
  try {
    return await reponse.json();
  } catch {
    return NON_JSON;
  }
};

const requete = async (chemin, { methode = "GET", json, formulaire, delaiMs = DELAI_REQUETE_MS } = {}) => {
  const url = `${urlApi()}/api/v1${chemin}`;
  const controleur = typeof AbortController !== "undefined" ? new AbortController() : null;
  const minuterie = controleur ? setTimeout(() => controleur.abort(), delaiMs) : null;
  const options = { method: methode, headers: { Accept: "application/json" }, signal: controleur?.signal };
  if (json !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(json);
  } else if (formulaire) {
    options.body = formulaire; // le navigateur fixe Content-Type (multipart + boundary)
  }

  let reponse;
  try {
    reponse = await fetch(url, options);
  } catch (erreur) {
    throw new ErreurApi(erreur?.name === "AbortError" ? "delai" : "reseau");
  } finally {
    if (minuterie) clearTimeout(minuterie);
  }

  const donnees = await lireJson(reponse);
  if (!reponse.ok) {
    throw new ErreurApi("http", {
      status: reponse.status,
      data: donnees === NON_JSON ? null : donnees,
      retryAfter: reponse.headers?.get?.("Retry-After") ?? null,
    });
  }
  // Succès sans corps JSON exploitable (proxy, page d'erreur HTML…) : jamais traité comme une réussite
  if (donnees === NON_JSON || donnees === null || typeof donnees !== "object") {
    throw new ErreurApi("reponse", { status: reponse.status });
  }
  return donnees;
};

/** GET /co/configuration → {ouvert, edition, commissions, commissions_precedentes, qualites, jeton_formulaire, …} */
export const chargerConfiguration = () => requete("/co/configuration");

/** POST /co/identification → {resultat, jeton_session, fiche, deja_soumise, verrouillee} */
export const identifierMembre = (corps) => requete("/co/identification", { methode: "POST", json: corps });

/** POST /co/fiche → 201 {message, reference, jeton_photo} */
export const soumettreFiche = (corps) => requete("/co/fiche", { methode: "POST", json: corps });

/** POST /co/photo (multipart : jeton_photo, photo) → {photo_url} */
export const envoyerPhoto = (formulaire) => requete("/co/photo", { methode: "POST", formulaire });
