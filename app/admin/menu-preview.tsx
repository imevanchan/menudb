import type { toUberMenu } from "../../lib/integrations/uber/menu";

type Payload = ReturnType<typeof toUberMenu>;
const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
function time(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}${minute ? `:${String(minute).padStart(2, "0")}` : ""} ${hour < 12 ? "a.m." : "p.m."}`;
}

export function MenuPreview({ payload }: { payload: Payload }) {
  const items = new Map(payload.items.map((item) => [item.id, item]));
  const groups = new Map(payload.modifier_groups.map((group) => [group.id, group]));
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  return <div className="mt-5 space-y-6">
    {payload.menus.map((menu) => <div key={menu.id}>
      <h4 className="text-lg font-semibold">{menu.title.translations.en_us}</h4>
      {menu.subtitle.translations.en_us && <p className="mt-1 text-sm text-[#68756f]">{menu.subtitle.translations.en_us}</p>}
      <div className="mt-4 rounded-2xl bg-[#f7f5f0] p-4">
        <h5 className="text-sm font-semibold">Menu hours <span className="font-normal text-[#68756f]">· Eastern time</span></h5>
        <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">{days.map((day) => {
          const periods = menu.service_availability.find((entry) => entry.day_of_week === day)?.time_periods ?? [];
          return <div key={day} className="flex justify-between gap-3"><dt className="capitalize text-[#52615b]">{day}</dt><dd>{periods.length ? periods.map((period) => `${time(period.start_time)}–${time(period.end_time)}`).join(", ") : "Closed"}</dd></div>;
        })}</dl>
      </div>
      {menu.category_ids.map((id) => payload.categories.find((category) => category.id === id)).filter((category) => category !== undefined).map((category) => <section key={category.id} className="mt-5">
        <h5 className="font-semibold">{category.title.translations.en_us}</h5>
        {!category.entities.length ? <p className="mt-2 text-sm text-[#68756f]">No available items in this category.</p> : <ul className="mt-3 divide-y divide-black/10 rounded-2xl border border-black/10 px-4">{category.entities.map(({ id }) => {
          const item = items.get(id);
          if (!item) return null;
          return <li key={id} className="py-4">
            <div className="flex justify-between gap-4 text-sm"><span className="font-semibold">{item.title.translations.en_us}</span><span className="shrink-0 font-semibold">{money(item.price_info.price)}</span></div>
            {item.description.translations.en_us && <p className="mt-1 text-sm leading-6 text-[#68756f]">{item.description.translations.en_us}</p>}
            {item.modifier_group_ids.ids.map((groupId) => {
              const group = groups.get(groupId);
              if (!group) return null;
              const { min_permitted: min, max_permitted: max } = group.quantity_info.quantity;
              return <div key={groupId} className="mt-3 border-l-2 border-[#dce8dc] pl-3 text-sm">
                <p className="font-medium">{group.title.translations.en_us} <span className="font-normal text-[#68756f]">· {min === max ? `Choose ${min}` : min === 0 ? `Optional, up to ${max}` : `Choose ${min}–${max}`}</span></p>
                <ul className="mt-1 space-y-1 text-[#52615b]">{group.modifier_options.map((option) => { const choice = items.get(option.id); return choice ? <li key={option.id} className="flex justify-between gap-4"><span>{choice.title.translations.en_us}</span><span>{choice.price_info.price ? `+${money(choice.price_info.price)}` : "Included"}</span></li> : null; })}</ul>
              </div>;
            })}
          </li>;
        })}</ul>}
      </section>)}
    </div>)}
    {!payload.categories.some((category) => category.entities.length) && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">No available items to publish. Add an item or enable an existing one in the editor.</p>}
  </div>;
}
