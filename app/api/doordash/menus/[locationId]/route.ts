import { createServerSupabaseClient } from "../../../../../lib/supabase/server";
import {
  DoorDashLocationRecord,
  toDoorDashMenu,
} from "../../../../../lib/integrations/doordash/menu";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ locationId: string }>;
  },
) {
  const expectedToken =
    process.env.DOORDASH_MENU_REQUEST_TOKEN;

  const suppliedToken =
    request.headers.get("authorization");

  if (!expectedToken || suppliedToken !== expectedToken) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { locationId } = await context.params;

  const requestedMenuIds =
    new URL(request.url).searchParams.get("ids");

  const requestedMenuId =
    requestedMenuIds?.split(",")[0]?.trim();

  console.log("DoorDash menu requested:", {
    locationId,
    requestedMenuIds,
  });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("locations")
    .select(`
      merchant_supplied_id,
      menus(
        id,
        name,
        description,
        active,
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
      )
    `)
    .eq("merchant_supplied_id", locationId)
    .eq("active", true)
    .single();

  if (error || !data) {
    console.error("Unable to load DoorDash menu location:", error);
    return Response.json(
      { error: "Location not found" },
      { status: error?.code === "PGRST116" ? 404 : 500 },
    );
  }

  const location = data as unknown as DoorDashLocationRecord;
  const activeMenus = (location.menus ?? []).filter((menu) => menu.active);

  return Response.json({
    store: {
      merchant_supplied_id: locationId,
      provider_type:
        process.env.DOORDASH_PROVIDER_TYPE,
    },
    menus: activeMenus.map((menu) =>
      toDoorDashMenu(menu, requestedMenuId),
    ),
  });
}
