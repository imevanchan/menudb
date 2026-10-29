"use client";

import { useMemo, useState } from "react";

type Option = {
  id: string;
  name: string;
  price_cents: number;
};

type Group = {
  id: string;
  name: string;
  minimum_selections: number;
  maximum_selections: number;
  options: Option[];
};

export function ModifierSelector({
  basePriceCents,
  groups,
}: {
  basePriceCents: number;
  groups: Group[];
}) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);

  const totalCents = useMemo(() => {
    const optionPrices = new Map(
      groups.flatMap((group) => group.options.map((option) => [option.id, option.price_cents] as const)),
    );
    return Object.values(selected)
      .flat()
      .reduce((total, optionId) => total + (optionPrices.get(optionId) ?? 0), basePriceCents);
  }, [basePriceCents, groups, selected]);

  const requirementsMet = groups.every((group) => {
    const count = selected[group.id]?.length ?? 0;
    return count >= group.minimum_selections && count <= group.maximum_selections;
  });

  function toggleOption(group: Group, optionId: string) {
    setSubmitted(false);
    setSelected((current) => {
      const groupSelections = current[group.id] ?? [];
      const alreadySelected = groupSelections.includes(optionId);

      if (alreadySelected) {
        return { ...current, [group.id]: groupSelections.filter((id) => id !== optionId) };
      }

      if (group.maximum_selections === 1) {
        return { ...current, [group.id]: [optionId] };
      }

      if (groupSelections.length >= group.maximum_selections) {
        return current;
      }

      return { ...current, [group.id]: [...groupSelections, optionId] };
    });
  }

  return (
    <div className="mt-10 space-y-6">
      {groups.map((group) => {
        const chosenCount = selected[group.id]?.length ?? 0;
        const instruction = group.minimum_selections > 0
          ? `Choose ${group.minimum_selections}${group.maximum_selections !== group.minimum_selections ? `–${group.maximum_selections}` : ""}`
          : `Optional · choose up to ${group.maximum_selections}`;

        return (
          <fieldset className="rounded-2xl border border-black/10 bg-white p-6" key={group.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <legend className="text-lg font-semibold">{group.name}</legend>
              <span className="text-xs font-semibold text-[#68756f]">{instruction}</span>
            </div>
            <div className="mt-4 divide-y divide-black/10">
              {group.options.map((option) => {
                const isSelected = selected[group.id]?.includes(option.id) ?? false;
                return (
                  <label className="flex cursor-pointer items-center justify-between gap-4 py-4" key={option.id}>
                    <span className="flex items-center gap-3">
                      <input
                        checked={isSelected}
                        name={group.id}
                        onChange={() => toggleOption(group, option.id)}
                        type={group.maximum_selections === 1 ? "radio" : "checkbox"}
                      />
                      <span>{option.name}</span>
                    </span>
                    <span className="text-sm font-medium text-[#52615b]">
                      {option.price_cents > 0 ? `+$${(option.price_cents / 100).toFixed(2)}` : "Included"}
                    </span>
                  </label>
                );
              })}
            </div>
            {chosenCount < group.minimum_selections && (
              <p className="mt-3 text-xs font-medium text-[#a3472f]">Select at least {group.minimum_selections} option{group.minimum_selections === 1 ? "" : "s"}.</p>
            )}
          </fieldset>
        );
      })}

      <button
        className="w-full rounded-full bg-[#a3472f] px-6 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
        disabled={!requirementsMet}
        onClick={() => setSubmitted(true)}
        type="button"
      >
        Add to order · ${(totalCents / 100).toFixed(2)}
      </button>

      {submitted && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center text-sm font-medium text-emerald-900">
          Item customization is valid. A persistent cart will be added in the next stage.
        </p>
      )}
    </div>
  );
}
