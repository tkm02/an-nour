import {
  appliquerFicheSauvegardee,
  chargerProgression,
  CLE_PROGRESSION,
  DUREE_CONSERVATION_MS,
  effacerProgression,
  enregistrerProgression,
  memeIdentite,
} from "./progression";

// Données fictives uniquement
const IDENTIFICATION = {
  ancien_membre: "oui",
  nom: "Test",
  prenoms: "Awa",
  telephone: "07 00 00 00 00",
  commission_precedente: "Santé",
};
const FICHE = {
  nom: "Test",
  prenoms: "Awa",
  sexe: "F",
  telephone: "0700000000",
  email: "awa.test@exemple.ci",
  commission: "Santé",
  qualite: "membre",
  allergies: "Arachide (fictif)",
  antecedents_medicaux: "Asthme (fictif)",
  jeton_session: "jeton-fictif",
};

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  jest.restoreAllMocks();
});

describe("sauvegarde de la progression (stockage de l'onglet)", () => {
  it("utilise sessionStorage, jamais localStorage", () => {
    enregistrerProgression({ identification: IDENTIFICATION, fiche: FICHE }, 1000);
    expect(window.sessionStorage.getItem(CLE_PROGRESSION)).not.toBeNull();
    expect(window.localStorage.getItem(CLE_PROGRESSION)).toBeNull();
  });

  it("n'enregistre ni téléphone, ni santé, ni jetons", () => {
    expect(CLE_PROGRESSION).toMatch(/v1$/);
    enregistrerProgression({ identification: { ...IDENTIFICATION, jeton_formulaire: "j" }, fiche: FICHE }, 1000);
    const brut = window.sessionStorage.getItem(CLE_PROGRESSION);
    expect(brut).not.toMatch(/0700000000|07 00|Arachide|Asthme|allergies|antecedents|jeton|telephone/);
    const donnees = JSON.parse(brut);
    expect(Object.keys(donnees.identification).sort()).toEqual(["ancien_membre", "commission_precedente", "nom", "prenoms"]);
    expect(Object.keys(donnees.fiche).sort()).toEqual(["commission", "email", "nom", "prenoms", "qualite", "sexe"]);
  });

  it("supprime au chargement l'ancienne sauvegarde localStorage (migration)", () => {
    window.localStorage.setItem(CLE_PROGRESSION, JSON.stringify({ version: 1, identification: IDENTIFICATION }));
    chargerProgression();
    expect(window.localStorage.getItem(CLE_PROGRESSION)).toBeNull();
  });

  it("recharge une progression récente de l'onglet", () => {
    enregistrerProgression({ identification: IDENTIFICATION, fiche: { email: "awa.test@exemple.ci" } }, 1000);
    const progression = chargerProgression(1000 + 60 * 1000);
    expect(progression.identification).toEqual({
      ancien_membre: "oui",
      nom: "Test",
      prenoms: "Awa",
      commission_precedente: "Santé",
    });
    expect(progression.fiche).toEqual({ email: "awa.test@exemple.ci" });
  });

  it("efface une progression expirée, d'une autre version ou illisible", () => {
    enregistrerProgression({ identification: IDENTIFICATION, fiche: null }, 1000);
    expect(chargerProgression(1000 + DUREE_CONSERVATION_MS + 1)).toBeNull();
    expect(window.sessionStorage.getItem(CLE_PROGRESSION)).toBeNull();

    window.sessionStorage.setItem(CLE_PROGRESSION, JSON.stringify({ version: 2, enregistreLe: 1000, identification: {} }));
    expect(chargerProgression(1000)).toBeNull();

    window.sessionStorage.setItem(CLE_PROGRESSION, "{pas du json");
    expect(chargerProgression(1000)).toBeNull();
    expect(window.sessionStorage.getItem(CLE_PROGRESSION)).toBeNull();
  });

  it("efface la progression à la demande", () => {
    enregistrerProgression({ identification: IDENTIFICATION, fiche: null });
    effacerProgression();
    expect(chargerProgression()).toBeNull();
  });

  it("ne lève jamais d'erreur si le stockage est indisponible", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(enregistrerProgression({ identification: IDENTIFICATION })).toBe(false);
    expect(chargerProgression()).toBeNull();
    expect(() => effacerProgression()).not.toThrow();
  });
});

describe("memeIdentite / appliquerFicheSauvegardee", () => {
  it("compare l'identité sans tenir compte des accents, de la casse ni du format du téléphone", () => {
    expect(memeIdentite(IDENTIFICATION, { ...IDENTIFICATION, nom: "TÉST ", telephone: "+2250700000000" })).toBe(true);
    expect(memeIdentite(IDENTIFICATION, { ...IDENTIFICATION, telephone: "0500000000" })).toBe(false);
    expect(memeIdentite(IDENTIFICATION, { ...IDENTIFICATION, prenoms: "Fatou" })).toBe(false);
    expect(memeIdentite(null, IDENTIFICATION)).toBe(false);
    expect(memeIdentite({ nom: "" }, { nom: "" })).toBe(false);
  });

  it("ignore date et téléphone absents de la référence (sauvegarde de l'onglet)", () => {
    expect(memeIdentite({ nom: "Test", prenoms: "Awa" }, IDENTIFICATION)).toBe(true);
  });

  it("applique chaque valeur saisie, y compris une valeur volontairement vidée", () => {
    const valeurs = { nom: "TEST", email: "serveur@exemple.ci", qualite: "membre" };
    expect(appliquerFicheSauvegardee(valeurs, { email: "", qualite: "responsable", inconnu: "x" })).toEqual({
      nom: "TEST",
      email: "",
      qualite: "responsable",
    });
    expect(appliquerFicheSauvegardee(valeurs, null)).toBe(valeurs);
  });
});
