// src/utils/recensementCo/photo.js
// Préparation de la photo facultative du recensement CO : contrôle du type, réduction (côté max 1200 px) et
// recompression JPEG (qualité 0,85) dans le navigateur avant l'envoi à l'API (qui revérifie et recompresse).
// La recompression par canvas supprime aussi les métadonnées EXIF (dont la localisation).

export const TYPES_PHOTO = ["image/jpeg", "image/png", "image/webp"];
export const COTE_MAX = 1200;
export const QUALITE_JPEG = 0.85;
export const TAILLE_MAX = 5 * 1024 * 1024; // après compression (limite de l'API)
export const TAILLE_MAX_ORIGINAL = 25 * 1024 * 1024; // au-delà, décodage trop coûteux sur téléphone

export class ErreurPhoto extends Error {
  constructor(message) {
    super(message);
    this.name = "ErreurPhoto";
  }
}

/** Message d'erreur si le fichier choisi n'est pas acceptable, sinon "". */
export const verifierFichierPhoto = (fichier) => {
  if (!fichier) return "Aucun fichier sélectionné.";
  if (!TYPES_PHOTO.includes(fichier.type)) return "Format non accepté : choisissez une photo JPEG, PNG ou WEBP.";
  if (fichier.size > TAILLE_MAX_ORIGINAL) return "Cette photo est trop lourde (25 Mo maximum avant compression).";
  return "";
};

/** Dimensions réduites en conservant les proportions (jamais agrandies). */
export const dimensionsReduites = (largeur, hauteur, coteMax = COTE_MAX) => {
  if (!(largeur > 0) || !(hauteur > 0)) return null;
  const ratio = Math.min(1, coteMax / Math.max(largeur, hauteur));
  return { largeur: Math.max(1, Math.round(largeur * ratio)), hauteur: Math.max(1, Math.round(hauteur * ratio)) };
};

export const formaterTaille = (octets) =>
  octets >= 1024 * 1024 ? `${(octets / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo` : `${Math.max(1, Math.round(octets / 1024))} Ko`;

const chargerImage = (fichier) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fichier);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ErreurPhoto("Impossible de lire cette image. Choisissez une autre photo."));
    };
    image.src = url;
  });

/** Photo compressée (File JPEG) prête à l'envoi ; lève ErreurPhoto avec un message affichable. */
export const compresserPhoto = async (fichier) => {
  const probleme = verifierFichierPhoto(fichier);
  if (probleme) throw new ErreurPhoto(probleme);

  const image = await chargerImage(fichier);
  const dimensions = dimensionsReduites(image.naturalWidth, image.naturalHeight);
  if (!dimensions) throw new ErreurPhoto("Impossible de lire cette image. Choisissez une autre photo.");

  const canvas = document.createElement("canvas");
  canvas.width = dimensions.largeur;
  canvas.height = dimensions.hauteur;
  const contexte = canvas.getContext("2d");
  if (!contexte) throw new ErreurPhoto("Votre navigateur ne permet pas de préparer la photo.");
  contexte.fillStyle = "#ffffff"; // fond blanc pour les PNG/WEBP transparents (le JPEG n'a pas de transparence)
  contexte.fillRect(0, 0, dimensions.largeur, dimensions.hauteur);
  contexte.drawImage(image, 0, 0, dimensions.largeur, dimensions.hauteur);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITE_JPEG));
  if (!blob) throw new ErreurPhoto("Impossible de préparer la photo. Choisissez une autre photo.");
  if (blob.size > TAILLE_MAX) throw new ErreurPhoto("La photo reste trop lourde après compression (5 Mo maximum).");
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
};
