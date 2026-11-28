import { ErreurApi } from "../commun/erreursApi";
import {
  agePropose,
  construireInscription,
  construireRecherche,
  ficheVersFormulaire,
  identiteModifiee,
  interpreterErreurRecherche,
  MESSAGE_FORMULAIRE_EXPIRE,
  MESSAGE_INDISPONIBLE,
  typeErreurReinscription,
  validerRecherche,
  verifierReponseRecherche,
} from "./reinscription";

const AUJOURDHUI = new Date(2026, 10, 21);
const http = (status, data, retryAfter = null) => new ErreurApi("http", { status, data, retryAfter });

// Données fictives uniquement
const FICHE = {
  nom: "TEST",
  prenom: "Ali",
  sexe: "M",
  date_naissance: "2010-03-10",
  age_precedent: 15,
  niveau_academique: "3ème",
  commune_habitation: "cocody",
  contact_parent: "+225 07 00 00 00 00",
  contact_seminariste: null,
  allergie: "Arachide (fictif)",
  antecedent_medical: null,
  matricule_precedent: "AN25-TEST-001",
};

describe("recherche", () => {
  it("valide nom, prénom, téléphone ; matricule facultatif", () => {
    expect(validerRecherche({ nom: "Test", prenom: "Ali", telephone: "0700000000", matricule_precedent: "" })).toEqual({});
    expect(Object.keys(validerRecherche({ nom: "", prenom: "", telephone: "07", matricule_precedent: "x".repeat(41) }))).toEqual([
      "nom",
      "prenom",
      "telephone",
      "matricule_precedent",
    ]);
  });

  it("construit exactement le corps du contrat", () => {
    expect(
      construireRecherche(
        { nom: " Test ", prenom: "Ali", telephone: "+225 07 00 00 00 00", matricule_precedent: "  " },
        "jeton-formulaire-fictif"
      )
    ).toEqual({
      nom: "Test",
      prenom: "Ali",
      telephone: "0700000000",
      matricule_precedent: null,
      jeton_formulaire: "jeton-formulaire-fictif",
      site_web: "",
    });
    expect(
      construireRecherche({ nom: "T", prenom: "A", telephone: "0700000000", matricule_precedent: " AN25-1 " }, "j", "spam")
    ).toMatchObject({ matricule_precedent: "AN25-1", site_web: "spam" });
  });

  it("n'accepte que 10 chiffres pour le téléphone (aligné sur l'API)", () => {
    expect(validerRecherche({ nom: "Test", prenom: "Ali", telephone: "07000000", matricule_precedent: "" })).toHaveProperty(
      "telephone"
    );
    expect(validerRecherche({ nom: "Test", prenom: "Ali", telephone: "00225 0700000000" })).toEqual({});
    expect(construireRecherche({ nom: "T", prenom: "A", telephone: "07000000" }, "j").telephone).toBe("");
  });

  it("détecte une modification du nom ou du prénom retrouvés (accents, casse et espaces ignorés)", () => {
    const retrouvee = { nom: "TEST", prenom: "Ali" };
    expect(identiteModifiee(retrouvee, { nom: " test ", prenom: "ALI" })).toBe(false);
    expect(identiteModifiee(retrouvee, { nom: "Testé", prenom: "Ali" })).toBe(true);
    expect(identiteModifiee(retrouvee, { nom: "TEST", prenom: "Ali Ben" })).toBe(true);
    expect(identiteModifiee(null, { nom: "x", prenom: "y" })).toBe(false);
  });

  it("refuse une réponse inattendue", () => {
    expect(() => verifierReponseRecherche({ resultat: "trouve" })).toThrow(ErreurApi);
    expect(() => verifierReponseRecherche(null)).toThrow(ErreurApi);
    const ok = { resultat: "nouveau", jeton_reinscription: "j" };
    expect(verifierReponseRecherche(ok)).toBe(ok);
  });
});

describe("pré-remplissage", () => {
  it("âge : calculé depuis la date de naissance, sinon âge de l'an dernier + 1", () => {
    expect(agePropose(FICHE, AUJOURDHUI)).toBe("16");
    expect(agePropose({ ...FICHE, date_naissance: null }, AUJOURDHUI)).toBe("16");
    expect(agePropose({ age_precedent: 9 }, AUJOURDHUI)).toBe("10");
    expect(agePropose({}, AUJOURDHUI)).toBe("");
  });

  it("convertit la fiche au format du formulaire existant (santé comprise)", () => {
    expect(ficheVersFormulaire(FICHE, AUJOURDHUI)).toEqual({
      personalInfo: {
        nom: "TEST",
        prenom: "Ali",
        sexe: "M",
        age: "16",
        contactParent: "0700000000",
        contactSeminariste: "",
        communeHabitation: "Cocody",
        communeAutre: "",
        niveauAcademique: "3ème",
      },
      healthInfo: { allergie: "Arachide (fictif)", antecedentMedical: "Néant" },
    });
  });

  it("commune inconnue → « Autre » précisée ; niveau hors liste → à choisir", () => {
    const { personalInfo } = ficheVersFormulaire(
      { ...FICHE, commune_habitation: "Bassam Village", niveau_academique: "Seconde C" },
      AUJOURDHUI
    );
    expect(personalInfo.communeHabitation).toBe("Autre");
    expect(personalInfo.communeAutre).toBe("Bassam Village");
    expect(personalInfo.niveauAcademique).toBe("");
  });
});

describe("construireInscription", () => {
  const source = {
    personalInfo: { nom: "Test", prenom: "Ali", sexe: "M", age: "16", communeHabitation: "Cocody", niveauAcademique: "2nde", contactParent: "0700000000" },
    dormitoryInfo: { dortoir: "Dortoir A", dortoirCode: "D-A" },
    healthInfo: { allergie: "RAS", antecedentMedical: "Néant" },
    paymentInfo: { transactionId: "TX-FICTIF-1", receiptUrl: "https://res.cloudinary.com/demo/r.jpg", amount: 6000 },
  };

  it("conserve la structure existante et n'ajoute rien sans réinscription", () => {
    const corps = construireInscription(source);
    expect(corps).not.toHaveProperty("reinscription");
    expect(corps.dormitoryInfo).toEqual({ dortoir: "Dortoir A", dortoirId: "D-A" });
    expect(corps.personalInfo).toMatchObject({ communeAutre: "", contactSeminariste: "" });
  });

  it("transmet le consentement santé (faux par défaut)", () => {
    expect(construireInscription(source).healthInfo).toEqual({
      allergie: "RAS", antecedentMedical: "Néant", consentementSante: false,
    });
    const avecSante = { ...source, healthInfo: { allergie: "Arachide (fictif)", consentementSante: true } };
    expect(construireInscription(avecSante).healthInfo.consentementSante).toBe(true);
  });

  it("ajoute reinscription: {jeton} dans le parcours « Oui »", () => {
    expect(construireInscription(source, "jeton-reinscription-fictif").reinscription).toEqual({
      jeton: "jeton-reinscription-fictif",
    });
  });
});

describe("erreurs", () => {
  it("recherche : jeton refusé, fermeture, 422, 429, 503, réseau", () => {
    expect(interpreterErreurRecherche(http(400, { detail: "x" }))).toMatchObject({
      action: "recommencer",
      message: MESSAGE_FORMULAIRE_EXPIRE,
    });
    expect(interpreterErreurRecherche(http(403, { detail: "Les inscriptions sont closes pour cette édition" }))).toMatchObject({
      action: "ferme",
    });
    expect(
      interpreterErreurRecherche(
        http(422, { detail: [{ type: "value_error", loc: ["body", "telephone"], msg: "Value error, Numéro invalide" }] })
      ).champs
    ).toEqual({ telephone: "Numéro invalide" });
    expect(interpreterErreurRecherche(http(429, null, "120")).message).toBe("Trop de tentatives. Réessayez dans 2 minutes.");
    expect(interpreterErreurRecherche(http(503, null)).message).toBe(MESSAGE_INDISPONIBLE);
    expect(interpreterErreurRecherche(new ErreurApi("reseau")).message).toMatch(/Impossible de contacter le serveur/);
  });

  it("envoi final : distingue « déjà inscrit », session expirée et autres erreurs", () => {
    const axiosErreur = (status, detail) => ({ response: { status, data: { detail } } });
    expect(typeErreurReinscription(axiosErreur(409, "Vous êtes déjà inscrit(e) pour cette édition"))).toBe("deja_inscrit");
    expect(typeErreurReinscription(axiosErreur(409, "L'ID de transaction fourni a déjà été utilisée"))).toBeNull();
    expect(typeErreurReinscription(axiosErreur(400, "Session expirée, veuillez recommencer la recherche"))).toBe("session");
    expect(typeErreurReinscription(axiosErreur(400, "Ce dortoir est réservé au genre F"))).toBeNull();
    expect(typeErreurReinscription(new Error("réseau"))).toBeNull();
  });
});
