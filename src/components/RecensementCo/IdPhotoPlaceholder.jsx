import React from "react";
import "./IdPhotoPlaceholder.css";

// Photo d'identité par défaut (format 3:4). Sexe "M" : avatar homme ; "F" : avatar femme voilée (images de
// public/) ; autre valeur : silhouette neutre dessinée.

const LIBELLES = {
  M: "Photo d'identité non fournie : avatar d'homme",
  F: "Photo d'identité non fournie : avatar de femme voilée",
  neutre: "Photo d'identité non fournie",
};

const AVATARS = {
  M: `${process.env.PUBLIC_URL}/avatar-homme-transparent.png`,
  F: `${process.env.PUBLIC_URL}/avatar-femme-transparent.png`,
};

const EPAULES = "M14 160 C14 131 34 116 60 116 C86 116 106 131 106 160 Z";

const IdPhotoPlaceholder = ({ sexe, label, className = "" }) => {
  const variante = sexe === "M" || sexe === "F" ? sexe : "neutre";
  const classes = `id-photo-placeholder ${className}`.trim();
  const libelle = label || LIBELLES[variante];

  if (variante !== "neutre") {
    return <img className={classes} src={AVATARS[variante]} alt={libelle} data-variante={variante} />;
  }
  return (
    <svg className={classes} viewBox="0 0 120 160" role="img" aria-label={libelle} focusable="false" data-variante={variante}>
      <rect className="idph-fond" x="0" y="0" width="120" height="160" rx="6" />
      <path className="idph-silhouette" d={EPAULES} />
      <rect className="idph-silhouette" x="51" y="88" width="18" height="32" rx="6" />
      <circle className="idph-silhouette" cx="60" cy="68" r="24" />
      <rect className="idph-cadre" x="0.75" y="0.75" width="118.5" height="158.5" rx="5.5" />
    </svg>
  );
};

export default IdPhotoPlaceholder;
