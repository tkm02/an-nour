import React, { useCallback } from "react";
import Champ from "./Champ";
import useValidationEtape from "./useValidationEtape";
import {
  ANCIEN_NON,
  ANCIEN_OUI,
  CHAMPS_IDENTIFICATION,
  formaterTelephone,
  validerIdentification,
} from "../../utils/recensementCo/validation";

const PREFIXE = "ident-";
const REPONSES = [
  { valeur: ANCIEN_OUI, libelle: "Oui" },
  { valeur: ANCIEN_NON, libelle: "Non" },
];

/**
 * Étape 1. « Étiez-vous membre du CO l'an passé ? » — oui : identification (nom, prénoms, téléphone, commission de
 * l'an passé) pour retrouver la fiche ; non : la fiche vide s'ouvre directement (étape 2).
 */
const StepIdentification = ({
  valeurs,
  onChange,
  commissionsPrecedentes,
  listeDisponible,
  listeEnChargement,
  erreursServeur,
  onValider,
  enCours,
  champPiegeRef,
}) => {
  const valider = useCallback((v) => validerIdentification(v, commissionsPrecedentes), [commissionsPrecedentes]);
  const { erreurs, marquer, verifier } = useValidationEtape({
    valeurs,
    valider,
    ordre: CHAMPS_IDENTIFICATION,
    prefixeId: PREFIXE,
    erreursServeur,
  });
  const occupe = enCours || !listeDisponible;
  const ancien = valeurs.ancien_membre === ANCIEN_OUI;

  const soumettre = (evenement) => {
    evenement.preventDefault();
    if (occupe) return; // bouton aria-disabled : la garde remplace l'attribut disabled
    if (verifier()) onValider();
  };

  const saisir = (champ) => (evenement) => onChange(champ, evenement.target.value);
  const idAncienErreur = erreurs.ancien_membre ? `${PREFIXE}ancien_membre-erreur` : undefined;

  return (
    <form className="rco-formulaire" onSubmit={soumettre} noValidate>
      <fieldset className={`rco-champ rco-choix${erreurs.ancien_membre ? " rco-champ-erreur" : ""}`}>
        <legend className="rco-libelle">
          Étiez-vous membre du comité d'organisation l'an passé ?
          <span className="rco-requis" aria-hidden="true"> *</span>
        </legend>
        <div className="rco-options">
          {REPONSES.map((option, index) => (
            <label key={option.valeur} className="rco-option">
              <input
                type="radio"
                id={index === 0 ? `${PREFIXE}ancien_membre` : `${PREFIXE}ancien_membre-${option.valeur}`}
                name="ancien_membre"
                value={option.valeur}
                checked={valeurs.ancien_membre === option.valeur}
                onChange={() => {
                  onChange("ancien_membre", option.valeur);
                  marquer("ancien_membre");
                }}
                aria-describedby={idAncienErreur}
                required
              />
              <span>{option.libelle}</span>
            </label>
          ))}
        </div>
        {erreurs.ancien_membre && (
          <p className="rco-message-erreur" id={idAncienErreur}>
            {erreurs.ancien_membre}
          </p>
        )}
      </fieldset>

      {ancien && (
        <>
          <p className="rco-intro">
            Saisissez les mêmes informations que l'an passé pour retrouver votre fiche : vous pourrez ensuite la
            vérifier, la compléter et la mettre à jour.
          </p>

          <div className="rco-grille">
            <Champ id={`${PREFIXE}nom`} libelle="Nom" requis erreur={erreurs.nom}>
              {(attributs) => (
                <input
                  {...attributs}
                  name="nom"
                  type="text"
                  autoComplete="family-name"
                  maxLength={80}
                  value={valeurs.nom}
                  onChange={saisir("nom")}
                  onBlur={() => marquer("nom")}
                />
              )}
            </Champ>
            <Champ id={`${PREFIXE}prenoms`} libelle="Prénom(s)" requis erreur={erreurs.prenoms}>
              {(attributs) => (
                <input
                  {...attributs}
                  name="prenoms"
                  type="text"
                  autoComplete="given-name"
                  maxLength={80}
                  value={valeurs.prenoms}
                  onChange={saisir("prenoms")}
                  onBlur={() => marquer("prenoms")}
                />
              )}
            </Champ>
            <Champ
              id={`${PREFIXE}telephone`}
              libelle="Téléphone"
              requis
              aide="Numéro ivoirien (+225) à 10 chiffres, par exemple 07 00 00 00 00"
              erreur={erreurs.telephone}
            >
              {(attributs) => (
                <div className="rco-telephone">
                  <span className="rco-prefixe" aria-hidden="true">
                    +225
                  </span>
                  <input
                    {...attributs}
                    name="telephone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    maxLength={25}
                    value={valeurs.telephone}
                    onChange={saisir("telephone")}
                    onBlur={() => {
                      marquer("telephone");
                      onChange("telephone", formaterTelephone(valeurs.telephone));
                    }}
                  />
                </div>
              )}
            </Champ>
          </div>

          <Champ
            id={`${PREFIXE}commission_precedente`}
            libelle="Votre commission l'an passé"
            requis
            erreur={erreurs.commission_precedente}
          >
            {(attributs) =>
              listeDisponible ? (
                <select
                  {...attributs}
                  name="commission_precedente"
                  value={valeurs.commission_precedente}
                  onChange={(e) => {
                    onChange("commission_precedente", e.target.value);
                    marquer("commission_precedente");
                  }}
                  onBlur={() => marquer("commission_precedente")}
                >
                  <option value="">Choisissez…</option>
                  {commissionsPrecedentes.map((commission) => (
                    <option key={commission} value={commission}>
                      {commission}
                    </option>
                  ))}
                </select>
              ) : (
                <select {...attributs} name="commission_precedente" value="" disabled onChange={() => {}}>
                  <option value="">{listeEnChargement ? "Chargement de la liste…" : "Liste indisponible"}</option>
                </select>
              )
            }
          </Champ>
        </>
      )}

      {valeurs.ancien_membre === ANCIEN_NON && (
        <p className="rco-intro">Bienvenue ! Continuez pour remplir votre fiche.</p>
      )}

      {/* Champ piège anti-robot : hors écran, ignoré par les lecteurs d'écran et les gestionnaires de mots de
          passe, nom non reconnaissable par le remplissage automatique ; envoyé comme `site_web` (vide pour un humain) */}
      <div className="rco-piege" aria-hidden="true">
        <label htmlFor="champ_controle_co">Laisser ce champ vide</label>
        <input
          ref={champPiegeRef}
          id="champ_controle_co"
          name="champ_controle_co"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore=""
          data-bwignore=""
          defaultValue=""
        />
      </div>

      <div className="rco-actions">
        <button
          type="submit"
          className={`rco-bouton rco-bouton-principal${occupe ? " rco-bouton-occupe" : ""}`}
          aria-disabled={occupe ? "true" : undefined}
        >
          {enCours ? "Recherche de votre fiche…" : "Continuer"}
        </button>
      </div>
    </form>
  );
};

export default StepIdentification;
