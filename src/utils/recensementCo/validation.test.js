import {
  bornesDateNaissance,
  calculerAge,
  formaterDate,
  formaterTelephone,
  normaliserTelephone,
  premierChampEnErreur,
  CHAMPS_FICHE,
  validerDateNaissance,
  validerEmail,
  validerFiche,
  validerIdentification,
  validerNom,
  validerTelephone,
  VALEUR_AUCUNE_COMMISSION,
} from "./validation";

const AUJOURDHUI = new Date(2026, 10, 21); // 21/11/2026

describe("normaliserTelephone", () => {
  it.each([
    ["0700000000", "0700000000"],
    ["07 00 00 00 00", "0700000000"],
    ["07.00.00-00-00", "0700000000"],
    ["+225 07 00 00 00 00", "0700000000"],
    ["+2250700000000", "0700000000"],
    ["00225 07 00 00 00 00", "0700000000"],
    ["225 0700000000", "0700000000"],
  ])("%s → %s", (saisie, attendu) => {
    expect(normaliserTelephone(saisie)).toBe(attendu);
  });

  it.each(["", "   ", "07000000", "070000000000", "abc", null, undefined, "+33 6 00 00 00 00"])(
    "refuse %p",
    (saisie) => {
      expect(normaliserTelephone(saisie)).toBeNull();
    }
  );
});

describe("formaterTelephone", () => {
  it("regroupe les chiffres par deux", () => {
    expect(formaterTelephone("+2250700000000")).toBe("07 00 00 00 00");
  });
  it("laisse une saisie invalide inchangée", () => {
    expect(formaterTelephone("0700")).toBe("0700");
    expect(formaterTelephone("")).toBe("");
  });
});

describe("dates", () => {
  it("calcule l'âge en tenant compte de l'anniversaire", () => {
    expect(calculerAge("2000-11-21", AUJOURDHUI)).toBe(26);
    expect(calculerAge("2000-11-22", AUJOURDHUI)).toBe(25);
    expect(calculerAge("2000-02-30", AUJOURDHUI)).toBeNull();
    expect(calculerAge("21/11/2000", AUJOURDHUI)).toBeNull();
  });

  it("accepte un âge de 10 à 100 ans (règle de l'API)", () => {
    expect(validerDateNaissance("2016-11-21", AUJOURDHUI)).toBe("");
    expect(validerDateNaissance("1926-11-21", AUJOURDHUI)).toBe("");
    expect(validerDateNaissance("2016-11-22", AUJOURDHUI)).toMatch(/entre 10 et 100 ans/);
    expect(validerDateNaissance("1925-11-21", AUJOURDHUI)).toMatch(/entre 10 et 100 ans/);
    expect(validerDateNaissance("", AUJOURDHUI)).toMatch(/obligatoire/);
    expect(validerDateNaissance("2000-13-01", AUJOURDHUI)).toMatch(/invalide/);
  });

  it("fournit des bornes cohérentes avec la validation", () => {
    const { min, max } = bornesDateNaissance(AUJOURDHUI);
    expect(max).toBe("2016-11-21");
    expect(min).toBe("1925-11-22");
    expect(validerDateNaissance(min, AUJOURDHUI)).toBe("");
    expect(validerDateNaissance(max, AUJOURDHUI)).toBe("");
  });

  it("formate une date pour l'affichage", () => {
    expect(formaterDate("1998-03-07")).toBe("07/03/1998");
    expect(formaterDate("")).toBe("");
  });
});

describe("validateurs de champ", () => {
  it("exige un nom avec des lettres, 80 caractères au plus", () => {
    expect(validerNom("Koné", "Le nom")).toBe("");
    expect(validerNom("  ", "Le nom")).toBe("Le nom est obligatoire.");
    expect(validerNom("1234")).toMatch(/lettres/);
    expect(validerNom("a".repeat(81))).toMatch(/80 caractères/);
  });

  it("valide l'email", () => {
    expect(validerEmail("membre.test@exemple.ci")).toBe("");
    expect(validerEmail("")).toMatch(/obligatoire/);
    expect(validerEmail("membre@exemple")).toMatch(/invalide/);
    expect(validerEmail("membre exemple@test.ci")).toMatch(/invalide/);
  });

  it("valide le téléphone", () => {
    expect(validerTelephone("07 00 00 00 00")).toBe("");
    expect(validerTelephone("")).toMatch(/obligatoire/);
    expect(validerTelephone("0700")).toMatch(/10 chiffres/);
  });
});

describe("validerIdentification", () => {
  const valides = {
    nom: "Test",
    prenoms: "Awa Fictive",
    date_naissance: "2000-01-15",
    telephone: "0700000000",
    commission_precedente: "Santé",
  };

  it("accepte une identification complète", () => {
    expect(validerIdentification(valides, ["Santé", "Logistique"], AUJOURDHUI)).toEqual({});
  });

  it("accepte « Nouveau membre / aucune »", () => {
    const valeurs = { ...valides, commission_precedente: VALEUR_AUCUNE_COMMISSION };
    expect(validerIdentification(valeurs, ["Santé"], AUJOURDHUI)).toEqual({});
  });

  it("signale chaque champ manquant et une commission hors liste", () => {
    const erreurs = validerIdentification(
      { nom: "", prenoms: "", date_naissance: "", telephone: "", commission_precedente: "Inconnue" },
      ["Santé"],
      AUJOURDHUI
    );
    expect(Object.keys(erreurs)).toEqual(["nom", "prenoms", "date_naissance", "telephone", "commission_precedente"]);
  });
});

describe("validerFiche", () => {
  const options = { commissions: ["Santé", "Logistique"], qualites: ["membre", "responsable", "responsable_adjoint"] };
  const valides = {
    nom: "Test",
    prenoms: "Awa Fictive",
    date_naissance: "2000-01-15",
    sexe: "F",
    telephone: "07 00 00 00 00",
    email: "awa.test@exemple.ci",
    commission: "Santé",
    qualite: "membre",
    allergies: "",
    antecedents_medicaux: "",
  };

  it("accepte une fiche complète sans santé", () => {
    expect(validerFiche(valides, options, AUJOURDHUI)).toEqual({});
  });

  it("exige l'email, le sexe, la commission et la qualité", () => {
    const erreurs = validerFiche({ ...valides, email: "", sexe: "", commission: "", qualite: "chef" }, options, AUJOURDHUI);
    expect(Object.keys(erreurs).sort()).toEqual(["commission", "email", "qualite", "sexe"]);
  });

  it("limite les textes de santé à 1000 caractères", () => {
    const erreurs = validerFiche({ ...valides, allergies: "x".repeat(1001) }, options, AUJOURDHUI);
    expect(erreurs).toEqual({ allergies: "1000 caractères maximum." });
  });

  it("désigne le premier champ en erreur dans l'ordre d'affichage", () => {
    expect(premierChampEnErreur({ qualite: "x", email: "y" }, CHAMPS_FICHE)).toBe("email");
    expect(premierChampEnErreur({}, CHAMPS_FICHE)).toBeNull();
  });
});
