import React, { useCallback, useMemo } from "react";
import Champ from "./Champ";
import PhotoField from "./PhotoField";
import useValidationEtape from "./useValidationEtape";
import {
  CHAMPS_FICHE,
  formaterTelephone,
  TEXTE_SANTE_MAX,
  validerFiche,
} from "../../utils/recensementCo/validation";

const PREFIXE = "fiche-";

const StepFiche = ({
  valeurs,
  onChange,
  commissions,
  qualites,
  trouvee,
  dejaSoumise,
  nonRetrouve,
  contact,
  photo,
  onChoisirPhoto,
  onRetirerPhoto,
  photoEnPreparation,
  onPreparationPhoto,
  erreursServeur,
  onValider,
  onRetour,
  enCours = false,
}) => {
  const codesQualites = useMemo(() => qualites.map((q) => q.code), [qualites]);
  const valider = useCallback(
    (v) => validerFiche(v, { commissions, qualites: codesQualites }),
    [commissions, codesQualites]
  );
  const { erreurs, marquer, verifier } = useValidationEtape({
    valeurs,
    valider,
    ordre: CHAMPS_FICHE,
    prefixeId: PREFIXE,
    erreursServeur,
  });

  const soumettre = (evenement) => {
    evenement.preventDefault();
    if (photoEnPreparation || enCours) return; // « Continuer » aria-disabled (photo en préparation, vérification)
    if (verifier()) onValider();
  };

  const saisir = (champ) => (evenement) => onChange(champ, evenement.target.value);
  const texte = (champ, libelle, autoComplete, extra = {}) => (
    <Champ id={`${PREFIXE}${champ}`} libelle={libelle} requis erreur={erreurs[champ]} aide={extra.aide}>
      {(attributs) => (
        <input
          {...attributs}
          name={champ}
          type={extra.type || "text"}
          inputMode={extra.inputMode}
          autoComplete={autoComplete}
          maxLength={extra.maxLength || 80}
          value={valeurs[champ]}
          onChange={saisir(champ)}
          onBlur={() => {
            marquer(champ);
            if (extra.onBlur) extra.onBlur();
          }}
        />
      )}
    </Champ>
  );

  const idSexeErreur = erreurs.sexe ? `${PREFIXE}sexe-erreur` : undefined;

  return (
    <form className="rco-formulaire" onSubmit={soumettre} noValidate>
      {trouvee ? (
        <div className="rco-alerte rco-alerte-succes">
          <p className="rco-alerte-titre">Nous avons retrouvé votre fiche</p>
          <p>
            Vérifiez chaque information, corrigez ce qui a changé et complétez ce qui manque.
            {dejaSoumise && " Vous avez déjà envoyé votre fiche pour cette édition : un nouvel envoi la mettra à jour."}
          </p>
        </div>
      ) : nonRetrouve ? (
        <div className="rco-alerte rco-alerte-info">
          <p className="rco-alerte-titre">Nous n'avons pas retrouvé votre fiche de l'an dernier.</p>
          <p>
            Vérifiez l'orthographe de votre nom, votre numéro et votre commission de l'an passé (bouton Retour), ou
            continuez pour créer votre fiche ; elle sera vérifiée par l'administration.
          </p>
        </div>
      ) : (
        <div className="rco-alerte rco-alerte-info">
          <p>Complétez votre fiche, elle sera vérifiée par l'administration.</p>
        </div>
      )}

      <fieldset className="rco-section">
        <legend>Identité</legend>
        <div className="rco-grille">
          {texte("nom", "Nom", "family-name")}
          {texte("prenoms", "Prénom(s)", "given-name")}
          <fieldset className={`rco-champ rco-choix${erreurs.sexe ? " rco-champ-erreur" : ""}`}>
            <legend className="rco-libelle">
              Sexe<span className="rco-requis" aria-hidden="true"> *</span>
            </legend>
            <div className="rco-options">
              {[
                { valeur: "M", libelle: "Masculin" },
                { valeur: "F", libelle: "Féminin" },
              ].map((option, index) => (
                <label key={option.valeur} className="rco-option">
                  <input
                    type="radio"
                    id={index === 0 ? `${PREFIXE}sexe` : `${PREFIXE}sexe-${option.valeur}`}
                    name="sexe"
                    value={option.valeur}
                    checked={valeurs.sexe === option.valeur}
                    onChange={() => {
                      onChange("sexe", option.valeur);
                      marquer("sexe");
                    }}
                    aria-describedby={idSexeErreur}
                    required
                  />
                  <span>{option.libelle}</span>
                </label>
              ))}
            </div>
            {erreurs.sexe && (
              <p className="rco-message-erreur" id={idSexeErreur}>
                {erreurs.sexe}
              </p>
            )}
          </fieldset>
        </div>
      </fieldset>

      <fieldset className="rco-section">
        <legend>Contacts</legend>
        <div className="rco-grille">
          <Champ
            id={`${PREFIXE}telephone`}
            libelle="Téléphone"
            requis
            aide="Numéro ivoirien (+225) à 10 chiffres"
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
          {texte("email", "Adresse email", "email", {
            type: "email",
            inputMode: "email",
            maxLength: 254,
            aide: `Pas d'adresse e-mail ? ${
              contact ? `Contactez l'administration : ${contact}` : "Contactez l'administration du séminaire."
            }`,
          })}
        </div>
      </fieldset>

      <fieldset className="rco-section">
        <legend>Commission et qualité</legend>
        <div className="rco-grille">
          <Champ id={`${PREFIXE}commission`} libelle="Commission pour cette édition" requis erreur={erreurs.commission}>
            {(attributs) => (
              <select
                {...attributs}
                name="commission"
                value={valeurs.commission}
                onChange={(e) => {
                  onChange("commission", e.target.value);
                  marquer("commission");
                }}
                onBlur={() => marquer("commission")}
              >
                <option value="">Choisissez…</option>
                {commissions.map((commission) => (
                  <option key={commission} value={commission}>
                    {commission}
                  </option>
                ))}
              </select>
            )}
          </Champ>
          <Champ
            id={`${PREFIXE}qualite`}
            libelle="Qualité"
            requis
            aide="Votre rôle dans la commission"
            erreur={erreurs.qualite}
          >
            {(attributs) => (
              <select
                {...attributs}
                name="qualite"
                value={valeurs.qualite}
                onChange={(e) => {
                  onChange("qualite", e.target.value);
                  marquer("qualite");
                }}
                onBlur={() => marquer("qualite")}
              >
                <option value="">Choisissez…</option>
                {qualites.map((qualite) => (
                  <option key={qualite.code} value={qualite.code}>
                    {qualite.libelle}
                  </option>
                ))}
              </select>
            )}
          </Champ>
        </div>
      </fieldset>

      <fieldset className="rco-section">
        <legend>Santé</legend>
        <p className="rco-aide">
          Facultatif. Ces informations permettent à la commission Santé de vous prendre en charge si besoin pendant le
          séminaire ; seule cette commission y a accès. Elles ne sont pas conservées sur cet appareil.
        </p>
        {[
          { champ: "allergies", libelle: "Allergies", aide: "ex. arachides, pénicilline. Laissez vide si aucune." },
          {
            champ: "antecedents_medicaux",
            libelle: "Antécédents médicaux",
            aide: "ex. asthme, diabète. Laissez vide si aucun.",
          },
        ].map(({ champ, libelle, aide }) => (
          <Champ
            key={champ}
            id={`${PREFIXE}${champ}`}
            libelle={libelle}
            facultatif
            aide={aide}
            erreur={erreurs[champ]}
          >
            {(attributs) => (
              <textarea
                {...attributs}
                name={champ}
                rows={3}
                maxLength={TEXTE_SANTE_MAX}
                autoComplete="off"
                value={valeurs[champ]}
                onChange={saisir(champ)}
                onBlur={() => marquer(champ)}
              />
            )}
          </Champ>
        ))}
      </fieldset>

      <fieldset className="rco-section">
        <legend>
          Photo <span className="rco-facultatif">(facultative)</span>
        </legend>
        <PhotoField
          fichier={photo.fichier}
          urlExistante={photo.supprimerExistante ? null : photo.urlExistante}
          sexe={valeurs.sexe}
          onChoisir={onChoisirPhoto}
          onRetirer={onRetirerPhoto}
          onPreparation={onPreparationPhoto}
        />
      </fieldset>

      <div className="rco-actions">
        <button type="button" className="rco-bouton rco-bouton-secondaire" onClick={onRetour}>
          Retour
        </button>
        <button
          type="submit"
          className={`rco-bouton rco-bouton-principal${photoEnPreparation || enCours ? " rco-bouton-occupe" : ""}`}
          aria-disabled={photoEnPreparation || enCours ? "true" : undefined}
        >
          {enCours ? "Vérification…" : "Continuer"}
        </button>
      </div>
    </form>
  );
};

export default StepFiche;
