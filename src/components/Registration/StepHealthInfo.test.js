import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import StepHealthInfo from "./StepHealthInfo";
import { CONSENTEMENT_SANTE_REQUIS } from "../../utils/inscription/sante";

// Étape santé avec un état réel (comme RegistrationPage : fusion des champs modifiés)
const Etape = ({ initial, onNext }) => {
  const [sante, setSante] = useState(initial);
  return (
    <StepHealthInfo
      data={sante}
      onChange={(champs) => setSante((v) => ({ ...v, ...champs }))}
      onNext={() => onNext(sante)}
      onPrevious={() => {}}
    />
  );
};

const RAS = { allergie: "RAS", antecedentMedical: "Néant" };

describe("StepHealthInfo — consentement santé (TAF lot 4)", () => {
  it("sans donnée de santé : pas de case de consentement, passage direct", () => {
    const onNext = jest.fn();
    render(<Etape initial={RAS} onNext={onNext} />);
    expect(screen.queryByRole("checkbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Suivant/ }));
    expect(onNext).toHaveBeenCalled();
  });

  it("allergie déclarée : consentement obligatoire avant de continuer", () => {
    const onNext = jest.fn();
    render(<Etape initial={RAS} onNext={onNext} />);
    fireEvent.click(screen.getByLabelText(/J'ai des allergies/));
    fireEvent.change(screen.getByPlaceholderText(/Décrivez vos allergies/), { target: { value: "Arachide (fictif)" } });

    const caseConsentement = screen.getByRole("checkbox", { name: /J'accepte que ces informations de santé/ });
    fireEvent.click(screen.getByRole("button", { name: /Suivant/ }));
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(CONSENTEMENT_SANTE_REQUIS);
    expect(caseConsentement).toHaveAttribute("aria-invalid", "true");
    expect(caseConsentement).toHaveFocus();

    fireEvent.click(caseConsentement);
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Suivant/ }));
    expect(onNext).toHaveBeenCalledWith(expect.objectContaining({ allergie: "Arachide (fictif)", consentementSante: true }));
  });

  it("réinscription : données de l'an dernier pré-remplies, consentement redemandé", () => {
    const onNext = jest.fn();
    render(<Etape initial={{ allergie: "RAS", antecedentMedical: "Asthme (fictif)" }} onNext={onNext} />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: /Suivant/ }));
    expect(onNext).not.toHaveBeenCalled();
  });

  it("revenir à RAS / Néant retire l'obligation", () => {
    const onNext = jest.fn();
    render(<Etape initial={{ allergie: "Arachide (fictif)", antecedentMedical: "Néant" }} onNext={onNext} />);
    fireEvent.click(screen.getByLabelText(/RAS \(Rien à signaler\)/));
    expect(screen.queryByRole("checkbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Suivant/ }));
    expect(onNext).toHaveBeenCalled();
  });
});
