import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import StepDormitory, { codePepiniere } from './StepDormitory';

jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn() } }));

// Dortoirs fictifs
const DORTOIRS = [
  { name: 'Dortoir Alpha', code: 'DA', available: 12, capacity: 30 },
  { name: 'Dortoir Beta', code: 'DB', available: 0, capacity: 20 },
  { name: 'Dortoir Gamma', code: 'DG', available: 5, capacity: 25 },
];

let consoleSpies;
beforeEach(() => {
  // Silence dans les tests ; la Pépinière (P-30) vérifie en plus qu'aucun journal de débogage n'est émis
  consoleSpies = ['log', 'error'].map((m) => jest.spyOn(console, m).mockImplementation(() => {}));
  axios.get.mockResolvedValue({ data: DORTOIRS });
});
afterEach(() => consoleSpies.forEach((spy) => spy.mockRestore()));

function rendre(data = { age: '17', dortoir: '', dortoirId: '' }) {
  const onChange = jest.fn();
  render(<StepDormitory data={data} sexe="M" onChange={onChange} onNext={jest.fn()} onPrevious={jest.fn()} />);
  return onChange;
}

describe('StepDormitory — accessibilité clavier (P-25)', () => {
  test('chaque dortoir est un radio natif nommé, groupé ; un dortoir complet est désactivé', async () => {
    rendre();

    const groupe = await screen.findByRole('radiogroup', { name: 'Dortoirs' });
    expect(groupe).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /dortoir alpha : 12 places disponibles sur 30/i })).toBeEnabled();
    expect(screen.getByRole('radio', { name: /dortoir beta : indisponible/i })).toBeDisabled();
  });

  test('sélection au clavier : Tab puis Espace choisit le dortoir', async () => {
    const onChange = rendre();
    const alpha = await screen.findByRole('radio', { name: /dortoir alpha/i });

    userEvent.tab();
    expect(alpha).toHaveFocus();
    userEvent.keyboard(' ');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ dortoir: 'Dortoir Alpha', dortoirCode: 'DA' }));
  });

  test('le clic souris sur la carte sélectionne une seule fois (pas de double bascule)', async () => {
    const onChange = rendre();
    // Clic sur le contenu de la carte (le nom) : l'événement remonte au gestionnaire de la carte
    userEvent.click(await screen.findByText('Dortoir Gamma'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ dortoirCode: 'DG' }));
  });

  test('activation directe du radio (technologie d’assistance) : une seule sélection', async () => {
    const onChange = rendre();

    userEvent.click(await screen.findByRole('radio', { name: /dortoir gamma/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('le dortoir sélectionné est coché', async () => {
    rendre({ age: '17', dortoir: 'Dortoir Gamma', dortoirId: 'DG' });

    expect(await screen.findByRole('radio', { name: /dortoir gamma/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /dortoir alpha/i })).not.toBeChecked();
  });
});

// Dortoirs fictifs : libellés réels de l'API (« Pépinière – Garçons/Filles ») différents des anciens libellés
const DORTOIRS_PEPINIERE = [
  { code: 'PEPINIERE-G', name: 'Pépinière – Garçons', available: 12, capacity: 50 },
  { code: 'PEPINIERE-F', name: 'Pépinière – Filles', available: 8, capacity: 50 },
  { code: 'D-TEST', name: 'Dortoir de test', available: 5, capacity: 30 },
];

function rendrePepiniere(age, sexe) {
  const onChange = jest.fn();
  render(
    <StepDormitory
      data={{ age, dortoir: '', dortoirId: '', dortoirCode: '' }}
      sexe={sexe}
      onChange={onChange}
      onNext={jest.fn()}
      onPrevious={jest.fn()}
    />
  );
  return onChange;
}

describe('StepDormitory — Pépinière (régression P-30)', () => {
  beforeEach(() => axios.get.mockResolvedValue({ data: DORTOIRS_PEPINIERE }));
  // Plus de journalisation de débogage (réponse de l'API, dortoir choisi)
  afterEach(() => expect(console.log).not.toHaveBeenCalled());

  test('identifie les dortoirs Pépinière par leur code', () => {
    expect(codePepiniere('M')).toBe('PEPINIERE-G');
    expect(codePepiniere('F')).toBe('PEPINIERE-F');
  });

  test.each([
    ['M', 'PEPINIERE-G', 'Pépinière – Garçons'],
    ['F', 'PEPINIERE-F', 'Pépinière – Filles'],
  ])('sélectionne automatiquement la Pépinière par code pour un enfant de 8 ans (sexe %s)', async (sexe, code, nom) => {
    const onChange = rendrePepiniere('8', sexe);
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({ dortoir: nom, dortoirId: code, dortoirCode: code, matricule: '' })
    );
  });

  test('ne sélectionne rien automatiquement hors tranche 5–11 ans', async () => {
    const onChange = rendrePepiniere('16', 'M');
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    expect(onChange).not.toHaveBeenCalled();
  });
});
