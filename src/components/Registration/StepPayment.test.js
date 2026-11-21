import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload';
import StepPayment from './StepPayment';
import { CLE_INSCRIPTION } from '../../utils/inscription/stockage';

// axios (ESM) et l'upload Cloudinary sont simulés : aucun appel réseau dans les tests
jest.mock('axios', () => ({ __esModule: true, default: { post: jest.fn() } }));
jest.mock('../../utils/cloudinaryUpload', () => ({ uploadToCloudinary: jest.fn() }));

// Données fictives uniquement
const DONNEES = {
  personalInfo: {
    nom: 'TESTNOM',
    prenom: 'Fictif',
    sexe: 'M',
    age: '17',
    communeHabitation: 'Commune-Test',
    niveauAcademique: 'Terminale',
    contactParent: '0100000000',
    contactSeminariste: '0700000000',
  },
  dormitoryInfo: { dortoir: 'Dortoir Test', dortoirCode: 'DT-TEST' },
  healthInfo: { allergie: 'Allergie-fictive', antecedentMedical: 'Antecedent-fictif' },
};

const VERIFICATION_OK = {
  isValid: true,
  message: 'Reçu valide',
  extractedData: { transactionId: 'TX-FICTIF-0001', amount: 7000 },
};

const REPONSE_INSCRIPTION = {
  id: 'id-fictif',
  matricule: 'MAT-FICTIF-001',
  verification_token: 'jeton-fictif-a-ne-pas-journaliser',
};

let reponseInscription;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.open = jest.fn();
  uploadToCloudinary.mockResolvedValue({
    success: true,
    url: 'https://res.cloudinary.com/demo/image/upload/recu-fictif.png',
  });
  reponseInscription = () => Promise.resolve({ data: REPONSE_INSCRIPTION });
  axios.post.mockImplementation((url) => {
    if (url.endsWith('/api/v1/registrations/verify-receipt')) {
      return Promise.resolve({ data: VERIFICATION_OK });
    }
    if (url.endsWith('/api/v1/registrations')) {
      return reponseInscription();
    }
    return Promise.reject(new Error(`URL inattendue : ${url}`));
  });
});

// Amène l'étape jusqu'à l'état « completed » (paiement simulé, reçu vérifié et téléversé)
async function allerJusquAuPaiementConfirme(onNext = jest.fn()) {
  render(<StepPayment data={DONNEES} onNext={onNext} onPrevious={jest.fn()} />);

  userEvent.click(screen.getByRole('button', { name: /payer 7.000 fcfa avec wave/i }));

  const recu = new File(['recu'], 'recu-fictif.png', { type: 'image/png' });
  userEvent.upload(screen.getByLabelText(/choisir une image/i), recu);

  const confirmer = await screen.findByRole('button', { name: /confirmer le paiement/i });
  await waitFor(() => expect(confirmer).toBeEnabled(), { timeout: 2000 });
  userEvent.click(confirmer);

  return screen.findByRole('button', { name: /continuer/i });
}

describe('StepPayment — journalisation (P-16)', () => {
  const MARQUEURS_SENSIBLES = [
    'TESTNOM',
    'Allergie-fictive',
    'Antecedent-fictif',
    '0100000000',
    'TX-FICTIF-0001',
    'jeton-fictif-a-ne-pas-journaliser',
  ];

  function journalContientDesDonnees(spies) {
    const contenu = spies
      .flatMap((spy) => spy.mock.calls)
      .map((args) => args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a) ?? String(a))).join(' '))
      .join('\n');
    return MARQUEURS_SENSIBLES.filter((m) => contenu.includes(m));
  }

  let spies;
  beforeEach(() => {
    spies = ['log', 'info', 'warn', 'error', 'debug'].map((m) => jest.spyOn(console, m).mockImplementation(() => {}));
  });
  afterEach(() => spies.forEach((spy) => spy.mockRestore()));

  test("n'écrit ni la charge ni la réponse de l'API en console lors d'un envoi réussi", async () => {
    const onNext = jest.fn();
    const continuer = await allerJusquAuPaiementConfirme(onNext);
    userEvent.click(continuer);

    await waitFor(() => expect(onNext).toHaveBeenCalledTimes(1));
    expect(journalContientDesDonnees(spies)).toEqual([]);
  });

  test("n'écrit pas l'erreur axios (qui contient la charge) en console lors d'un échec d'envoi", async () => {
    reponseInscription = () =>
      Promise.reject(
        Object.assign(new Error('Request failed with status code 500'), {
          config: { data: JSON.stringify(DONNEES) },
          response: { status: 500, data: { detail: 'Erreur interne du serveur' } },
        })
      );
    const continuer = await allerJusquAuPaiementConfirme();
    userEvent.click(continuer);

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(continuer).toBeEnabled());
    expect(journalContientDesDonnees(spies)).toEqual([]);
  });
});

describe("StepPayment — échec de l'envoi final (P-23, P-17)", () => {
  const appelsInscription = () =>
    axios.post.mock.calls.filter(([url]) => url.endsWith('/api/v1/registrations'));

  test("affiche l'erreur de l'API et un bouton « Réessayer » après un échec", async () => {
    reponseInscription = () =>
      Promise.reject({ response: { status: 409, data: { detail: 'Le dortoir sélectionné est complet' } } });
    const onNext = jest.fn();
    const continuer = await allerJusquAuPaiementConfirme(onNext);
    userEvent.click(continuer);

    const alerte = await screen.findByRole('alert');
    expect(alerte).toHaveTextContent('Le dortoir sélectionné est complet');
    expect(screen.getByRole('button', { name: /réessayer/i })).toBeEnabled();
    expect(onNext).not.toHaveBeenCalled();
  });

  test('« Réessayer » relance l’envoi avec la même charge, sans nouveau paiement', async () => {
    let tentative = 0;
    reponseInscription = () => {
      tentative += 1;
      return tentative === 1
        ? Promise.reject(new Error('Network Error'))
        : Promise.resolve({ data: REPONSE_INSCRIPTION });
    };
    const onNext = jest.fn();
    const continuer = await allerJusquAuPaiementConfirme(onNext);
    userEvent.click(continuer);

    const alerte = await screen.findByRole('alert');
    expect(alerte).toHaveTextContent(/impossible de contacter le serveur/i);

    userEvent.click(screen.getByRole('button', { name: /réessayer/i }));

    await waitFor(() => expect(onNext).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(appelsInscription()).toHaveLength(2);
    expect(appelsInscription()[1][1]).toEqual(appelsInscription()[0][1]);
    // Aucun nouveau paiement : Wave ouvert une seule fois, pas de retour à l'étape « Payer »
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /payer .* avec wave/i })).not.toBeInTheDocument();
  });

  test('une erreur 422 (detail tableau) est affichée en message lisible, sans plantage', async () => {
    reponseInscription = () =>
      Promise.reject({
        response: {
          status: 422,
          data: { detail: [{ loc: ['body', 'personalInfo', 'age'], msg: 'Input should be a valid integer' }] },
        },
      });
    const continuer = await allerJusquAuPaiementConfirme();
    userEvent.click(continuer);

    const alerte = await screen.findByRole('alert');
    expect(alerte).toHaveTextContent(/certaines informations de l'inscription sont invalides/i);
    expect(alerte).not.toHaveTextContent(/input should be/i);
  });
});

describe('StepPayment — reçu accessible au clavier (P-25)', () => {
  test('le champ du reçu est nommé, non masqué par display:none et atteint par Tab', () => {
    render(<StepPayment data={DONNEES} onNext={jest.fn()} onPrevious={jest.fn()} />);
    userEvent.click(screen.getByRole('button', { name: /payer 7.000 fcfa avec wave/i }));

    const champ = screen.getByLabelText(/choisir une image/i);
    expect(champ).toHaveAttribute('type', 'file');
    expect(champ).not.toHaveStyle({ display: 'none' });

    userEvent.tab();
    expect(champ).toHaveFocus();
  });
});

// ---------------------------------------------------------------------------
// Réinscription (TAF lot 2) : stockage sans santé ni jeton, jeton envoyé, double clic, 409, session expirée
// ---------------------------------------------------------------------------

// Données fictives uniquement
const DATA_REINSCRIPTION = {
  personalInfo: {
    nom: "Test",
    prenom: "Ali",
    sexe: "M",
    age: "16",
    contactParent: "0700000000",
    contactSeminariste: "",
    communeHabitation: "Cocody",
    niveauAcademique: "2nde",
  },
  dormitoryInfo: { dortoir: "Dortoir de test", dortoirId: "D-TEST", dortoirCode: "D-TEST", matricule: "" },
  healthInfo: { allergie: "Arachide (fictif)", antecedentMedical: "Néant" },
  paymentInfo: { status: "pending", amount: 7000 },
};

const REPONSE_VERIFICATION = {
  data: { isValid: true, message: "Reçu valide", extractedData: { transactionId: "TX-FICTIF-1", amount: 6000 } },
};
const REPONSE_INSCRIPTION_LOT2 = { data: { id: "id-fictif", matricule: "AN26-TEST-001", qrCode: null, confirmedAt: null } };
const erreurAxios = (status, detail) => Object.assign(new Error("HTTP"), { response: { status, data: { detail } } });

/** Paiement Wave simulé, reçu vérifié puis téléversé : arrive à l'écran « Preuve reçue ». */
const allerJusquAuContinuer = async (props = {}) => {
  const onNext = jest.fn();
  render(<StepPayment data={DATA_REINSCRIPTION} onNext={onNext} onPrevious={jest.fn()} {...props} />);
  fireEvent.click(screen.getByRole("button", { name: /avec Wave/ }));
  const recu = new File(["recu"], "recu.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText(/Cliquez pour choisir une image/), { target: { files: [recu] } });
  const confirmer = await screen.findByRole("button", { name: /Confirmer le paiement/ });
  await waitFor(() => expect(confirmer).toBeEnabled(), { timeout: 3000 });
  fireEvent.click(confirmer);
  await screen.findByText("Preuve reçue avec succès !");
  return { onNext };
};

const envoisInscription = () => axios.post.mock.calls.filter(([url]) => url.endsWith("/api/v1/registrations"));

describe("StepPayment — envoi final et réinscription (TAF lot 2)", () => {
  beforeEach(() => {
    jest.spyOn(console, "error");
    jest.spyOn(console, "log");
    axios.post.mockImplementation((url) =>
      url.endsWith("/verify-receipt") ? Promise.resolve(REPONSE_VERIFICATION) : Promise.resolve(REPONSE_INSCRIPTION_LOT2)
    );
    uploadToCloudinary.mockResolvedValue({ success: true, url: "https://res.cloudinary.com/demo/recu.jpg", size: 1000 });
  });

  afterEach(() => {
    // Aucune journalisation console de données d'inscription (débogage retiré)
    expect(console.log).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    console.error.mockRestore();
    console.log.mockRestore();
  });

  it("envoie la santé depuis la mémoire et ne l'écrit jamais dans le navigateur (parcours « Non » : sans jeton)", async () => {
    const { onNext } = await allerJusquAuContinuer();
    const stocke = window.sessionStorage.getItem(CLE_INSCRIPTION);
    expect(stocke).not.toMatch(/Arachide|healthInfo/);
    expect(window.localStorage.getItem(CLE_INSCRIPTION)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Continuer/ }));
    await waitFor(() => expect(onNext).toHaveBeenCalled());
    const corps = envoisInscription()[0][1];
    expect(corps.healthInfo).toEqual({ allergie: "Arachide (fictif)", antecedentMedical: "Néant" });
    expect(corps.paymentInfo).toEqual({
      transactionId: "TX-FICTIF-1",
      receiptUrl: "https://res.cloudinary.com/demo/recu.jpg",
      amount: 6000,
    });
    expect(corps).not.toHaveProperty("reinscription");
    expect(JSON.parse(window.sessionStorage.getItem(CLE_INSCRIPTION)).matricule).toBe("AN26-TEST-001");
  });

  it("parcours « Oui » : envoie reinscription: {jeton} sans jamais le stocker", async () => {
    const { onNext } = await allerJusquAuContinuer({ jetonReinscription: "jeton-reinscription-fictif" });
    fireEvent.click(screen.getByRole("button", { name: /Continuer/ }));
    await waitFor(() => expect(onNext).toHaveBeenCalled());
    expect(envoisInscription()[0][1].reinscription).toEqual({ jeton: "jeton-reinscription-fictif" });
    expect(window.sessionStorage.getItem(CLE_INSCRIPTION)).not.toMatch(/jeton/);
  });

  it("double clic sur « Continuer » : un seul envoi de l'inscription", async () => {
    const { onNext } = await allerJusquAuContinuer();
    let terminer;
    axios.post.mockImplementationOnce(() => new Promise((resolve) => (terminer = resolve)));
    const bouton = screen.getByRole("button", { name: /Continuer/ });
    fireEvent.click(bouton);
    fireEvent.click(bouton);
    expect(envoisInscription()).toHaveLength(1);
    terminer(REPONSE_INSCRIPTION_LOT2);
    await waitFor(() => expect(onNext).toHaveBeenCalledTimes(1));
  });

  it("409 « déjà inscrit » : message affiché, pas de confirmation", async () => {
    const { onNext } = await allerJusquAuContinuer({ jetonReinscription: "jeton-reinscription-fictif" });
    axios.post.mockRejectedValueOnce(erreurAxios(409, "Vous êtes déjà inscrit(e) pour cette édition"));
    fireEvent.click(screen.getByRole("button", { name: /Continuer/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Vous êtes déjà inscrit(e) pour cette édition Si vous avez déjà payé, contactez l'administration avec votre reçu."
    );
    expect(onNext).not.toHaveBeenCalled();
  });

  it("400 session expirée : nouvelle recherche automatique puis un seul nouvel essai avec le nouveau jeton", async () => {
    const onRenouvelerReinscription = jest.fn().mockResolvedValue("jeton-renouvele-fictif");
    const { onNext } = await allerJusquAuContinuer({
      jetonReinscription: "jeton-expire-fictif",
      onRenouvelerReinscription,
    });
    axios.post.mockRejectedValueOnce(erreurAxios(400, "Session expirée, veuillez recommencer la recherche"));
    fireEvent.click(screen.getByRole("button", { name: /Continuer/ }));
    await waitFor(() => expect(onNext).toHaveBeenCalled());
    expect(onRenouvelerReinscription).toHaveBeenCalledTimes(1);
    const envois = envoisInscription();
    expect(envois).toHaveLength(2);
    expect(envois[0][1].reinscription).toEqual({ jeton: "jeton-expire-fictif" });
    expect(envois[1][1].reinscription).toEqual({ jeton: "jeton-renouvele-fictif" });
  });

  it("400 session expirée et renouvellement impossible : paiement conservé, message et nouvel essai possible", async () => {
    const onRenouvelerReinscription = jest.fn().mockRejectedValue(new Error("réseau"));
    const { onNext } = await allerJusquAuContinuer({
      jetonReinscription: "jeton-expire-fictif",
      onRenouvelerReinscription,
    });
    axios.post.mockRejectedValueOnce(erreurAxios(400, "Session expirée, veuillez recommencer la recherche"));
    fireEvent.click(screen.getByRole("button", { name: /Continuer/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Votre paiement est conservé/);
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Continuer/ })).toBeEnabled();
  });
});
