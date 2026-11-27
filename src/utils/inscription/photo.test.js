import {
  choisirFichier,
  ERREUR_CONSENTEMENT_PHOTO,
  formulairePhoto,
  optionsReprisePhoto,
  PHOTO_VIDE,
  photoDepuisFiche,
  photoRetenue,
  retirerPhoto,
  statutApresCreation,
  validerPhoto,
} from "./photo";

// Données fictives uniquement
const ANCIENNE = "https://res.cloudinary.com/demo/participants_photos/ANNOUR25-TEST-001.jpg";
const fichier = () => new File(["x"], "photo.jpg", { type: "image/jpeg" });

describe("photo d'identité — état", () => {
  test("photo de l'an dernier proposée seulement si l'URL est sûre (https)", () => {
    expect(photoDepuisFiche({ photo_url: ANCIENNE })).toEqual({ ...PHOTO_VIDE, urlPrecedente: ANCIENNE, reprendre: true });
    expect(photoDepuisFiche({ photo_url: "http://exemple.test/photo.jpg" })).toEqual(PHOTO_VIDE);
    expect(photoDepuisFiche({ photo_url: null })).toEqual(PHOTO_VIDE);
  });

  test("photo retenue : nouveau fichier, sinon photo de l'an dernier reprise, sinon aucune", () => {
    expect(photoRetenue(PHOTO_VIDE)).toBeNull();
    const precedente = photoDepuisFiche({ photo_url: ANCIENNE });
    expect(photoRetenue(precedente)).toBe("precedente");
    expect(photoRetenue(choisirFichier(precedente, fichier()))).toBe("nouvelle");
  });

  test("retirer : d'abord le fichier choisi (retour à la photo de l'an dernier), puis la reprise", () => {
    const avecFichier = choisirFichier({ ...photoDepuisFiche({ photo_url: ANCIENNE }), consentement: true }, fichier());
    const sansFichier = retirerPhoto(avecFichier);
    expect(photoRetenue(sansFichier)).toBe("precedente");
    const sansPhoto = retirerPhoto(sansFichier);
    expect(photoRetenue(sansPhoto)).toBeNull();
    expect(sansPhoto.consentement).toBe(false);
  });

  test("consentement exigé dès qu'une photo est retenue, jamais sans photo", () => {
    expect(validerPhoto(PHOTO_VIDE)).toBe("");
    expect(validerPhoto(choisirFichier(PHOTO_VIDE, fichier()))).toBe(ERREUR_CONSENTEMENT_PHOTO);
    expect(validerPhoto({ ...choisirFichier(PHOTO_VIDE, fichier()), consentement: true })).toBe("");
    expect(validerPhoto(photoDepuisFiche({ photo_url: ANCIENNE }))).toBe(ERREUR_CONSENTEMENT_PHOTO);
  });
});

describe("photo d'identité — envoi", () => {
  test("reprise de la photo de l'an dernier envoyée dans `reinscription` seulement si elle est retenue", () => {
    const precedente = { ...photoDepuisFiche({ photo_url: ANCIENNE }), consentement: true };
    expect(optionsReprisePhoto(precedente)).toEqual({ reprendre_photo: true, consentement_photo: true });
    expect(optionsReprisePhoto(choisirFichier(precedente, fichier()))).toEqual({});
    expect(optionsReprisePhoto(PHOTO_VIDE)).toEqual({});
  });

  test("formulaire multipart : jeton, consentement et fichier", () => {
    const formulaire = formulairePhoto("jeton-photo-fictif", fichier());
    expect(formulaire.get("jeton_photo")).toBe("jeton-photo-fictif");
    expect(formulaire.get("consentement_photo")).toBe("true");
    expect(formulaire.get("photo")).toBeInstanceOf(File);
  });

  test("statut après la création de l'inscription", () => {
    const nouvelle = { ...choisirFichier(PHOTO_VIDE, fichier()), consentement: true };
    expect(statutApresCreation(nouvelle, { jeton_photo: "j" })).toBe("a_envoyer");
    expect(statutApresCreation(nouvelle, {})).toBe("echec");
    const precedente = { ...photoDepuisFiche({ photo_url: ANCIENNE }), consentement: true };
    expect(statutApresCreation(precedente, { photo_url: ANCIENNE })).toBe("reprise");
    expect(statutApresCreation(precedente, { photo_url: null })).toBe("absente"); // non liée : photo non reprise
    expect(statutApresCreation(PHOTO_VIDE, { jeton_photo: "j" })).toBe("absente");
  });
});
