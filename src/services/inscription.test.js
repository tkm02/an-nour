import { chargerConfigurationReinscription, chargerStatutInscriptions, rechercherInscription } from "./inscription";

const reponse = (status, corps) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(corps),
  headers: { get: () => null },
});

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.fetch;
});

describe("service inscription (/api/v1/registrations/…)", () => {
  it("GET /registrations/status et /registrations/reinscription/configuration", async () => {
    global.fetch.mockResolvedValue(reponse(200, { open: true, fee: 6000, close_at: null }));
    await chargerStatutInscriptions();
    await chargerConfigurationReinscription();
    expect(global.fetch.mock.calls[0][0]).toMatch(/\/api\/v1\/registrations\/status$/);
    expect(global.fetch.mock.calls[1][0]).toMatch(/\/api\/v1\/registrations\/reinscription\/configuration$/);
  });

  it("POST /registrations/reinscription/recherche en JSON", async () => {
    global.fetch.mockResolvedValue(reponse(200, { resultat: "nouveau", jeton_reinscription: "j" }));
    await rechercherInscription({ nom: "Test" });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/registrations\/reinscription\/recherche$/);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ nom: "Test" });
  });

  it("transforme une erreur HTTP en ErreurApi", async () => {
    global.fetch.mockResolvedValue(reponse(403, { detail: "Les inscriptions sont closes pour cette édition" }));
    await expect(rechercherInscription({})).rejects.toMatchObject({ type: "http", status: 403 });
  });
});
