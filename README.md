# MenuDB

MenuDB is a single-location restaurant menu-management prototype. It provides one authenticated master menu for categories, items, prices, availability, and modifiers, then transforms that data into delivery-platform formats.

The project intentionally does not claim live marketplace access. DoorDash Marketplace activation remains pending, so the DoorDash transport is demonstrated through an authenticated Menu Pull endpoint, contract tests, and generated payloads rather than a live storefront.

## What it demonstrates

- Authenticated menu administration with Supabase Auth
- Row Level Security for menu writes
- Category and item creation, editing, pricing, and availability
- Reusable modifier groups and priced modifier options
- Item-to-modifier assignments and customer customization rules
- A public menu and item-customization flow
- DoorDash Marketplace Menu Pull response generation
- Uber Eats sandbox authentication, menu preview, full upload, and verified retrieval
- Authenticated webhook endpoints for orders, menu status, and menu requests
- Platform adapters that share the master database; Grubhub remains a future integration
- Vercel deployment and GitHub-based delivery

## Architecture

```text
Administrator
     |
     v
Next.js admin editor
     |
     v
Supabase master menu
     |
     +----> Public menu and customization preview
     |
     +----> DoorDash transformer
                |
                v
       Authenticated Menu Pull endpoint
```

Platform transformation is kept separate from transmission. The DoorDash transformer can be tested without a provisioned test store, and a real push transport can be added later if Marketplace access is granted.

## Technology

- Next.js 16 and React 19
- TypeScript
- Tailwind CSS
- Supabase Postgres, Auth, and Row Level Security
- Vercel
- DoorDash Marketplace sandbox contracts

## Local setup

Install dependencies:

```bash
npm install
```

Create `.env.local` with the required values:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
DOORDASH_PROVIDER_TYPE=
DOORDASH_MENU_REQUEST_TOKEN=
DOORDASH_MENU_STATUS_WEBHOOK_TOKEN=
DOORDASH_ORDERS_WEBHOOK_TOKEN=
UBER_CLIENT_ID=
UBER_CLIENT_SECRET=
UBER_STORE_ID=
UBER_AUTH_URL=https://sandbox-login.uber.com/oauth/v2/token
UBER_API_BASE_URL=https://test-api.uber.com
```

Never commit `.env.local` or real credentials.

Start the application:

```bash
npm run dev
```

Open:

- `http://localhost:3000/menu` for the public menu
- `http://localhost:3000/admin` for authenticated administration
- `http://localhost:3000/status` for integration status

## Quality checks

```bash
npm run lint
npm test
npm run build -- --webpack
```

The contract test verifies that active master-menu records map into DoorDash categories, items, integer-cent prices, modifier groups, and modifier options while inactive records are excluded.

## DoorDash Menu Pull

The menu endpoint is:

```text
GET /api/doordash/menus/{locationId}?ids={externalMenuId}
```

It requires the configured `Authorization` value and returns the current Supabase menu in DoorDash's pull-response envelope. It includes the requested external menu ID for update pulls.

Current operating hours are an explicit sandbox placeholder. Database-backed weekly and special hours are a documented future enhancement.

## Sandbox limitations

- DoorDash Marketplace is pending activation, so no test store is available for a real menu push.
- Uber Eats uploads have been verified in the sandbox only. Taxes remain unconfigured, and hours are defined in the adapter rather than edited through the database.
- Grubhub is not yet implemented or verified.
- The customer order button validates modifier choices but does not create a persistent cart or payment flow.
- This is a single-location portfolio MVP, not a production POS.

## Potential extensions

- Database-backed weekly and holiday hours
- Menu-status and sync-job persistence
- Grubhub preproduction adapter
- Real DoorDash POST/PATCH transport if test-store access is granted
- Multi-location support

## Security

Secrets are stored in local or Vercel environment variables. Administrative writes require an authenticated Supabase session and are restricted by database policies. Public pages use read-only access.

## Uber Eats sandbox

With the local server running, inspect `GET /api/uber/menu/preview` for the transformed Supabase menu and validation results. `GET /api/uber/menu` retrieves the menu currently stored by Uber.

```bash
npm run uber:sandbox
npm run uber:sandbox -- --upload
```

The first command checks the preview without calling Uber. The second obtains a sandbox token, saves the existing menu under the Git-ignored `sandbox-backups/` directory, and replaces the sandbox menu. Production URLs and redirects are refused. Never change this command to target a live merchant for a portfolio demonstration.

An upload returned HTTP 204, and a subsequent read-only retrieval returned HTTP 200. Comparison with the saved submission confirmed menu names, category relationships, item prices, modifier rules, and hours. This is an on-demand sync command, not automatic publishing after every editor change.

Configured hours: Tuesday–Thursday 11:00–21:00, Friday–Saturday 11:00–22:00; Monday and Sunday closed.
