"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../../lib/supabase/server";

export async function updateMenuItem(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const itemId = String(formData.get("itemId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const active = formData.get("active") === "on";

  if (!itemId || !name || !Number.isFinite(price) || price < 0) {
    redirect("/admin?error=invalid-item");
  }

  const { error } = await supabase
    .from("menu_items")
    .update({
      name,
      description,
      price_cents: Math.round(price * 100),
      active,
    })
    .eq("id", itemId);

  if (error) {
    console.error("Unable to update menu item:", error);
    redirect("/admin?error=save-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/menu");
  redirect("/admin?saved=1");
}
