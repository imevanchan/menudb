import { menusMatch } from "./payload.ts";

export type PublishOutcome = {
  status: "verified" | "failed" | "uncertain" | "mismatch" | "accepted";
  message: string;
  http_status?: number;
};
type Transport = {
  read: () => Promise<unknown>;
  upload: (payload: unknown) => Promise<{ ok: boolean; status: number }>;
};

export async function runSandboxPublish(
  payload: unknown,
  transport: Transport,
  saveBackup: (original: unknown) => Promise<void>,
  markAccepted: (status: number) => Promise<void>,
): Promise<PublishOutcome> {
  let uploadStarted = false;
  let acceptedStatus: number | undefined;
  try {
    const original = await transport.read();
    await saveBackup(original);
    uploadStarted = true;
    const result = await transport.upload(payload);
    if (!result.ok) return { status: "failed", http_status: result.status, message: `Uber rejected the sandbox upload (HTTP ${result.status}).` };
    acceptedStatus = result.status;
    await markAccepted(result.status);
    const actual = await transport.read();
    if (!menusMatch(actual, payload)) return { status: "mismatch", http_status: result.status, message: "Uber accepted the upload, but the retrieved menu differs. Review it before publishing again." };
    return { status: "verified", http_status: result.status, message: "Published to Uber sandbox and verified by retrieval." };
  } catch {
    if (acceptedStatus) return { status: "accepted", http_status: acceptedStatus, message: "Uber accepted the upload, but verification or history storage failed. Check the stored menu before retrying." };
    if (uploadStarted) return { status: "uncertain", message: "The upload connection ended without a confirmed result. Check Uber before retrying; this attempt will not be retried automatically." };
    return { status: "failed", message: "Authentication, menu retrieval, or backup storage failed. No upload was attempted." };
  }
}
