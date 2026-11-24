import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import LandingPage from './pages/LandingPage';

// Test de fumée : la coquille de l'application (App + Outlet) rend la page d'accueil sur la route « / »,
// comme le routeur déclaré dans src/index.js.
test("affiche la page d'accueil sur la route racine", () => {
  const router = createMemoryRouter(
    [{ path: '/', element: <App />, children: [{ index: true, element: <LandingPage /> }] }],
    { initialEntries: ['/'] }
  );

  render(<RouterProvider router={router} />);

  expect(screen.getByRole('heading', { level: 1, name: /séminaire de formation/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /questions fréquentes/i })).toBeInTheDocument();
});
