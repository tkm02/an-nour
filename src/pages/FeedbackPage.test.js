import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import FeedbackPage from './FeedbackPage';

jest.mock('../services/api', () => ({ createFeedback: jest.fn() }));

const rendre = () =>
  render(
    <MemoryRouter>
      <FeedbackPage />
    </MemoryRouter>
  );

describe('FeedbackPage — notes accessibles au clavier (P-25)', () => {
  test.each([
    'Note globale du séminaire',
    'Qualité de la nourriture',
    'Confort des dortoirs',
    'Qualité des formations',
    'Qualité du contenu',
  ])('« %s » est un groupe de 5 radios nommés', (libelle) => {
    rendre();
    const groupe = screen.getByRole('radiogroup', { name: libelle });
    const radios = within(groupe).getAllByRole('radio');

    expect(radios).toHaveLength(5);
    expect(within(groupe).getByRole('radio', { name: '1 sur 5' })).toBeInTheDocument();
    expect(within(groupe).getByRole('radio', { name: '5 sur 5' })).toBeInTheDocument();
  });

  test('note globale choisie au clavier (focus puis Espace)', () => {
    rendre();
    const groupe = screen.getByRole('radiogroup', { name: 'Note globale du séminaire' });
    const quatre = within(groupe).getByRole('radio', { name: '4 sur 5' });

    quatre.focus();
    userEvent.keyboard(' ');

    expect(quatre).toBeChecked();
    expect(within(groupe).getAllByRole('radio').filter((r) => r.checked)).toEqual([quatre]);
  });

  test('le clic souris sur l’étoile reste fonctionnel', () => {
    rendre();
    const groupe = screen.getByRole('radiogroup', { name: 'Qualité de la nourriture' });
    // Clic sur le glyphe ★ (masqué aux lecteurs d'écran) : l'événement remonte au gestionnaire de l'étoile
    userEvent.click(within(groupe).getAllByText('★')[2]);

    expect(within(groupe).getByRole('radio', { name: '3 sur 5' })).toBeChecked();
  });

  test('échelle « Qualité du contenu » au clavier', () => {
    rendre();
    const groupe = screen.getByRole('radiogroup', { name: 'Qualité du contenu' });
    const deux = within(groupe).getByRole('radio', { name: '2 sur 5' });

    deux.focus();
    userEvent.keyboard(' ');

    expect(deux).toBeChecked();
    expect(within(groupe).getAllByRole('radio').filter((r) => r.checked)).toEqual([deux]);
  });
});
