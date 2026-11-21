// src/services/clientApi.js
// Client HTTP (fetch) des formulaires publics récents (recensement CO, réinscription des séminaristes) :
// préfixe /api/v1, délai long (API en veille sur Render), erreurs typées `ErreurApi`, aucune URL de repli en
// production. Le parcours d'inscription historique (axios) n'est pas concerné.

import { ErreurApi } from "../utils/commun/erreursApi";

// L'API gratuite (Render) peut mettre ~50 s à démarrer : délai généreux avant d'abandonner la requête
export const DELAI_REQUETE_MS = 90000;
export const URL_API_DEVELOPPEMENT = "http://localhost:8000";

/**
 * URL de base de l'API (sans /api/v1). Mêmes règles que la centralisation prévue (P-19) : variable obligatoire en
 * production, sans URL de repli, et HTTPS obligatoire en production (données personnelles et de santé).
 * Résolue à l'appel (et non au chargement du module) pour qu'une configuration manquante n'affecte que les
 * formulaires qui utilisent ce client, avec un message explicite.
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

export const requete = async (chemin, { methode = "GET", json, formulaire, delaiMs = DELAI_REQUETE_MS } = {}) => {
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
