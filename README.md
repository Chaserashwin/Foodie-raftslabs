# Foodie — Food Delivery Order Management

RaftLabs assessment implementation with an independent audit dated 14 October 2026. See [AUDIT_REPORT.md](AUDIT_REPORT.md) for evidence, defects, and verification limits. No hosted deployment has been verified.

## Architecture

The root npm package runs two separate packages. `client` is a React 18 SPA using TypeScript, Vite 6, React Router 7, Tailwind CSS 3 and Lucide. React context stores the cart in localStorage. The HTTP client calls `/api` through Vite's development proxy or a configured backend URL.

`server` is an Express 4/TypeScript API. Routes call controllers, Zod validators, services and Mongoose 8 models. MongoDB stores menu documents and orders with item/price snapshots and status history. Tests use Vitest, Supertest, React Testing Library and jsdom; API tests use a disposable real MongoDB process through mongodb-memory-server.

## Local setup (PowerShell, Node.js 22)

From the repository root:

```powershell
npm ci
npm ci --prefix server
npm ci --prefix client
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

Edit `server/.env` to point at your running local MongoDB or a dedicated Atlas development database. Generate a unique admin key locally and put it in the ignored environment file; do not commit or share it. This command writes the key to the ignored file without printing it:

```powershell
node -e 'const fs=require("node:fs"),crypto=require("node:crypto"); fs.appendFileSync("server/.env", "\nADMIN_API_KEY="+crypto.randomBytes(32).toString("hex")+"\n")'
npm run dev
```

The client runs at http://localhost:5173, the backend at http://localhost:5000 and readiness at http://localhost:5000/api/health. Visit `/admin` and enter the key you configured to update statuses. Keys are held only in React memory and must be entered again on refresh.

For a disposable local demo without MongoDB, explicitly set `USE_MEMORY_DB=true` in `server/.env`. This permits a temporary database only when the configured URI cannot connect in development. Dependencies must include devDependencies and the MongoDB binary must be available/downloadable. Orders in this temporary database do not survive backend restart. Use persistent MongoDB for real persistence or submission.

## Environment reference

| Variable | Default / requirement |
|---|---|
| `NODE_ENV` | `development`; must be development, test, or production |
| `PORT` | 5000; integer 1–65535 |
| `MONGODB_URI` | local MongoDB in development; explicitly required in production |
| `CORS_ORIGIN` | `http://localhost:5173`; exact HTTP(S) origin or comma-separated origins; explicit non-wildcard value required in production |
| `ADMIN_API_KEY` | unique key of at least 16 characters; required in production; if omitted in development a random inaccessible key is generated for that process |
| `DELIVERY_FEE` | 40 INR; finite nonnegative number |
| `USE_MEMORY_DB` | `false`; forbidden in production |
| `VITE_API_URL` | client-only, `/api` locally; deployed backend URL ending in `/api` for hosted frontend |

All `VITE_` values are public build-time configuration. Never put the admin key or MongoDB credentials in frontend variables. The UI fetches `/api/config` for the delivery fee; menu/cart values are estimates and saved orders always use trusted database prices.

## Checks and production commands

```powershell
npm test
npm run lint
npm run build
npm run start --prefix server
npm run preview --prefix client
```

`lint` runs TypeScript checks in each package. There is no ESLint configuration. API tests force `NODE_ENV=test` and use an isolated database; they fail instead of falling back to a configured external database. The first test run can download a MongoDB executable. Do not use `NODE_ENV=test` as a deployment configuration.

The production API starts from `server/dist/server.js` after building. Production requires persistent MongoDB and explicit origins/admin key. The backend serves API endpoints only; host the client assets separately. `vite preview` is for local build verification.

## API

Responses use `{ success, data }` on successful data requests and `{ success: false, error, details? }` on errors. Readiness has its own status/database fields.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | 200 if connected; 503 if database disconnected |
| GET | `/api/config` | Public delivery fee only |
| GET | `/api/menu?category=pizzas&search=Pizza` | Available menu, optional category and literal search (max 120 chars) |
| GET | `/api/menu/:id` | Individual menu item |
| POST | `/api/orders` | Validate customer/products/quantities and save order |
| GET | `/api/orders/:id` | Retrieve by MongoDB ID or order number |
| GET | `/api/orders?limit=50&skip=0` | Admin list; limit 1–100 and nonnegative skip |
| PATCH | `/api/orders/:id/status` | Admin status update |
| POST | `/api/orders/:id/simulate` | Admin-only advancement to the next stage |

Admin routes require `x-admin-key` or `Authorization: Bearer <your key>`. Customer tracking does not expose a status-changing button.

Order request:

```json
{
  "customer": {"name": "Demo Customer", "phone": "9876543210", "address": "42 Demo Street"},
  "items": [{"productId": "<actual menu item id>", "quantity": 2}]
}
```

Name is 2–100 characters, address 5–300 characters, and phone must match the Indian mobile format (10 digits starting 6–9, optionally prefixed by +91, 0091 or 0). Quantities are integers 1–50. Orders accept at most 100 distinct product lines. Duplicate product lines are rejected; unknown client price/total fields are discarded.

Send a unique `Idempotency-Key` header (16–100 alphanumeric/hyphen characters) when creating orders. Retrying the same validated payload/key returns the original order; changed payload reuse returns 409. Concurrent retries are protected by a unique index. The checkout reuses its key when retrying within the mounted page, and disables duplicate clicks while submitting. The key is optional for non-UI API callers. Browser refresh/new tabs are separate attempts.

Status request: `{"status":"PREPARING","note":"Kitchen started preparation"}`. The lifecycle is `ORDER_RECEIVED → PREPARING → OUT_FOR_DELIVERY → DELIVERED`. Repeating the current status returns the current order; skipped/backward transitions return 400. Concurrent writes cannot append duplicate timeline entries.

There are no product write/delete or order delete endpoints. Menu data is seeded only into an empty collection; existing data and orders are not deleted or reset. General seed changes do not migrate an existing database. Startup narrowly repairs only the two exact legacy image URLs identified by the audit; custom images are preserved.

## Deployment and submission

No deployment was performed during the audit. After authorization and access to the hosting/database accounts:

1. Create a dedicated persistent MongoDB database/user. Allow only the necessary hosting egress addresses where practical; keep the URI private.
2. Deploy the backend to Render with root directory `server`, build `npm ci && npm run build`, start `npm run start`, health check `/api/health`. Set `NODE_ENV=production`, `MONGODB_URI`, a unique `ADMIN_API_KEY`, exact frontend `CORS_ORIGIN`, and `DELIVERY_FEE=40`; keep `USE_MEMORY_DB=false`. The blueprint provides the backend and an optional Render static frontend.
3. Deploy the frontend to Vercel with root `client`, build `npm run build`, output `dist`, and `VITE_API_URL=<actual backend HTTPS URL>/api`. Set this before building and redeploy if it changes. Alternatively use the blueprint's Render static frontend with the same public API variable.
4. Set backend CORS to the actual frontend origin, including only deliberately approved preview origins. Confirm the API works from that browser origin. Vercel SPA deep-link rewrites are in `client/vercel.json`; Render static rewrites are in `render.yaml`.
5. Verify the actual health/menu URLs and complete the browser journey at desktop and mobile widths. Refresh the cart, confirmation, and tracking pages. Restart the deployed backend and verify orders remain.
6. Submit only verified live URLs, the repository and requested walkthrough. Demonstrate invalid checkout, valid checkout, server prices, admin authorization, all statuses, and actual test/build results. Disclose AI assistance and the remaining limits in the audit report accurately.

Configuration references: [Render blueprint specification](https://render.com/docs/blueprint-spec) and [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## Known limits

AI assistance: the initial implementation was completed with Antigravity. Codex then reviewed the repository, fixed confirmed issues, added regression tests and ran the automated suites, builds and isolated live HTTP/persistence checks documented in the audit report. Browser visual/mobile QA and hosted deployment were not verified. The submitter should review the implementation and explain these limits in the walkthrough.

The app is an assessment demo, with a shared admin key and public order lookup by identifier rather than customer accounts. Treat an order link as a private capability. Existing short legacy order numbers remain more guessable than newly generated 96-bit random suffixes. Catalog/fee changes during an already open cart can change server totals. Production MongoDB/hosting credentials and a live deployment were not verified. Browser visual/mobile QA remains outstanding; see the audit report. Remove any old admin credential retained in browser storage from earlier versions and rotate any previously used published default key.

For repeatable local HTTP smoke checks against a disposable server with synthetic orders:

```powershell
$env:AUDIT_ADMIN_KEY = '<key configured on your disposable local server>'
node scripts/audit-smoke.mjs
Remove-Item Env:AUDIT_ADMIN_KEY
node scripts/audit-persistence.cjs
```

The smoke script requires backend port 5000 and Vite port 5173 by default (`AUDIT_API_URL` can override the API URL). It creates synthetic test orders. The persistence script starts a disposable MongoDB and compiled production server on port 5011, checks restart/readiness, and stops both; its temporary database files are ignored under `.audit-runtime`.
