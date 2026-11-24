import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import StepDormitory from './StepDormitory';

jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn() } }));

// Dortoirs fictifs
const DORTOIRS = [
  { name: 'Dortoir Alpha', code: 'DA', available: 12, capacity: 30 },
  { name: 'Dortoir Beta', code: 'DB', available: 0, capacity: 20 },
  { name: 'Dortoir Gamma', code: 'DG', available: 5, capacity: 25 },
];

let consoleSpies;
beforeEach(() => {
  // Le composant journalise encore la réponse au chargement (dette P-22) : silence dans les tests
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
