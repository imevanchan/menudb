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

export async function createCategory(formData: FormData) {
  const supabase = await requireAuthenticatedUser();
  const menuId = String(formData.get("menuId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!menuId || !name) {
    redirect("/admin?error=invalid-new-category");
  }

  const { data: lastCategory, error: orderError } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("menu_id", menuId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) {
    console.error("Unable to determine category order:", orderError);
    redirect("/admin?error=category-create-failed");
  }

  const { error } = await supabase.from("categories").insert({
    menu_id: menuId,
    name,
    description,
    sort_order: (lastCategory?.sort_order ?? -1) + 1,
  });

  if (error) {
    console.error("Unable to create category:", error);
    redirect("/admin?error=category-create-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/menu");
  redirect("/admin?categoryCreated=1");
}

export async function updateCategory(formData: FormData) {
  const supabase = await requireAuthenticatedUser();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!categoryId || !name) {
    redirect("/admin?error=invalid-category");
  }

  const { error } = await supabase
    .from("categories")
    .update({ name, description, active })
    .eq("id", categoryId);

  if (error) {
    console.error("Unable to update category:", error);
    redirect("/admin?error=category-save-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/menu");
  redirect("/admin?categorySaved=1");
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

export async function createModifierGroup(formData: FormData) {
  const supabase = await requireAuthenticatedUser();
  const name = String(formData.get("name") ?? "").trim();
  const minimumSelections = Number(formData.get("minimumSelections"));
  const maximumSelections = Number(formData.get("maximumSelections"));

  if (
    !name ||
    !Number.isInteger(minimumSelections) ||
    !Number.isInteger(maximumSelections) ||
    minimumSelections < 0 ||
    maximumSelections < 1 ||
    maximumSelections < minimumSelections
  ) {
    redirect("/admin?error=invalid-modifier-group");
  }

  const { error } = await supabase.from("modifier_groups").insert({
    name,
    minimum_selections: minimumSelections,
    maximum_selections: maximumSelections,
  });

  if (error) {
    console.error("Unable to create modifier group:", error);
    redirect("/admin?error=modifier-group-create-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/menu");
  redirect("/admin?modifierSaved=1");
}

export async function updateModifierGroup(formData: FormData) {
  const supabase = await requireAuthenticatedUser();
  const groupId = String(formData.get("groupId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const minimumSelections = Number(formData.get("minimumSelections"));
  const maximumSelections = Number(formData.get("maximumSelections"));
  const active = formData.get("active") === "on";

  if (
    !groupId ||
    !name ||
    !Number.isInteger(minimumSelections) ||
    !Number.isInteger(maximumSelections) ||
    minimumSelections < 0 ||
    maximumSelections < 1 ||
    maximumSelections < minimumSelections
  ) {
    redirect("/admin?error=invalid-modifier-group");
  }

  const { error } = await supabase
    .from("modifier_groups")
    .update({
      name,
      minimum_selections: minimumSelections,
      maximum_selections: maximumSelections,
      active,
    })
    .eq("id", groupId);

  if (error) {
    console.error("Unable to update modifier group:", error);
    redirect("/admin?error=modifier-group-save-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/menu");
  redirect("/admin?modifierSaved=1");
}

export async function createModifierOption(formData: FormData) {
  const supabase = await requireAuthenticatedUser();
  const groupId = String(formData.get("groupId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));

  if (!groupId || !name || !Number.isFinite(price) || price < 0) {
    redirect("/admin?error=invalid-modifier-option");
  }

  const { data: lastOption, error: orderError } = await supabase
    .from("modifier_options")
    .select("sort_order")
    .eq("modifier_group_id", groupId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) {
    console.error("Unable to determine modifier option order:", orderError);
    redirect("/admin?error=modifier-option-create-failed");
  }

  const { error } = await supabase.from("modifier_options").insert({
    modifier_group_id: groupId,
    name,
    price_cents: Math.round(price * 100),
    sort_order: (lastOption?.sort_order ?? -1) + 1,
  });

  if (error) {
    console.error("Unable to create modifier option:", error);
    redirect("/admin?error=modifier-option-create-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/menu");
  redirect("/admin?modifierSaved=1");
}

export async function updateModifierOption(formData: FormData) {
  const supabase = await requireAuthenticatedUser();
  const optionId = String(formData.get("optionId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const active = formData.get("active") === "on";

  if (!optionId || !name || !Number.isFinite(price) || price < 0) {
    redirect("/admin?error=invalid-modifier-option");
  }

  const { error } = await supabase
    .from("modifier_options")
    .update({ name, price_cents: Math.round(price * 100), active })
    .eq("id", optionId);

  if (error) {
    console.error("Unable to update modifier option:", error);
    redirect("/admin?error=modifier-option-save-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/menu");
  redirect("/admin?modifierSaved=1");
}

export async function attachModifierGroup(formData: FormData) {
  const supabase = await requireAuthenticatedUser();
  const itemId = String(formData.get("itemId") ?? "").trim();
  const groupId = String(formData.get("groupId") ?? "").trim();

  if (!itemId || !groupId) {
    redirect("/admin?error=invalid-modifier-assignment");
  }

  const { data: existing, error: existingError } = await supabase
    .from("menu_item_modifier_groups")
    .select("menu_item_id")
    .eq("menu_item_id", itemId)
    .eq("modifier_group_id", groupId)
    .maybeSingle();

  if (existingError) {
    console.error("Unable to check modifier assignment:", existingError);
    redirect("/admin?error=modifier-assignment-failed");
  }

  if (!existing) {
    const { data: lastAssignment, error: orderError } = await supabase
      .from("menu_item_modifier_groups")
      .select("sort_order")
      .eq("menu_item_id", itemId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError) {
      console.error("Unable to determine modifier assignment order:", orderError);
      redirect("/admin?error=modifier-assignment-failed");
    }

    const { error } = await supabase.from("menu_item_modifier_groups").insert({
      menu_item_id: itemId,
      modifier_group_id: groupId,
      sort_order: (lastAssignment?.sort_order ?? -1) + 1,
    });

    if (error) {
      console.error("Unable to attach modifier group:", error);
      redirect("/admin?error=modifier-assignment-failed");
    }
  }

  revalidatePath("/admin");
  revalidatePath("/menu");
  redirect("/admin?modifierSaved=1");
}

export async function detachModifierGroup(formData: FormData) {
  const supabase = await requireAuthenticatedUser();
  const itemId = String(formData.get("itemId") ?? "").trim();
  const groupId = String(formData.get("groupId") ?? "").trim();

  if (!itemId || !groupId) {
    redirect("/admin?error=invalid-modifier-assignment");
  }

  const { error } = await supabase
    .from("menu_item_modifier_groups")
    .delete()
    .eq("menu_item_id", itemId)
    .eq("modifier_group_id", groupId);

  if (error) {
    console.error("Unable to detach modifier group:", error);
    redirect("/admin?error=modifier-assignment-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/menu");
  redirect("/admin?modifierSaved=1");
}
