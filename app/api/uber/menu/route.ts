import { connection } from "next/server";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import { assertSandbox } from "../../../../lib/integrations/uber/transport";
import { uberConfig } from "../../../../lib/integrations/uber/config";

async function getUberAccessToken() {
  const clientId = process.env.UBER_CLIENT_ID;
  const clientSecret = process.env.UBER_CLIENT_SECRET;
  const authUrl = process.env.UBER_AUTH_URL;

  if (!clientId || !clientSecret || !authUrl) {
    throw new Error("Uber authentication variables are missing.");
  }

  const response = await fetch(authUrl, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "eats.store",
    }),
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    console.error("Uber token request failed:", response.status);
    throw new Error("Unable to authenticate with Uber.");
  }

  return data.access_token as string;
}

export async function GET() {
  await connection();
  try {
    const supabase = await createServerSupabaseClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return Response.json({ error: "Sign in to retrieve the Uber sandbox menu." }, { status: 401 });
    assertSandbox(uberConfig());
    const apiBaseUrl = process.env.UBER_API_BASE_URL;
    const storeId = process.env.UBER_STORE_ID;

    if (!apiBaseUrl || !storeId) {
      return Response.json(
        { error: "Uber configuration is incomplete." },
        { status: 500 },
      );
    }

    const accessToken = await getUberAccessToken();

    const response = await fetch(
      `${apiBaseUrl}/v2/eats/stores/${storeId}/menus`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Uber menu request failed:", response.status, data);

      return Response.json(
        {
          error: "Unable to retrieve the Uber Eats menu.",
          details: data,
        },
        { status: response.status },
      );
    }

    return Response.json({
      environment: "sandbox",
      storeId,
      menu: data,
    });
  } catch (error) {
    console.error("Uber menu route failed:", error);

    return Response.json(
      { error: "The Uber Eats menu request failed." },
      { status: 500 },
    );
  }
}
