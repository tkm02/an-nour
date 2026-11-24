import { render, waitFor } from "@testing-library/react";
import axios from "axios";
import StepDormitory, { codePepiniere } from "./StepDormitory";

jest.mock("axios", () => ({ get: jest.fn(), post: jest.fn() }));

// Dortoirs fictifs : libellés réels de l'API (« Pépinière – Garçons/Filles ») différents des anciens libellés
const DORTOIRS = [
  { code: "PEPINIERE-G", name: "Pépinière – Garçons", available: 12, capacity: 50 },
  { code: "PEPINIERE-F", name: "Pépinière – Filles", available: 8, capacity: 50 },
  { code: "D-TEST", name: "Dortoir de test", available: 5, capacity: 30 },
];

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "log");
  jest.spyOn(console, "error");
  axios.get.mockResolvedValue({ data: DORTOIRS });
});

afterEach(() => {
  // Plus de journalisation de débogage (réponse de l'API, dortoir choisi)
  expect(console.log).not.toHaveBeenCalled();
  expect(console.error).not.toHaveBeenCalled();
  console.log.mockRestore();
  console.error.mockRestore();
});

describe("StepDormitory — Pépinière (régression P-30)", () => {
  it("identifie les dortoirs Pépinière par leur code", () => {
    expect(codePepiniere("M")).toBe("PEPINIERE-G");
    expect(codePepiniere("F")).toBe("PEPINIERE-F");
  });

  it.each([
    ["M", "PEPINIERE-G", "Pépinière – Garçons"],
    ["F", "PEPINIERE-F", "Pépinière – Filles"],
  ])("sélectionne automatiquement la Pépinière par code pour un enfant de 8 ans (sexe %s)", async (sexe, code, nom) => {
    const onChange = jest.fn();
    render(
      <StepDormitory
        data={{ age: "8", dortoir: "", dortoirId: "", dortoirCode: "" }}
        sexe={sexe}
        onChange={onChange}
        onNext={jest.fn()}
        onPrevious={jest.fn()}
      />
    );
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({ dortoir: nom, dortoirId: code, dortoirCode: code, matricule: "" })
    );
  });

  it("ne sélectionne rien automatiquement hors tranche 5–11 ans", async () => {
    const onChange = jest.fn();
    render(
      <StepDormitory
        data={{ age: "16", dortoir: "", dortoirId: "", dortoirCode: "" }}
        sexe="M"
        onChange={onChange}
        onNext={jest.fn()}
        onPrevious={jest.fn()}
      />
    );
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    expect(onChange).not.toHaveBeenCalled();
  });
});
