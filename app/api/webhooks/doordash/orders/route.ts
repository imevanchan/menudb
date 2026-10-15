export async function POST(request: Request) {
  const expectedToken =
    process.env.DOORDASH_ORDERS_WEBHOOK_TOKEN;

  const suppliedToken =
    request.headers.get("authorization");

  if (!expectedToken || suppliedToken !== expectedToken) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const order = await request.json();

  console.log("DoorDash sandbox order received:", order);

  return Response.json(
    { message: "Order received" },
    { status: 200 },
  );
}