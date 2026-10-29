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

export type DoorDashMenuRecord = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  categories: CategoryRecord[] | null;
};

export type DoorDashLocationRecord = {
  merchant_supplied_id: string;
  menus: DoorDashMenuRecord[] | null;
};

function relatedModifierGroup(
  relation: ModifierAssignmentRecord["modifier_groups"],
) {
  return Array.isArray(relation) ? relation[0] : relation;
}

function toDoorDashExtra(assignment: ModifierAssignmentRecord) {
  const group = relatedModifierGroup(assignment.modifier_groups);

  if (!group?.active) {
    return null;
  }

  const options = [...(group.modifier_options ?? [])]
    .filter((option) => option.active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((option) => ({
      name: option.name,
      description: "",
      merchant_supplied_id: option.id,
      active: true,
      price: option.price_cents,
      sort_id: option.sort_order,
      default: false,
    }));

  if (options.length === 0) {
    return null;
  }

  return {
    name: group.name,
    description: "",
    merchant_supplied_id: group.id,
    active: true,
    sort_id: assignment.sort_order,
    min_num_options: group.minimum_selections,
    max_num_options: group.maximum_selections,
    num_free_options: 0,
    options,
  };
}

export function toDoorDashMenu(
  menu: DoorDashMenuRecord,
  requestedMenuId?: string,
) {
  const categories = [...(menu.categories ?? [])]
    .filter((category) => category.active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((category) => ({
      name: category.name,
      subtitle: category.description ?? "",
      merchant_supplied_id: category.id,
      active: true,
      sort_id: category.sort_order,
      items: [...(category.menu_items ?? [])]
        .filter((item) => item.active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({
          name: item.name,
          description: item.description ?? "",
          merchant_supplied_id: item.id,
          active: true,
          price: item.price_cents,
          sort_id: item.sort_order,
          extras: [...(item.menu_item_modifier_groups ?? [])]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(toDoorDashExtra)
            .filter((extra) => extra !== null),
        })),
    }));

  return {
    ...(requestedMenuId ? { id: requestedMenuId } : {}),
    reference: `menudb-${menu.id}`,
    // Menu hours are still sandbox configuration. They will move into the
    // master database when schedule editing is added.
    open_hours: [
      {
        day_index: "THU",
        start_time: "11:00",
        end_time: "21:00",
      },
    ],
    special_hours: [],
    menu: {
      name: menu.name,
      subtitle: menu.description ?? "",
      merchant_supplied_id: menu.id,
      active: menu.active,
      categories,
    },
  };
}
