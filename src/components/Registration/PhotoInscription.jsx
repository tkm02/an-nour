// src/components/Registration/PhotoInscription.jsx
// Photo d'identité facultative de l'inscription et de la réinscription (décisions du 2026-11-27). Réutilise le
// champ photo du recensement CO (compression dans le navigateur, silhouette selon le sexe) sans le modifier.
// En réinscription, la photo de l'an dernier est affichée et reprise tant qu'elle n'est pas remplacée ou retirée.
import React from "react";
import PhotoField from "../RecensementCo/PhotoField";
import { choisirFichier, photoRetenue, retirerPhoto, TEXTE_CONSENTEMENT_PHOTO } from "../../utils/inscription/photo";
import "../../pages/RecensementCoPage.css";
import "./Reinscription.css";
import "./PhotoInscription.css";

const PhotoInscription = ({ photo, onChange, sexe, erreur }) => {
  const retenue = photoRetenue(photo);

  return (
    <fieldset className="rco-formulaire-public photo-inscription">
      <legend className="photo-inscription-titre">Photo d'identité (facultative, recommandée)</legend>
      <p className="rco-aide">
        Elle sert à préparer votre badge. Photo de face, visage dégagé, sur fond clair. Sans photo, elle sera prise à
        l'accueil.
      </p>
      {retenue === "precedente" && (
        <p className="rco-aide photo-inscription-precedente" role="status">
          Voici la photo de votre inscription de l'an dernier : gardez-la ou choisissez-en une plus récente.
        </p>
      )}

      <PhotoField
        fichier={photo.fichier}
        urlExistante={photo.reprendre ? photo.urlPrecedente : null}
        sexe={sexe}
        onChoisir={(fichier) => onChange(choisirFichier(photo, fichier))}
        onRetirer={() => onChange(retirerPhoto(photo))}
      />

      {retenue && (
        <div className="photo-inscription-consentement">
          <input
            id="consentement-photo"
            type="checkbox"
            checked={photo.consentement}
            onChange={(e) => onChange({ ...photo, consentement: e.target.checked })}
            aria-invalid={erreur ? "true" : undefined}
            aria-describedby={erreur ? "consentement-photo-erreur" : undefined}
          />
          <label htmlFor="consentement-photo">{TEXTE_CONSENTEMENT_PHOTO}</label>
        </div>
      )}
      <div aria-live="polite">
        {erreur && (
          <p className="rco-message-erreur" id="consentement-photo-erreur">
            {erreur}
          </p>
        )}
      </div>
    </fieldset>
  );
};

export default PhotoInscription;
