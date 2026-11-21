import { compresserPhoto, dimensionsReduites, ErreurPhoto, formaterTaille, verifierFichierPhoto } from "./photo";

const fichier = (type, taille = 10) => {
  const f = new File(["x"], "photo", { type });
  Object.defineProperty(f, "size", { value: taille });
  return f;
};

describe("verifierFichierPhoto", () => {
  it("accepte JPEG, PNG et WEBP", () => {
    expect(verifierFichierPhoto(fichier("image/jpeg"))).toBe("");
    expect(verifierFichierPhoto(fichier("image/png"))).toBe("");
    expect(verifierFichierPhoto(fichier("image/webp"))).toBe("");
  });

  it("refuse les autres formats, un fichier absent ou démesuré", () => {
    expect(verifierFichierPhoto(fichier("image/gif"))).toMatch(/JPEG, PNG ou WEBP/);
    expect(verifierFichierPhoto(fichier("application/pdf"))).toMatch(/JPEG, PNG ou WEBP/);
    expect(verifierFichierPhoto(null)).toMatch(/Aucun fichier/);
    expect(verifierFichierPhoto(fichier("image/jpeg", 30 * 1024 * 1024))).toMatch(/trop lourde/);
  });
});

describe("dimensionsReduites", () => {
  it("réduit le plus grand côté à 1200 px en conservant les proportions", () => {
    expect(dimensionsReduites(3000, 4000)).toEqual({ largeur: 900, hauteur: 1200 });
    expect(dimensionsReduites(4032, 3024)).toEqual({ largeur: 1200, hauteur: 900 });
  });

  it("n'agrandit jamais une petite image et refuse des dimensions nulles", () => {
    expect(dimensionsReduites(600, 800)).toEqual({ largeur: 600, hauteur: 800 });
    expect(dimensionsReduites(0, 800)).toBeNull();
  });
});

describe("compresserPhoto", () => {
  it("rejette un format non accepté avant tout décodage", async () => {
    await expect(compresserPhoto(fichier("image/gif"))).rejects.toBeInstanceOf(ErreurPhoto);
  });
});

it("formaterTaille", () => {
  expect(formaterTaille(512 * 1024)).toBe("512 Ko");
  expect(formaterTaille(2.5 * 1024 * 1024)).toBe("2,5 Mo");
});
