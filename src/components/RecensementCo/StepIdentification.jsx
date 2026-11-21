import React, { useCallback } from "react";
import Champ from "./Champ";
import useValidationEtape from "./useValidationEtape";
import {
  bornesDateNaissance,
  CHAMPS_IDENTIFICATION,
  formaterTelephone,
  validerIdentification,
  VALEUR_AUCUNE_COMMISSION,
} from "../../utils/recensementCo/validation";

const PREFIXE = "ident-";
export const AIDE_DATE = "Touchez l'année en haut du calendrier pour la changer.";

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
  const bornes = bornesDateNaissance();
  const occupe = enCours || !listeDisponible;

  const soumettre = (evenement) => {
    evenement.preventDefault();
    if (occupe) return; // bouton aria-disabled : la garde remplace l'attribut disabled
    if (verifier()) onValider();
  };

  const saisir = (champ) => (evenement) => onChange(champ, evenement.target.value);

  return (
    <form className="rco-formulaire" onSubmit={soumettre} noValidate>
      <p className="rco-intro">
        Vous étiez membre l'an dernier ? Saisissez les mêmes informations pour retrouver votre fiche. Nouveau membre ?
        Remplissez simplement le formulaire.
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
          id={`${PREFIXE}date_naissance`}
          libelle="Date de naissance"
          requis
          aide={AIDE_DATE}
          erreur={erreurs.date_naissance}
        >
          {(attributs) => (
            <input
              {...attributs}
              name="date_naissance"
              type="date"
              autoComplete="bday"
              min={bornes.min}
              max={bornes.max}
              value={valeurs.date_naissance}
              onChange={saisir("date_naissance")}
              onBlur={() => marquer("date_naissance")}
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
        libelle="Votre commission lors de l'édition précédente"
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
              <option value={VALEUR_AUCUNE_COMMISSION}>Nouveau membre / aucune</option>
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
