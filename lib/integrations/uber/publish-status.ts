export function publishStatus({ unavailable, activeStatus, latestStatus, current }: {
  unavailable: boolean; activeStatus?: string; latestStatus?: string; current: boolean;
}) {
  if (activeStatus === "running") return { label: "Publishing", tone: "blue", description: "An upload is in progress. Refresh shortly to see its result." } as const;
  if (unavailable || activeStatus || ["failed", "mismatch", "accepted", "uncertain"].includes(latestStatus ?? "")) return { label: "Needs attention", tone: "amber", description: "Review the publishing details below before continuing." } as const;
  if (current) return { label: "Up to date", tone: "green", description: "The saved menu matches the last verified Uber sandbox publish." } as const;
  return { label: "Unpublished changes", tone: "amber", description: "Review and publish your saved menu to update the Uber sandbox." } as const;
}
