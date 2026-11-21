import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import StepPayment from "./StepPayment";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";
import { CLE_INSCRIPTION } from "../../utils/inscription/stockage";

jest.mock("axios", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("../../utils/cloudinaryUpload", () => ({ uploadToCloudinary: jest.fn() }));

// Données fictives uniquement
const DATA = {
  personalInfo: {
    nom: "Test",
    prenom: "Ali",
    sexe: "M",
    age: "16",
    contactParent: "0700000000",
    contactSeminariste: "",
    communeHabitation: "Cocody",
    niveauAcademique: "2nde",
  },
  dormitoryInfo: { dortoir: "Dortoir de test", dortoirId: "D-TEST", dortoirCode: "D-TEST", matricule: "" },
  healthInfo: { allergie: "Arachide (fictif)", antecedentMedical: "Néant" },
  paymentInfo: { status: "pending", amount: 7000 },
};

const REPONSE_VERIFICATION = {
  data: { isValid: true, message: "Reçu valide", extractedData: { transactionId: "TX-FICTIF-1", amount: 6000 } },
};
const REPONSE_INSCRIPTION = { data: { id: "id-fictif", matricule: "AN26-TEST-001", qrCode: null, confirmedAt: null } };
const erreurAxios = (status, detail) => Object.assign(new Error("HTTP"), { response: { status, data: { detail } } });

/** Paiement Wave simulé, reçu vérifié puis téléversé : arrive à l'écran « Preuve reçue ». */
const allerJusquAuContinuer = async (props = {}) => {
  const onNext = jest.fn();
  render(<StepPayment data={DATA} onNext={onNext} onPrevious={jest.fn()} {...props} />);
  fireEvent.click(screen.getByRole("button", { name: /avec Wave/ }));
  const recu = new File(["recu"], "recu.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText(/Cliquez pour choisir une image/), { target: { files: [recu] } });
  const confirmer = await screen.findByRole("button", { name: /Confirmer le paiement/ });
  await waitFor(() => expect(confirmer).toBeEnabled(), { timeout: 3000 });
  fireEvent.click(confirmer);
  await screen.findByText("Preuve reçue avec succès !");
  return { onNext };
};

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  window.localStorage.clear();
  window.open = jest.fn();
  jest.spyOn(console, "error");
  jest.spyOn(console, "log");
  axios.post.mockImplementation((url) =>
    url.endsWith("/verify-receipt") ? Promise.resolve(REPONSE_VERIFICATION) : Promise.resolve(REPONSE_INSCRIPTION)
  );
  uploadToCloudinary.mockResolvedValue({ success: true, url: "https://res.cloudinary.com/demo/recu.jpg", size: 1000 });
});

afterEach(() => {
  // Aucune journalisation console de données d'inscription (débogage retiré)
  expect(console.log).not.toHaveBeenCalled();
  expect(console.error).not.toHaveBeenCalled();
  console.error.mockRestore();
  console.log.mockRestore();
});

const appelsInscription = () => axios.post.mock.calls.filter(([url]) => url.endsWith("/api/v1/registrations"));

describe("StepPayment — envoi final", () => {
  it("envoie la santé depuis la mémoire et ne l'écrit jamais dans le navigateur (parcours « Non » : sans jeton)", async () => {
    const { onNext } = await allerJusquAuContinuer();
    const stocke = window.sessionStorage.getItem(CLE_INSCRIPTION);
    expect(stocke).not.toMatch(/Arachide|healthInfo/);
    expect(window.localStorage.getItem(CLE_INSCRIPTION)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Continuer/ }));
    await waitFor(() => expect(onNext).toHaveBeenCalled());
    const corps = appelsInscription()[0][1];
    expect(corps.healthInfo).toEqual({ allergie: "Arachide (fictif)", antecedentMedical: "Néant" });
    expect(corps.paymentInfo).toEqual({
      transactionId: "TX-FICTIF-1",
      receiptUrl: "https://res.cloudinary.com/demo/recu.jpg",
      amount: 6000,
    });
    expect(corps).not.toHaveProperty("reinscription");
    expect(JSON.parse(window.sessionStorage.getItem(CLE_INSCRIPTION)).matricule).toBe("AN26-TEST-001");
  });

  it("parcours « Oui » : envoie reinscription: {jeton} sans jamais le stocker", async () => {
    const { onNext } = await allerJusquAuContinuer({ jetonReinscription: "jeton-reinscription-fictif" });
    fireEvent.click(screen.getByRole("button", { name: /Continuer/ }));
    await waitFor(() => expect(onNext).toHaveBeenCalled());
    expect(appelsInscription()[0][1].reinscription).toEqual({ jeton: "jeton-reinscription-fictif" });
    expect(window.sessionStorage.getItem(CLE_INSCRIPTION)).not.toMatch(/jeton/);
  });

  it("double clic sur « Continuer » : un seul envoi de l'inscription", async () => {
    const { onNext } = await allerJusquAuContinuer();
    let terminer;
    axios.post.mockImplementationOnce(() => new Promise((resolve) => (terminer = resolve)));
    const bouton = screen.getByRole("button", { name: /Continuer/ });
    fireEvent.click(bouton);
    fireEvent.click(bouton);
    expect(appelsInscription()).toHaveLength(1);
    terminer(REPONSE_INSCRIPTION);
    await waitFor(() => expect(onNext).toHaveBeenCalledTimes(1));
  });

  it("409 « déjà inscrit » : message affiché, pas de confirmation", async () => {
    const { onNext } = await allerJusquAuContinuer({ jetonReinscription: "jeton-reinscription-fictif" });
    axios.post.mockRejectedValueOnce(erreurAxios(409, "Vous êtes déjà inscrit(e) pour cette édition"));
    fireEvent.click(screen.getByRole("button", { name: /Continuer/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Vous êtes déjà inscrit(e) pour cette édition Si vous avez déjà payé, contactez l'administration avec votre reçu."
    );
    expect(onNext).not.toHaveBeenCalled();
  });

  it("400 session expirée : nouvelle recherche automatique puis un seul nouvel essai avec le nouveau jeton", async () => {
    const onRenouvelerReinscription = jest.fn().mockResolvedValue("jeton-renouvele-fictif");
    const { onNext } = await allerJusquAuContinuer({
      jetonReinscription: "jeton-expire-fictif",
      onRenouvelerReinscription,
    });
    axios.post.mockRejectedValueOnce(erreurAxios(400, "Session expirée, veuillez recommencer la recherche"));
    fireEvent.click(screen.getByRole("button", { name: /Continuer/ }));
    await waitFor(() => expect(onNext).toHaveBeenCalled());
    expect(onRenouvelerReinscription).toHaveBeenCalledTimes(1);
    const envois = appelsInscription();
    expect(envois).toHaveLength(2);
    expect(envois[0][1].reinscription).toEqual({ jeton: "jeton-expire-fictif" });
    expect(envois[1][1].reinscription).toEqual({ jeton: "jeton-renouvele-fictif" });
  });

  it("400 session expirée et renouvellement impossible : paiement conservé, message et nouvel essai possible", async () => {
    const onRenouvelerReinscription = jest.fn().mockRejectedValue(new Error("réseau"));
    const { onNext } = await allerJusquAuContinuer({
      jetonReinscription: "jeton-expire-fictif",
      onRenouvelerReinscription,
    });
    axios.post.mockRejectedValueOnce(erreurAxios(400, "Session expirée, veuillez recommencer la recherche"));
    fireEvent.click(screen.getByRole("button", { name: /Continuer/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Votre paiement est conservé/);
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Continuer/ })).toBeEnabled();
  });
});
