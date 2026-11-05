import { createServerSupabaseClient } from "../../lib/supabase/server";
import { loadUberPreview } from "../../lib/integrations/uber/load-menu";
import { payloadHash } from "../../lib/integrations/uber/payload";
import { uberConfig } from "../../lib/integrations/uber/config";
import { assertSandbox } from "../../lib/integrations/uber/transport";
import { PublishForm, VerifyAttemptForm } from "./publish-form";
import { MenuPreview } from "./menu-preview";
import { publishStatus } from "../../lib/integrations/uber/publish-status";
import { menuChangeSummary } from "../../lib/integrations/uber/change-summary";

const labels: Record<string, string> = { running: "Publishing", accepted: "Accepted; verification needed", verified: "Published and verified", failed: "Failed", uncertain: "Result unknown; review needed", mismatch: "Uploaded; content differs" };
function date(value: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export async function PublishingPanel() {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: member, error: memberError } = await supabase.from("menu_publishers").select("user_id").eq("user_id", auth.user.id).maybeSingle();
  let unavailable = memberError ? "Publishing setup is required. Apply the supplied Supabase migration." : !member ? "This account does not have publishing permission." : "";
  const config = uberConfig();
  try { assertSandbox(config); } catch { unavailable ||= "Uber sandbox credentials or store settings are missing."; }
  if (process.env.UBER_SANDBOX_PUBLISH_ENABLED !== "true") unavailable ||= "Sandbox publishing is disabled. Enable it in the server environment when ready.";

  const { data: jobs, error: historyError } = member ? await supabase.from("menu_sync_jobs")
    .select("id,status,message,http_status,created_at,finished_at,payload_hash")
    .eq("store_id", config.storeId).order("created_at", { ascending: false }).limit(20) : { data: null, error: null };
  if (historyError) unavailable ||= "Sync history is unavailable. Check the publishing migration and database permissions.";
  const { data: verified, error: verifiedError } = member ? await supabase.from("menu_sync_jobs").select("finished_at,payload_hash,submitted_payload")
    .eq("store_id", config.storeId).eq("status", "verified").order("created_at", { ascending: false }).limit(1).maybeSingle() : { data: null, error: null };
  if (verifiedError) unavailable ||= "The last verified menu could not be checked. Refresh and try again.";
  const { data: active, error: activeError } = member ? await supabase.from("menu_sync_jobs").select("id,status")
    .eq("store_id", config.storeId).in("status", ["running", "accepted", "uncertain"]).limit(1) : { data: null, error: null };
  if (activeError) unavailable ||= "The current publishing state could not be checked.";
  if (active?.length) unavailable ||= "A publishing attempt is running or awaiting review. Check its history before retrying.";

  let preview: Awaited<ReturnType<typeof loadUberPreview>> | null = null;
  try { preview = await loadUberPreview(supabase); } catch { unavailable ||= "The saved menu could not be loaded."; }
  if (preview && !preview.validation.sourceChecksPassed) unavailable ||= preview.validation.errors.join(" ");
  const hash = preview ? payloadHash(preview.payload) : "";
  const current = verified?.payload_hash === hash;
  const changes = preview ? menuChangeSummary(verified?.submitted_payload, preview.payload) : [];
  const status = publishStatus({ unavailable: Boolean(unavailable), activeStatus: active?.[0]?.status, latestStatus: jobs?.[0]?.status, current });
  const colors = { green: "border-emerald-200 bg-emerald-50 text-emerald-900", amber: "border-amber-200 bg-amber-50 text-amber-950", blue: "border-sky-200 bg-sky-50 text-sky-900" };
  const itemCount = preview?.payload.categories.reduce((sum, category) => sum + category.entities.length, 0) ?? 0;

  return <section className="mt-10 rounded-3xl border border-[#1f5d49]/25 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="publishing-heading">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f5d49]">Publishing</p><h2 id="publishing-heading" className="mt-2 text-2xl font-semibold">Uber Eats sandbox</h2></div>
      <span className={`rounded-full border px-4 py-2 text-sm font-semibold ${colors[status.tone]}`}>{status.label}</span>
    </div>
    <p className="mt-3 text-sm leading-6 text-[#52615b]">{status.description}</p>
    <p className="mt-2 text-xs text-[#68756f]">Test environment · Status reflects saved changes. Unsaved edits are not included.</p>
    <p className="mt-4 font-semibold">{verified?.finished_at ? `Last verified publish: ${date(verified.finished_at)} ET` : "No verified publishes recorded yet."}</p>
    <p className="mt-1 text-sm text-[#52615b]">{current ? "The saved menu matches the last verified publish." : "The current saved menu has not been verified through this publishing panel."}</p>
    {preview && <>
      <div className="mt-5 grid grid-cols-3 gap-3">{[[itemCount, "Menu items"], [preview.payload.categories.length, "Categories"], [preview.payload.modifier_groups.length, "Modifier groups"]].map(([count, label]) => <div key={label} className="rounded-2xl bg-[#f7f5f0] p-4"><p className="text-2xl font-semibold">{count}</p><p className="mt-1 text-xs text-[#68756f]">{label}</p></div>)}</div>
      <details className="mt-5 rounded-2xl border border-black/10 p-5"><summary className="cursor-pointer text-sm font-semibold">Review saved menu and hours</summary><MenuPreview payload={preview.payload} /></details>
      <details className="mt-4 rounded-2xl border border-black/10 p-5"><summary className="cursor-pointer text-sm font-semibold">Changes since last verified publish ({changes.length})</summary>
        {verifiedError ? <p className="mt-3 text-sm">The previous menu could not be loaded.</p> : changes.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#52615b]">{changes.map((change, index) => <li key={index}>{change}</li>)}</ul> : <p className="mt-3 text-sm text-[#52615b]">No saved menu changes.</p>}
      </details>
      {preview.validation.warnings.map((warning) => <p key={warning} className="mt-3 text-sm text-amber-900">{warning}</p>)}
    </>}
    {unavailable && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">{unavailable}</p>}
    <PublishForm hash={hash} disabled={Boolean(unavailable) || !preview} current={current && status.label === "Up to date"} />
    {Boolean(active?.length) && <VerifyAttemptForm />}
    <details className="mt-8 border-t border-black/10 pt-6"><summary className="cursor-pointer text-sm font-semibold">Publishing history <span className="ml-2 font-normal text-[#68756f]">{jobs?.length ?? 0} recent attempts</span></summary>
      {!jobs?.length ? <p className="mt-3 text-sm text-[#52615b]">Publishing attempts will appear here after setup. Earlier terminal uploads are not imported.</p> : <ol className="mt-4 divide-y divide-black/10">{jobs.map((job) => <li key={job.id} className="py-4 text-sm"><div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{labels[job.status] ?? job.status}</span><time dateTime={job.created_at} className="text-[#52615b]">{date(job.created_at)} ET</time></div><p className="mt-1 leading-6 text-[#52615b]">{job.message}{job.http_status ? ` HTTP ${job.http_status}.` : ""}</p></li>)}</ol>}
    </details>
  </section>;
}
