"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../../lib/supabase/server";

async function requireAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  return supabase;
}

export async function createMenuItem(formData: FormData) {
  const supabase = await requireAuthenticatedUser();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));

  if (!categoryId || !name || !Number.isFinite(price) || price < 0) {
    redirect("/admin?error=invalid-new-item");
  }

  const { data: lastItem, error: orderError } = await supabase
    .from("menu_items")
    .select("sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) {
    console.error("Unable to determine menu item order:", orderError);
    redirect("/admin?error=create-failed");
  }

  const { error } = await supabase.from("menu_items").insert({
    category_id: categoryId,
    name,
    description,
    price_cents: Math.round(price * 100),
    sort_order: (lastItem?.sort_order ?? -1) + 1,
  });

  if (error) {
    console.error("Unable to create menu item:", error);
    redirect("/admin?error=create-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/menu");
  redirect("/admin?created=1");
}

export async function updateMenuItem(formData: FormData) {
  const supabase = await requireAuthenticatedUser();
  const itemId = String(formData.get("itemId") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const active = formData.get("active") === "on";

  if (!itemId || !categoryId || !name || !Number.isFinite(price) || price < 0) {
    redirect("/admin?error=invalid-item");
  }

  const { error } = await supabase
    .from("menu_items")
    .update({
      category_id: categoryId,
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
