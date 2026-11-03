import type { UberMenuRecord } from "./menu";

// Validate the source as well as the payload: an empty required group would
// otherwise disappear during transformation and silently remove a choice.
export function validateUberMenu(menu: UberMenuRecord) {
  const errors: string[] = [];
  const warnings = [
    "Tax settings are not configured. This preview has not been validated by Uber.",
  ];
  let itemCount = 0;
  const checkPrice = (name: string, price: number) => {
    if (!Number.isSafeInteger(price) || price < 0) {
      errors.push(`${name}: price must be a nonnegative whole number of cents.`);
    }
  };

  if (!menu.active || !menu.name.trim()) {
    errors.push("The menu must be active and have a name.");
  }
  for (const category of menu.categories ?? []) {
    if (!category.active) continue;
    if (!category.name.trim()) errors.push("An active category has no name.");
    const items = (category.menu_items ?? []).filter((item) => item.active);
    if (!items.length) warnings.push(`${category.name}: category has no active items.`);
    for (const item of items) {
      itemCount++;
      if (!item.name.trim()) errors.push("An active item has no name.");
      checkPrice(item.name, item.price_cents);
      for (const assignment of item.menu_item_modifier_groups ?? []) {
        const relation = assignment.modifier_groups;
        const group = Array.isArray(relation) ? relation[0] : relation;
        if (!group?.active) continue;
        const options = (group.modifier_options ?? []).filter((option) => option.active);
        const min = group.minimum_selections;
        const max = group.maximum_selections;
        if (!group.name.trim()) errors.push(`${item.name}: a modifier group has no name.`);
        if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min < 0 || max < 1 || min > max || min > options.length) {
          errors.push(`${item.name} / ${group.name}: selection limits cannot be satisfied by the active options.`);
        }
        for (const option of options) {
          if (!option.name.trim()) errors.push(`${group.name}: an active option has no name.`);
          checkPrice(option.name, option.price_cents);
        }
      }
    }
  }
  if (!itemCount) errors.push("The menu has no active items.");
  return {
    sourceChecksPassed: errors.length === 0,
    readyForUpload: false,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
  };
}
