import { santeRenseignee } from "./sante";

describe("santeRenseignee", () => {
  it.each([
    [{}],
    [{ allergie: "RAS", antecedentMedical: "Néant" }],
    [{ allergie: " ras ", antecedentMedical: "NEANT" }],
    [{ allergie: "", antecedentMedical: null }],
    [{ allergie: "Aucune", antecedentMedical: "-" }],
  ])("rien à signaler : %j", (sante) => {
    expect(santeRenseignee(sante)).toBe(false);
  });

  it.each([
    [{ allergie: "Arachide (fictif)", antecedentMedical: "Néant" }],
    [{ allergie: "RAS", antecedentMedical: "Asthme (fictif)" }],
  ])("donnée de santé déclarée : %j", (sante) => {
    expect(santeRenseignee(sante)).toBe(true);
  });
});
