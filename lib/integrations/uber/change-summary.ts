type Entity = { id: unknown; title?: { translations?: Record<string, string> }; [key: string]: unknown };
type Menu = { menus?: Entity[]; categories?: Entity[]; items?: Entity[]; modifier_groups?: Entity[] };
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`).join(",")}}`;
  return JSON.stringify(value) ?? "undefined";
}

export function menuChangeSummary(previous: unknown, current: unknown): string[] {
  if (!previous || typeof previous !== "object") return ["First publish: the complete saved menu will be uploaded."];
  const before = previous as Menu;
  const after = current as Menu;
  const changes: string[] = [];
  for (const [key, label] of [["menus", "Menu / hours"], ["categories", "Category"], ["items", "Item / option"], ["modifier_groups", "Modifier group"]] as const) {
    const old = new Map((before[key] ?? []).map((entity) => [entity.id, entity]));
    const next = new Map((after[key] ?? []).map((entity) => [entity.id, entity]));
    const name = (entity: Entity) => Object.values(entity.title?.translations ?? {})[0] || String(entity.id);
    for (const [id, entity] of next) {
      if (!old.has(id)) changes.push(`${label} added: ${name(entity)}`);
      else if (stable(old.get(id)) !== stable(entity)) changes.push(`${label} updated: ${name(entity)}`);
    }
    for (const [id, entity] of old) if (!next.has(id)) changes.push(`${label} removed: ${name(entity)}`);
  }
  return changes;
}
