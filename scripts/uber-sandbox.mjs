import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const apiBase = "https://test-api.uber.com";
const authUrl = "https://sandbox-login.uber.com/oauth/v2/token";

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--upload") || args.length > 1) {
    throw new Error("Usage: npm run uber:sandbox [-- --upload]");
  }
  if (process.env.UBER_API_BASE_URL !== apiBase || process.env.UBER_AUTH_URL !== authUrl) {
    throw new Error("Sandbox URLs must match exactly. Production and custom hosts are refused.");
  }
  const storeId = process.env.UBER_STORE_ID;
  if (!storeId || !/^[0-9a-f-]{36}$/i.test(storeId)) {
    throw new Error("A valid UBER_STORE_ID is required.");
  }
  const response = await fetch("http://localhost:3000/api/uber/menu/preview", {
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Local preview failed: HTTP ${response.status}. Start npm run dev first.`);
  const preview = await response.json();
  if (preview.storeId !== storeId || preview.mode !== "preview" || preview.transmitted !== false) {
    throw new Error("Preview does not match the configured sandbox store.");
  }
  if (!preview.validation?.sourceChecksPassed || preview.validation.errors?.length || !preview.payload?.menus?.length || !preview.payload?.items?.length) {
    throw new Error(`Preview validation failed: ${JSON.stringify(preview.validation?.errors ?? [])}`);
  }
  console.log(JSON.stringify({
    target: apiBase,
    storeId,
    menus: preview.payload.menus.length,
    categories: preview.payload.categories.length,
    items: preview.payload.items.length,
    modifierGroups: preview.payload.modifier_groups.length,
    warnings: preview.validation.warnings,
  }, null, 2));
  if (!args.includes("--upload")) {
    console.log("Dry run complete. No Uber requests were made. Use --upload to replace this store’s sandbox menu.");
    return;
  }
  if (!process.env.UBER_CLIENT_ID || !process.env.UBER_CLIENT_SECRET) {
    throw new Error("Uber client credentials are missing.");
  }
  const tokenResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.UBER_CLIENT_ID,
      client_secret: process.env.UBER_CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "eats.store",
    }),
  });
  if (!tokenResponse.ok) throw new Error(`Sandbox authentication failed: HTTP ${tokenResponse.status}`);
  const { access_token: token } = await tokenResponse.json();
  if (!token) throw new Error("Sandbox authentication returned no token.");
  const menuUrl = `${apiBase}/v2/eats/stores/${storeId}/menus`;
  const headers = { Authorization: `Bearer ${token}` };
  const currentResponse = await fetch(menuUrl, {
    headers, redirect: "error", signal: AbortSignal.timeout(30_000),
  });
  if (!currentResponse.ok) throw new Error(`Cannot back up the existing sandbox menu: HTTP ${currentResponse.status}. Upload cancelled.`);
  const current = await currentResponse.json();
  const backupDir = fileURLToPath(new URL("../sandbox-backups/", import.meta.url));
  await mkdir(backupDir, { recursive: true, mode: 0o700 });
  const backupPath = `${backupDir}${storeId}-${Date.now()}.json`;
  await writeFile(backupPath, JSON.stringify({ storeId, apiBase, original: current, submitted: preview.payload }, null, 2), { flag: "wx", mode: 0o600 });
  console.log(`Backup saved: ${backupPath}`);
  const upload = await fetch(menuUrl, {
    method: "PUT",
    redirect: "error",
    signal: AbortSignal.timeout(60_000),
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(preview.payload),
  });
  const body = await upload.text();
  console.log(`Sandbox upload HTTP ${upload.status}`);
  if (body) console.log(body);
  if (!upload.ok) throw new Error("Uber rejected the sandbox upload. Review the response above.");
  console.log("Sandbox upload accepted. Retrieve /api/uber/menu to inspect the stored result.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Sandbox operation failed.");
  process.exitCode = 1;
});
