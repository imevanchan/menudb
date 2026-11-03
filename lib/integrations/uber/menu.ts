type ModifierOptionRecord = {
  id: string;
  name: string;
  price_cents: number;
  active: boolean;
  sort_order: number;
};

type ModifierGroupRecord = {
  id: string;
  name: string;
  minimum_selections: number;
  maximum_selections: number;
  active: boolean;
  modifier_options: ModifierOptionRecord[] | null;
};

type ModifierAssignmentRecord = {
  sort_order: number;
  modifier_groups: ModifierGroupRecord | ModifierGroupRecord[] | null;
};

type MenuItemRecord = {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  active: boolean;
  sort_order: number;
  menu_item_modifier_groups: ModifierAssignmentRecord[] | null;
};

type CategoryRecord = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  sort_order: number;
  menu_items: MenuItemRecord[] | null;
};

export type UberMenuRecord = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  categories: CategoryRecord[] | null;
};

type UberItem = {
  id: string;
  external_data: string;
  title: ReturnType<typeof text>;
  description: ReturnType<typeof text>;
  price_info: { price: number };
  tax_info: Record<string, never>;
  modifier_group_ids: { ids: string[] };
};

type UberModifierGroup = {
  id: string;
  external_data: string;
  title: ReturnType<typeof text>;
  quantity_info: {
    quantity: {
      min_permitted: number;
      max_permitted: number;
    };
  };
  modifier_options: { id: string; type: "ITEM" }[];
  display_type: "expanded";
};

const serviceAvailability = [
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
].map((dayOfWeek) => ({
  day_of_week: dayOfWeek,
  time_periods: [{
    start_time: "11:00",
    end_time: dayOfWeek === "friday" || dayOfWeek === "saturday" ? "22:00" : "21:00",
  }],
}));

function text(value: string | null | undefined) {
  return { translations: { en_us: value ?? "" } };
}

function relatedModifierGroup(
  relation: ModifierAssignmentRecord["modifier_groups"],
) {
  return Array.isArray(relation) ? relation[0] : relation;
}

export function toUberMenu(menu: UberMenuRecord) {
  const uberItems = new Map<string, UberItem>();
  const uberModifierGroups = new Map<string, UberModifierGroup>();

  const categories = [...(menu.categories ?? [])]
    .filter((category) => category.active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((category) => {
      const entities = [...(category.menu_items ?? [])]
        .filter((item) => item.active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => {
          const modifierGroupIds: string[] = [];

          [...(item.menu_item_modifier_groups ?? [])]
            .sort((a, b) => a.sort_order - b.sort_order)
            .forEach((assignment) => {
              const group = relatedModifierGroup(assignment.modifier_groups);

              if (!group?.active) {
                return;
              }

              const options = [...(group.modifier_options ?? [])]
                .filter((option) => option.active)
                .sort((a, b) => a.sort_order - b.sort_order);

              if (options.length === 0) {
                return;
              }

              modifierGroupIds.push(group.id);

              for (const option of options) {
                uberItems.set(option.id, {
                  id: option.id,
                  external_data: option.id,
                  title: text(option.name),
                  description: text(""),
                  price_info: { price: option.price_cents },
                  tax_info: {},
                  modifier_group_ids: { ids: [] },
                });
              }

              uberModifierGroups.set(group.id, {
                id: group.id,
                external_data: group.id,
                title: text(group.name),
                quantity_info: {
                  quantity: {
                    min_permitted: group.minimum_selections,
                    max_permitted: group.maximum_selections,
                  },
                },
                modifier_options: options.map((option) => ({
                  id: option.id,
                  type: "ITEM",
                })),
                display_type: "expanded",
              });
            });

          uberItems.set(item.id, {
            id: item.id,
            external_data: item.id,
            title: text(item.name),
            description: text(item.description),
            price_info: { price: item.price_cents },
            tax_info: {},
            modifier_group_ids: { ids: modifierGroupIds },
          });

          return { id: item.id, type: "ITEM" };
        });

      return {
        id: category.id,
        title: text(category.name),
        subtitle: text(category.description),
        entities,
      };
    });

  return {
    menus: [
      {
        id: menu.id,
        title: text(menu.name),
        subtitle: text(menu.description),
        service_availability: serviceAvailability,
        category_ids: categories.map((category) => category.id),
      },
    ],
    categories,
    items: [...uberItems.values()],
    modifier_groups: [...uberModifierGroups.values()],
    display_options: {},
  };
}
