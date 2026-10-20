import { CanopApiError } from "@canop/ui";
import { describe, expect, it } from "vitest";
import { createAuthApi, DEFAULT_API_BASE_PATH } from "../index";
import { jsonResponse, stubAuthApi, TEST_TERMS_VERSION } from "./authPortalTestKit";

const api = createAuthApi(DEFAULT_API_BASE_PATH);

describe("client API /api/auth", () => {
  it("login appelle POST /api/auth/login avec email et mot de passe", async () => {
    const stub = stubAuthApi({ "POST /api/auth/login": { status: 200, body: { ok: true } } });
    await api.login("a@b.test", "secret123");
    expect(stub.callsTo("POST /api/auth/login")).toEqual([
      {
        method: "POST",
        url: "/api/auth/login",
        body: { email: "a@b.test", password: "secret123" },
      },
    ]);
  });

  it("envoie les requetes en same-origin et en JSON", async () => {
    const stub = stubAuthApi({ "POST /api/auth/login": { status: 200, body: {} } });
    await api.login("a@b.test", "secret123");
    expect(stub.calls).toHaveLength(1);
    expect(stub.inits[0].credentials).toBe("same-origin");
    expect(new Headers(stub.inits[0].headers).get("content-type")).toBe("application/json");
  });

  it("register appelle POST /api/auth/register avec accepted_terms_version", async () => {
    const stub = stubAuthApi({ "POST /api/auth/register": { status: 201, body: {} } });
    await api.register({
      name: "Alice",
      email: "a@b.test",
      password: "secret123",
      acceptedTermsVersion: TEST_TERMS_VERSION,
    });
    expect(stub.callsTo("POST /api/auth/register")[0].body).toEqual({
      name: "Alice",
      email: "a@b.test",
      password: "secret123",
      accepted_terms_version: TEST_TERMS_VERSION,
    });
  });

  it("forgotPassword appelle POST /api/auth/password/forgot", async () => {
    const stub = stubAuthApi({ "POST /api/auth/password/forgot": { status: 202 } });
    await api.forgotPassword("a@b.test");
    expect(stub.callsTo("POST /api/auth/password/forgot")[0].body).toEqual({ email: "a@b.test" });
  });

  it("resetPassword envoie {token, new_password}", async () => {
    const stub = stubAuthApi({ "POST /api/auth/password/reset": { status: 200, body: {} } });
    await api.resetPassword("tok", "nouveau-mdp");
    expect(stub.callsTo("POST /api/auth/password/reset")[0].body).toEqual({
      token: "tok",
      new_password: "nouveau-mdp",
    });
  });

  it("getRegistrationEnabled lit GET /api/auth/settings/registration", async () => {
    stubAuthApi({
      "GET /api/auth/settings/registration": { status: 200, body: { enabled: false } },
    });
    await expect(api.getRegistrationEnabled()).resolves.toEqual({ enabled: false });
  });

  it("getMe retourne le profil", async () => {
    stubAuthApi({
      "GET /api/auth/me": { status: 200, body: { user_id: "1", email: "a@b.test", roles: [] } },
    });
    const me = await api.getMe();
    expect(me.email).toBe("a@b.test");
  });

  it("logout appelle POST /api/auth/logout et accepte un 204", async () => {
    const stub = stubAuthApi({ "POST /api/auth/logout": { status: 204 } });
    await expect(api.logout()).resolves.toBeUndefined();
    expect(stub.callsTo("POST /api/auth/logout")).toHaveLength(1);
  });

  it("utilise le chemin de base fourni", async () => {
    const stub = stubAuthApi({ "GET /gateway/auth/me": { status: 200, body: {} } });
    await createAuthApi("/gateway/auth").getMe();
    expect(stub.calls.map((call) => call.url)).toEqual(["/gateway/auth/me"]);
  });

  it("leve une erreur avec le status sur reponse 401", async () => {
    stubAuthApi({ "GET /api/auth/me": { status: 401, body: { error: "invalid credentials" } } });
    await expect(api.getMe()).rejects.toMatchObject({ status: 401 });
  });

  it("expose le message et le code d'erreur du corps JSON", async () => {
    stubAuthApi({ "POST /api/auth/register": { status: 409, body: { error: "email_taken" } } });
    const error = await api
      .register({
        name: "Bob",
        email: "a@b.test",
        password: "x".repeat(8),
        acceptedTermsVersion: "v",
      })
      .catch((err: unknown) => err);
    expect(error).toBeInstanceOf(CanopApiError);
    expect(error).toMatchObject({ status: 409, code: "email_taken", message: "email_taken" });
  });

  it("garde une erreur typee si le corps n'est pas du JSON", async () => {
    stubAuthApi({ "GET /api/auth/me": new Response("boom", { status: 500 }) });
    await expect(api.getMe()).rejects.toBeInstanceOf(CanopApiError);
  });

  it("leve une erreur typee sur une reponse d'erreur sans corps", async () => {
    stubAuthApi({ "GET /api/auth/me": jsonResponse(500) });
    await expect(api.getMe()).rejects.toMatchObject({ status: 500 });
  });
});
