import {
  attachModifierGroup,
  createModifierGroup,
  createModifierOption,
  detachModifierGroup,
  updateModifierGroup,
  updateModifierOption,
} from "./actions";
import { SubmitButton } from "./submit-button";

type MenuItem = { id: string; name: string; active: boolean };
type ModifierOption = {
  id: string;
  modifier_group_id: string;
  name: string;
  price_cents: number;
  active: boolean;
  sort_order: number;
};
type ModifierGroup = {
  id: string;
  name: string;
  minimum_selections: number;
  maximum_selections: number;
  active: boolean;
  modifier_options: ModifierOption[] | null;
};
type Assignment = {
  menu_item_id: string;
  modifier_group_id: string;
  sort_order: number;
};

export function ModifierEditor({
  items,
  groups,
  assignments,
}: {
  items: MenuItem[];
  groups: ModifierGroup[];
  assignments: Assignment[];
}) {
  const itemNames = new Map(items.map((item) => [item.id, item.name]));
  const groupNames = new Map(groups.map((group) => [group.id, group.name]));

  return (
    <details className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
      <summary className="cursor-pointer font-semibold">Manage modifiers <span className="ml-2 text-sm font-normal text-[#68756f]">{groups.length} {groups.length === 1 ? "group" : "groups"} · {assignments.length} {assignments.length === 1 ? "item assignment" : "item assignments"}</span></summary>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#a3472f]">Modifiers</p>
        <h3 className="mt-2 text-xl font-semibold">Configure customer choices</h3>
        <p className="mt-2 text-sm leading-6 text-[#52615b]">
          Create reusable groups, add their options, and attach them to menu items.
        </p>
      </div>

      <form action={createModifierGroup} className="mt-6 rounded-2xl border border-dashed border-[#a3472f]/40 bg-[#fffaf7] p-5">
        <p className="font-semibold">Add a modifier group</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-semibold text-[#27332e] sm:col-span-1">
            Group name
            <input className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" name="name" placeholder="Choose a side" required />
          </label>
          <label className="text-sm font-semibold text-[#27332e]">
            Minimum choices
            <input className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" defaultValue="0" min="0" name="minimumSelections" required type="number" />
          </label>
          <label className="text-sm font-semibold text-[#27332e]">
            Maximum choices
            <input className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" defaultValue="1" min="1" name="maximumSelections" required type="number" />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <SubmitButton pendingLabel="Adding…" className="rounded-full bg-[#27332e] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black">Add group</SubmitButton>
        </div>
      </form>

      <div className="mt-6 space-y-6">
        {!groups.length && <p className="rounded-xl bg-[#f7f5f0] p-4 text-sm text-[#52615b]">No modifier groups yet. Add a group such as Choose a side, then add options and attach it to an item.</p>}
        {groups.map((group) => {
          const options = [...(group.modifier_options ?? [])].sort(
            (a, b) => a.sort_order - b.sort_order,
          );

          return (
            <details className="rounded-2xl border border-black/10 bg-[#faf9f6] p-5" key={group.id}>
              <summary className="mb-4 cursor-pointer font-semibold">{group.name} <span className="ml-2 text-sm font-normal text-[#68756f]">{options.length} options{!group.active ? " · Hidden" : ""}</span></summary>
              <form action={updateModifierGroup}>
                <input name="groupId" type="hidden" value={group.id} />
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="text-sm font-semibold text-[#27332e]">
                    Group name
                    <input className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" defaultValue={group.name} name="name" required />
                  </label>
                  <label className="text-sm font-semibold text-[#27332e]">
                    Minimum choices
                    <input className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" defaultValue={group.minimum_selections} min="0" name="minimumSelections" required type="number" />
                  </label>
                  <label className="text-sm font-semibold text-[#27332e]">
                    Maximum choices
                    <input className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" defaultValue={group.maximum_selections} min="1" name="maximumSelections" required type="number" />
                  </label>
                </div>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-3 text-sm font-semibold text-[#27332e]">
                    <input className="h-4 w-4 accent-[#a3472f]" defaultChecked={group.active} name="active" type="checkbox" />
                    Group is available
                  </label>
                  <SubmitButton className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm font-semibold hover:border-black/30">Save group</SubmitButton>
                </div>
              </form>

              <div className="mt-5 border-t border-black/10 pt-5">
                <p className="text-sm font-semibold">Options</p>
                <div className="mt-3 space-y-3">
                  {!options.length && <p className="text-sm text-[#68756f]">Add an option below. Required groups need enough available options to satisfy their minimum choices.</p>}
                  {options.map((option) => (
                    <form action={updateModifierOption} className="grid gap-3 rounded-xl border border-black/10 bg-white p-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end" key={option.id}>
                      <input name="optionId" type="hidden" value={option.id} />
                      <label className="text-xs font-semibold text-[#52615b]">
                        Option name
                        <input className="mt-1.5 w-full rounded-lg border border-black/15 px-3 py-2 text-sm font-normal text-[#27332e]" defaultValue={option.name} name="name" required />
                      </label>
                      <label className="text-xs font-semibold text-[#52615b]">
                        Added price
                        <input className="mt-1.5 w-full rounded-lg border border-black/15 px-3 py-2 text-sm font-normal text-[#27332e]" defaultValue={(option.price_cents / 100).toFixed(2)} min="0" name="price" required step="0.01" type="number" />
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-xs font-semibold">
                          <input defaultChecked={option.active} name="active" type="checkbox" /> Active
                        </label>
                        <SubmitButton className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold">Save</SubmitButton>
                      </div>
                    </form>
                  ))}
                </div>

                <form action={createModifierOption} className="mt-3 grid gap-3 rounded-xl border border-dashed border-black/20 p-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
                  <input name="groupId" type="hidden" value={group.id} />
                  <label className="text-xs font-semibold text-[#52615b]">
                    New option
                    <input className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-normal text-[#27332e]" name="name" placeholder="White rice" required />
                  </label>
                  <label className="text-xs font-semibold text-[#52615b]">
                    Added price
                    <input className="mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-normal text-[#27332e]" defaultValue="0.00" min="0" name="price" required step="0.01" type="number" />
                  </label>
                  <SubmitButton pendingLabel="Adding…" className="rounded-full bg-[#a3472f] px-4 py-2 text-xs font-semibold text-white">Add option</SubmitButton>
                </form>
              </div>
            </details>
          );
        })}
      </div>

      <div className="mt-8 border-t border-black/10 pt-6">
        <h4 className="font-semibold">Item assignments</h4>
        <form action={attachModifierGroup} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-sm font-semibold text-[#27332e]">
            Menu item
            <select className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" name="itemId" required>
              {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-[#27332e]">
            Modifier group
            <select className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 font-normal" name="groupId" required>
              {groups.filter((group) => group.active).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
          </label>
          <SubmitButton pendingLabel="Attaching…" disabled={!items.length || !groups.some((group) => group.active)} className="rounded-full bg-[#27332e] px-5 py-3 text-sm font-semibold text-white">Attach group</SubmitButton>
        </form>

        <div className="mt-4 space-y-2">
          {!assignments.length && <p className="text-sm text-[#68756f]">No item assignments yet. Select an item and an available modifier group above.</p>}
          {(!items.length || !groups.some((group) => group.active)) && <p className="text-sm text-amber-900">You need a menu item and an available modifier group before attaching choices.</p>}
          {[...assignments].sort((a, b) => a.sort_order - b.sort_order).map((assignment) => (
            <form action={detachModifierGroup} className="flex items-center justify-between gap-4 rounded-xl border border-black/10 px-4 py-3 text-sm" key={`${assignment.menu_item_id}-${assignment.modifier_group_id}`}>
              <input name="itemId" type="hidden" value={assignment.menu_item_id} />
              <input name="groupId" type="hidden" value={assignment.modifier_group_id} />
              <span><strong>{itemNames.get(assignment.menu_item_id) ?? "Unknown item"}</strong> — {groupNames.get(assignment.modifier_group_id) ?? "Unknown group"}</span>
              <SubmitButton pendingLabel="Detaching…" className="text-xs font-semibold text-[#a3472f] hover:underline">Detach</SubmitButton>
            </form>
          ))}
        </div>
      </div>
    </details>
  );
}
