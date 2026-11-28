// src/utils/inscription/referentiels.js
// Listes du formulaire d'inscription des séminaristes (déplacées telles quelles depuis StepPersonalInfo.jsx pour
// être partagées avec le pré-remplissage de la réinscription).

export const NIVEAUX_ACADEMIQUES = {
  Primaire: ["CP1", "CP2", "CE1", "CE2", "CM1", "CM2"],
  Collège: ["6ème", "5ème", "4ème", "3ème"],
  Lycée: ["2nde", "1ère", "Terminale"],
  Licence: ["Licence 1", "Licence 2", "Licence 3"],
  Master: ["Master 1", "Master 2"],
  Prepa: ["Prepa 1", "Prepa 2"],
  Ingenieur: ["Ingenieur 1", "Ingenieur 2", "Ingenieur 3"],
  Bts: ["Bts 1", "Bts 2"],
  Doctorat: ["Doctorat 1", "Doctorat 2", "Doctorat 3"],
  Professionnel: ["Professionnel"],
};

export const COMMUNES_CI = [
  "Abobo",
  "Adjamé",
  "Attécoubé",
  "Cocody",
  "Koumassi",
  "Marcory",
  "Plateau",
  "Port-Bouët",
  "Treichville",
  "Yopougon",
  "Bingerville",
  "Songon",
  "Anyama",
  "Bouaké",
  "Daloa",
  "Korhogo",
  "San-Pédro",
  "Yamoussoukro",
  "Man",
  "Gagnoa",
  "Divo",
  "Abengourou",
  "Agboville",
  "Grand-Bassam",
  "Autre",
];

/** Cycle (clé de NIVEAUX_ACADEMIQUES) contenant ce niveau, ou "". */
export const cycleDuNiveau = (niveau) =>
  Object.keys(NIVEAUX_ACADEMIQUES).find((cycle) => NIVEAUX_ACADEMIQUES[cycle].includes(niveau)) || "";
