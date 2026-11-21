// src/utils/inscription/statut.js
// État public des inscriptions (GET /registrations/status → {open, fee, close_at}).

const FUSEAU = "Africa/Abidjan"; // heure de Côte d'Ivoire (UTC+0)

/** « mercredi 2 décembre 2026 à 23 h 59 » à partir de `close_at` (ISO 8601), ou null si absent/invalide. */
export const formaterCloture = (closeAt) => {
  if (typeof closeAt !== "string" || !closeAt.trim()) return null;
  const date = new Date(closeAt);
  if (Number.isNaN(date.getTime())) return null;
  const jour = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: FUSEAU,
  });
  const heure = date
    .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: FUSEAU })
    .replace(":", " h ");
  return `${jour} à ${heure}`;
};

/** Inscriptions explicitement closes (open === false) ; état inconnu → considérées ouvertes (l'API tranche). */
export const inscriptionsCloses = (statut) => Boolean(statut) && statut.open === false;
