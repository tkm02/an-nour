import React from "react";

// Champ de formulaire accessible : libellé associé, aide, message d'erreur relié par aria-describedby,
// aria-invalid. Styles partagés du formulaire : src/pages/RecensementCoPage.css (classes .rco-champ*).
// `children` est une fonction qui reçoit les attributs à poser sur le contrôle (input, select, textarea).
const Champ = ({ id, libelle, erreur, aide, requis = false, facultatif = false, children }) => {
  const idAide = aide ? `${id}-aide` : null;
  const idErreur = erreur ? `${id}-erreur` : null;
  const decritPar = [idAide, idErreur].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`rco-champ${erreur ? " rco-champ-erreur" : ""}`}>
      <label className="rco-libelle" htmlFor={id}>
        {libelle}
        {requis && (
          <span className="rco-requis" aria-hidden="true">
            {" "}*
          </span>
        )}
        {facultatif && <span className="rco-facultatif"> (facultatif)</span>}
      </label>
      {aide && (
        <p className="rco-aide" id={idAide}>
          {aide}
        </p>
      )}
      {children({
        id,
        "aria-invalid": erreur ? true : undefined,
        "aria-describedby": decritPar,
        "aria-required": requis || undefined,
      })}
      {erreur && (
        <p className="rco-message-erreur" id={idErreur}>
          {erreur}
        </p>
      )}
    </div>
  );
};

export default Champ;
