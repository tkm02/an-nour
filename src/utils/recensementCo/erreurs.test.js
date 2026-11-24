import {
  ErreurApi,
  erreursParChamp,
  formaterDelai,
  interpreterErreur,
  interpreterErreurPhoto,
  MESSAGE_CONFIGURATION,
  MESSAGE_PHOTO_DELAI,
  MESSAGE_PHOTO_FICHE_VALIDEE,
  MESSAGE_REPONSE_INVALIDE,
  MESSAGE_DELAI,
  MESSAGE_FERME,
  MESSAGE_RESEAU,
  MESSAGE_SERVEUR,
  MESSAGE_SESSION,
  MESSAGE_VALIDATION,
} from "./erreurs";

const http = (status, data, retryAfter = null) => new ErreurApi("http", { status, data, retryAfter });
const CHAMPS = ["nom", "email", "date_naissance", "telephone"];

describe("interpreterErreur", () => {
  it("erreur réseau et délai dépassé : réessayer", () => {
    expect(interpreterErreur(new ErreurApi("reseau"))).toEqual({ action: "reessayer", message: MESSAGE_RESEAU, champs: {} });
    expect(interpreterErreur(new ErreurApi("delai")).message).toBe(MESSAGE_DELAI);
  });

  it("configuration manquante : message explicite, sans action", () => {
    expect(interpreterErreur(new ErreurApi("configuration"))).toEqual({
      action: "aucune",
      message: MESSAGE_CONFIGURATION,
      champs: {},
    });
  });

  it("400 (jeton refusé) : recommencer avec le texte de l'API", () => {
    const resultat = interpreterErreur(http(400, { detail: "Formulaire expiré ou envoyé trop vite, veuillez réessayer" }));
    expect(resultat.action).toBe("recommencer");
    expect(resultat.message).toBe("Formulaire expiré ou envoyé trop vite, veuillez réessayer");
    expect(interpreterErreur(http(400, null)).message).toBe(MESSAGE_SESSION);
  });

  it("réponse inattendue (corps non JSON ou incomplet) : réessayer sans risque de doublon", () => {
    expect(interpreterErreur(new ErreurApi("reponse"))).toEqual({
      action: "reessayer",
      message: MESSAGE_REPONSE_INVALIDE,
      champs: {},
    });
  });

  it("409 envoi concurrent : message de l'API, sans verrouiller", () => {
    expect(interpreterErreur(http(409, { detail: "Envoi déjà en cours, patientez quelques secondes" }))).toEqual({
      action: "attendre",
      message: "Envoi déjà en cours, patientez quelques secondes",
      champs: {},
    });
  });

  it("422 « Commission inconnue » : rattaché au champ indiqué", () => {
    const resultat = interpreterErreur(http(422, { detail: "Commission inconnue" }), {
      champsConnus: ["commission"],
      champsTexte: { "commission inconnue": "commission" },
    });
    expect(resultat.champs).toEqual({ commission: "Commission inconnue : choisissez une valeur dans la liste." });
  });

  it("409 : fiche verrouillée", () => {
    const resultat = interpreterErreur(
      http(409, { detail: "Votre fiche a déjà été validée : contactez l'administration pour la modifier" })
    );
    expect(resultat.action).toBe("verrouillee");
    expect(resultat.message).toMatch(/déjà été validée/);
  });

  it("422 texte : message de l'API", () => {
    expect(interpreterErreur(http(422, { detail: "Commission inconnue" }), { champsConnus: CHAMPS })).toEqual({
      action: "corriger",
      message: "Commission inconnue",
      champs: {},
    });
  });

  it("422 Pydantic : message général et message par champ, jamais le tableau brut", () => {
    const detail = [
      {
        type: "value_error",
        loc: ["body", "email"],
        msg: "value is not a valid email address: An email address must have an @-sign.",
      },
      { type: "value_error", loc: ["body", "date_naissance"], msg: "Value error, Date de naissance invalide" },
      { type: "missing", loc: ["body", "telephone"], msg: "Field required" },
      { type: "extra_forbidden", loc: ["body", "inconnu"], msg: "Extra inputs are not permitted" },
    ];
    const resultat = interpreterErreur(http(422, { detail }), { champsConnus: CHAMPS });
    expect(resultat.action).toBe("corriger");
    expect(resultat.message).toBe(MESSAGE_VALIDATION);
    expect(resultat.champs).toEqual({
      email: "Adresse email invalide.",
      date_naissance: "Date de naissance invalide.",
      telephone: "Ce champ est obligatoire.",
    });
  });

  it("429 : délai issu de Retry-After", () => {
    expect(interpreterErreur(http(429, { detail: "Trop de requêtes" }, "840")).message).toBe(
      "Trop de tentatives. Réessayez dans 14 minutes."
    );
    expect(interpreterErreur(http(429, null, "30")).message).toBe("Trop de tentatives. Réessayez dans 30 secondes.");
    expect(interpreterErreur(http(429, null)).message).toBe("Trop de tentatives. Réessayez dans quelques minutes.");
    expect(interpreterErreur(http(429, null)).action).toBe("attendre");
  });

  it("503 : recensement fermé", () => {
    expect(interpreterErreur(http(503, { detail: "Le recensement du comité d'organisation n'est pas ouvert" }))).toEqual({
      action: "ferme",
      message: MESSAGE_FERME,
      champs: {},
    });
  });

  it("413 et 502 : texte de l'API ; 500 : message générique (aucun détail interne)", () => {
    expect(interpreterErreur(http(413, { detail: "Image trop volumineuse (maximum 5 Mo)" })).message).toBe(
      "Image trop volumineuse (maximum 5 Mo)"
    );
    expect(interpreterErreur(http(502, { detail: "Service de stockage des photos indisponible" })).message).toBe(
      "Service de stockage des photos indisponible"
    );
    expect(interpreterErreur(http(500, { detail: "Erreur interne du serveur", request_id: "abc" })).message).toBe(
      MESSAGE_SERVEUR
    );
  });

  it("erreur inattendue (hors API) : message générique", () => {
    expect(interpreterErreur(new Error("boom")).message).toBe(MESSAGE_SERVEUR);
  });
});

describe("interpreterErreurPhoto", () => {
  it("jeton photo expiré (400) : message dédié, sans nouvel essai", () => {
    expect(interpreterErreurPhoto(http(400, { detail: "Session expirée ou invalide, veuillez recommencer" }))).toEqual({
      message: MESSAGE_PHOTO_DELAI,
      reessayable: false,
    });
  });

  it("image refusée (400) : texte de l'API, sans nouvel essai", () => {
    const detail = "Le fichier doit être une image JPEG, PNG ou WEBP valide";
    expect(interpreterErreurPhoto(http(400, { detail }))).toEqual({ message: detail, reessayable: false });
  });

  it("fiche validée entre-temps (409) et recensement fermé (503) : sans nouvel essai", () => {
    expect(interpreterErreurPhoto(http(409, { detail: "x" }))).toEqual({
      message: MESSAGE_PHOTO_FICHE_VALIDEE,
      reessayable: false,
    });
    expect(interpreterErreurPhoto(http(503, null))).toEqual({ message: MESSAGE_FERME, reessayable: false });
  });

  it("stockage indisponible (502) ou réseau : nouvel essai possible", () => {
    expect(interpreterErreurPhoto(http(502, { detail: "Service de stockage des photos indisponible" }))).toEqual({
      message: "Service de stockage des photos indisponible",
      reessayable: true,
    });
    expect(interpreterErreurPhoto(new ErreurApi("reseau"))).toEqual({ message: MESSAGE_RESEAU, reessayable: true });
  });
});

describe("formaterDelai", () => {
  it("gère secondes, minutes, date HTTP et valeurs absentes", () => {
    expect(formaterDelai("1")).toBe("1 seconde");
    expect(formaterDelai("61")).toBe("2 minutes");
    expect(formaterDelai("Sat, 21 Nov 2026 10:05:00 GMT", Date.parse("Sat, 21 Nov 2026 10:00:00 GMT"))).toBe(
      "5 minutes"
    );
    expect(formaterDelai(null)).toBeNull();
    expect(formaterDelai("pas une date")).toBeNull();
  });
});

describe("erreursParChamp", () => {
  it("ignore un detail qui n'est pas une liste", () => {
    expect(erreursParChamp("texte", CHAMPS)).toEqual({});
  });
});
