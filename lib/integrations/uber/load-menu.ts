import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toUberMenu, type UberMenuRecord } from "./menu";
import { validateUberMenu } from "./validation";

export async function loadUberPreview(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("menus").select(`
    id, name, description, active,
    locations!inner(merchant_supplied_id),
    categories(id, name, description, active, sort_order,
      menu_items(id, name, description, price_cents, active, sort_order,
        menu_item_modifier_groups(sort_order,
          modifier_groups(id, name, minimum_selections, maximum_selections, active,
            modifier_options(id, name, price_cents, active, sort_order)
          )
        )
      )
    )
  `).eq("locations.merchant_supplied_id", "test-location").eq("active", true).single();
  if (error || !data) throw new Error("The master menu could not be loaded.");
  const menu = data as unknown as UberMenuRecord;
  return { payload: toUberMenu(menu), validation: validateUberMenu(menu) };
}
