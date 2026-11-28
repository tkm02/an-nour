import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import PhotoInscription from "./PhotoInscription";
import StepConfirmation from "./StepConfirmation";
import { PHOTO_VIDE, photoDepuisFiche } from "../../utils/inscription/photo";

jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }));
jest.mock("../PDFGenerator", () => ({ __esModule: true, default: { generateRegistrationPDF: jest.fn() } }));

// Données fictives uniquement
const ANCIENNE = "https://res.cloudinary.com/demo/participants_photos/ANNOUR25-TEST-001.jpg";

function Harnais({ initiale, onEtat = () => {} }) {
  const [photo, setPhoto] = useState(initiale);
  return (
    <PhotoInscription
      photo={photo}
      sexe="M"
      onChange={(nouvelle) => {
        setPhoto(nouvelle);
        onEtat(nouvelle);
      }}
    />
  );
}

describe("PhotoInscription", () => {
  test("sans photo : silhouette, aucune case de consentement", () => {
    render(<Harnais initiale={PHOTO_VIDE} />);
    expect(screen.getByRole("button", { name: /choisir une photo/i })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  test("réinscription : photo de l'an dernier affichée, consentement demandé, retrait possible", () => {
    const etats = [];
    render(<Harnais initiale={photoDepuisFiche({ photo_url: ANCIENNE })} onEtat={(e) => etats.push(e)} />);
    expect(screen.getByRole("img", { name: /photo enregistrée/i })).toHaveAttribute("src", ANCIENNE);
    expect(screen.getByText(/photo de votre inscription de l'an dernier/i)).toBeInTheDocument();

    userEvent.click(screen.getByRole("checkbox", { name: /j'autorise l'utilisation de cette photo/i }));
    expect(etats.at(-1).consentement).toBe(true);

    userEvent.click(screen.getByRole("button", { name: /retirer la photo/i }));
    expect(etats.at(-1)).toMatchObject({ reprendre: false, consentement: false });
    expect(screen.queryByRole("img", { name: /photo enregistrée/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  test("message d'erreur relié à la case de consentement", () => {
    render(<PhotoInscription photo={photoDepuisFiche({ photo_url: ANCIENNE })} sexe="F" onChange={() => {}}
      erreur="Cochez l'autorisation d'utiliser la photo, ou retirez la photo." />);
    const caseConsentement = screen.getByRole("checkbox");
    expect(caseConsentement).toHaveAttribute("aria-invalid", "true");
    expect(caseConsentement).toHaveAttribute("aria-describedby", "consentement-photo-erreur");
  });
});

describe("StepConfirmation — statut de la photo", () => {
  const DONNEES = { personalInfo: { nom: "TESTNOM", prenom: "Fictif", sexe: "M" }, dormitoryInfo: {}, healthInfo: {} };

  beforeEach(() => sessionStorage.clear());

  test("échec de l'envoi : inscription confirmée, « Réessayer » relance l'envoi", () => {
    const onReessayer = jest.fn();
    const fichier = new File(["x"], "photo.jpg", { type: "image/jpeg" });
    render(<StepConfirmation data={DONNEES} onReessayerPhoto={onReessayer}
      photo={{ statut: "echec", jeton: "jeton-photo-fictif", fichier, url: null, enCours: false }} />);
    expect(screen.getByText(/inscription confirmée/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/la photo n'a pas pu être envoyée/i);
    userEvent.click(screen.getByRole("button", { name: /réessayer l'envoi de la photo/i }));
    expect(onReessayer).toHaveBeenCalledTimes(1);
  });

  test("photo reprise de l'an dernier : affichée comme enregistrée", () => {
    render(<StepConfirmation data={DONNEES}
      photo={{ statut: "reprise", jeton: null, fichier: null, url: ANCIENNE, enCours: false }} />);
    expect(screen.getByText(/photo enregistrée : elle figurera sur votre badge/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /photo enregistrée/i })).toHaveAttribute("src", ANCIENNE);
  });

  test("sans photo : prise à l'accueil", () => {
    render(<StepConfirmation data={DONNEES} photo={{ statut: "absente", jeton: null, fichier: null, url: null }} />);
    expect(screen.getByText(/elle sera prise à l'accueil/i)).toBeInTheDocument();
  });
});
