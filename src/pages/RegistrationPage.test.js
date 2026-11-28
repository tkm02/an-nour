import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RegistrationPage from "./RegistrationPage";
import * as service from "../services/inscription";
import { ErreurApi } from "../utils/commun/erreursApi";
import { CLE_INSCRIPTION } from "../utils/inscription/stockage";

// Jest (CRA) ne résout pas react-router-dom 7 (P-01) : seul useNavigate est utilisé par ces écrans
const mockNaviguer = jest.fn();
jest.mock("react-router-dom", () => ({ useNavigate: () => mockNaviguer }));
jest.mock("axios", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("../components/PDFGenerator", () => ({ generateRegistrationPDF: jest.fn() }));
jest.mock("../utils/cloudinaryUpload", () => ({ uploadToCloudinary: jest.fn() })); // non utilisé ici (journalise au chargement)
jest.mock("../services/inscription", () => ({
  chargerStatutInscriptions: jest.fn(),
  chargerConfigurationReinscription: jest.fn(),
  rechercherInscription: jest.fn(),
}));

// Données fictives uniquement
const FICHE = {
  nom: "TEST",
  prenom: "Ali",
  sexe: "M",
  date_naissance: null,
  age_precedent: 7, // → 8 ans : parcours Pépinière (étape Dortoir sautée), utile pour atteindre l'étape Santé
  niveau_academique: "CE1",
  commune_habitation: "Cocody",
  contact_parent: "0700000000",
  contact_seminariste: null,
  allergie: "Arachide (fictif)",
  antecedent_medical: null,
  matricule_precedent: "AN25-TEST-001",
};
const TROUVE = {
  resultat: "trouve",
  jeton_reinscription: "jeton-reinscription-fictif",
  fiche: FICHE,
  deja_inscrit: false,
  matricule_actuel: null,
};
const NOUVEAU = { resultat: "nouveau", jeton_reinscription: "jeton-nouveau-fictif", fiche: null, deja_inscrit: false, matricule_actuel: null };

const saisir = (libelle, valeur) => fireEvent.change(screen.getByLabelText(libelle), { target: { value: valeur } });
const cliquer = (nom) => fireEvent.click(screen.getByRole("button", { name: nom }));

const allerALaRecherche = async () => {
  render(<RegistrationPage delaiMinimalMs={0} />);
  cliquer("Oui, j'étais inscrit(e)");
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Rechercher" })).not.toHaveAttribute("aria-disabled")
  );
  saisir(/^Nom du séminariste/, "Test");
  saisir(/^Prénom\(s\) du séminariste/, "Ali");
  saisir(/^Téléphone/, "07 00 00 00 00");
  saisir(/^Matricule de l'an dernier/, "AN25-TEST-001");
};

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  window.localStorage.clear();
  service.chargerStatutInscriptions.mockResolvedValue({ open: true, fee: 6000, close_at: "2026-12-02T23:59:59+00:00" });
  service.chargerConfigurationReinscription.mockResolvedValue({ ouvert: true, jeton_formulaire: "jeton-formulaire-fictif" });
});

describe("RegistrationPage — écran préalable et fermeture", () => {
  it("affiche la question puis, sur « Non », le parcours actuel vierge", async () => {
    render(<RegistrationPage delaiMinimalMs={0} />);
    expect(screen.getByRole("heading", { name: "Étiez-vous inscrit(e) à l'édition précédente ?" })).toBeInTheDocument();
    expect(
      await screen.findByText("Inscriptions ouvertes jusqu'au mercredi 2 décembre 2026 à 23 h 59")
    ).toBeInTheDocument();
    cliquer("Non, c'est ma première inscription");
    expect(screen.getByRole("heading", { name: /Informations personnelles/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nom/)).toHaveValue("");
    expect(screen.getByText("Étape 1 sur 5")).toBeInTheDocument();
    expect(service.chargerConfigurationReinscription).not.toHaveBeenCalled();
  });

  it("supprime l'ancienne sauvegarde localStorage au chargement", async () => {
    window.localStorage.setItem(CLE_INSCRIPTION, JSON.stringify({ healthInfo: { allergie: "x" } }));
    render(<RegistrationPage delaiMinimalMs={0} />);
    expect(window.localStorage.getItem(CLE_INSCRIPTION)).toBeNull();
    await screen.findByText(/Inscriptions ouvertes jusqu'au/); // fin du chargement du statut
  });

  it("inscriptions closes (open=false) : écran dédié sans formulaire", async () => {
    service.chargerStatutInscriptions.mockResolvedValue({ open: false, fee: 6000, close_at: "2026-12-02T23:59:59+00:00" });
    render(<RegistrationPage delaiMinimalMs={0} />);
    expect(await screen.findByText("Les inscriptions sont closes pour cette édition.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Oui, j'étais inscrit/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Inscriptions ouvertes jusqu'au/)).not.toBeInTheDocument();
  });
});

describe("RegistrationPage — réinscription", () => {
  it("Oui / trouvé : pré-remplit identité et santé, bandeau, aide sur le niveau, rien de stocké", async () => {
    service.rechercherInscription.mockResolvedValue(TROUVE);
    await allerALaRecherche();
    cliquer("Rechercher");

    expect(await screen.findByText("Nous avons retrouvé votre inscription de l'an dernier")).toBeInTheDocument();
    expect(service.rechercherInscription).toHaveBeenCalledWith({
      nom: "Test",
      prenom: "Ali",
      telephone: "0700000000",
      matricule_precedent: "AN25-TEST-001",
      jeton_formulaire: "jeton-formulaire-fictif",
      site_web: "",
    });
    expect(screen.getByLabelText(/^Nom/)).toHaveValue("TEST");
    expect(screen.getByLabelText(/^Âge/)).toHaveValue(8);
    expect(screen.getByLabelText(/^Contact Parent/)).toHaveValue("0700000000");
    expect(screen.getByText("Mettez à jour votre niveau pour cette année scolaire.")).toBeInTheDocument();
    expect(screen.getByDisplayValue("CE1")).toBeInTheDocument(); // cycle « Primaire » rouvert sur le niveau de l'an dernier

    // Pépinière (8 ans) : l'étape Dortoir est sautée, la santé de l'an dernier est pré-remplie
    cliquer("Continuer");
    expect(await screen.findByRole("heading", { name: "Informations de santé" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Arachide (fictif)")).toBeInTheDocument();

    // Données renvoyées par le serveur et jeton : jamais dans le stockage du navigateur
    const stockages = `${window.sessionStorage.getItem(CLE_INSCRIPTION) || ""}${window.localStorage.getItem(CLE_INSCRIPTION) || ""}`;
    expect(stockages).not.toMatch(/Arachide|jeton/);
  });

  it("Oui / trouvé : avertit si le nom ou le prénom retrouvés sont modifiés, sans changer la requête", async () => {
    service.rechercherInscription.mockResolvedValue(TROUVE);
    await allerALaRecherche();
    cliquer("Rechercher");
    await screen.findByText("Nous avons retrouvé votre inscription de l'an dernier");
    const avertissement = /Vous avez modifié le nom ou le prénom de l'inscription retrouvée/;
    expect(screen.queryByText(avertissement)).not.toBeInTheDocument();
    saisir(/^Nom/, "TESTE");
    expect(screen.getByText(avertissement)).toHaveTextContent("votre inscription sera vérifiée par l'administration");
    saisir(/^Nom/, "test");
    expect(screen.queryByText(avertissement)).not.toBeInTheDocument();
  });

  it("Oui / non retrouvé : message neutre, parcours vierge (nom et prénom saisis repris)", async () => {
    service.rechercherInscription.mockResolvedValue(NOUVEAU);
    await allerALaRecherche();
    cliquer("Rechercher");
    expect(
      await screen.findByText(
        "Nous n'avons pas pu confirmer votre inscription de l'an dernier : continuez, l'administration vérifiera."
      )
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nom/)).toHaveValue("Test");
    expect(screen.getByLabelText(/^Âge/)).toHaveValue(null);
    expect(screen.getByLabelText(/^Contact Parent/)).toHaveValue("");
  });

  it("déjà inscrit : écran avec le matricule, sans formulaire", async () => {
    service.rechercherInscription.mockResolvedValue({ ...TROUVE, deja_inscrit: true, matricule_actuel: "AN26-TEST-009" });
    await allerALaRecherche();
    cliquer("Rechercher");
    expect(
      await screen.findByText("Vous êtes déjà inscrit(e) pour cette édition (matricule AN26-TEST-009).")
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("jeton du formulaire refusé (400) : message rassurant, configuration rechargée, alerte focalisée", async () => {
    service.rechercherInscription.mockRejectedValueOnce(new ErreurApi("http", { status: 400, data: { detail: "x" } }));
    await allerALaRecherche();
    cliquer("Rechercher");
    const alerte = await screen.findByRole("alert");
    expect(alerte).toHaveTextContent("Pour votre sécurité, le formulaire a expiré. Vos réponses sont conservées");
    expect(alerte).toHaveFocus();
    expect(service.chargerConfigurationReinscription).toHaveBeenCalledTimes(2);
    expect(screen.getByLabelText(/^Nom du séminariste/)).toHaveValue("Test");
  });

  it("recherche close (403) : écran « inscriptions closes »", async () => {
    service.rechercherInscription.mockRejectedValueOnce(
      new ErreurApi("http", { status: 403, data: { detail: "Les inscriptions sont closes pour cette édition" } })
    );
    await allerALaRecherche();
    cliquer("Rechercher");
    expect(await screen.findByText("Les inscriptions sont closes pour cette édition.")).toBeInTheDocument();
  });

  it("validation : téléphone obligatoire, focus sur le premier champ en erreur", async () => {
    await allerALaRecherche();
    saisir(/^Téléphone/, "");
    cliquer("Rechercher");
    expect(screen.getByLabelText(/^Téléphone/)).toHaveFocus();
    expect(service.rechercherInscription).not.toHaveBeenCalled();
  });
});

describe("RegistrationPage — photo de l'an dernier (2026-11-27)", () => {
  it("trouvé avec photo : photo affichée à l'étape 1, consentement exigé pour continuer", async () => {
    const photoUrl = "https://res.cloudinary.com/demo/participants_photos/AN25-TEST-001.jpg";
    service.rechercherInscription.mockResolvedValue({ ...TROUVE, fiche: { ...FICHE, photo_url: photoUrl } });
    await allerALaRecherche();
    cliquer("Rechercher");

    expect(await screen.findByRole("img", { name: /photo enregistrée/i })).toHaveAttribute("src", photoUrl);
    cliquer("Continuer");
    expect(await screen.findByText(/cochez l'autorisation d'utiliser la photo/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Informations de santé" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: /j'autorise l'utilisation de cette photo/i }));
    cliquer("Continuer");
    expect(await screen.findByRole("heading", { name: "Informations de santé" })).toBeInTheDocument();
    // L'URL de la photo n'est pas écrite dans le stockage du navigateur
    expect(window.sessionStorage.getItem(CLE_INSCRIPTION) || "").not.toMatch(/cloudinary/);
  });

  it("parcours « Non » : aucune photo proposée d'office, aucune case de consentement", async () => {
    render(<RegistrationPage delaiMinimalMs={0} />);
    cliquer("Non, c'est ma première inscription");
    expect(await screen.findByRole("button", { name: /choisir une photo/i })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /j'autorise/i })).not.toBeInTheDocument();
  });
});
