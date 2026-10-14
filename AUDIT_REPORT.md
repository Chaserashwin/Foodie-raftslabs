# Independent repository audit and QA — 14 October 2026

Scope: this Foodie repository only. No deployment, commits, pushes or changes to other projects were performed. Existing modifications to `server/src/config/db.ts` were inspected and preserved: cache lookup, 60-second MongoDB binary launch timeout and the two-second connection timeout remain.

## Actual architecture

The root npm package orchestrates independent `client` and `server` packages. Client: React 18, TypeScript, Vite 6, React Router 7, Tailwind CSS 3, Lucide; React context and localStorage for cart state. Server: Node.js 22, Express 4, TypeScript, Zod, Mongoose 8/MongoDB; route → controller → validator/service → model. Helmet, CORS, rate limiting and Morgan wrap the API. Orders persist trusted price/name snapshots and status timelines. Vitest/Supertest runs against a disposable MongoDB process; Vitest/Testing Library/jsdom covers UI behavior. Vercel SPA and Render API/static-site configurations exist. Actual installed versions can differ from manifest minimums; the executed test runner was Vitest 3.2.7 and production builder Vite 6.4.4.

## Requirement matrix (after fixes)

PASS means the stated behavior was verified with the evidence listed; it does not imply browser visual verification or hosted deployment.

| # | Requirement | Result | Evidence / limitation |
|---|---|---|---|
| 1 | Menu names, descriptions, prices, images | PASS | Live API returned 16 products with required fields. All 16 image endpoints passed HEAD checks after repairing two 404s. Product rendering and image fallback tested in jsdom; rendered photography not visually verified. |
| 2 | Add to cart | PASS | Existing ProductCard and cart tests exercised clicks and context state. |
| 3 | Quantity changes and removal | PASS | Existing tests exercised quantity changes, removal and clear; invalid persisted quantities and NaN handling added. |
| 4 | Subtotal, fee, total | PASS | Cart tests, decimal rounding and server-configured fee test; live HTTP totals and forged-price regression. Assumes current catalog/config; stale open carts remain estimates. |
| 5 | Name/address/phone checkout | PASS | Actual CheckoutPage tested for invalid input, valid submission, error/retry, pending duplicate clicks, cart clearing and confirmation navigation. |
| 6 | Server validation and trusted prices | PASS | Missing fields, malformed JSON, invalid IDs/quantities, duplicate lines, unavailable products and forged totals tested through API. |
| 7 | Persistent order creation | PASS | Saved order survived restart of compiled production API against an isolated real MongoDB process. Atlas and host durability remain unverified. Explicit temporary demo mode does not persist across database restart. |
| 8 | Order retrieval by ID | PASS | Tests and live HTTP read by MongoDB ID and order number, including missing orders. |
| 9 | Four order statuses | PASS | All forward transitions, illegal jumps/backward transitions, terminal status and concurrent history deduplication verified. |
| 10 | Menu/order/status API | PASS | API integration suite and live HTTP journey; list, status and simulation routes require admin authorization. |
| 11 | Meaningful API/UI tests including CRUD | PARTIAL | Create/read/status-update and cart create/read/update/remove covered. Backend has no product write/delete or order delete routes, so full backend CRUD is absent. No unnecessary delete API was introduced. Browser E2E is blocked. |
| 12 | Responsive, usable interface | PARTIAL | Responsive classes inspected, unsupported Tailwind utilities corrected, form labels linked to fields. Real viewport, overflow, keyboard focus and visual QA still required. |
| 13 | Deployment readiness | PARTIAL | Local builds/startup/readiness/proxy/environment checks verified; Render static config repaired and Vercel rewrite checked against official docs. Actual account/database/origin/live URLs are BLOCKED by unavailable deployment access and no deployment authorization. |
| 14 | Complete accurate README | PASS | Replaced unsupported production/coverage claims and exposed default credential; documented actual commands, configuration, API behavior, demo limitations, deployment steps and disclosure. Hosted instructions remain subject to the deployment verification above. |

## Defects and root causes

| Defect found | Root cause | Fix |
|---|---|---|
| Anyone could advance any known order | Public simulation route bypassed protected status API | Require admin auth on simulation; remove customer simulation button. |
| Public built-in admin credential | Server fallback, frontend autofill/display and README shared the same default | Remove published default, require production key, generate random process fallback in development, keep entered admin key in memory. |
| Repeated/retried requests could create duplicates | Disabled UI button was the only protection | Add synchronous submit guard plus optional idempotency key; same-page retries reuse key; MongoDB unique index and payload hash handle concurrent retries/conflicts. |
| Duplicate status timeline under concurrency | Read/modify/save allowed competing writers | Atomic compare-and-update using previous status, with idempotent same-target retry handling. |
| Order number collisions/guessability | Only 9,000 possible random daily suffixes | Use 96-bit cryptographic random suffix; retain unique index and existing lookup compatibility. |
| Search accepted regex syntax | Raw user search became a regular expression | Escape metacharacters and bound search length. |
| Bad pagination reached MongoDB | parseInt accepted partial strings, NaN and negative/unbounded values | Zod integer bounds for limit/skip. |
| Malformed JSON reported server error | Body-parser errors fell through to generic 500 | Explicit JSON parse 400 and oversized-body 413 responses. |
| Health always reported UP | HTTP readiness ignored DB state | Report 503/DOWN when disconnected. |
| Invalid environment silently accepted | parseInt/parseFloat and unchecked casts/defaults | Runtime validation and strict production requirements, without printing invalid values. |
| Test setup could connect to configured DB on failure | Test memory database fallback used external URI | Fail isolated tests instead of falling back. |
| Development could silently lose orders after DB failure | Automatic temporary DB fallback was always enabled | Require explicit USE_MEMORY_DB=true; production forbids it; log temporary persistence limit. |
| Credentials/error internals could reach logs/responses | Full MongoDB URI, raw errors, URL query logging and dev stacks | Remove URI/raw error/URL logs and stack responses; startup failure uses generic message. |
| Wildcard CORS combined with credentials | Cookies flag enabled although API uses headers | Disable credentialed CORS, validate exact origins and require explicit production origins. |
| Normal tracking could hit rate limit | 5-second polling consumed shared 200/15min quota | Keep write quota at 200/15min, add separate read quota of 1,000/15min and exempt health so ordinary polling does not exhaust the write quota. |
| UI fee differed from configured server fee | Frontend hardcoded ₹40 | Fetch public pricing configuration; calculate totals in currency subunits. |
| Corrupted stored carts crashed/produced invalid totals | Incomplete localStorage validation; NaN quantity accepted | Validate required product fields, finite nonnegative prices and integer bounds; ignore nonfinite quantity updates. |
| Product image sizing/other styling absent | Tailwind 4 utility names used with Tailwind 3 | Replace invalid aspect/gradient/shadow/focus utilities with supported equivalents. |
| Two product image URLs returned 404 | Invalid Unsplash photo IDs | Replace verified URLs and narrowly repair only exact known legacy URLs; local SVG fallback avoids another external dependency. |
| Old responses could overwrite newer search/tracking | No response-version guard | Ignore stale requests; failed background tracking refresh preserves last known details and reports an error. |
| Checkout labels lacked associations | Visible labels had no htmlFor/input IDs | Link name, phone and address labels and add autocomplete hints. |
| Admin offered illegal status choices | Every status remained selectable | Offer current status plus next valid status. Server remains authoritative. |
| Render static blueprint invalid | Static site had compute-plan field | Remove unsupported plan; use lockfile-based npm ci builds. |
| Documentation overstated verification | Claimed production quality, zero-any, fixed test counts and all checks without supporting evidence | Rewrite README to match actual implementation and performed checks. |

## Files changed and purposes

| Files | Purpose |
|---|---|
| `server/src/config/env.ts`, `server/.env.example` | Environment validation, explicit memory opt-in, secure admin configuration and exact origins. |
| `server/src/config/db.ts`, `server/src/server.ts` | Isolated tests, secret-safe DB handling, seed failure propagation, unique-index initialization and shutdown disconnect. Preserve pre-existing DB changes. |
| `server/src/data/seedMenu.ts` | Repair two broken image URLs and define exact legacy replacements. |
| `server/src/services/order.service.ts`, `server/src/models/order.model.ts` | Random identifiers, trusted currency rounding, idempotency fields/unique index, payload conflict checks and atomic statuses; internal retry metadata omitted from JSON. |
| `server/src/services/menu.service.ts`, `server/src/validators/menu.validator.ts`, `server/src/validators/order.validator.ts` | Literal search and bounded/duplicate-line validation. |
| `server/src/routes/order.routes.ts`, `server/src/controllers/order.controller.ts` | Protect simulation, validate pagination/idempotency header. |
| `server/src/controllers/health.controller.ts`, `server/src/middleware/errorHandler.middleware.ts`, `server/src/app.ts` | Readiness, consistent errors, CORS, read polling allowance, safe request logs and public pricing endpoint. |
| `server/src/tests/api.test.ts`, `server/src/tests/env.test.ts`, `server/vitest.config.ts` | Security/concurrency/persistence regressions and deterministic isolated test configuration. Existing simulation assertions retained with required authentication. |
| `client/src/context/CartContext.tsx`, `client/src/services/api.ts` | Stored-cart validation, finite quantities, currency math, configured fee, retry headers and admin simulation signature. |
| `client/src/pages/CheckoutPage.tsx` | Synchronous duplicate-click guard, retry key and accessible labels. |
| `client/src/pages/AdminOrdersPage.tsx` | Remove built-in/stored credential and restrict status options. |
| `client/src/pages/OrderTrackingPage.tsx`, `client/src/pages/HomePage.tsx` | Remove public simulation, encoded routes, avoid duplicate lookup and stale responses, preserve tracking on background errors. |
| `client/src/components/ProductCard.tsx`, `client/src/components/ErrorMessage.tsx`, `client/src/components/Navbar.tsx`, `client/src/pages/OrderConfirmationPage.tsx` | Supported Tailwind utilities and local image fallback. |
| `client/src/tests/audit.test.tsx` | Checkout failure/retry/duplicate clicks, remount persistence, stored data validation, configured fee, tracking/confirmation reload, admin and image fallback. |
| `.gitignore`, `render.yaml`, `README.md`, `AUDIT_REPORT.md` | Broader environment ignoring, corrected deployment config and honest documentation. |
| `scripts/audit-smoke.mjs`, `scripts/audit-persistence.cjs` | Reproducible disposable live HTTP, production restart and DB-readiness checks. |

## Executed verification

Initial checks were started before fixes. The initial complete run passed **26 backend tests** and **12 frontend tests**, both TypeScript checks and production builds. Passing baseline tests did not cover the security/edge-case defects above.

An intermediate expanded run exposed a CORS-test failure because the existing ignored environment file provided a wildcard origin. Tests now explicitly configure an isolated origin/key instead of inheriting local configuration. No assertion was weakened. A first persistence attempt timed out during startup; its startup wait was bounded at 60 seconds with request timeouts, then the actual restart/readiness assertions passed. A first HTTP SPA check returned 404 because PowerShell/npm forwarded an attempted host argument as a Vite root directory; restarting with the documented `npm run dev --prefix client` fixed the invocation.

Final unit/integration counts and checks are recorded below. `npm run lint` is TypeScript checking, not an ESLint run.

| Check | Actual result |
|---|---|
| Backend final suite | `npm test`: 56/56 passed (49 API + 7 environment tests). |
| Frontend final suite | `npm test`: 22/22 passed (5 cart + 7 component + 10 audit UI tests). |
| `npm run lint` | Exit 0; server and client TypeScript checks passed. No ESLint configured. |
| `npm run build` | Exit 0; server tsc and client tsc/Vite production builds passed. |
| Live `scripts/audit-smoke.mjs` | Passed health/menu/invalid checkout/trusted totals/idempotency/full admin status sequence/retrieval/refreshed status/SPA HTTP route/Vite proxy; final 16/16 image HEAD checks succeeded. |
| `scripts/audit-persistence.cjs` | Passed compiled production startup, order retrieval after API process restart, menu seed count unchanged and disconnected DB HTTP 503. Uses disposable MongoDB, not Atlas. |
| `npm audit --omit=dev --json --prefix server` | Exit 0, zero reported production dependency vulnerabilities. |
| `npm audit --omit=dev --json --prefix client` | Exit 0, zero reported production dependency vulnerabilities. Dev dependencies were not assessed by these commands. |
| Browser automation | BLOCKED: first request before server startup refused connection; subsequent attempts after HTTP readiness repeatedly timed out waiting for in-app browser webview attachment. Browser inventory exposes no alternative configured browser. No visual E2E or mobile pass claimed. |
| Deployed URLs | BLOCKED / not deployed. No available hosting authorization/credentials or live URL verification. |

## Journey and remaining risks

Menu → add → change quantities → remove → totals is exercised by ProductCard/cart tests. Invalid/valid checkout → error retry → confirmation navigation/cart clearing is exercised by actual CheckoutPage tests. Confirmation/tracking reload from URL is exercised in jsdom. Menu/order/status/retrieval behavior is also exercised through a running HTTP API and Vite proxy. This combination is **not** a single real-browser E2E run. Actual polling appearance, responsive layout, images, focus, cart drawer interactions and a complete visual browser journey remain manual verification tasks.

Persistence was verified across API restart while isolated MongoDB continued running. Atlas, backup/restore, hosted DB restarts and free-tier cold-start behavior remain unverified. Temporary development fallback deliberately loses data when its MongoDB process stops. Startup creates/checks the new unique idempotency index; index permissions and existing production data need deployment verification. Seed failure is fatal. Exact legacy image URL repair preserves custom images and orders; broad catalog migrations are not performed.

Public order lookup exposes customer name/phone/address to anyone possessing the identifier. New order numbers have strong random suffixes, but legacy four-digit suffixes remain guessable; production should use customer authentication or separate private tracking tokens and read-abuse controls. The shared admin key lacks per-user roles/audit identity. The write limiter remains process-local and proxy trust has not been configured against an actual host. Distributed rate limiting and precise proxy configuration require deployment decisions. Removing URL logging prevents order identifiers from appearing in application request logs, but hosting logs need their own privacy review.

Idempotency is optional for API clients and the UI retry key survives only within a mounted checkout page; refreshing or using another tab starts a new attempt. There is no payment processing. Catalog prices saved in a restored/open cart can become stale; backend totals remain authoritative. Pricing config falls back to the default estimate if loading fails; a production checkout quote/reconfirmation flow would address catalog/fee changes. Third-party images remain dependent on Unsplash availability despite successful HEAD checks and local failure placeholders. Browser persistent admin keys saved by older versions are no longer read; remove them and rotate any published default previously used.

## Environment, local commands, deployment and submission

Required production variables: `NODE_ENV=production`, `MONGODB_URI`, `ADMIN_API_KEY` (unique, at least 16 characters), exact `CORS_ORIGIN`. Optional validated values: `PORT` (5000 default; host can provide it), `DELIVERY_FEE` (40 default), `USE_MEMORY_DB=false`. Frontend: `VITE_API_URL=<actual backend URL>/api` at build time; `/api` for Vite development proxy.

Exact PowerShell commands from repository root:

```powershell
npm ci
npm ci --prefix server
npm ci --prefix client
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
# Configure persistent MongoDB and a unique admin key in the ignored server/.env.
npm run dev
# Verification:
npm test
npm run lint
npm run build
# Compiled API startup (after setting the production variables):
npm run start --prefix server
```

Dependencies were already installed, so the audit did not need to install or alter package versions/lockfiles. Full setup, secret generation without printing, optional disposable demo mode, API payloads and exact deployment settings are in README.md.

Next steps: provision dedicated persistent MongoDB, deploy Render `server` with `npm ci && npm run build` / `npm run start` and `/api/health`, deploy Vercel `client` with output `dist` and actual public API URL, set exact backend frontend origin, verify actual live URLs and complete desktop/mobile browser journey plus hosted restart persistence. Submit only verified URLs with repository, requested walkthrough and accurate AI-assistance disclosure. Deployment changes require the user's authorization; none were made here.

Render static sites do not support compute `plan`; this confirmed blueprint defect was repaired using the [official blueprint specification](https://render.com/docs/blueprint-spec). Vercel's existing SPA rewrite matches the guidance in [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite). Hosting acceptance itself is not claimed.
