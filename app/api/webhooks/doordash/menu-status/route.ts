export async function POST(request: Request) {
  const expectedToken =
    process.env.DOORDASH_MENU_STATUS_WEBHOOK_TOKEN;

  const suppliedToken =
    request.headers.get("authorization");

  if (!expectedToken || suppliedToken !== expectedToken) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const status = await request.json();

  console.log("DoorDash menu status received:", status);

  return Response.json(
    {
      message: "Menu status received",
      menuId: status?.menu?.id ?? null,
    },
    { status: 200 },
  );
}