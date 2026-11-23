import {
  calculerAge,
  formaterTelephone,
  normaliserTelephone,
  premierChampEnErreur,
  CHAMPS_FICHE,
  CHAMPS_IDENTIFICATION,
  validerEmail,
  validerFiche,
  validerIdentification,
  validerNom,
  validerTelephone,
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

describe("calculerAge (réinscription des séminaristes)", () => {
  it("calcule l'âge en tenant compte de l'anniversaire", () => {
    expect(calculerAge("2000-11-21", AUJOURDHUI)).toBe(26);
    expect(calculerAge("2000-11-22", AUJOURDHUI)).toBe(25);
    expect(calculerAge("2000-02-30", AUJOURDHUI)).toBeNull();
    expect(calculerAge("21/11/2000", AUJOURDHUI)).toBeNull();
  });
});

it("le formulaire CO ne demande plus la date de naissance", () => {
  expect(CHAMPS_IDENTIFICATION).not.toContain("date_naissance");
  expect(CHAMPS_FICHE).not.toContain("date_naissance");
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
    ancien_membre: "oui",
    nom: "Test",
    prenoms: "Awa Fictive",
    telephone: "0700000000",
    commission_precedente: "Santé",
  };

  it("exige d'abord la réponse à « membre du CO l'an passé ? »", () => {
    expect(validerIdentification({ ...valides, ancien_membre: "" }, ["Santé"])).toEqual({
      ancien_membre: "Indiquez si vous étiez membre du CO l'an passé.",
    });
  });

  it("réponse « non » : aucun autre champ exigé", () => {
    expect(validerIdentification({ ancien_membre: "non", nom: "", commission_precedente: "" }, ["Santé"])).toEqual({});
  });

  it("réponse « oui » : accepte une identification complète", () => {
    expect(validerIdentification(valides, ["Santé", "Logistique"])).toEqual({});
  });

  it("réponse « oui » : la commission de l'an passé est obligatoire (plus d'option « aucune »)", () => {
    expect(validerIdentification({ ...valides, commission_precedente: "__aucune__" }, ["Santé"])).toEqual({
      commission_precedente: "Choisissez votre commission de l'an passé.",
    });
  });

  it("réponse « oui » : signale chaque champ manquant et une commission hors liste", () => {
    const erreurs = validerIdentification(
      { ancien_membre: "oui", nom: "", prenoms: "", telephone: "", commission_precedente: "Inconnue" },
      ["Santé"]
    );
    expect(Object.keys(erreurs)).toEqual(["nom", "prenoms", "telephone", "commission_precedente"]);
  });
});

describe("validerFiche", () => {
  const options = { commissions: ["Santé", "Logistique"], qualites: ["membre", "responsable", "responsable_adjoint"] };
  const valides = {
    nom: "Test",
    prenoms: "Awa Fictive",
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
