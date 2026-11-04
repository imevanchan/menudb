# Publishing setup and deployment

## Verification record

- November 4, 2026: publishing migration applied to the hosted Supabase project.
- Anonymous REST access to publisher membership and sync history denied (HTTP 401, Postgres code 42501).
- Local signed-in dashboard publish completed with “Published to Uber sandbox and verified by retrieval.”
- Application build, TypeScript, lint, and 11 automated checks passed.
- Vercel deployed the publishing implementation; its public status page reflects the updated platform labels.
- The six Uber environment settings were saved in Vercel Production. A fresh deployment and signed-in publishing test complete hosted verification.

## 1. Apply the database migration

Open the existing Supabase MenuDB project → SQL Editor → New query. Paste and run the contents of `supabase/migrations/202611040001_publishing.sql` once.

The migration creates `menu_publishers` and `menu_sync_jobs`, with RLS and no anonymous access. It approves the existing user with email `imevanchan.careers@gmail.com`. If your administrator uses a different email, change the email in the migration before running it. Check Authentication → Users first. New signups cannot grant themselves publishing permission.

To check setup in SQL Editor:

```sql
select user_id from public.menu_publishers;
select id, status, created_at from public.menu_sync_jobs order by created_at desc;
```

The first result should contain the intended administrator UUID. The second is initially empty. Do not disable RLS or use a service-role key in the browser.

## 2. Configure local publishing

Keep the existing Supabase and DoorDash values. Add these server-side settings to `.env.local`:

```dotenv
UBER_CLIENT_ID=your_testing_app_client_id
UBER_CLIENT_SECRET=your_testing_app_client_secret
UBER_STORE_ID=your_provisioned_test_store_id
UBER_AUTH_URL=https://sandbox-login.uber.com/oauth/v2/token
UBER_API_BASE_URL=https://test-api.uber.com
UBER_SANDBOX_PUBLISH_ENABLED=true
```

Restart the local server. Sign in to `/admin`; the publishing panel should display the preview and an enabled button. Its credentials and token remain on the server. A saved database backup is required before the dashboard sends an upload.

## 3. Validate the dashboard

1. Sign out: `/admin` redirects to login. An unauthenticated publishing action must return an authentication error.
2. Sign in with the approved account. Confirm the panel shows the saved items, modifiers, prices, and hours.
3. Publish once. Confirm **Published and verified**, a new history record, and a last-verified timestamp.
4. Publish the unchanged version again. The action should report that it was already verified and skip another upload.
5. Save a price change, refresh the panel, and confirm it reports an unpublished version. Publish again and inspect the new result.
6. Disable `UBER_SANDBOX_PUBLISH_ENABLED` and restart: publishing must be disabled while menu editing remains available.

No automatic background retries run. If an upload times out, its result is recorded as unknown and another upload is blocked. After five minutes, **Verify previous attempt** reads Uber and resolves that job as verified or mismatched without sending another upload. If history storage itself failed, inspect the record before retrying.

The database unique index blocks overlapping dashboard uploads for one store, including unresolved jobs. Do not run the standalone CLI concurrently with a dashboard publish; the legacy CLI has its own local backups and does not participate in the database history or lock.

## 4. Deploy to Vercel

Add the six Uber settings above to the existing Vercel project's Production environment. Use the same sandbox hosts and testing credentials even though Vercel calls the deployment environment "Production". These are separate concepts. Add them to Preview only if you want approved administrators to publish from preview deployments too.

Keep `UBER_CLIENT_SECRET` secret and never prefix Uber settings with `NEXT_PUBLIC_`. Existing Supabase settings must match the project where you applied the migration. No Supabase service-role key is needed.

Push the tested commit to GitHub and inspect the resulting Vercel deployment. If the Git integration does not create one, create a deployment from the latest Git commit; redeploying an older build does not include new code.

After Vercel reports Ready, test `/menu`, `/status`, sign-in, and `/admin` on `https://menudb.vercel.app`. Repeat a sandbox publish and verify persistent history after a browser refresh. Do not call the deployment verified until those checks succeed.

## Backup retention

Dashboard jobs contain the submitted menu and prior sandbox menu in private database columns. The UI only selects history summaries. Review storage usage as history grows; no automatic retention deletion is configured. CLI backups remain in the Git-ignored `sandbox-backups/` folder.
