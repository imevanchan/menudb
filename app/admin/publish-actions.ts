"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "../../lib/supabase/server";
import { loadUberPreview } from "../../lib/integrations/uber/load-menu";
import { payloadHash } from "../../lib/integrations/uber/payload";
import { menusMatch } from "../../lib/integrations/uber/payload";
import { uberConfig } from "../../lib/integrations/uber/config";
import { assertSandbox, uberSandbox } from "../../lib/integrations/uber/transport";
import { runSandboxPublish } from "../../lib/integrations/uber/publish";

export type PublishState = { ok: boolean; message: string };

export async function publishUberMenu(_previous: PublishState, form: FormData): Promise<PublishState> {
  const supabase = await createServerSupabaseClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return { ok: false, message: "Sign in before publishing." };
  const { data: publisher, error: membershipError } = await supabase.from("menu_publishers").select("user_id").eq("user_id", auth.user.id).maybeSingle();
  if (membershipError || !publisher) return { ok: false, message: "Publishing access is not configured for this account. Apply the publishing migration and approve this administrator." };
  if (form.get("confirmed") !== "on") return { ok: false, message: "Confirm replacement of the sandbox menu before publishing." };

  try {
    const config = uberConfig();
    assertSandbox(config);
    if (process.env.UBER_SANDBOX_PUBLISH_ENABLED !== "true") return { ok: false, message: "Sandbox publishing is disabled in this environment." };
    const preview = await loadUberPreview(supabase);
    const hash = payloadHash(preview.payload);
    if (!preview.validation.sourceChecksPassed) return { ok: false, message: preview.validation.errors.join(" ") };
    if (form.get("payloadHash") !== hash) return { ok: false, message: "The menu changed since this page loaded. Refresh and review it before publishing." };

    const { data: latest, error: latestError } = await supabase.from("menu_sync_jobs").select("status,payload_hash").eq("store_id", config.storeId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (latestError) return { ok: false, message: "Sync history is unavailable. No upload was attempted." };
    if (latest?.status === "verified" && latest.payload_hash === hash) return { ok: true, message: "This menu version was already published and verified. No additional upload was needed." };

    const { data: job, error: startError } = await supabase.from("menu_sync_jobs").insert({
      user_id: auth.user.id, store_id: config.storeId, payload_hash: hash, submitted_payload: preview.payload,
    }).select("id").single();
    if (startError || !job) return { ok: false, message: startError?.code === "23505" ? "Another upload is running or awaiting verification. Review sync history before retrying." : "Could not record the publishing attempt. No upload was attempted." };

    const outcome = await runSandboxPublish(preview.payload, uberSandbox(config),
      async (original) => {
        const { error } = await supabase.from("menu_sync_jobs").update({ original_menu: original }).eq("id", job.id).select("id").single();
        if (error) throw new Error("Backup could not be persisted.");
      },
      async (httpStatus) => {
        const { error } = await supabase.from("menu_sync_jobs").update({ status: "accepted", http_status: httpStatus, message: "Upload accepted. Verifying stored menu." }).eq("id", job.id).select("id").single();
        if (error) throw new Error("Accepted status could not be persisted.");
      });
    const { error: finishError } = await supabase.from("menu_sync_jobs").update({ ...outcome, finished_at: new Date().toISOString() }).eq("id", job.id).select("id").single();
    revalidatePath("/admin");
    if (finishError) return { ok: false, message: `${outcome.message} Final history update failed. Review this attempt before retrying.` };
    return { ok: outcome.status === "verified", message: outcome.message };
  } catch {
    return { ok: false, message: "Publishing could not complete. Check sandbox configuration and sync history before retrying." };
  }
}

export async function verifyUberAttempt(_previous: PublishState, _form: FormData): Promise<PublishState> {
  void _form;
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "Sign in before verifying an upload." };
  const { data: member } = await supabase.from("menu_publishers").select("user_id").eq("user_id", auth.user.id).maybeSingle();
  if (!member) return { ok: false, message: "Publishing permission is required." };
  try {
    const config = uberConfig();
    assertSandbox(config);
    const { data: job, error } = await supabase.from("menu_sync_jobs")
      .select("id,status,created_at,submitted_payload")
      .eq("store_id", config.storeId).eq("user_id", auth.user.id)
      .in("status", ["running", "accepted", "uncertain"])
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error || !job) return { ok: false, message: "No unresolved attempt was found for this account." };
    if (Date.now() - new Date(job.created_at).getTime() < 300_000) return { ok: false, message: "Wait five minutes after the attempt started so an active upload can finish, then verify again." };
    const actual = await uberSandbox(config).read();
    const match = menusMatch(actual, job.submitted_payload);
    const { error: updateError } = await supabase.from("menu_sync_jobs").update({
      status: match ? "verified" : "mismatch",
      message: match ? "Stored sandbox menu verified after an interrupted attempt." : "Read-back completed: the sandbox menu differs from this attempt. Review the preview before publishing again.",
      finished_at: new Date().toISOString(),
    }).eq("id", job.id).in("status", ["running", "accepted", "uncertain"]).select("id").single();
    if (updateError) return { ok: false, message: "Verification finished, but its history could not be saved." };
    revalidatePath("/admin");
    return { ok: match, message: match ? "The stored sandbox menu matches. Publishing history is now verified." : "The stored menu differs. This attempt is recorded as a mismatch; review and publish the current menu when ready." };
  } catch {
    return { ok: false, message: "The sandbox menu could not be verified. The unresolved attempt remains recorded; no upload was sent." };
  }
}
