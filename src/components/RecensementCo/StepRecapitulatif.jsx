import React, { useState } from "react";
import { ApercuPhoto } from "./PhotoField";
import { commissionSansQualite, formaterTelephone } from "../../utils/recensementCo/validation";

const NON_RENSEIGNE = "Non renseigné";

const SANTE_CONSERVEE = "Inchangées (non réaffichées)";

const valeurOuVide = (valeur, vide = NON_RENSEIGNE) =>
  typeof valeur === "string" && valeur.trim() ? valeur.trim() : vide;

/** Fiche en lecture seule (récapitulatif avant envoi, ou fiche verrouillée). */
export const RecapitulatifFiche = ({ valeurs, qualites, qualitesParCommission = null, photo, santeMasquee = false }) => {
  const videSante = santeMasquee ? SANTE_CONSERVEE : NON_RENSEIGNE;
  const qualite = qualites.find((q) => q.code === valeurs.qualite);
  // Commission sans qualité (Secrétaire Régional, Superviseur…) : pas de ligne « Qualité »
  const sansQualite =
    !qualite &&
    commissionSansQualite(
      valeurs.commission,
      qualites.map((q) => q.code),
      qualitesParCommission
    );
  const lignes = [
    {
      titre: "Identité",
      elements: [
        ["Nom", valeurOuVide(valeurs.nom)],
        ["Prénom(s)", valeurOuVide(valeurs.prenoms)],
        ["Sexe", valeurs.sexe === "M" ? "Masculin" : valeurs.sexe === "F" ? "Féminin" : NON_RENSEIGNE],
      ],
    },
    {
      titre: "Contacts",
      elements: [
        ["Téléphone", valeurs.telephone ? `+225 ${formaterTelephone(valeurs.telephone)}` : NON_RENSEIGNE],
        ["Email", valeurOuVide(valeurs.email)],
      ],
    },
    {
      titre: "Commission et qualité",
      elements: [
        ["Commission", valeurOuVide(valeurs.commission)],
        ...(sansQualite ? [] : [["Qualité", qualite ? qualite.libelle : NON_RENSEIGNE]]),
      ],
    },
    {
      titre: "Santé",
      elements: [
        ["Allergies", valeurOuVide(valeurs.allergies, videSante)],
        ["Antécédents médicaux", valeurOuVide(valeurs.antecedents_medicaux, videSante)],
      ],
    },
  ];

  return (
    <div className="rco-recap">
      <div className="rco-recap-photo">
        <ApercuPhoto
          fichier={photo.fichier}
          urlExistante={photo.supprimerExistante ? null : photo.urlExistante}
          sexe={valeurs.sexe}
        />
      </div>
      <div className="rco-recap-sections">
        {lignes.map((section) => (
          <section key={section.titre} className="rco-recap-section">
            <h3>{section.titre}</h3>
            <dl>
              {section.elements.map(([terme, valeur]) => (
                <div key={terme} className="rco-recap-ligne">
                  <dt>{terme}</dt>
                  <dd className={valeur === NON_RENSEIGNE ? "rco-recap-vide" : undefined}>{valeur}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
};

// À VALIDER PAR LE RESPONSABLE DU TRAITEMENT : texte d'information (finalités, accès, droits, conservation).
// Ne pas compléter la durée de conservation ni le nom du responsable sans décision écrite de l'administration.
const InformationDonnees = ({ version }) => (
  <details className="rco-details">
    <summary>En savoir plus sur l'utilisation de vos données</summary>
    <ul>
      <li>
        Finalités : organisation de l'édition du séminaire, création éventuelle d'un compte d'accès au back-office pour
        votre commission, et photo de badge.
      </li>
      <li>L'accès aux données de santé est limité à la commission Santé.</li>
      <li>
        Vous pouvez demander l'accès à vos données, leur rectification ou leur suppression auprès de l'administration du
        séminaire.
      </li>
      <li>Durée de conservation : précisée par l'administration du séminaire.</li>
      <li>
        Traitement réalisé conformément à la loi ivoirienne n°2013-450 relative à la protection des
        données à caractère personnel.
      </li>
    </ul>
    {version && <p className="rco-aide">Version du texte : {version}</p>}
  </details>
);

const StepRecapitulatif = ({
  valeurs,
  qualites,
  qualitesParCommission = null,
  photo,
  onModifier,
  onEnvoyer,
  enCours,
  erreur,
  consentementVersion,
  dejaSoumise = false,
  santeMasquee = false,
}) => {
  const [consentement, setConsentement] = useState(false);
  const [erreurConsentement, setErreurConsentement] = useState("");

  const soumettre = (evenement) => {
    evenement.preventDefault();
    if (enCours) return; // bouton aria-disabled : la garde remplace l'attribut disabled
    if (!consentement) {
      setErreurConsentement("Vous devez donner votre consentement pour envoyer votre fiche.");
      const caseConsentement = document.getElementById("consentement");
      if (caseConsentement) caseConsentement.focus();
      return;
    }
    onEnvoyer();
  };

  return (
    <form className="rco-formulaire" onSubmit={soumettre} noValidate>
      <p className="rco-intro">Relisez votre fiche avant de l'envoyer.</p>
      {dejaSoumise && (
        <div className="rco-alerte rco-alerte-info">
          <p>Vous avez déjà envoyé votre fiche pour cette édition : ce nouvel envoi la mettra à jour.</p>
        </div>
      )}
      <RecapitulatifFiche
        valeurs={valeurs}
        qualites={qualites}
        qualitesParCommission={qualitesParCommission}
        photo={photo}
        santeMasquee={santeMasquee}
      />

      <div className={`rco-consentement${erreurConsentement ? " rco-champ-erreur" : ""}`}>
        <label className="rco-option rco-option-consentement" htmlFor="consentement">
          <input
            id="consentement"
            name="consentement"
            type="checkbox"
            checked={consentement}
            onChange={(e) => {
              setConsentement(e.target.checked);
              if (e.target.checked) setErreurConsentement("");
            }}
            aria-invalid={erreurConsentement ? true : undefined}
            aria-describedby={erreurConsentement ? "consentement-erreur" : undefined}
            required
          />
          <span>
            J'accepte que le comité d'organisation utilise ces informations, y compris celles de santé, pour organiser
            le séminaire.
            <span className="rco-requis" aria-hidden="true">
              {" "}*
            </span>
          </span>
        </label>
        <InformationDonnees version={consentementVersion} />
        {erreurConsentement && (
          <p className="rco-message-erreur" id="consentement-erreur">
            {erreurConsentement}
          </p>
        )}
      </div>

      {/* Rappel de l'erreur d'envoi au plus près des boutons (l'alerte principale est en haut de l'étape) */}
      {erreur && <p className="rco-message-erreur rco-rappel-erreur">{erreur}</p>}

      <div className="rco-actions">
        <button
          type="button"
          className="rco-bouton rco-bouton-secondaire"
          onClick={() => !enCours && onModifier()}
          aria-disabled={enCours ? "true" : undefined}
        >
          Modifier
        </button>
        <button
          type="submit"
          className={`rco-bouton rco-bouton-principal${enCours ? " rco-bouton-occupe" : ""}`}
          aria-disabled={enCours ? "true" : undefined}
        >
          {enCours ? "Envoi en cours…" : "Envoyer ma fiche"}
        </button>
      </div>
    </form>
  );
};

export default StepRecapitulatif;
