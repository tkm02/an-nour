import React from "react";
import "./CoStepper.css";

// Indicateur d'étapes accessible : liste ordonnée, étape courante marquée par aria-current="step",
// état de chaque étape annoncé en texte (pas seulement par la couleur).
const CoStepper = ({ etapes, etapeCourante }) => (
  <nav className="co-stepper" aria-label="Progression du formulaire">
    <ol className="co-stepper-liste">
      {etapes.map((etape, index) => {
        const numero = index + 1;
        const etat = numero < etapeCourante ? "terminee" : numero === etapeCourante ? "courante" : "a-venir";
        return (
          <li
            key={etape}
            className={`co-stepper-etape co-stepper-${etat}`}
            aria-current={etat === "courante" ? "step" : undefined}
          >
            <span className="co-stepper-pastille" aria-hidden="true">
              {etat === "terminee" ? "✓" : numero}
            </span>
            <span className="co-stepper-libelle">
              <span className="co-sr-only">
                {`Étape ${numero} sur ${etapes.length}${etat === "terminee" ? " (terminée)" : ""} : `}
              </span>
              {etape}
            </span>
          </li>
        );
      })}
    </ol>
  </nav>
);

export default CoStepper;
