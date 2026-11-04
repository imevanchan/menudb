import { createServerSupabaseClient } from "../../lib/supabase/server";
import { loadUberPreview } from "../../lib/integrations/uber/load-menu";
import { payloadHash } from "../../lib/integrations/uber/payload";
import { uberConfig } from "../../lib/integrations/uber/config";
import { assertSandbox } from "../../lib/integrations/uber/transport";
import { PublishForm, VerifyAttemptForm } from "./publish-form";

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
  const { data: verified } = member ? await supabase.from("menu_sync_jobs").select("finished_at,payload_hash")
    .eq("store_id", config.storeId).eq("status", "verified").order("created_at", { ascending: false }).limit(1).maybeSingle() : { data: null };
  const { data: active, error: activeError } = member ? await supabase.from("menu_sync_jobs").select("id")
    .eq("store_id", config.storeId).in("status", ["running", "accepted", "uncertain"]).limit(1) : { data: null, error: null };
  if (activeError) unavailable ||= "The current publishing state could not be checked.";
  if (active?.length) unavailable ||= "A publishing attempt is running or awaiting review. Check its history before retrying.";

  let preview: Awaited<ReturnType<typeof loadUberPreview>> | null = null;
  try { preview = await loadUberPreview(supabase); } catch { unavailable ||= "The saved menu could not be loaded."; }
  if (preview && !preview.validation.sourceChecksPassed) unavailable ||= preview.validation.errors.join(" ");
  const hash = preview ? payloadHash(preview.payload) : "";
  const current = verified?.payload_hash === hash;

  return <section className="mt-10 rounded-3xl border border-[#1f5d49]/25 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="publishing-heading">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f5d49]">Publishing</p><h2 id="publishing-heading" className="mt-2 text-2xl font-semibold">Uber Eats sandbox</h2></div>
      <span className="rounded-full bg-[#dce8dc] px-3 py-1 text-xs font-semibold text-[#315444]">Test environment</span>
    </div>
    <p className="mt-3 text-sm leading-6 text-[#52615b]">Save your edits, review the menu below, then publish. Each attempt preserves the previous sandbox menu and checks the result with Uber.</p>
    <p className="mt-4 font-semibold">{verified?.finished_at ? `Last verified publish: ${date(verified.finished_at)} ET` : "No verified publishes recorded yet."}</p>
    <p className="mt-1 text-sm text-[#52615b]">{current ? "The saved menu matches the last verified publish." : "The current saved menu has not been verified through this publishing panel."}</p>
    {preview && <>
      <div className="mt-5 flex flex-wrap gap-3 text-sm text-[#52615b]"><span>{preview.payload.menus.length} menu</span><span>· {preview.payload.categories.length} categories</span><span>· {preview.payload.items.length} items including options</span><span>· {preview.payload.modifier_groups.length} modifier groups</span></div>
      <details className="mt-5 rounded-xl border border-black/10 p-4"><summary className="cursor-pointer text-sm font-semibold">Review saved menu and hours</summary><pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs leading-5">{JSON.stringify(preview.payload, null, 2)}</pre></details>
      {preview.validation.warnings.map((warning) => <p key={warning} className="mt-3 text-sm text-amber-900">{warning}</p>)}
    </>}
    {unavailable && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">{unavailable}</p>}
    <PublishForm hash={hash} disabled={Boolean(unavailable) || !preview} />
    {Boolean(active?.length) && <VerifyAttemptForm />}
    <div className="mt-8 border-t border-black/10 pt-6"><h3 className="text-lg font-semibold">Recent publishing attempts</h3>
      {!jobs?.length ? <p className="mt-3 text-sm text-[#52615b]">Publishing attempts will appear here after setup. Earlier terminal uploads are not imported.</p> : <ol className="mt-4 divide-y divide-black/10">{jobs.map((job) => <li key={job.id} className="py-4 text-sm"><div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{labels[job.status] ?? job.status}</span><time dateTime={job.created_at} className="text-[#52615b]">{date(job.created_at)} ET</time></div><p className="mt-1 leading-6 text-[#52615b]">{job.message}{job.http_status ? ` HTTP ${job.http_status}.` : ""}</p></li>)}</ol>}
    </div>
  </section>;
}
