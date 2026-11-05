import assert from "node:assert/strict";
import test from "node:test";
import { menuChangeSummary } from "../lib/integrations/uber/change-summary.ts";

test("first publish and unchanged menus have clear summaries", () => {
  assert.match(menuChangeSummary(null, {})[0], /First publish/);
  assert.deepEqual(menuChangeSummary({ items: [] }, { items: [] }), []);
});
test("reports additions, removals, prices and hours without object-key noise", () => {
  const item = { id: "a", title: { translations: { en: "Chicken" } }, price_info: { price: 100 } };
  assert.deepEqual(menuChangeSummary({ items: [item] }, { items: [{ ...item, price_info: { price: 200 } }] }), ["Item / option updated: Chicken"]);
  assert.deepEqual(menuChangeSummary({ items: [item] }, { items: [] }), ["Item / option removed: Chicken"]);
  assert.deepEqual(menuChangeSummary({ items: [] }, { items: [item] }), ["Item / option added: Chicken"]);
  assert.deepEqual(menuChangeSummary({ items: [item] }, { items: [{ price_info: item.price_info, title: item.title, id: item.id }] }), []);
  assert.deepEqual(menuChangeSummary({ menus: [{ id: "m", service_availability: [] }] }, { menus: [{ id: "m", service_availability: [{ day: "tuesday" }] }] }), ["Menu / hours updated: m"]);
});
