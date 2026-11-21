import { render, screen } from "@testing-library/react";
import IdPhotoPlaceholder from "./IdPhotoPlaceholder";

describe("IdPhotoPlaceholder", () => {
  it("affiche une silhouette d'homme pour le sexe M", () => {
    render(<IdPhotoPlaceholder sexe="M" />);
    const image = screen.getByRole("img", { name: /silhouette d'homme/ });
    expect(image).toHaveAttribute("data-variante", "M");
    expect(image).toHaveAttribute("viewBox", "0 0 120 160"); // format 3:4
  });

  it("affiche une silhouette de femme voilée pour le sexe F", () => {
    render(<IdPhotoPlaceholder sexe="F" />);
    expect(screen.getByRole("img", { name: /femme voilée/ })).toHaveAttribute("data-variante", "F");
  });

  it("affiche une silhouette neutre sans sexe choisi", () => {
    render(<IdPhotoPlaceholder sexe="" />);
    expect(screen.getByRole("img", { name: "Photo d'identité non fournie" })).toHaveAttribute("data-variante", "neutre");
  });

  it("accepte un libellé personnalisé", () => {
    render(<IdPhotoPlaceholder sexe="M" label="Photo du membre" />);
    expect(screen.getByRole("img", { name: "Photo du membre" })).toBeInTheDocument();
  });
});
