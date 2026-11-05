import { updateMenuItem } from "./actions";
import { EditorForm } from "./editor-form";
import { SubmitButton } from "./submit-button";

type Category = { id: string; name: string; active: boolean };
type Item = { id: string; category_id: string; name: string; description: string; price_cents: number; active: boolean };
const field = "mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal outline-none focus:border-[#a3472f] focus:ring-2 focus:ring-[#a3472f]/15";

export function ItemsEditor({ categories, items }: { categories: Category[]; items: Item[] }) {
  const groups = categories.map((category) => ({ ...category, items: items.filter((item) => item.category_id === category.id) }));
  const unassigned = items.filter((item) => !categories.some((category) => category.id === item.category_id));
  if (unassigned.length) groups.push({ id: "unassigned", name: "Uncategorized", active: false, items: unassigned });

  return <section id="menu-items" className="scroll-mt-6 space-y-4" aria-labelledby="items-heading">
    <div className="flex flex-wrap items-end justify-between gap-2">
      <h3 id="items-heading" className="text-xl font-semibold">Items by category</h3>
      <p className="text-sm text-[#68756f]">{items.length} {items.length === 1 ? "item" : "items"} · Open an item to edit</p>
    </div>
    {!groups.length && <p className="rounded-2xl border border-dashed border-black/20 p-6 text-sm text-[#52615b]">Create a category first, then add your first menu item.</p>}
    {groups.map((category) => <details key={category.id} open className="rounded-3xl border border-black/10 bg-white shadow-sm">
      <summary className="cursor-pointer rounded-3xl px-6 py-5 font-semibold focus-visible:outline-2 focus-visible:outline-[#1f5d49]">
        {category.name}<span className="ml-3 text-sm font-normal text-[#68756f]">{category.items.length} {category.items.length === 1 ? "item" : "items"}{!category.active ? " · Category hidden" : ""}</span>
      </summary>
      <div className="space-y-3 border-t border-black/10 p-4 sm:p-6">
        {!category.items.length && <p className="p-2 text-sm text-[#68756f]">No items yet. Choose this category when adding an item above.</p>}
        {category.items.map((item) => <details key={item.id} className="rounded-2xl border border-black/10 bg-[#faf9f6]">
          <summary className="cursor-pointer rounded-2xl px-5 py-4 focus-visible:outline-2 focus-visible:outline-[#1f5d49]">
            <span className="ml-1 font-semibold">{item.name}</span>
            <span className="ml-3 text-sm text-[#52615b]">${(item.price_cents / 100).toFixed(2)}</span>
            <span className={`ml-3 inline-block rounded-full px-2 py-0.5 text-xs ${item.active && category.active ? "bg-emerald-50 text-emerald-800" : "bg-stone-200 text-stone-700"}`}>{!category.active ? "Category hidden" : item.active ? "Available" : "Unavailable"}</span>
          </summary>
          <EditorForm key={JSON.stringify(item)} action={updateMenuItem} label={`Edit ${item.name}`} className="border-t border-black/10 p-5">
            <input name="itemId" type="hidden" value={item.id} />
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold">Item name<input className={field} defaultValue={item.name} name="name" required /></label>
              <label className="text-sm font-semibold">Category<div className="relative"><select className={`${field} appearance-none pr-10`} defaultValue={item.category_id} name="categoryId" required>{categories.filter((entry) => entry.active || entry.id === item.category_id).map((entry) => <option key={entry.id} value={entry.id}>{entry.name}{!entry.active ? " (hidden)" : ""}</option>)}</select><span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-[#68756f]">⌄</span></div></label>
              <label className="text-sm font-semibold">Price ($)<input className={field} defaultValue={(item.price_cents / 100).toFixed(2)} min="0" name="price" required step="0.01" type="number" /></label>
            </div>
            <label className="block text-sm font-semibold">Description<textarea className={`${field} min-h-24`} defaultValue={item.description ?? ""} name="description" /></label>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="flex items-center gap-3 text-sm font-semibold"><input className="h-4 w-4 accent-[#a3472f]" defaultChecked={item.active} name="active" type="checkbox" />Available to customers</label>
              <SubmitButton className="rounded-full bg-[#a3472f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#873923]">Save item</SubmitButton>
            </div>
          </EditorForm>
        </details>)}
      </div>
    </details>)}
  </section>;
}
