import { formaterCloture, inscriptionsCloses } from "./statut";

describe("statut des inscriptions", () => {
  it("formate la date de clôture en heure d'Abidjan", () => {
    expect(formaterCloture("2026-12-02T23:59:59+00:00")).toBe("mercredi 2 décembre 2026 à 23 h 59");
  });

  it("ignore une date absente ou invalide", () => {
    expect(formaterCloture(null)).toBeNull();
    expect(formaterCloture("pas une date")).toBeNull();
  });

  it("considère les inscriptions closes seulement si open === false", () => {
    expect(inscriptionsCloses({ open: false })).toBe(true);
    expect(inscriptionsCloses({ open: true })).toBe(false);
    expect(inscriptionsCloses(null)).toBe(false);
  });
});
