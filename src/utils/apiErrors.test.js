import {
  getApiErrorMessage,
  MESSAGE_DONNEES_INVALIDES,
  MESSAGE_SERVEUR_INJOIGNABLE,
} from './apiErrors';

const PAR_DEFAUT = "Erreur lors de l'envoi des données. Veuillez réessayer.";
const erreurHttp = (status, data) => ({ response: { status, data } });

describe('getApiErrorMessage (P-17)', () => {
  test('422 FastAPI : le tableau `detail` devient un message lisible en français', () => {
    const erreur = erreurHttp(422, {
      detail: [
        { loc: ['body', 'personalInfo', 'age'], msg: 'Input should be a valid integer', type: 'int_parsing' },
      ],
    });

    const message = getApiErrorMessage(erreur, PAR_DEFAUT);

    expect(typeof message).toBe('string');
    expect(message).toBe(MESSAGE_DONNEES_INVALIDES);
  });

  test('`detail` tableau sans statut 422 : jamais renvoyé tel quel', () => {
    expect(getApiErrorMessage(erreurHttp(400, { detail: [{ msg: 'x' }] }), PAR_DEFAUT)).toBe(
      MESSAGE_DONNEES_INVALIDES
    );
  });

  test('`detail` texte (format des erreurs de l’API) : repris tel quel', () => {
    const erreur = erreurHttp(409, { detail: 'Le dortoir sélectionné est complet' });
    expect(getApiErrorMessage(erreur, PAR_DEFAUT)).toBe('Le dortoir sélectionné est complet');
  });

  test('`message` texte : prioritaire', () => {
    expect(getApiErrorMessage(erreurHttp(400, { message: 'Reçu illisible' }), PAR_DEFAUT)).toBe('Reçu illisible');
  });

  test('`detail` objet ou corps vide : message par défaut', () => {
    expect(getApiErrorMessage(erreurHttp(500, { detail: { code: 1 } }), PAR_DEFAUT)).toBe(PAR_DEFAUT);
    expect(getApiErrorMessage(erreurHttp(502, undefined), PAR_DEFAUT)).toBe(PAR_DEFAUT);
    expect(getApiErrorMessage(erreurHttp(500, { detail: '   ' }), PAR_DEFAUT)).toBe(PAR_DEFAUT);
  });

  test('pas de réponse (réseau coupé, délai dépassé) : message de connexion', () => {
    expect(getApiErrorMessage(new Error('Network Error'), PAR_DEFAUT)).toBe(MESSAGE_SERVEUR_INJOIGNABLE);
    expect(getApiErrorMessage(undefined, PAR_DEFAUT)).toBe(MESSAGE_SERVEUR_INJOIGNABLE);
  });
});
