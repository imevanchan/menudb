import assert from "node:assert/strict";
import test from "node:test";
import { toUberMenu } from "../lib/integrations/uber/menu.ts";
import type { UberMenuRecord } from "../lib/integrations/uber/menu.ts";

const menu: UberMenuRecord = {
  id: "menu-1",
  name: "Main Menu",
  description: "Primary menu",
  active: true,
  categories: [
    {
      id: "category-1",
      name: "Combos",
      description: "Popular combinations",
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

test("converts the master menu into Uber Eats format", () => {
  const result = toUberMenu(menu);

  assert.deepEqual(result.menus[0].category_ids, ["category-1"]);
  assert.deepEqual(result.categories[0].entities, [
    { id: "item-1", type: "ITEM" },
  ]);

  const item = result.items.find((entry) => entry.id === "item-1");
  const option = result.items.find((entry) => entry.id === "option-1");
  const group = result.modifier_groups[0];

  assert.equal(item?.price_info.price, 1375);
  assert.deepEqual(item?.modifier_group_ids.ids, ["group-1"]);
  assert.equal(option?.price_info.price, 200);
  assert.equal(group.quantity_info.quantity.min_permitted, 1);
  assert.deepEqual(group.modifier_options, [
    { id: "option-1", type: "ITEM" },
  ]);
});

test("omits inactive items and modifier options", () => {
  const result = toUberMenu(menu);
  const ids = result.items.map((item) => item.id);

  assert.equal(ids.includes("item-hidden"), false);
  assert.equal(ids.includes("option-hidden"), false);
});
