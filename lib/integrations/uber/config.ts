import "server-only";
import type { UberConfig } from "./transport";

export function uberConfig(): UberConfig {
  return {
    apiBase: process.env.UBER_API_BASE_URL ?? "",
    authUrl: process.env.UBER_AUTH_URL ?? "",
    storeId: process.env.UBER_STORE_ID ?? "",
    clientId: process.env.UBER_CLIENT_ID ?? "",
    clientSecret: process.env.UBER_CLIENT_SECRET ?? "",
  };
}
