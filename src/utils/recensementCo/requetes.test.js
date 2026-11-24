import {
  construireFiche,
  construireIdentification,
  construirePhoto,
  libelleOfficiel,
  urlPhotoSure,
  valeursFicheInitiales,
} from "./requetes";
import { VALEUR_AUCUNE_COMMISSION } from "./validation";

// Données fictives uniquement
const IDENTIFICATION = {
  nom: "  Test ",
  prenoms: "Awa  Fictive",
  telephone: "+225 07 00 00 00 00",
  commission_precedente: "Santé",
};

describe("construireIdentification", () => {
  it("respecte exactement le contrat de POST /co/identification", () => {
    expect(construireIdentification(IDENTIFICATION, "jeton-formulaire-fictif")).toEqual({
      nom: "Test",
      prenoms: "Awa  Fictive",
      telephone: "0700000000",
      commission_precedente: "Santé",
      jeton_formulaire: "jeton-formulaire-fictif",
      site_web: "",
    });
  });

  it("n'envoie jamais la réponse « ancien membre » (choix du parcours, hors contrat)", () => {
    const corps = construireIdentification({ ...IDENTIFICATION, ancien_membre: "oui" }, "j");
    expect(corps).not.toHaveProperty("ancien_membre");
    expect(corps).not.toHaveProperty("date_naissance");
  });

  it("parcours « non » : commission précédente vide envoyée comme null", () => {
    expect(construireIdentification({ ...IDENTIFICATION, commission_precedente: "" }, "j").commission_precedente)
      .toBeNull();
  });

  it("envoie null pour l'ancienne option « Nouveau membre / aucune »", () => {
    const corps = construireIdentification(
      { ...IDENTIFICATION, commission_precedente: VALEUR_AUCUNE_COMMISSION },
      "j"
    );
    expect(corps.commission_precedente).toBeNull();
  });

  it("transmet la valeur du champ piège telle quelle (vide pour un humain)", () => {
    expect(construireIdentification(IDENTIFICATION, "j", "http://spam.example").site_web).toBe("http://spam.example");
    expect(construireIdentification(IDENTIFICATION, "j", undefined).site_web).toBe("");
  });
});

describe("construireFiche", () => {
  const fiche = {
    nom: "Test",
    prenoms: "Awa",
    sexe: "F",
    telephone: "07 00 00 00 00",
    email: " Awa.Test@Exemple.CI ",
    commission: "Santé",
    qualite: "responsable_adjoint",
    allergies: "  ",
    antecedents_medicaux: " Asthme (fictif) ",
  };

  it("respecte le contrat de POST /co/fiche et omet la santé vide", () => {
    expect(construireFiche(fiche, "jeton-session-fictif")).toEqual({
      jeton_session: "jeton-session-fictif",
      nom: "Test",
      prenoms: "Awa",
      sexe: "F",
      telephone: "0700000000",
      email: "awa.test@exemple.ci",
      commission: "Santé",
      qualite: "responsable_adjoint",
      antecedents_medicaux: "Asthme (fictif)",
      consentement: true,
      supprimer_photo: false,
    });
  });

  it("envoie une qualité null pour une commission sans qualité", () => {
    expect(construireFiche({ ...fiche, commission: "Superviseur", qualite: "" }, "j").qualite).toBeNull();
  });

  it("demande la suppression de la photo existante si elle a été retirée", () => {
    expect(construireFiche(fiche, "j", { supprimerPhoto: true }).supprimer_photo).toBe(true);
  });
});

describe("construirePhoto", () => {
  it("construit le multipart jeton_photo + photo", () => {
    const fichier = new File(["x"], "photo.jpg", { type: "image/jpeg" });
    const formulaire = construirePhoto("jeton-photo-fictif", fichier);
    expect(formulaire.get("jeton_photo")).toBe("jeton-photo-fictif");
    expect(formulaire.get("photo")).toBeInstanceOf(File);
    expect(formulaire.get("photo").name).toBe("photo.jpg");
  });
});

describe("libelleOfficiel / urlPhotoSure", () => {
  it("retrouve le libellé officiel sans tenir compte des accents ni de la casse", () => {
    expect(libelleOfficiel("sante", ["Santé", "Logistique"])).toBe("Santé");
    expect(libelleOfficiel("  LOGISTIQUE ", ["Santé", "Logistique"])).toBe("Logistique");
    expect(libelleOfficiel("Ancienne commission", ["Santé"])).toBe("");
    expect(libelleOfficiel(null, ["Santé"])).toBe("");
  });

  it("n'accepte que les URL https", () => {
    expect(urlPhotoSure("https://res.cloudinary.com/demo/photo.jpg")).toBe("https://res.cloudinary.com/demo/photo.jpg");
    expect(urlPhotoSure(["javascript", "alert(1)"].join(":"))).toBeNull();
    expect(urlPhotoSure("http://exemple.ci/a.jpg")).toBeNull();
    expect(urlPhotoSure(null)).toBeNull();
  });
});

describe("valeursFicheInitiales", () => {
  const options = { commissions: ["Santé", "Logistique"], qualites: ["membre", "responsable"] };
  const identification = { ...IDENTIFICATION, nom: "Test", prenoms: "Awa", telephone: "0700000000" };

  it("fiche nouvelle : reprend uniquement l'identité saisie à l'étape 1", () => {
    expect(valeursFicheInitiales(identification, null, options)).toEqual({
      nom: "Test",
      prenoms: "Awa",
      sexe: "",
      telephone: "0700000000",
      email: "",
      commission: "",
      qualite: "",
      allergies: "",
      antecedents_medicaux: "",
    });
  });

  it("fiche retrouvée : pré-remplit tout, santé comprise, et complète les champs null", () => {
    const fiche = {
      nom: "TEST",
      prenoms: null,
      sexe: "F",
      telephone: "0500000000",
      email: "awa.test@exemple.ci",
      commission: "sante",
      qualite: "responsable",
      allergies: "Arachide (fictif)",
      antecedents_medicaux: null,
      photo_url: "https://res.cloudinary.com/demo/photo.jpg",
    };
    expect(valeursFicheInitiales(identification, fiche, options)).toEqual({
      nom: "TEST",
      prenoms: "Awa",
      sexe: "F",
      telephone: "0500000000",
      email: "awa.test@exemple.ci",
      commission: "Santé",
      qualite: "responsable",
      allergies: "Arachide (fictif)",
      antecedents_medicaux: "",
    });
  });

  it("vide une commission ou une qualité absente de la configuration", () => {
    const fiche = { commission: "Commission 2025 dissoute", qualite: "chef", sexe: "X" };
    const valeurs = valeursFicheInitiales(identification, fiche, options);
    expect(valeurs.commission).toBe("");
    expect(valeurs.qualite).toBe("");
    expect(valeurs.sexe).toBe("");
  });

  it("vide une qualité qui ne convient pas à la commission", () => {
    const avecTable = {
      commissions: ["Santé", "Comité Managérial", "Superviseur"],
      qualites: ["membre", "manager_general"],
      qualitesParCommission: { Santé: ["membre"], "Comité Managérial": ["manager_general"], Superviseur: [] },
    };
    const initiales = (commission, qualite) =>
      valeursFicheInitiales(identification, { commission, qualite }, avecTable).qualite;
    expect(initiales("Comité Managérial", "membre")).toBe("");
    expect(initiales("Comité Managérial", "manager_general")).toBe("manager_general");
    expect(initiales("Superviseur", "membre")).toBe("");
    expect(initiales("Santé", "membre")).toBe("membre");
  });
});
