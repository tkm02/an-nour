import React, { useEffect, useRef } from "react";
import Champ from "../RecensementCo/Champ";
import useValidationEtape from "../RecensementCo/useValidationEtape";
import { formaterTelephone } from "../../utils/commun/telephone";
import { CHAMPS_RECHERCHE, MATRICULE_MAX, validerRecherche } from "../../utils/inscription/reinscription";
// Styles et jetons partagés des formulaires publics (classes rco-*, conteneur .rco-formulaire-public)
import "../../pages/RecensementCoPage.css";
import "./Reinscription.css";

const PREFIXE = "rei-";

/** Alerte d'erreur : reçoit le focus et est centrée à l'écran à chaque nouvelle erreur. */
export const AlerteErreur = ({ erreur, children }) => {
  const zone = useRef(null);
  useEffect(() => {
    if (!erreur || !zone.current) return;
    zone.current.focus();
    if (typeof zone.current.scrollIntoView === "function") zone.current.scrollIntoView({ block: "center" });
  }, [erreur]);
  if (!erreur) return null;
  return (
    <div className="rco-alerte rco-alerte-erreur" role="alert" ref={zone} tabIndex={-1}>
      <p>{erreur.message}</p>
      {children}
    </div>
  );
};

/** Écran « Étiez-vous inscrit(e) à l'édition précédente ? ». */
export const ReinscriptionChoix = ({ onOui, onNon }) => (
  <div className="rco-formulaire-public reinscription">
    <div className="form-header">
      <h2 id="reinscription-question">Étiez-vous inscrit(e) à l'édition précédente ?</h2>
      <p>Si oui, nous retrouvons votre inscription de l'an dernier pour la pré-remplir.</p>
    </div>
    <div className="reinscription-choix" role="group" aria-labelledby="reinscription-question">
      <button type="button" className="rco-bouton rco-bouton-principal" onClick={onOui}>
        Oui, j'étais inscrit(e)
      </button>
      <button type="button" className="rco-bouton rco-bouton-secondaire" onClick={onNon}>
        Non, c'est ma première inscription
      </button>
    </div>
  </div>
);

/** Recherche de l'inscription de l'an dernier (nom, prénom, téléphone, matricule facultatif). */
const ReinscriptionRecherche = ({
  valeurs,
  onChange,
  onValider,
  onRetour,
  pret,
  enCours,
  erreur,
  erreursServeur = {},
  champPiegeRef,
  messageAttente,
}) => {
  const { erreurs, marquer, verifier } = useValidationEtape({
    valeurs,
    valider: validerRecherche,
    ordre: CHAMPS_RECHERCHE,
    prefixeId: PREFIXE,
    erreursServeur,
  });
  const occupe = enCours || !pret;

  const soumettre = (evenement) => {
    evenement.preventDefault();
    if (occupe) return; // bouton aria-disabled : la garde remplace l'attribut disabled
    if (verifier()) onValider();
  };
  const saisir = (champ) => (evenement) => onChange(champ, evenement.target.value);

  return (
    <div className="rco-formulaire-public reinscription">
      <div className="form-header">
        <h2>Retrouver votre inscription de l'an dernier</h2>
        <p>Saisissez les informations utilisées lors de votre inscription à l'édition précédente.</p>
      </div>
      <AlerteErreur erreur={erreur} />
      <form className="rco-formulaire" onSubmit={soumettre} noValidate>
        <div className="rco-grille">
          {[
            { champ: "nom", libelle: "Nom du séminariste", autoComplete: "family-name" },
            { champ: "prenom", libelle: "Prénom(s) du séminariste", autoComplete: "given-name" },
          ].map(({ champ, libelle, autoComplete }) => (
            <Champ key={champ} id={`${PREFIXE}${champ}`} libelle={libelle} requis erreur={erreurs[champ]}>
              {(attributs) => (
                <input
                  {...attributs}
                  name={champ}
                  type="text"
                  autoComplete={autoComplete}
                  maxLength={80}
                  value={valeurs[champ]}
                  onChange={saisir(champ)}
                  onBlur={() => marquer(champ)}
                />
              )}
            </Champ>
          ))}
        </div>
        <Champ
          id={`${PREFIXE}telephone`}
          libelle="Téléphone (parent ou séminariste)"
          requis
          aide="Un numéro donné l'an dernier, 10 chiffres, par exemple 07 00 00 00 00"
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
        <Champ
          id={`${PREFIXE}matricule_precedent`}
          libelle="Matricule de l'an dernier"
          facultatif
          aide="Il figure sur votre badge ou votre reçu 2025 ; sans lui, votre inscription sera vérifiée par l'administration."
          erreur={erreurs.matricule_precedent}
        >
          {(attributs) => (
            <input
              {...attributs}
              name="matricule_precedent"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={MATRICULE_MAX}
              value={valeurs.matricule_precedent}
              onChange={saisir("matricule_precedent")}
              onBlur={() => marquer("matricule_precedent")}
            />
          )}
        </Champ>

        {/* Champ piège anti-robot (même logique que le recensement CO), envoyé comme `site_web` */}
        <div className="rco-piege" aria-hidden="true">
          <label htmlFor="champ_controle_inscription">Laisser ce champ vide</label>
          <input
            ref={champPiegeRef}
            id="champ_controle_inscription"
            name="champ_controle_inscription"
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
          <button type="button" className="rco-bouton rco-bouton-secondaire" onClick={onRetour}>
            Retour
          </button>
          <button
            type="submit"
            className={`rco-bouton rco-bouton-principal${occupe ? " rco-bouton-occupe" : ""}`}
            aria-disabled={occupe ? "true" : undefined}
          >
            {enCours ? "Recherche en cours…" : "Rechercher"}
          </button>
        </div>
      </form>
      <div className="rco-attente" aria-live="polite">
        {messageAttente && (
          <p>
            <span className="rco-spinner" aria-hidden="true" /> {messageAttente}
          </p>
        )}
      </div>
    </div>
  );
};

export default ReinscriptionRecherche;
