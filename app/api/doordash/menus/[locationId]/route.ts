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

  return Response.json({
    store: {
      merchant_supplied_id: locationId,
      provider_type:
        process.env.DOORDASH_PROVIDER_TYPE,
    },
    menus: [
      {
        ...(requestedMenuId
          ? { id: requestedMenuId }
          : {}),
        reference: "test-menu-v1",
        open_hours: [
          {
            day_index: "THU",
            start_time: "11:00",
            end_time: "21:00",
          },
        ],
        special_hours: [],
        menu: {
          name: "Test Menu",
          subtitle: "",
          merchant_supplied_id: "test-menu-001",
          active: true,
          categories: [
            {
              name: "Combos",
              subtitle: "",
              merchant_supplied_id: "combos",
              active: true,
              sort_id: 0,
              items: [
                {
                  name: "Test Sesame Chicken",
                  description: "Sandbox menu item",
                  merchant_supplied_id:
                    "test-sesame-chicken",
                  active: true,
                  price: 1299,
                  extras: [],
                },
              ],
            },
          ],
        },
      },
    ],
  });
}