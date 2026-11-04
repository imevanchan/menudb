import assert from "node:assert/strict";
import test from "node:test";
import { assertSandbox, uberSandbox } from "../lib/integrations/uber/transport.ts";
import { menusMatch, payloadHash } from "../lib/integrations/uber/payload.ts";
import { runSandboxPublish } from "../lib/integrations/uber/publish.ts";

const config = { apiBase: "https://test-api.uber.com", authUrl: "https://sandbox-login.uber.com/oauth/v2/token", storeId: "49a494a7-3345-507d-bca9-a019476d93fe", clientId: "test-client", clientSecret: "test-secret" };
const payload = {
  menus: [{ id: "menu", title: { translations: { en_us: "Menu" } }, category_ids: ["category"], service_availability: [{ day_of_week: "tuesday", time_periods: [{ start_time: "11:00", end_time: "21:00" }] }] }],
  categories: [{ id: "category", title: { translations: { en_us: "Combos" } }, entities: [{ id: "item", type: "ITEM" }] }],
  items: [{ id: "item", title: { translations: { en_us: "Chicken" } }, price_info: { price: 1375 }, modifier_group_ids: { ids: [] } }],
  modifier_groups: [],
};

test("production URLs and lookalike sandbox hosts are rejected before any request", () => {
  for (const apiBase of ["https://api.uber.com", "https://test-api.uber.com.evil.example", "https://test-api.uber.com/path"]) {
    assert.throws(() => assertSandbox({ ...config, apiBase }));
  }
  assert.throws(() => assertSandbox({ ...config, authUrl: "https://auth.uber.com/oauth/v2/token" }));
});

test("sandbox transport refuses redirects and never returns tokens", async () => {
  const calls: { url: string; options?: RequestInit }[] = [];
  const request: typeof fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) return Response.json({ access_token: "private-test-token" });
    return options?.method === "PUT" ? new Response(null, { status: 204 }) : Response.json(payload);
  };
  const transport = uberSandbox(config, request);
  await transport.read();
  assert.deepEqual(await transport.upload(payload), { ok: true, status: 204 });
  assert.equal(calls.length, 3);
  assert.ok(calls.every((call) => call.options?.redirect === "error"));
  assert.ok(calls.slice(1).every((call) => call.url.startsWith(`${config.apiBase}/v2/eats/stores/`)));
});

test("retrieval comparison tolerates platform defaults but detects a price or hours change", () => {
  const actual = structuredClone(payload);
  delete (actual.categories[0].entities[0] as { type?: string }).type;
  assert.equal(menusMatch(actual, payload), true);
  actual.items[0].price_info.price++;
  assert.equal(menusMatch(actual, payload), false);
  const hours = structuredClone(payload);
  hours.menus[0].service_availability[0].time_periods[0].end_time = "22:00";
  assert.equal(menusMatch(hours, payload), false);
  assert.equal(payloadHash({ b: 2, a: 1 }), payloadHash({ a: 1, b: 2 }));
});

test("backup persistence is required before any upload", async () => {
  let uploaded = false;
  const result = await runSandboxPublish(payload, { read: async () => payload, upload: async () => { uploaded = true; return { ok: true, status: 204 }; } }, async () => { throw new Error("Storage failure"); }, async () => {});
  assert.equal(uploaded, false);
  assert.equal(result.status, "failed");
});

test("successful publishing backs up, uploads once, records acceptance, and verifies", async () => {
  const events: string[] = [];
  const result = await runSandboxPublish(payload, {
    read: async () => { events.push("read"); return payload; },
    upload: async () => { events.push("upload"); return { ok: true, status: 204 }; },
  }, async () => { events.push("backup"); }, async () => { events.push("accepted"); });
  assert.deepEqual(events, ["read", "backup", "upload", "accepted", "read"]);
  assert.equal(result.status, "verified");
});

test("an upload timeout is uncertain and is never retried automatically", async () => {
  let uploads = 0;
  const result = await runSandboxPublish(payload, { read: async () => payload, upload: async () => { uploads++; throw new Error("Timeout"); } }, async () => {}, async () => {});
  assert.equal(result.status, "uncertain");
  assert.equal(uploads, 1);
});

test("accepted upload with failed retrieval is distinguished from rejected upload", async () => {
  let reads = 0;
  const result = await runSandboxPublish(payload, { read: async () => { if (++reads > 1) throw new Error("Timeout"); return payload; }, upload: async () => ({ ok: true, status: 204 }) }, async () => {}, async () => {});
  assert.equal(result.status, "accepted");
  const rejected = await runSandboxPublish(payload, { read: async () => payload, upload: async () => ({ ok: false, status: 400 }) }, async () => {}, async () => {});
  assert.equal(rejected.status, "failed");
  assert.equal(rejected.http_status, 400);
});
