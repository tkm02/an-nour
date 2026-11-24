import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import './index.css';
import FeedbackPage from './pages/FeedbackPage';
import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import VisitorRegistrationPage from './pages/VisitorRegistrationPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <LandingPage />
      },
      {
        path: 'inscription',
        element: <RegistrationPage />
      },
      {
        path: 'visiteurs',
        element: <VisitorRegistrationPage />
      },
      {
        path: 'avis',
        element: <FeedbackPage />
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);