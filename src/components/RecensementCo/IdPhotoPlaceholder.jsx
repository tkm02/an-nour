import React from "react";
import "./IdPhotoPlaceholder.css";

// Silhouettes de photo d'identité (format 3:4, style plat), dessin original. Sexe "M" : homme ; "F" : femme voilée
// en jilbab (voile enveloppant la tête et les épaules, visage ovale sans traits) ; autre valeur : silhouette neutre.

const LIBELLES = {
  M: "Photo d'identité non fournie : silhouette d'homme",
  F: "Photo d'identité non fournie : silhouette de femme voilée",
  neutre: "Photo d'identité non fournie",
};

const EPAULES = "M14 160 C14 131 34 116 60 116 C86 116 106 131 106 160 Z";

const Homme = () => (
  <>
    <path className="idph-silhouette" d={EPAULES} />
    <rect className="idph-silhouette" x="51" y="88" width="18" height="32" rx="6" />
    <ellipse className="idph-silhouette" cx="38.5" cy="70" rx="4" ry="7" />
    <ellipse className="idph-silhouette" cx="81.5" cy="70" rx="4" ry="7" />
    <ellipse className="idph-silhouette" cx="60" cy="68" rx="21" ry="25" />
    <path className="idph-detail" d="M39 64 C38 47 47 40 60 40 C73 40 82 47 81 64 C77 55 70 51 60 51 C50 51 43 55 39 64 Z" />
    <path className="idph-fond" d="M50 116 L60 131 L70 116 Z" />
  </>
);

const FemmeVoilee = () => (
  <>
    <path
      className="idph-silhouette"
      d="M60 30 C35 30 27 52 27 76 C27 95 31 106 23 117 C15 128 8 142 8 160 L112 160 C112 142 105 128 97 117 C89 106 93 95 93 76 C93 52 85 30 60 30 Z"
    />
    <ellipse className="idph-visage" cx="60" cy="76" rx="16" ry="21" />
    <path className="idph-pli" d="M38 118 C48 128 72 128 82 118" />
    <path className="idph-pli" d="M28 140 C44 148 76 148 92 140" />
  </>
);

const Neutre = () => (
  <>
    <path className="idph-silhouette" d={EPAULES} />
    <rect className="idph-silhouette" x="51" y="88" width="18" height="32" rx="6" />
    <circle className="idph-silhouette" cx="60" cy="68" r="24" />
  </>
);

const IdPhotoPlaceholder = ({ sexe, label, className = "" }) => {
  const variante = sexe === "M" || sexe === "F" ? sexe : "neutre";
  return (
    <svg
      className={`id-photo-placeholder ${className}`.trim()}
      viewBox="0 0 120 160"
      role="img"
      aria-label={label || LIBELLES[variante]}
      focusable="false"
      data-variante={variante}
    >
      <rect className="idph-fond" x="0" y="0" width="120" height="160" rx="6" />
      {variante === "M" && <Homme />}
      {variante === "F" && <FemmeVoilee />}
      {variante === "neutre" && <Neutre />}
      <rect className="idph-cadre" x="0.75" y="0.75" width="118.5" height="158.5" rx="5.5" />
    </svg>
  );
};

export default IdPhotoPlaceholder;
