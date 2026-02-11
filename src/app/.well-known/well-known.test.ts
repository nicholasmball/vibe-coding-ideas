import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET as getAuthServerMetadata } from "./oauth-authorization-server/route";
import { GET as getProtectedResourceMetadata } from "./oauth-protected-resource/route";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://test.vibecodes.app");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("/.well-known/oauth-authorization-server", () => {
  it("returns complete OAuth server metadata", async () => {
    const response = await getAuthServerMetadata();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      issuer: "https://test.vibecodes.app",
      authorization_endpoint: "https://test.vibecodes.app/api/oauth/authorize",
      token_endpoint: "https://test.vibecodes.app/api/oauth/token",
      registration_endpoint: "https://test.vibecodes.app/api/oauth/register",
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: ["client_secret_post"],
      code_challenge_methods_supported: ["S256"],
      scopes_supported: ["mcp:tools"],
    });
  });

  it("returns 500 when NEXT_PUBLIC_APP_URL is not set", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    const response = await getAuthServerMetadata();
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("server_error");
  });
});

describe("/.well-known/oauth-protected-resource", () => {
  it("returns complete protected resource metadata", async () => {
    const response = await getProtectedResourceMetadata();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      resource: "https://test.vibecodes.app/api/mcp",
      authorization_servers: ["https://test.vibecodes.app"],
      scopes_supported: ["mcp:tools"],
      bearer_methods_supported: ["header"],
    });
  });
});
