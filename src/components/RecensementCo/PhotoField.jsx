import React, { useEffect, useRef, useState } from "react";
import IdPhotoPlaceholder from "./IdPhotoPlaceholder";
import { compresserPhoto, ErreurPhoto, formaterTaille } from "../../utils/recensementCo/photo";
import { urlPhotoSure } from "../../utils/recensementCo/requetes";
import "./PhotoField.css";

const useUrlObjet = (fichier) => {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!fichier || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
      setUrl(null);
      return undefined;
    }
    const nouvelle = URL.createObjectURL(fichier);
    setUrl(nouvelle);
    return () => URL.revokeObjectURL(nouvelle);
  }, [fichier]);
  return url;
};

/** Aperçu 3:4 : photo choisie, sinon photo déjà enregistrée, sinon silhouette selon le sexe. */
export const ApercuPhoto = ({ fichier, urlExistante, sexe, className = "" }) => {
  const urlFichier = useUrlObjet(fichier);
  const url = urlFichier || (!fichier ? urlPhotoSure(urlExistante) : null);
  return (
    <div className={`co-apercu-photo ${className}`.trim()}>
      {url ? (
        <img src={url} alt={fichier ? "Aperçu de la photo choisie" : "Photo enregistrée sur votre fiche"} />
      ) : (
        <IdPhotoPlaceholder sexe={sexe} />
      )}
    </div>
  );
};

const PhotoField = ({ fichier, urlExistante, sexe, onChoisir, onRetirer, onPreparation = () => {} }) => {
  const entree = useRef(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const aUnePhoto = Boolean(fichier || urlPhotoSure(urlExistante));

  const choisir = async (evenement) => {
    const original = evenement.target.files && evenement.target.files[0];
    evenement.target.value = ""; // permet de rechoisir le même fichier
    if (!original || enCours) return;
    setErreur("");
    setEnCours(true);
    onPreparation(true);
    try {
      const compressee = await compresserPhoto(original);
      onChoisir(compressee);
    } catch (e) {
      setErreur(e instanceof ErreurPhoto ? e.message : "Impossible de préparer cette photo. Choisissez-en une autre.");
    } finally {
      setEnCours(false);
      onPreparation(false);
    }
  };

  const retirer = () => {
    if (enCours) return;
    setErreur("");
    onRetirer();
  };

  return (
    <div className="co-photo">
      <ApercuPhoto fichier={fichier} urlExistante={urlExistante} sexe={sexe} />
      <div className="co-photo-actions">
        <p className="rco-aide" id="photo-aide">
          Prenez une photo de face ou choisissez-en une dans votre galerie (JPEG, PNG ou WEBP).
        </p>
        <input
          ref={entree}
          id="photo"
          type="file"
          aria-label="Fichier de la photo"
          accept="image/jpeg,image/png,image/webp"
          onChange={choisir}
          hidden
        />
        <button
          type="button"
          className={`rco-bouton rco-bouton-secondaire${enCours ? " rco-bouton-occupe" : ""}`}
          onClick={() => !enCours && entree.current && entree.current.click()}
          aria-disabled={enCours ? "true" : undefined}
          aria-describedby={erreur ? "photo-aide photo-erreur" : "photo-aide"}
        >
          {enCours ? "Préparation de la photo…" : aUnePhoto ? "Changer de photo" : "Choisir une photo"}
        </button>
        {aUnePhoto && (
          <button
            type="button"
            className="rco-bouton rco-bouton-discret"
            onClick={retirer}
            aria-disabled={enCours ? "true" : undefined}
          >
            Retirer la photo
          </button>
        )}
        {fichier && <p className="rco-aide">Photo prête ({formaterTaille(fichier.size)}).</p>}
        <div aria-live="polite">
          {erreur && (
            <p className="rco-message-erreur" id="photo-erreur">
              {erreur}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoField;
