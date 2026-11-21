import { completerAvecContact, contactAide } from "./contact";

// Contact fictif uniquement
describe("contact d'aide", () => {
  it("lit REACT_APP_RECENSEMENT_CONTACT, sinon rien", () => {
    expect(contactAide({ REACT_APP_RECENSEMENT_CONTACT: "  WhatsApp 07 00 00 00 00 " })).toBe("WhatsApp 07 00 00 00 00");
    expect(contactAide({ REACT_APP_RECENSEMENT_CONTACT: "   " })).toBeNull();
    expect(contactAide({})).toBeNull();
  });

  it("complète uniquement les messages invitant à contacter l'administration", () => {
    expect(completerAvecContact("Fiche déjà validée : contactez l'administration.", "WhatsApp 07 00 00 00 00")).toBe(
      "Fiche déjà validée : contactez l'administration. Besoin d'aide ? WhatsApp 07 00 00 00 00"
    );
    expect(completerAvecContact("Trop de tentatives.", "WhatsApp 07 00 00 00 00")).toBe("Trop de tentatives.");
    expect(completerAvecContact("Contactez l'administration.", null)).toBe("Contactez l'administration.");
  });
});
