import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import RecensementCoPage from "./RecensementCoPage";
import * as service from "../services/recensementCo";
import { compresserPhoto } from "../utils/recensementCo/photo";
import { ErreurApi } from "../utils/recensementCo/erreurs";
import { CLE_PROGRESSION } from "../utils/recensementCo/progression";

jest.mock("../services/recensementCo", () => ({
  chargerConfiguration: jest.fn(),
  identifierMembre: jest.fn(),
  soumettreFiche: jest.fn(),
  envoyerPhoto: jest.fn(),
}));

jest.mock("../utils/recensementCo/photo", () => ({
  ...jest.requireActual("../utils/recensementCo/photo"),
  compresserPhoto: jest.fn(),
}));

// Données fictives uniquement
const CONFIGURATION = {
  ouvert: true,
  edition: { code: "TEST26", libelle: "Édition de test" },
  commissions: ["Santé", "Logistique"],
  commissions_precedentes: ["Santé", "Logistique", "Accueil"],
  qualites: [
    { code: "membre", libelle: "Membre" },
    { code: "responsable", libelle: "Responsable" },
    { code: "responsable_adjoint", libelle: "Responsable adjoint" },
  ],
  jeton_formulaire: "jeton-formulaire-1",
  consentement_version: "test-v1",
};

const FICHE_TROUVEE = {
  nom: "TEST",
  prenoms: "Awa",
  sexe: "F",
  telephone: "0700000000",
  email: "awa.serveur@exemple.ci",
  commission: "Santé",
  qualite: "membre",
  allergies: "Arachide (fictif)",
  antecedents_medicaux: null,
  photo_url: null,
};

const TROUVEE = {
  resultat: "trouve",
  jeton_session: "jeton-session-1",
  fiche: FICHE_TROUVEE,
  deja_soumise: false,
  verrouillee: false,
};
const NOUVEAU = { resultat: "nouveau", jeton_session: "jeton-session-2", fiche: null, deja_soumise: false, verrouillee: false };
const ENREGISTREE = {
  message: "Votre fiche a bien été enregistrée. Merci !",
  reference: "CO-TEST26-ABC123",
  jeton_photo: "jeton-photo-1",
};

const http = (status, data, retryAfter = null) => new ErreurApi("http", { status, data, retryAfter });

const saisir = (libelle, valeur) => fireEvent.change(screen.getByLabelText(libelle), { target: { value: valeur } });
const cliquer = (nom) => fireEvent.click(screen.getByRole("button", { name: nom }));

const repondreAncien = (reponse) => fireEvent.click(screen.getByRole("radio", { name: reponse }));

/** Parcours « oui » : membre du CO l'an passé, identification pour retrouver la fiche. */
const remplirIdentification = (commission = "Santé") => {
  repondreAncien("Oui");
  saisir(/^Nom/, "Test");
  saisir(/^Prénom\(s\)/, "Awa");
  saisir(/^Téléphone/, "07 00 00 00 00");
  saisir(/^Votre commission l'an passé/, commission);
};

/** Configuration chargée : l'édition apparaît dans le surtitre. */
const configurationChargee = () => screen.findByText(/Édition de test/);

const afficher = async () => {
  render(<RecensementCoPage delaiMinimalMs={0} />);
  await configurationChargee();
};

const allerAuRecapitulatif = async (reponseIdentification = TROUVEE) => {
  service.identifierMembre.mockResolvedValue(reponseIdentification);
  await afficher();
  remplirIdentification();
  cliquer("Continuer");
  await screen.findByRole("heading", { name: "Vérifiez et complétez votre fiche" });
  cliquer("Continuer");
  await screen.findByRole("heading", { name: "Récapitulatif et envoi" });
  fireEvent.click(screen.getByRole("checkbox"));
};

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  window.sessionStorage.clear();
  delete process.env.REACT_APP_RECENSEMENT_CONTACT;
  service.chargerConfiguration.mockResolvedValue(CONFIGURATION);
});

describe("RecensementCoPage — affichage", () => {
  it("affiche l'étape 1 pendant le chargement : seuls la liste et « Continuer » attendent", async () => {
    let terminer;
    service.chargerConfiguration.mockReturnValue(new Promise((resolve) => (terminer = resolve)));
    render(<RecensementCoPage delaiMinimalMs={0} />);
    expect(screen.getByRole("heading", { name: "Identifiez-vous" })).toBeInTheDocument();
    repondreAncien("Oui");
    expect(screen.getByLabelText(/^Nom/)).toBeEnabled();
    expect(screen.getByRole("option", { name: "Chargement de la liste…" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuer" })).toHaveAttribute("aria-disabled", "true");
    await act(async () => terminer(CONFIGURATION));
    expect(screen.getByRole("button", { name: "Continuer" })).not.toHaveAttribute("aria-disabled");
  });

  it("indique l'étape courante de façon accessible, avec des libellés courts", async () => {
    await afficher();
    const etapes = within(screen.getByRole("navigation", { name: "Progression du formulaire" })).getAllByRole("listitem");
    expect(etapes.map((e) => e.textContent)).toEqual([
      "1Étape 1 sur 3 : Identité",
      "2Étape 2 sur 3 : Fiche",
      "3Étape 3 sur 3 : Envoi",
    ]);
    expect(etapes[0]).toHaveAttribute("aria-current", "step");
    expect(etapes[1]).not.toHaveAttribute("aria-current");
  });

  it("contient le champ piège hors de l'arbre d'accessibilité et ignoré des gestionnaires de mots de passe", async () => {
    await afficher();
    const piege = screen.getByLabelText("Laisser ce champ vide");
    expect(piege).toHaveAttribute("tabindex", "-1");
    expect(piege).toHaveAttribute("autocomplete", "off");
    expect(piege).toHaveAttribute("data-lpignore", "true");
    expect(piege).toHaveAttribute("data-1p-ignore");
    expect(piege).toHaveAttribute("data-bwignore");
    expect(piege.getAttribute("name")).not.toMatch(/web|url|site/i);
    expect(screen.queryByRole("textbox", { name: "Laisser ce champ vide" })).not.toBeInTheDocument();
  });

  it("commence par « membre du CO l'an passé ? » : sans réponse, erreur et focus sur la question", async () => {
    await afficher();
    expect(screen.getByRole("group", { name: /membre du comité d'organisation l'an passé/ })).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Nom/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Date de naissance/)).not.toBeInTheDocument();
    cliquer("Continuer");
    const oui = screen.getByRole("radio", { name: "Oui" });
    expect(oui).toHaveFocus();
    expect(oui).toHaveAccessibleDescription("Indiquez si vous étiez membre du CO l'an passé.");
    expect(service.identifierMembre).not.toHaveBeenCalled();
  });

  it("réponse « oui » : signale les erreurs sous chaque champ et place le focus sur la première", async () => {
    await afficher();
    repondreAncien("Oui");
    expect(screen.queryByRole("option", { name: /Nouveau membre/ })).not.toBeInTheDocument();
    cliquer("Continuer");
    const nom = screen.getByLabelText(/^Nom/);
    expect(nom).toHaveFocus();
    expect(nom).toHaveAttribute("aria-invalid", "true");
    expect(nom).toHaveAccessibleDescription("Le nom est obligatoire.");
    expect(service.identifierMembre).not.toHaveBeenCalled();
  });

  it("affiche le contact d'aide s'il est configuré", async () => {
    process.env.REACT_APP_RECENSEMENT_CONTACT = "WhatsApp 07 00 00 00 00 (fictif)";
    await afficher();
    expect(screen.getByText("WhatsApp 07 00 00 00 00 (fictif)")).toBeInTheDocument();
  });

  it("recensement fermé : message explicite", async () => {
    service.chargerConfiguration.mockResolvedValue({ ...CONFIGURATION, ouvert: false, edition: null });
    render(<RecensementCoPage delaiMinimalMs={0} />);
    expect(await screen.findByText("Le recensement n'est pas ouvert pour le moment.")).toBeInTheDocument();
  });

  it("serveur injoignable au chargement : alerte focalisée et bouton Réessayer", async () => {
    service.chargerConfiguration.mockRejectedValueOnce(new ErreurApi("reseau"));
    render(<RecensementCoPage delaiMinimalMs={0} />);
    const alerte = await screen.findByRole("alert");
    expect(alerte).toHaveTextContent(/Impossible de contacter le serveur/);
    expect(alerte).toHaveFocus();
    cliquer("Réessayer");
    await configurationChargee();
  });
});

describe("RecensementCoPage — parcours", () => {
  it("fiche retrouvée : pré-remplit tout (santé comprise), puis envoie la fiche après consentement", async () => {
    service.identifierMembre.mockResolvedValue(TROUVEE);
    service.soumettreFiche.mockResolvedValue(ENREGISTREE);
    await afficher();
    remplirIdentification();
    cliquer("Continuer");

    await screen.findByText("Nous avons retrouvé votre fiche");
    expect(service.identifierMembre).toHaveBeenCalledWith({
      nom: "Test",
      prenoms: "Awa",
      telephone: "0700000000",
      commission_precedente: "Santé",
      jeton_formulaire: "jeton-formulaire-1",
      site_web: "",
    });
    expect(screen.getByLabelText(/^Adresse email/)).toHaveValue("awa.serveur@exemple.ci");
    expect(screen.getByLabelText(/^Allergies/)).toHaveValue("Arachide (fictif)");
    expect(screen.getByLabelText(/^Allergies/)).toHaveAccessibleDescription(/arachides, pénicilline/);
    expect(screen.getByLabelText(/^Commission pour cette édition/)).toHaveValue("Santé");
    expect(screen.getByRole("img", { name: /femme voilée/ })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Date de naissance/)).not.toBeInTheDocument();

    // Rien de ce que le serveur a renvoyé n'est écrit dans le navigateur
    const sauvegarde = window.sessionStorage.getItem(CLE_PROGRESSION) || "";
    expect(sauvegarde).not.toMatch(/awa\.serveur|Arachide|0700000000/);
    expect(window.localStorage.getItem(CLE_PROGRESSION)).toBeNull();

    cliquer("Continuer");
    await screen.findByRole("heading", { name: "Récapitulatif et envoi" });
    expect(screen.getByText("Arachide (fictif)")).toBeInTheDocument();
    expect(screen.getByText("Version du texte : test-v1")).toBeInTheDocument();

    cliquer("Envoyer ma fiche");
    expect(screen.getByRole("checkbox")).toHaveFocus();
    expect(screen.getByText(/devez donner votre consentement/)).toBeInTheDocument();
    expect(service.soumettreFiche).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("checkbox"));
    cliquer("Envoyer ma fiche");
    await screen.findByText("CO-TEST26-ABC123");
    expect(service.soumettreFiche).toHaveBeenCalledWith(
      expect.objectContaining({
        jeton_session: "jeton-session-1",
        email: "awa.serveur@exemple.ci",
        allergies: "Arachide (fictif)",
        consentement: true,
        supprimer_photo: false,
      })
    );
    expect(service.soumettreFiche.mock.calls[0][0]).not.toHaveProperty("antecedents_medicaux");
    expect(service.envoyerPhoto).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(CLE_PROGRESSION)).toBeNull();
  });

  it("n'enregistre dans l'onglet que les champs saisis par l'utilisateur", async () => {
    service.identifierMembre.mockResolvedValue(TROUVEE);
    await afficher();
    remplirIdentification();
    cliquer("Continuer");
    await screen.findByText("Nous avons retrouvé votre fiche");
    saisir(/^Adresse email/, "awa.saisie@exemple.ci");
    saisir(/^Allergies/, "Pollen (fictif)");
    const sauvegarde = JSON.parse(window.sessionStorage.getItem(CLE_PROGRESSION));
    expect(sauvegarde.fiche).toEqual({ email: "awa.saisie@exemple.ci" });
    expect(sauvegarde.identification).toEqual({
      ancien_membre: "oui",
      nom: "Test",
      prenoms: "Awa",
      commission_precedente: "Santé",
    });
  });

  it("supprime l'ancienne sauvegarde localStorage au chargement", async () => {
    window.localStorage.setItem(CLE_PROGRESSION, JSON.stringify({ version: 1, identification: { nom: "Test" } }));
    await afficher();
    expect(window.localStorage.getItem(CLE_PROGRESSION)).toBeNull();
  });

  it("réponse « non » : fiche vide, identification au passage au récapitulatif, puis envoi", async () => {
    service.identifierMembre.mockResolvedValue(NOUVEAU);
    service.soumettreFiche.mockResolvedValue(ENREGISTREE);
    await afficher();
    repondreAncien("Non");
    cliquer("Continuer");
    await screen.findByText("Complétez votre fiche, elle sera vérifiée par l'administration.");
    expect(service.identifierMembre).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^Nom/)).toHaveValue("");
    expect(screen.getByLabelText(/^Adresse email/)).toHaveValue("");
    expect(screen.queryByLabelText(/Date de naissance/)).not.toBeInTheDocument();

    cliquer("Continuer");
    expect(screen.getByLabelText(/^Nom/)).toHaveFocus();
    expect(service.identifierMembre).not.toHaveBeenCalled();

    saisir(/^Nom/, "Nouveau");
    saisir(/^Prénom\(s\)/, "Fictif");
    fireEvent.click(screen.getByRole("radio", { name: "Masculin" }));
    saisir(/^Téléphone/, "05 00 00 00 00");
    saisir(/^Adresse email/, "nouveau.fictif@exemple.ci");
    saisir(/^Commission pour cette édition/, "Logistique");
    saisir(/^Qualité/, "membre");
    cliquer("Continuer");
    await screen.findByRole("heading", { name: "Récapitulatif et envoi" });
    expect(service.identifierMembre).toHaveBeenCalledWith({
      nom: "Nouveau",
      prenoms: "Fictif",
      telephone: "0500000000",
      commission_precedente: null,
      jeton_formulaire: "jeton-formulaire-1",
      site_web: "",
    });

    // Retour à la fiche sans changer l'identité : pas de nouvelle identification
    cliquer("Modifier");
    await screen.findByRole("heading", { name: "Complétez votre fiche" });
    cliquer("Continuer");
    await screen.findByRole("heading", { name: "Récapitulatif et envoi" });
    expect(service.identifierMembre).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("checkbox"));
    cliquer("Envoyer ma fiche");
    await screen.findByText("CO-TEST26-ABC123");
    expect(service.soumettreFiche).toHaveBeenCalledWith(
      expect.objectContaining({ jeton_session: "jeton-session-2", nom: "Nouveau", commission: "Logistique" })
    );
    expect(service.soumettreFiche.mock.calls[0][0]).not.toHaveProperty("date_naissance");
  });

  it("réponse « non » mais fiche de cette édition déjà validée : lecture seule, rien n'est envoyé", async () => {
    service.identifierMembre.mockResolvedValue({ ...NOUVEAU, resultat: "trouve", deja_soumise: true, verrouillee: true });
    await afficher();
    repondreAncien("Non");
    cliquer("Continuer");
    await screen.findByText("Complétez votre fiche, elle sera vérifiée par l'administration.");
    saisir(/^Nom/, "Nouveau");
    saisir(/^Prénom\(s\)/, "Fictif");
    fireEvent.click(screen.getByRole("radio", { name: "Masculin" }));
    saisir(/^Téléphone/, "05 00 00 00 00");
    saisir(/^Adresse email/, "nouveau.fictif@exemple.ci");
    saisir(/^Commission pour cette édition/, "Logistique");
    saisir(/^Qualité/, "membre");
    cliquer("Continuer");
    await screen.findByText(/Fiche déjà validée : contactez l'administration/);
    expect(screen.getByRole("heading", { name: "Vos modifications (non enregistrées)" })).toBeInTheDocument();
    // l'étape ne change pas : le focus est placé sur l'alerte (lue par les lecteurs d'écran)
    const alerte = screen.getByRole("status");
    expect(alerte).toHaveTextContent(/Fiche déjà validée/);
    await waitFor(() => expect(alerte).toHaveFocus());
    expect(service.soumettreFiche).not.toHaveBeenCalled();
  });

  it("ancien membre non retrouvé : invitation à vérifier l'identification", async () => {
    service.identifierMembre.mockResolvedValue(NOUVEAU);
    await afficher();
    remplirIdentification("Santé");
    cliquer("Continuer");
    expect(await screen.findByText("Nous n'avons pas retrouvé votre fiche de l'an passé.")).toBeInTheDocument();
  });

  it("fiche verrouillée : lecture seule et invitation à contacter l'administration", async () => {
    service.identifierMembre.mockResolvedValue({ ...TROUVEE, deja_soumise: true, verrouillee: true });
    await afficher();
    remplirIdentification();
    cliquer("Continuer");
    await screen.findByText(/Fiche déjà validée : contactez l'administration/);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continuer" })).not.toBeInTheDocument();
  });

  it("retour arrière : un champ volontairement vidé ne reprend pas la valeur du serveur", async () => {
    service.identifierMembre.mockResolvedValue(TROUVEE);
    await afficher();
    remplirIdentification();
    cliquer("Continuer");
    await screen.findByText("Nous avons retrouvé votre fiche");
    saisir(/^Allergies/, "");
    cliquer("Retour");
    await screen.findByRole("heading", { name: "Identifiez-vous" });
    cliquer("Continuer");
    await screen.findByText("Nous avons retrouvé votre fiche");
    expect(screen.getByLabelText(/^Allergies/)).toHaveValue("");
  });

  it("confirmation : copie de la référence et fiche d'une autre personne", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    service.soumettreFiche.mockResolvedValue(ENREGISTREE);
    await allerAuRecapitulatif();
    cliquer("Envoyer ma fiche");
    await screen.findByText("CO-TEST26-ABC123");

    cliquer("Copier la référence");
    expect(await screen.findByText("Référence copiée.")).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith("CO-TEST26-ABC123");

    cliquer("Remplir la fiche d'une autre personne");
    await screen.findByRole("heading", { name: "Identifiez-vous" });
    expect(screen.getByRole("radio", { name: "Oui" })).not.toBeChecked();
    repondreAncien("Oui");
    expect(screen.getByLabelText(/^Nom/)).toHaveValue("");
    await waitFor(() => expect(service.chargerConfiguration).toHaveBeenCalledTimes(2));
    delete navigator.clipboard;
  });
});

describe("RecensementCoPage — erreurs", () => {
  it("jeton du formulaire refusé (400) : recharge la configuration, message rassurant et focus sur l'alerte", async () => {
    service.identifierMembre.mockRejectedValueOnce(
      http(400, { detail: "Formulaire expiré ou envoyé trop vite, veuillez réessayer" })
    );
    await afficher();
    remplirIdentification();
    cliquer("Continuer");
    const alerte = await screen.findByRole("alert");
    expect(alerte).toHaveTextContent("Pour votre sécurité, le formulaire a expiré. Vos réponses sont conservées");
    expect(alerte).toHaveFocus();
    expect(service.chargerConfiguration).toHaveBeenCalledTimes(2);
  });

  it("champ piège rempli : valeur transmise, puis au 2e refus invitation à contacter l'administration", async () => {
    process.env.REACT_APP_RECENSEMENT_CONTACT = "WhatsApp 07 00 00 00 00 (fictif)";
    service.identifierMembre.mockRejectedValue(http(400, { detail: "Requête invalide" }));
    await afficher();
    remplirIdentification();
    fireEvent.change(screen.getByLabelText("Laisser ce champ vide"), { target: { value: "http://spam.example" } });
    cliquer("Continuer");
    await screen.findByText(/le formulaire a expiré/);
    expect(service.identifierMembre.mock.calls[0][0].site_web).toBe("http://spam.example");

    cliquer("Continuer");
    const alerte = await screen.findByText(/n'a pas pu être vérifiée/);
    expect(alerte).toHaveTextContent("Besoin d'aide ? WhatsApp 07 00 00 00 00 (fictif)");
    expect(service.chargerConfiguration).toHaveBeenCalledTimes(2); // pas de rechargement en boucle
  });

  it("trop de tentatives (429) : message avec le délai", async () => {
    service.identifierMembre.mockRejectedValueOnce(http(429, { detail: "Trop de requêtes" }, "600"));
    await afficher();
    remplirIdentification();
    cliquer("Continuer");
    expect(await screen.findByRole("alert")).toHaveTextContent("Trop de tentatives. Réessayez dans 10 minutes.");
  });

  it("double clic sur « Envoyer » : un seul envoi", async () => {
    let terminer;
    service.soumettreFiche.mockReturnValue(new Promise((resolve) => (terminer = resolve)));
    await allerAuRecapitulatif();
    const bouton = screen.getByRole("button", { name: "Envoyer ma fiche" });
    fireEvent.click(bouton);
    fireEvent.click(bouton);
    expect(service.soumettreFiche).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Envoi en cours…" })).toHaveAttribute("aria-disabled", "true");
    await act(async () => terminer(ENREGISTREE));
    await screen.findByText("CO-TEST26-ABC123");
  });

  it("envoi concurrent (409 « patientez ») : message de l'API, bouton réactivé, erreur rappelée près des boutons", async () => {
    service.soumettreFiche.mockRejectedValueOnce(http(409, { detail: "Envoi déjà en cours, patientez quelques secondes" }));
    await allerAuRecapitulatif();
    cliquer("Envoyer ma fiche");
    const alerte = await screen.findByRole("alert");
    expect(alerte).toHaveTextContent("Envoi déjà en cours, patientez quelques secondes");
    expect(alerte).toHaveFocus();
    expect(screen.getAllByText("Envoi déjà en cours, patientez quelques secondes")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Envoyer ma fiche" })).not.toHaveAttribute("aria-disabled");
  });

  it("réponse 201 non JSON ou incomplète : message d'erreur et bouton réactivé", async () => {
    service.soumettreFiche
      .mockRejectedValueOnce(new ErreurApi("reponse", { status: 201 }))
      .mockResolvedValueOnce({ message: "ok" });
    await allerAuRecapitulatif();
    cliquer("Envoyer ma fiche");
    expect(await screen.findByRole("alert")).toHaveTextContent(/Réponse inattendue du serveur/);
    expect(screen.getByRole("button", { name: "Envoyer ma fiche" })).not.toHaveAttribute("aria-disabled");

    cliquer("Envoyer ma fiche");
    await waitFor(() => expect(service.soumettreFiche).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Réponse inattendue du serveur/);
    expect(screen.queryByText(/Référence de votre fiche/)).not.toBeInTheDocument();
  });

  it("422 par champ : retour à l'étape 2 avec le message sous le champ", async () => {
    service.soumettreFiche.mockRejectedValueOnce(
      http(422, {
        detail: [{ type: "value_error", loc: ["body", "email"], msg: "value is not a valid email address" }],
      })
    );
    await allerAuRecapitulatif();
    cliquer("Envoyer ma fiche");
    await screen.findByRole("heading", { name: "Vérifiez et complétez votre fiche" });
    expect(screen.getByLabelText(/^Adresse email/)).toHaveAccessibleDescription(/Adresse email invalide\./);
    expect(screen.getByRole("alert")).toHaveTextContent("Certaines informations sont invalides");
  });

  it("422 « Commission inconnue » : rattaché au champ commission, retour à l'étape 2", async () => {
    service.soumettreFiche.mockRejectedValueOnce(http(422, { detail: "Commission inconnue" }));
    await allerAuRecapitulatif();
    cliquer("Envoyer ma fiche");
    await screen.findByRole("heading", { name: "Vérifiez et complétez votre fiche" });
    const commission = screen.getByLabelText(/^Commission pour cette édition/);
    expect(commission).toHaveAttribute("aria-invalid", "true");
    expect(commission).toHaveAccessibleDescription("Commission inconnue : choisissez une valeur dans la liste.");
  });

  it("fiche validée entre-temps (409) : lecture seule titrée « Vos modifications (non enregistrées) »", async () => {
    service.soumettreFiche.mockRejectedValueOnce(
      http(409, { detail: "Votre fiche a déjà été validée : contactez l'administration pour la modifier" })
    );
    await allerAuRecapitulatif({ ...TROUVEE, deja_soumise: true });
    cliquer("Envoyer ma fiche");
    await screen.findByText("Vos modifications (non enregistrées)");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("session expirée à l'envoi (400) : retour à l'identification, saisie conservée (champ vidé compris)", async () => {
    service.soumettreFiche.mockRejectedValueOnce(http(400, { detail: "Session expirée ou invalide, veuillez recommencer" }));
    service.identifierMembre.mockResolvedValue(TROUVEE);
    await afficher();
    remplirIdentification();
    cliquer("Continuer");
    await screen.findByText("Nous avons retrouvé votre fiche");
    saisir(/^Adresse email/, "awa.saisie@exemple.ci");
    saisir(/^Allergies/, "");
    cliquer("Continuer");
    await screen.findByRole("heading", { name: "Récapitulatif et envoi" });
    fireEvent.click(screen.getByRole("checkbox"));
    cliquer("Envoyer ma fiche");

    await screen.findByRole("heading", { name: "Identifiez-vous" });
    const alerte = screen.getByRole("alert");
    expect(alerte).toHaveTextContent("Pour votre sécurité, votre session a expiré. Vos réponses sont conservées");
    expect(alerte).toHaveFocus();
    expect(screen.getByLabelText(/^Nom/)).toHaveValue("Test");

    cliquer("Continuer");
    await screen.findByText("Nous avons retrouvé votre fiche");
    expect(screen.getByLabelText(/^Adresse email/)).toHaveValue("awa.saisie@exemple.ci");
    expect(screen.getByLabelText(/^Allergies/)).toHaveValue("");
  });
});

describe("RecensementCoPage — photo", () => {
  const photo = new File(["photo"], "photo.jpg", { type: "image/jpeg" });

  const envoyerAvecPhoto = async () => {
    compresserPhoto.mockResolvedValue(photo);
    service.identifierMembre.mockResolvedValue({ ...TROUVEE, fiche: { ...FICHE_TROUVEE, sexe: "M" } });
    service.soumettreFiche.mockResolvedValue({ message: "Enregistrée", reference: "CO-TEST26-PHOTO1", jeton_photo: "jp" });
    await afficher();
    remplirIdentification();
    cliquer("Continuer");
    await screen.findByText("Nous avons retrouvé votre fiche");
    fireEvent.change(screen.getByLabelText("Fichier de la photo"), { target: { files: [photo] } });
    await screen.findByText(/Photo prête/);
    cliquer("Continuer");
    await screen.findByRole("heading", { name: "Récapitulatif et envoi" });
    fireEvent.click(screen.getByRole("checkbox"));
    cliquer("Envoyer ma fiche");
    await screen.findByText("CO-TEST26-PHOTO1");
  };

  it("pendant la préparation de la photo, « Continuer » est désactivé", async () => {
    let terminer;
    compresserPhoto.mockReturnValue(new Promise((resolve) => (terminer = resolve)));
    service.identifierMembre.mockResolvedValue(TROUVEE);
    await afficher();
    remplirIdentification();
    cliquer("Continuer");
    await screen.findByText("Nous avons retrouvé votre fiche");
    fireEvent.change(screen.getByLabelText("Fichier de la photo"), { target: { files: [photo] } });
    await screen.findByRole("button", { name: "Préparation de la photo…" });
    const continuer = screen.getByRole("button", { name: "Continuer" });
    expect(continuer).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(continuer);
    expect(screen.queryByRole("heading", { name: "Récapitulatif et envoi" })).not.toBeInTheDocument();
    await act(async () => terminer(photo));
    expect(screen.getByRole("button", { name: "Continuer" })).not.toHaveAttribute("aria-disabled");
  });

  it("échec du stockage (502) : la fiche reste enregistrée, avertissement et nouvel essai possible", async () => {
    service.envoyerPhoto
      .mockRejectedValueOnce(http(502, { detail: "Service de stockage des photos indisponible" }))
      .mockResolvedValueOnce({ photo_url: "https://res.cloudinary.com/demo/p.jpg" });
    await envoyerAvecPhoto();
    expect(screen.getByRole("alert")).toHaveTextContent("Service de stockage des photos indisponible");
    expect(service.envoyerPhoto.mock.calls[0][0].get("jeton_photo")).toBe("jp");

    cliquer("Réessayer l'envoi de la photo");
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(service.envoyerPhoto).toHaveBeenCalledTimes(2);
  });

  it("jeton photo expiré (400) : message dédié, sans bouton Réessayer", async () => {
    service.envoyerPhoto.mockRejectedValueOnce(http(400, { detail: "Session expirée ou invalide, veuillez recommencer" }));
    await envoyerAvecPhoto();
    expect(screen.getByRole("alert")).toHaveTextContent("Le délai d'envoi de la photo est dépassé");
    expect(screen.queryByRole("button", { name: "Réessayer l'envoi de la photo" })).not.toBeInTheDocument();
  });
});

describe("RecensementCoPage — sauvegarde de l'onglet", () => {
  it("reprend la saisie de l'onglet (sans téléphone) et permet de l'effacer", async () => {
    window.sessionStorage.setItem(
      CLE_PROGRESSION,
      JSON.stringify({
        version: 1,
        enregistreLe: Date.now(),
        identification: { ancien_membre: "oui", nom: "Test", prenoms: "Awa", commission_precedente: "" },
        fiche: null,
      })
    );
    await afficher();
    expect(screen.getByLabelText(/^Nom/)).toHaveValue("Test");
    expect(screen.getByLabelText(/^Téléphone/)).toHaveValue("");
    cliquer("Effacer mes réponses");
    expect(screen.queryByLabelText(/^Nom/)).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Oui" })).not.toBeChecked();
    expect(window.sessionStorage.getItem(CLE_PROGRESSION)).toBeNull();
  });
});

describe("RecensementCoPage — corrections de la revue du 2026-11-23", () => {
  /** Parcours « non » : fiche remplie avec une identité fictive. */
  const remplirFicheNouveau = () => {
    saisir(/^Nom/, "Nouveau");
    saisir(/^Prénom\(s\)/, "Fictif");
    fireEvent.click(screen.getByRole("radio", { name: "Masculin" }));
    saisir(/^Téléphone/, "05 00 00 00 00");
    saisir(/^Adresse email/, "nouveau.fictif@exemple.ci");
    saisir(/^Commission pour cette édition/, "Logistique");
    saisir(/^Qualité/, "membre");
  };

  const ouvrirFicheNouveau = async () => {
    repondreAncien("Non");
    cliquer("Continuer");
    await screen.findByRole("heading", { name: "Complétez votre fiche" });
  };

  it("parcours « non » : le champ piège rempli à l'étape 1 est transmis à l'identification", async () => {
    service.identifierMembre.mockResolvedValue(NOUVEAU);
    await afficher();
    fireEvent.change(screen.getByLabelText("Laisser ce champ vide"), { target: { value: "robot" } });
    await ouvrirFicheNouveau();
    remplirFicheNouveau();
    cliquer("Continuer");
    await waitFor(() =>
      expect(service.identifierMembre).toHaveBeenCalledWith(expect.objectContaining({ site_web: "robot" }))
    );
  });

  it("passer de « Oui » à « Non » après une erreur du serveur ne bloque plus « Continuer »", async () => {
    service.identifierMembre.mockRejectedValueOnce(http(422, { detail: "Commission inconnue" }));
    await afficher();
    remplirIdentification();
    cliquer("Continuer");
    await screen.findByRole("alert");
    repondreAncien("Non");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    cliquer("Continuer");
    await screen.findByRole("heading", { name: "Complétez votre fiche" });
  });

  it("« Retour » est inactif pendant la vérification du parcours « non »", async () => {
    let repondre;
    service.identifierMembre.mockReturnValue(new Promise((resolve) => (repondre = resolve)));
    await afficher();
    await ouvrirFicheNouveau();
    remplirFicheNouveau();
    cliquer("Continuer");
    await screen.findByRole("button", { name: "Vérification…" });
    expect(screen.getByRole("button", { name: "Retour" })).toHaveAttribute("aria-disabled", "true");
    cliquer("Retour");
    expect(screen.getByRole("heading", { name: "Complétez votre fiche" })).toBeInTheDocument();
    await act(async () => repondre(NOUVEAU));
    await screen.findByRole("heading", { name: "Récapitulatif et envoi" });
  });

  it("parcours « non » avec une fiche déjà envoyée cette année : prévient que l'envoi la met à jour", async () => {
    service.identifierMembre.mockResolvedValue({ ...NOUVEAU, resultat: "trouve", deja_soumise: true });
    await afficher();
    await ouvrirFicheNouveau();
    remplirFicheNouveau();
    cliquer("Continuer");
    await screen.findByRole("heading", { name: "Récapitulatif et envoi" });
    expect(
      screen.getByText("Vous avez déjà envoyé votre fiche pour cette édition : ce nouvel envoi la mettra à jour.")
    ).toBeInTheDocument();
  });

  it("santé non réaffichée par le serveur : explication à l'étape 2 et « inchangées » au récapitulatif", async () => {
    service.identifierMembre.mockResolvedValue({
      ...TROUVEE,
      fiche: { ...FICHE_TROUVEE, allergies: null },
      sante_masquee: true,
    });
    await afficher();
    remplirIdentification();
    cliquer("Continuer");
    await screen.findByText(/elles ne sont pas réaffichées ici/);
    expect(screen.getByLabelText(/^Allergies/)).toHaveValue("");
    cliquer("Continuer");
    await screen.findByRole("heading", { name: "Récapitulatif et envoi" });
    expect(screen.getAllByText("Inchangées (non réaffichées)")).toHaveLength(2);
  });

  it("« Non » puis « Oui » : l'identité saisie dans la fiche est reprise, ainsi que la saisie", async () => {
    service.identifierMembre.mockResolvedValue(NOUVEAU);
    await afficher();
    await ouvrirFicheNouveau();
    remplirFicheNouveau();
    cliquer("Retour");
    await screen.findByRole("heading", { name: "Identifiez-vous" });
    repondreAncien("Oui");
    expect(screen.getByLabelText(/^Nom/)).toHaveValue("Nouveau");
    expect(screen.getByLabelText(/^Prénom\(s\)/)).toHaveValue("Fictif");
    expect(screen.getByLabelText(/^Téléphone/).value.replace(/\D/g, "")).toBe("0500000000");
    saisir(/^Votre commission l'an passé/, "Santé");
    cliquer("Continuer");
    await screen.findByRole("heading", { name: "Vérifiez et complétez votre fiche" });
    expect(screen.getByLabelText(/^Adresse email/)).toHaveValue("nouveau.fictif@exemple.ci");
  });

  it("« Oui » puis « Non » : nom, prénoms et téléphone déjà saisis sont repris dans la fiche", async () => {
    await afficher();
    remplirIdentification();
    repondreAncien("Non");
    cliquer("Continuer");
    await screen.findByRole("heading", { name: "Complétez votre fiche" });
    expect(screen.getByLabelText(/^Nom/)).toHaveValue("Test");
    expect(screen.getByLabelText(/^Prénom\(s\)/)).toHaveValue("Awa");
    expect(screen.getByLabelText(/^Téléphone/).value.replace(/\D/g, "")).toBe("0700000000");
    expect(service.identifierMembre).not.toHaveBeenCalled();
  });

  it("une ancienne sauvegarde « Nouveau membre / aucune » est reprise comme la réponse « Non »", async () => {
    window.sessionStorage.setItem(
      CLE_PROGRESSION,
      JSON.stringify({
        version: 1,
        enregistreLe: Date.now(),
        identification: { nom: "Test", prenoms: "Awa", commission_precedente: "__aucune__" },
        fiche: null,
      })
    );
    await afficher();
    expect(screen.getByRole("radio", { name: "Non" })).toBeChecked();
  });
});
