import { createHash } from "node:crypto";

// Uber may reorder entities, add defaults, or omit ITEM types on retrieval.
// Compare the fields we manage, including relationships and option order.
type Entity = Record<string, unknown>;
function record(value: unknown): Entity {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid menu object.");
  return value as Entity;
}
function list(value: unknown): Entity[] {
  if (!Array.isArray(value)) throw new Error("Invalid menu entity list.");
  return value.map(record);
}
function sorted(value: unknown) {
  return list(value).sort((a, b) => String(a.id).localeCompare(String(b.id)));
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonical(child)]));
  }
  return value;
}
export function payloadHash(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(canonical(payload))).digest("hex");
}
export function managedMenu(payload: unknown) {
  const p = record(payload);
  const title = (value: unknown) => record(record(value).translations);
  return {
    menus: sorted(p.menus).map((x) => ({ id: x.id, title: title(x.title), subtitle: x.subtitle ? title(x.subtitle) : { en_us: "" }, category_ids: x.category_ids,
      hours: list(x.service_availability).sort((a, b) => String(a.day_of_week).localeCompare(String(b.day_of_week))).map((h) => ({ day: h.day_of_week, periods: list(h.time_periods).map((t) => ({ start: t.start_time, end: t.end_time })) })) })),
    categories: sorted(p.categories).map((x) => ({ id: x.id, title: title(x.title), subtitle: x.subtitle ? title(x.subtitle) : { en_us: "" }, items: list(x.entities).map((y) => y.id) })),
    items: sorted(p.items).map((x) => ({ id: x.id, title: title(x.title), description: x.description ? title(x.description) : { en_us: "" }, price: record(x.price_info).price, groups: x.modifier_group_ids ? record(x.modifier_group_ids).ids ?? [] : [] })),
    groups: sorted(p.modifier_groups ?? []).map((x) => {
      const quantity = record(record(x.quantity_info).quantity);
      return { id: x.id, title: title(x.title), min: quantity.min_permitted ?? 0, max: quantity.max_permitted, options: list(x.modifier_options).map((y) => y.id) };
    }),
  };
}
export function menusMatch(actual: unknown, submitted: unknown) {
  try { return payloadHash(managedMenu(actual)) === payloadHash(managedMenu(submitted)); }
  catch { return false; }
}
