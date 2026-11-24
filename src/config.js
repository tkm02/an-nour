// src/config.js
// Source unique de l'URL de base de l'API (P-19). REACT_APP_API_URL = URL SANS /api/v1 (les appels l'ajoutent).
// Production : variable obligatoire, aucune URL de repli (erreur explicite plutôt qu'un appel silencieux à une
// autre API). Développement et tests : repli sur l'API locale (uvicorn, port 8000 du Backend).

export const URL_API_DEVELOPPEMENT = "http://localhost:8000";

export const resolveApiUrl = ({ REACT_APP_API_URL, NODE_ENV } = {}) => {
  const url = (REACT_APP_API_URL || "").trim().replace(/\/+$/, "");
  if (url) {
    return url;
  }
  if (NODE_ENV === "production") {
    throw new Error(
      "Configuration manquante : REACT_APP_API_URL doit être définie au build de production " +
        "(URL de l'API sans /api/v1, voir .env.example)."
    );
  }
  return URL_API_DEVELOPPEMENT;
};

// Lecture explicite des deux variables : Create React App les remplace par leur valeur au build
export const API_URL = resolveApiUrl({
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  NODE_ENV: process.env.NODE_ENV,
});
