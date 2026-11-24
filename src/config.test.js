import { API_URL, resolveApiUrl, URL_API_DEVELOPPEMENT } from './config';

describe('resolveApiUrl (P-19)', () => {
  test('utilise REACT_APP_API_URL quand elle est définie (slash final retiré)', () => {
    expect(resolveApiUrl({ REACT_APP_API_URL: 'https://api.exemple.test/', NODE_ENV: 'production' })).toBe(
      'https://api.exemple.test'
    );
    expect(resolveApiUrl({ REACT_APP_API_URL: ' https://api.exemple.test ', NODE_ENV: 'development' })).toBe(
      'https://api.exemple.test'
    );
  });

  test('production sans variable : erreur explicite, aucun repli silencieux', () => {
    expect(() => resolveApiUrl({ NODE_ENV: 'production' })).toThrow(/REACT_APP_API_URL doit être définie/);
    expect(() => resolveApiUrl({ REACT_APP_API_URL: '   ', NODE_ENV: 'production' })).toThrow(
      /REACT_APP_API_URL/
    );
  });

  test('développement et tests sans variable : repli sur l’API locale (port 8000)', () => {
    expect(resolveApiUrl({ NODE_ENV: 'development' })).toBe('http://localhost:8000');
    expect(resolveApiUrl({ NODE_ENV: 'test' })).toBe(URL_API_DEVELOPPEMENT);
  });

  test('API_URL exportée est résolue depuis l’environnement courant', () => {
    expect(API_URL).toBe(
      resolveApiUrl({ REACT_APP_API_URL: process.env.REACT_APP_API_URL, NODE_ENV: process.env.NODE_ENV })
    );
  });
});
