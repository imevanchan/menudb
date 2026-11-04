import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SiteShell } from "../components/site-shell";
import { createServerSupabaseClient } from "../../lib/supabase/server";
import { logout } from "../login/actions";
import {
  createCategory,
  createMenuItem,
  updateCategory,
  updateMenuItem,
} from "./actions";
import { ModifierEditor } from "./modifier-editor";
import { PublishingPanel } from "./publishing-panel";

export const metadata: Metadata = {
  title: "Menu administration",
  description: "Private MenuDB administration dashboard.",
};

// Authentication depends on request cookies and token-expiration time.
export const instant = false;
export const maxDuration = 60;

async function AdminContent({
  saved,
  created,
  categorySaved,
  categoryCreated,
  modifierSaved,
  errorMessage,
}: {
  saved: boolean;
  created: boolean;
  categorySaved: boolean;
  categoryCreated: boolean;
  modifierSaved: boolean;
  errorMessage: string | null;
}) {
  await connection();

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const email = String(data.claims.email ?? "Administrator");
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, menu_id, name, description, sort_order, active")
    .order("sort_order");
  const { data: items, error } = await supabase
    .from("menu_items")
    .select("id, category_id, name, description, price_cents, active, sort_order")
    .order("sort_order");
  const { data: modifierGroups, error: modifierGroupsError } = await supabase
    .from("modifier_groups")
    .select(`
      id,
      name,
      minimum_selections,
      maximum_selections,
      active,
      modifier_options(
        id,
        modifier_group_id,
        name,
        price_cents,
        active,
        sort_order
      )
    `)
    .order("name");
  const { data: modifierAssignments, error: modifierAssignmentsError } = await supabase
    .from("menu_item_modifier_groups")
    .select("menu_item_id, modifier_group_id, sort_order")
    .order("sort_order");

  return (
    <>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a3472f]">Authenticated</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Menu administration</h1>
            <p className="mt-4 text-[#52615b]">Signed in as {email}</p>
          </div>
          <form action={logout}>
            <button className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm font-semibold hover:border-black/30" type="submit">Sign out</button>
          </form>
        </div>
        <PublishingPanel />
        <section className="mt-12">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a3472f]">Master menu</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">Edit menu items</h2>
              <p className="mt-2 text-[#52615b]">Changes saved here are written directly to Supabase.</p>
            </div>
          </div>

          {saved && (
            <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-900">
              Menu item saved successfully.
            </p>
          )}

          {created && (
            <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-900">
              New menu item created successfully.
            </p>
          )}

          {categorySaved && (
            <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-900">
              Category saved successfully.
            </p>
          )}

          {categoryCreated && (
            <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-900">
              New category created successfully.
            </p>
          )}

          {modifierSaved && (
            <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-900">
              Modifier changes saved successfully.
            </p>
          )}

          {errorMessage && (
            <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-900">
              {errorMessage}
            </p>
          )}

          {categoriesError || error || modifierGroupsError || modifierAssignmentsError ? (
            <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
              The menu editor could not be loaded: {categoriesError?.message ?? error?.message ?? modifierGroupsError?.message ?? modifierAssignmentsError?.message}
            </p>
          ) : (
            <div className="mt-6 space-y-8">
              <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#a3472f]">Categories</p>
                  <h3 className="mt-2 text-xl font-semibold">Organize the master menu</h3>
                  <p className="mt-2 text-sm leading-6 text-[#52615b]">Disabled categories stay here for editing but are hidden from the public menu.</p>
                </div>

                <div className="mt-6 space-y-5">
                  {(categories ?? []).map((category) => (
                    <form action={updateCategory} className="rounded-2xl border border-black/10 bg-[#faf9f6] p-5" key={category.id}>
                      <input name="categoryId" type="hidden" value={category.id} />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm font-semibold text-[#27332e]">
                          Category name
                          <input className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#a3472f] focus:ring-2 focus:ring-[#a3472f]/15" defaultValue={category.name} name="name" required />
                        </label>
                        <label className="text-sm font-semibold text-[#27332e]">
                          Description
                          <input className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#a3472f] focus:ring-2 focus:ring-[#a3472f]/15" defaultValue={category.description ?? ""} name="description" />
                        </label>
                      </div>
                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <label className="flex items-center gap-3 text-sm font-semibold text-[#27332e]">
                          <input className="h-4 w-4 accent-[#a3472f]" defaultChecked={category.active} name="active" type="checkbox" />
                          Show category on the menu
                        </label>
                        <button className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm font-semibold hover:border-black/30" type="submit">Save category</button>
                      </div>
                    </form>
                  ))}
                </div>

                {categories?.[0]?.menu_id && (
                  <form action={createCategory} className="mt-6 rounded-2xl border border-dashed border-[#a3472f]/40 bg-[#fffaf7] p-5">
                    <input name="menuId" type="hidden" value={categories[0].menu_id} />
                    <p className="font-semibold">Add a category</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-semibold text-[#27332e]">
                        Category name
                        <input className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#a3472f] focus:ring-2 focus:ring-[#a3472f]/15" name="name" required />
                      </label>
                      <label className="text-sm font-semibold text-[#27332e]">
                        Description
                        <input className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#a3472f] focus:ring-2 focus:ring-[#a3472f]/15" name="description" />
                      </label>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button className="rounded-full bg-[#27332e] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black" type="submit">Add category</button>
                    </div>
                  </form>
                )}
              </section>

              <form action={createMenuItem} className="rounded-3xl border border-[#a3472f]/25 bg-[#fffaf7] p-6 shadow-sm sm:p-8">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#a3472f]">New item</p>
                  <h3 className="mt-2 text-xl font-semibold">Add an item to the master menu</h3>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-[#27332e]">
                    Item name
                    <input className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#a3472f] focus:ring-2 focus:ring-[#a3472f]/15" name="name" required />
                  </label>
                  <label className="text-sm font-semibold text-[#27332e]">
                    Category
                    <select className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#a3472f] focus:ring-2 focus:ring-[#a3472f]/15" name="categoryId" required>
                      {(categories ?? []).filter((category) => category.active).map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-[#27332e]">
                    Price
                    <div className="relative mt-2">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-normal text-[#68756f]">$</span>
                      <input className="w-full rounded-xl border border-black/15 bg-white py-3 pl-8 pr-4 font-normal outline-none focus:border-[#a3472f] focus:ring-2 focus:ring-[#a3472f]/15" min="0" name="price" required step="0.01" type="number" />
                    </div>
                  </label>
                </div>

                <label className="mt-5 block text-sm font-semibold text-[#27332e]">
                  Description
                  <textarea className="mt-2 min-h-24 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#a3472f] focus:ring-2 focus:ring-[#a3472f]/15" name="description" />
                </label>

                <div className="mt-5 flex justify-end">
                  <button className="rounded-full bg-[#a3472f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#873923]" type="submit">Add item</button>
                </div>
              </form>

              {(items ?? []).map((item) => (
                <form action={updateMenuItem} className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8" key={item.id}>
                  <input name="itemId" type="hidden" value={item.id} />

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-[#27332e]">
                      Item name
                      <input
                        className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#a3472f] focus:ring-2 focus:ring-[#a3472f]/15"
                        defaultValue={item.name}
                        name="name"
                        required
                      />
                    </label>

                    <label className="text-sm font-semibold text-[#27332e]">
                      Category
                      <select className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#a3472f] focus:ring-2 focus:ring-[#a3472f]/15" defaultValue={item.category_id} name="categoryId" required>
                        {(categories ?? []).filter((category) => category.active || category.id === item.category_id).map((category) => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </label>

                    <label className="text-sm font-semibold text-[#27332e]">
                      Price
                      <div className="relative mt-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-normal text-[#68756f]">$</span>
                        <input
                          className="w-full rounded-xl border border-black/15 bg-white py-3 pl-8 pr-4 font-normal outline-none focus:border-[#a3472f] focus:ring-2 focus:ring-[#a3472f]/15"
                          defaultValue={(item.price_cents / 100).toFixed(2)}
                          min="0"
                          name="price"
                          required
                          step="0.01"
                          type="number"
                        />
                      </div>
                    </label>
                  </div>

                  <label className="mt-5 block text-sm font-semibold text-[#27332e]">
                    Description
                    <textarea
                      className="mt-2 min-h-28 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#a3472f] focus:ring-2 focus:ring-[#a3472f]/15"
                      defaultValue={item.description ?? ""}
                      name="description"
                    />
                  </label>

                  <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex items-center gap-3 text-sm font-semibold text-[#27332e]">
                      <input className="h-4 w-4 accent-[#a3472f]" defaultChecked={item.active} name="active" type="checkbox" />
                      Available to customers
                    </label>
                    <button className="rounded-full bg-[#a3472f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#873923]" type="submit">
                      Save item
                    </button>
                  </div>
                </form>
              ))}

              <ModifierEditor
                assignments={modifierAssignments ?? []}
                groups={modifierGroups ?? []}
                items={(items ?? []).map((item) => ({ id: item.id, name: item.name, active: item.active }))}
              />
            </div>
          )}
        </section>
    </>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    created?: string;
    categorySaved?: string;
    categoryCreated?: string;
    modifierSaved?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const errorMessage =
    params.error === "invalid-item"
      ? "Enter a valid item name and price."
      : params.error === "invalid-category"
        ? "Enter a category name before saving."
        : params.error === "invalid-new-category"
          ? "Enter a name for the new category."
          : params.error === "category-save-failed"
            ? "The category could not be saved. Check the Supabase category update policy and try again."
            : params.error === "category-create-failed"
              ? "The category could not be created. Check the Supabase category insert policy and try again."
              : params.error === "invalid-modifier-group"
                ? "Enter a modifier-group name and valid minimum and maximum selections."
                : params.error === "modifier-group-save-failed"
                  ? "The modifier group could not be saved. Check its Supabase update policy."
                  : params.error === "invalid-modifier-option"
                    ? "Enter an option name and a valid added price."
                    : params.error === "modifier-option-create-failed"
                      ? "The modifier option could not be created. Check its Supabase insert policy."
                      : params.error === "modifier-option-save-failed"
                        ? "The modifier option could not be saved. Check its Supabase update policy."
                        : params.error === "invalid-modifier-assignment"
                          ? "Choose both a menu item and modifier group."
                          : params.error === "modifier-assignment-failed"
                            ? "The modifier assignment could not be changed. Check the junction-table policies."
      : params.error === "invalid-new-item"
        ? "Choose a category and enter a valid item name and price."
        : params.error === "create-failed"
          ? "The new item could not be created. Check the Supabase insert policy and try again."
      : params.error === "save-failed"
        ? "The item could not be saved. Check the Supabase update policy and try again."
        : null;

  return (
    <SiteShell>
      <main className="mx-auto min-h-[70vh] max-w-5xl px-6 py-20 sm:py-24">
        <Suspense fallback={<p className="text-[#68756f]">Loading administration…</p>}>
          <AdminContent
            saved={params.saved === "1"}
            created={params.created === "1"}
            categorySaved={params.categorySaved === "1"}
            categoryCreated={params.categoryCreated === "1"}
            modifierSaved={params.modifierSaved === "1"}
            errorMessage={errorMessage}
          />
        </Suspense>
      </main>
    </SiteShell>
  );
}
