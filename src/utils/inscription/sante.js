// Consentement aux données de santé de l'inscription (TAF lot 4, décision D4 du 2026-11-28).
// L'API exige `healthInfo.consentementSante = true` dès qu'une allergie ou un antécédent est déclaré
// (Backend : app/models/schemas.py SANTE_SANS_OBJET, app/routes/registrations.py CONSENTEMENT_SANTE_VERSION).
// Toute modification du texte affiché impose une nouvelle version côté API (actuelle : 2026-11-sante-v1).

// Valeurs signifiant « rien à signaler » : mêmes valeurs que l'API (casse et espaces ignorés)
const SANS_OBJET = new Set(["", "ras", "néant", "neant", "aucun", "aucune", "rien", "non", "-"]);

/** Vrai si une allergie ou un antécédent est réellement déclaré (consentement alors obligatoire). */
export const santeRenseignee = (healthInfo = {}) =>
  [healthInfo.allergie, healthInfo.antecedentMedical].some(
    (valeur) => !SANS_OBJET.has(String(valeur ?? "").trim().toLowerCase())
  );

export const CONSENTEMENT_SANTE_REQUIS =
  "Votre accord est nécessaire pour enregistrer ces informations de santé (ou choisissez « RAS » / « Néant »).";
