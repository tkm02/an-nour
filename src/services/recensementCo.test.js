import {
  chargerConfiguration,
  envoyerPhoto,
  identifierMembre,
  resoudreUrlApi,
  soumettreFiche,
  URL_API_DEVELOPPEMENT,
} from "./recensementCo";
import { ErreurApi } from "../utils/recensementCo/erreurs";

const reponse = (status, corps, entetes = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => (corps === undefined ? Promise.reject(new SyntaxError("vide")) : Promise.resolve(corps)),
  headers: { get: (nom) => entetes[nom] ?? null },
});

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.fetch;
});

describe("resoudreUrlApi", () => {
  it("retire les barres finales et refuse l'absence d'URL en production", () => {
    expect(resoudreUrlApi({ REACT_APP_API_URL: " https://api.exemple.ci/ ", NODE_ENV: "production" })).toBe(
      "https://api.exemple.ci"
    );
    expect(resoudreUrlApi({ REACT_APP_API_URL: "", NODE_ENV: "test" })).toBe(URL_API_DEVELOPPEMENT);
    expect(() => resoudreUrlApi({ REACT_APP_API_URL: "", NODE_ENV: "production" })).toThrow(ErreurApi);
  });

  it("exige HTTPS en production (erreur de configuration explicite)", () => {
    expect(() => resoudreUrlApi({ REACT_APP_API_URL: "http://api.exemple.ci", NODE_ENV: "production" })).toThrow(
      expect.objectContaining({ type: "configuration" })
    );
    expect(() => resoudreUrlApi({ REACT_APP_API_URL: "api.exemple.ci", NODE_ENV: "production" })).toThrow(ErreurApi);
    expect(resoudreUrlApi({ REACT_APP_API_URL: "http://localhost:8000", NODE_ENV: "development" })).toBe(
      "http://localhost:8000"
    );
  });
});

describe("appels publics /api/v1/co/*", () => {
  it("GET /co/configuration", async () => {
    global.fetch.mockResolvedValue(reponse(200, { ouvert: true, jeton_formulaire: "j" }));
    await expect(chargerConfiguration()).resolves.toEqual({ ouvert: true, jeton_formulaire: "j" });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/co\/configuration$/);
    expect(options.method).toBe("GET");
    expect(options.body).toBeUndefined();
  });

  it("POST /co/identification et /co/fiche en JSON", async () => {
    global.fetch.mockResolvedValue(reponse(201, { reference: "CO-TEST-000001" }));
    await identifierMembre({ nom: "Test" });
    await soumettreFiche({ nom: "Test" });
    const [urlIdent, optionsIdent] = global.fetch.mock.calls[0];
    expect(urlIdent).toMatch(/\/api\/v1\/co\/identification$/);
    expect(optionsIdent.method).toBe("POST");
    expect(optionsIdent.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(optionsIdent.body)).toEqual({ nom: "Test" });
    expect(global.fetch.mock.calls[1][0]).toMatch(/\/api\/v1\/co\/fiche$/);
  });

  it("POST /co/photo en multipart, sans Content-Type forcé", async () => {
    global.fetch.mockResolvedValue(reponse(200, { photo_url: "https://res.cloudinary.com/demo/p.jpg" }));
    const formulaire = new FormData();
    await envoyerPhoto(formulaire);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/co\/photo$/);
    expect(options.body).toBe(formulaire);
    expect(options.headers["Content-Type"]).toBeUndefined();
  });

  it("transforme une réponse d'erreur en ErreurApi avec statut, corps et Retry-After", async () => {
    global.fetch.mockResolvedValue(reponse(429, { detail: "Trop de requêtes" }, { "Retry-After": "120" }));
    const erreur = await identifierMembre({}).catch((e) => e);
    expect(erreur).toBeInstanceOf(ErreurApi);
    expect(erreur).toMatchObject({ type: "http", status: 429, retryAfter: "120", data: { detail: "Trop de requêtes" } });
  });

  it("tolère un corps d'erreur non JSON", async () => {
    global.fetch.mockResolvedValue(reponse(502, undefined));
    const erreur = await chargerConfiguration().catch((e) => e);
    expect(erreur).toMatchObject({ type: "http", status: 502, data: null });
  });

  it("refuse une réponse de succès sans corps JSON exploitable", async () => {
    global.fetch.mockResolvedValueOnce(reponse(201, undefined));
    await expect(soumettreFiche({})).rejects.toMatchObject({ type: "reponse", status: 201 });
    global.fetch.mockResolvedValueOnce(reponse(200, null));
    await expect(chargerConfiguration()).rejects.toMatchObject({ type: "reponse" });
  });

  it("distingue erreur réseau et délai dépassé", async () => {
    global.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(chargerConfiguration()).rejects.toMatchObject({ type: "reseau" });
    const abandon = new Error("aborted");
    abandon.name = "AbortError";
    global.fetch.mockRejectedValueOnce(abandon);
    await expect(chargerConfiguration()).rejects.toMatchObject({ type: "delai" });
  });
});
