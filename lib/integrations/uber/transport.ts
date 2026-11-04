export const UBER_SANDBOX_API = "https://test-api.uber.com";
export const UBER_SANDBOX_AUTH = "https://sandbox-login.uber.com/oauth/v2/token";

export type UberConfig = { apiBase: string; authUrl: string; storeId: string; clientId: string; clientSecret: string };
export function assertSandbox(config: UberConfig) {
  if (config.apiBase !== UBER_SANDBOX_API || config.authUrl !== UBER_SANDBOX_AUTH) throw new Error("Only Uber sandbox URLs are allowed.");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(config.storeId)) throw new Error("The sandbox store is not configured.");
  if (!config.clientId || !config.clientSecret) throw new Error("Uber sandbox credentials are missing.");
}

export function uberSandbox(config: UberConfig, request: typeof fetch = fetch) {
  assertSandbox(config);
  const url = `${UBER_SANDBOX_API}/v2/eats/stores/${config.storeId}/menus`;
  let token: string | undefined;
  async function headers() {
    if (!token) {
      const response = await request(UBER_SANDBOX_AUTH, {
        method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10_000),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, grant_type: "client_credentials", scope: "eats.store" }),
      });
      if (!response.ok) throw new Error(`Sandbox authentication failed (HTTP ${response.status}).`);
      const data = await response.json();
      if (typeof data.access_token !== "string" || !data.access_token) throw new Error("Sandbox authentication returned no token.");
      token = data.access_token;
    }
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  }
  return {
    async read() {
      const response = await request(url, { headers: await headers(), redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(`Sandbox menu retrieval failed (HTTP ${response.status}).`);
      return response.json() as Promise<unknown>;
    },
    async upload(payload: unknown) {
      const response = await request(url, { method: "PUT", headers: await headers(), body: JSON.stringify(payload), redirect: "error", cache: "no-store", signal: AbortSignal.timeout(20_000) });
      return { ok: response.ok, status: response.status };
    },
  };
}
