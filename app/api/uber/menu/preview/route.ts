import { createServerSupabaseClient } from "../../../../../lib/supabase/server";
import { validateUberMenu } from "../../../../../lib/integrations/uber/validation";
import {
  toUberMenu,
  type UberMenuRecord,
} from "../../../../../lib/integrations/uber/menu";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("menus")
      .select(`
        id,
        name,
        description,
        active,
        locations!inner(merchant_supplied_id),
        categories(
          id,
          name,
          description,
          active,
          sort_order,
          menu_items(
            id,
            name,
            description,
            price_cents,
            active,
            sort_order,
            menu_item_modifier_groups(
              sort_order,
              modifier_groups(
                id,
                name,
                minimum_selections,
                maximum_selections,
                active,
                modifier_options(
                  id,
                  name,
                  price_cents,
                  active,
                  sort_order
                )
              )
            )
          )
        )
      `)
      .eq("locations.merchant_supplied_id", "test-location")
      .eq("active", true)
      .single();

    if (error || !data) {
      console.error("Unable to load the Uber preview menu:", error);
      return Response.json(
        { error: "The master menu could not be loaded." },
        { status: error?.code === "PGRST116" ? 404 : 500 },
      );
    }

    return Response.json({
      mode: "preview",
      transmitted: false,
      storeId: process.env.UBER_STORE_ID ?? null,
      validation: validateUberMenu(data as unknown as UberMenuRecord),
      payload: toUberMenu(data as unknown as UberMenuRecord),
    });
  } catch (error) {
    console.error("Uber menu preview failed:", error);
    return Response.json(
      { error: "The Uber menu preview could not be generated." },
      { status: 500 },
    );
  }
}
