import { render, screen } from "@testing-library/react";
import IdPhotoPlaceholder from "./IdPhotoPlaceholder";

describe("IdPhotoPlaceholder", () => {
  it("affiche l'avatar homme pour le sexe M", () => {
    render(<IdPhotoPlaceholder sexe="M" />);
    const image = screen.getByRole("img", { name: /avatar d'homme/ });
    expect(image).toHaveAttribute("data-variante", "M");
    expect(image.getAttribute("src")).toMatch(/\/avatar-homme-transparent\.png$/);
  });

  it("affiche l'avatar femme voilée pour le sexe F", () => {
    render(<IdPhotoPlaceholder sexe="F" />);
    const image = screen.getByRole("img", { name: /femme voilée/ });
    expect(image).toHaveAttribute("data-variante", "F");
    expect(image.getAttribute("src")).toMatch(/\/avatar-femme-transparent\.png$/);
  });

  it("affiche une silhouette neutre sans sexe choisi", () => {
    render(<IdPhotoPlaceholder sexe="" />);
    const image = screen.getByRole("img", { name: "Photo d'identité non fournie" });
    expect(image).toHaveAttribute("data-variante", "neutre");
    expect(image).toHaveAttribute("viewBox", "0 0 120 160"); // format 3:4
  });

  it("accepte un libellé personnalisé", () => {
    render(<IdPhotoPlaceholder sexe="M" label="Photo du membre" />);
    expect(screen.getByRole("img", { name: "Photo du membre" })).toBeInTheDocument();
  });
});
