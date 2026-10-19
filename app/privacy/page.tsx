import type { Metadata } from "next";
import { SiteShell } from "../components/site-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for the MenuDB menu integration.",
};

const sections = [
  ["Information we process", "MenuDB may process restaurant and store identifiers, menu content, prices, modifiers, availability, integration settings, and technical records such as webhook events and error logs. MenuDB is not designed to collect customer payment-card information."],
  ["How we use information", "We use this information to connect the restaurant's delivery-platform accounts, synchronize menu changes, monitor whether updates succeed, troubleshoot errors, secure the integration, and improve the application."],
  ["How information is shared", "Information is shared with connected delivery platforms when needed to perform menu-management operations. It may also be processed by hosting and infrastructure providers that help operate MenuDB. We do not sell personal information."],
  ["Retention and security", "We retain information only for as long as it is reasonably needed to operate and troubleshoot the integration. We use reasonable technical and organizational safeguards, but no internet-based system can be guaranteed to be completely secure."],
  ["Your choices", "The restaurant may disconnect a delivery-platform integration or request correction or deletion of information under its control, subject to legal and operational retention requirements."],
  ["Changes to this policy", "We may update this policy as MenuDB develops. Any revised version will be posted on this page with a new effective date."],
];

export default function PrivacyPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a3472f]">Legal</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-[#68756f]">Effective October 17, 2026</p>
        <div className="mt-10 rounded-2xl border border-black/10 bg-white p-6 text-[#52615b] shadow-sm">
          <p className="leading-7">MenuDB is an internal, direct-to-brand menu-management application operated by 1333 Desiree Wok LLC. This policy explains how information is handled when MenuDB connects with delivery platforms.</p>
        </div>
        <div className="mt-12 space-y-10">
          {sections.map(([title, body]) => (
            <section key={title}>
              <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-3 leading-7 text-[#52615b]">{body}</p>
            </section>
          ))}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">Contact</h2>
            <p className="mt-3 leading-7 text-[#52615b]">Questions about this policy can be directed to 1333 Desiree Wok LLC through the restaurant&apos;s established business contact channel.</p>
          </section>
        </div>
      </main>
    </SiteShell>
  );
}
