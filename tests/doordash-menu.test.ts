import assert from "node:assert/strict";
import test from "node:test";
import { toDoorDashMenu } from "../lib/integrations/doordash/menu.ts";
import type { DoorDashMenuRecord } from "../lib/integrations/doordash/menu.ts";

const menu: DoorDashMenuRecord = {
  id: "menu-1",
  name: "Main Menu",
  description: "Primary menu",
  active: true,
  categories: [
    {
      id: "category-1",
      name: "Combos",
      description: "",
      active: true,
      sort_order: 0,
      menu_items: [
        {
          id: "item-1",
          name: "Sesame Chicken",
          description: "Crispy chicken",
          price_cents: 1375,
          active: true,
          sort_order: 0,
          menu_item_modifier_groups: [
            {
              sort_order: 0,
              modifier_groups: {
                id: "group-1",
                name: "Choose a Side",
                minimum_selections: 1,
                maximum_selections: 1,
                active: true,
                modifier_options: [
                  { id: "option-1", name: "Fried Rice", price_cents: 200, active: true, sort_order: 0 },
                  { id: "option-hidden", name: "Hidden option", price_cents: 0, active: false, sort_order: 1 },
                ],
              },
            },
          ],
        },
        {
          id: "item-hidden",
          name: "Hidden item",
          description: "",
          price_cents: 100,
          active: false,
          sort_order: 1,
          menu_item_modifier_groups: [],
        },
      ],
    },
  ],
};

test("converts the master menu into DoorDash format", () => {
  const result = toDoorDashMenu(menu, "external-menu-1");
  const item = result.menu.categories[0].items[0];
  const extra = item.extras[0];

  assert.equal(result.id, "external-menu-1");
  assert.equal(result.menu.name, "Main Menu");
  assert.equal(item.name, "Sesame Chicken");
  assert.equal(item.price, 1375);
  assert.equal(extra.min_num_options, 1);
  assert.equal(extra.max_num_options, 1);
  assert.equal(extra.options[0].name, "Fried Rice");
  assert.equal(extra.options[0].price, 200);
});

test("omits inactive items and modifier options", () => {
  const result = toDoorDashMenu(menu);
  const items = result.menu.categories[0].items;
  const options = items[0].extras[0].options;

  assert.deepEqual(items.map((item) => item.name), ["Sesame Chicken"]);
  assert.deepEqual(options.map((option) => option.name), ["Fried Rice"]);
});
