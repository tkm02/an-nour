import {
  CLE_INSCRIPTION,
  completerInscription,
  ecrireInscription,
  effacerInscription,
  inscriptionComplete,
  lireInscription,
  migrerAncienneInscription,
  nettoyerPourStockage,
} from "./stockage";

// Données fictives uniquement
const INSCRIPTION = {
  personalInfo: { nom: "Test", prenom: "Ali", sexe: "M", age: "16", contactParent: "0700000000" },
  dormitoryInfo: { dortoir: "Dortoir A", dortoirCode: "D-A" },
  healthInfo: { allergie: "Arachide (fictif)", antecedentMedical: "Asthme (fictif)" },
  paymentInfo: { status: "awaiting_proof", amount: 6000 },
  reinscription: { jeton: "jeton-reinscription-fictif" },
  jeton_reinscription: "jeton-reinscription-fictif",
};

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  jest.restoreAllMocks();
});

describe("stockage de l'inscription en cours", () => {
  it("écrit dans sessionStorage, jamais localStorage, sans santé ni jeton", () => {
    ecrireInscription(INSCRIPTION);
    expect(window.localStorage.getItem(CLE_INSCRIPTION)).toBeNull();
    const brut = window.sessionStorage.getItem(CLE_INSCRIPTION);
    expect(brut).not.toMatch(/Arachide|Asthme|healthInfo|jeton|reinscription/);
    expect(JSON.parse(brut).personalInfo.nom).toBe("Test");
  });

  it("complète l'inscription conservée sans jamais y réintroduire la santé", () => {
    ecrireInscription(INSCRIPTION);
    completerInscription({ paymentInfo: { transactionId: "TX-FICTIF-1" }, healthInfo: { allergie: "x" } });
    const lue = lireInscription();
    expect(lue.paymentInfo).toEqual({ transactionId: "TX-FICTIF-1" });
    expect(lue.healthInfo).toBeUndefined();
  });

  it("supprime l'ancienne clé localStorage (migration) et efface les deux stockages", () => {
    window.localStorage.setItem(CLE_INSCRIPTION, JSON.stringify(INSCRIPTION));
    migrerAncienneInscription();
    expect(window.localStorage.getItem(CLE_INSCRIPTION)).toBeNull();
    ecrireInscription(INSCRIPTION);
    effacerInscription();
    expect(window.sessionStorage.getItem(CLE_INSCRIPTION)).toBeNull();
  });

  it("filtre une sauvegarde ancienne qui contiendrait encore la santé", () => {
    window.sessionStorage.setItem(CLE_INSCRIPTION, JSON.stringify(INSCRIPTION));
    expect(lireInscription().healthInfo).toBeUndefined();
    expect(nettoyerPourStockage(null)).toEqual({});
  });

  it("reconstitue l'inscription complète : santé et identité depuis la mémoire, paiement depuis le stockage", () => {
    ecrireInscription({ ...INSCRIPTION, paymentInfo: { transactionId: "TX-FICTIF-1", amount: 6000 } });
    const complete = inscriptionComplete({ ...INSCRIPTION, personalInfo: { nom: "Modifié" } });
    expect(complete.personalInfo).toEqual({ nom: "Modifié" });
    expect(complete.healthInfo.allergie).toBe("Arachide (fictif)");
    expect(complete.paymentInfo.transactionId).toBe("TX-FICTIF-1");
    expect(inscriptionComplete(null).healthInfo).toEqual({});
  });

  it("ne lève jamais d'erreur si le stockage est indisponible", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(ecrireInscription(INSCRIPTION)).toBe(false);
    expect(lireInscription()).toEqual({});
  });
});
