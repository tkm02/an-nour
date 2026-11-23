import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload';
import StepPayment from './StepPayment';

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
