import type { Metadata } from "next";
import { SiteShell } from "../components/site-shell";

export const metadata: Metadata = {
  title: "Help",
  description: "Setup and troubleshooting help for MenuDB.",
};

const topics = [
  ["Publish a saved menu", "Sign in to Admin, save your edits, and review the Uber Eats sandbox publishing panel. Confirm replacement of the test menu and choose Publish to Uber sandbox. The result and recent attempts appear in the panel."],
  ["Publishing is unavailable", "Publishing requires an approved administrator, the publishing database migration, and Uber sandbox settings on the server. Your saved menu remains editable while publishing is unavailable."],
  ["An upload result is unknown", "A timeout can happen after Uber receives an upload. Review the stored sandbox menu and the history record before retrying. MenuDB blocks overlapping or unresolved publishing attempts."],
  ["A menu update does not appear", "Confirm that the correct sandbox store and menu are selected, then review the platform response for a validation error. Some updates may take time to process."],
  ["A webhook is rejected", "Confirm that the endpoint URL is public, uses HTTPS, and that its authorization value exactly matches the value configured for that webhook."],
  ["An endpoint returns Unauthorized", "Check the corresponding environment variable in Vercel, redeploy after changing it, and make sure the request includes the expected Authorization header."],
  ["A menu request is empty", "Confirm that the requested location and menu identifiers exist in MenuDB and that the menu is marked active."],
];

export default function HelpPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-4xl px-6 py-20 sm:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a3472f]">Documentation</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">MenuDB help</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#52615b]">Setup notes and common troubleshooting steps for the MenuDB sandbox integration.</p>
        <div className="mt-14 divide-y divide-black/10 rounded-3xl border border-black/10 bg-white px-7 shadow-sm sm:px-9">
          {topics.map(([title, description]) => (
            <section className="py-8" key={title}>
              <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-3 leading-7 text-[#52615b]">{description}</p>
            </section>
          ))}
        </div>
        <p className="mt-8 text-sm leading-6 text-[#68756f]">This documentation covers the current development version and will be updated as additional integrations become available.</p>
      </main>
    </SiteShell>
  );
}
