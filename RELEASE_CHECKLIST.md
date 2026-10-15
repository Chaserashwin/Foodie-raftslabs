# RaftLabs final assessment checklist

Use a disposable test database and synthetic customer details. Local URLs: frontend `http://localhost:5173`, API `http://localhost:5000/api`. For hosted checks, substitute the actual verified frontend/backend URLs. No hosted URL is claimed by this checklist.

## Desktop and mobile browser journey (manual verification if automation is unavailable)

Record browser/version, viewport, date and outcome. Run the complete journey at **1440×900**, **768×1024**, **390×844**, and **320×568**; repeat the mobile journey on a real phone if available. Unchecked boxes mean unverified, not passed.

- [ ] Open menu. Check all 16 seeded cards show name, description, INR price and a visible food image. Scroll the full menu to exercise lazy images. Block one image in DevTools; verify the local “Image unavailable” fallback preserves the card height.
- [ ] Filter categories and search; check loading, no-results and retry states. Type successive queries quickly and confirm results correspond to the latest query.
- [ ] Add two different items. Open the basket, increase one quantity to 3, decrement once, remove the other item, and confirm subtotal = unit price × quantity, fee = configured delivery fee, total = subtotal + fee.
- [ ] Refresh the page and reopen the basket. Verify product/quantity state and totals remain. Check empty-basket checkout and clear-cart behavior.
- [ ] Proceed to checkout. Submit empty fields, then invalid phone `12345`, name `A`, and address `123`. Check field errors and that no order was created.
- [ ] Enter synthetic name `Release QA`, phone `9876543210`, address `42 Synthetic QA Road`. Submit once, then try rapid repeated clicks. Confirm only one order is created, the button is disabled while pending, and the basket clears after success.
- [ ] Simulate API/network failure at checkout. Verify a readable error, retained basket and enabled retry. Restore the network and retry without refreshing the checkout page; verify retry does not create duplicate orders.
- [ ] On confirmation, verify order number, purchased items and totals; private contact/address must not appear. Refresh the confirmation URL and confirm the same safe order can be retrieved.
- [ ] Follow Live Order Tracking. Verify current status, all four stage labels, timestamps and quantities/totals. Refresh the tracking URL. Test lookup by both order number and MongoDB ID copied from the public order response.
- [ ] In DevTools Network, inspect `POST /api/orders` and both `GET /api/orders/:identifier` responses. Verify no `customer`, phone, delivery address, staff `note`, request hash or idempotency key is returned. Use fresh responses with `Cache-Control: no-store`; do not rely on pages cached before remediation.
- [ ] Open `/admin` in another tab. An empty/wrong key must fail. With the authorized key, confirm staff can see customer name, phone and full address and only valid next statuses are offered.
- [ ] Advance `ORDER_RECEIVED → PREPARING → OUT_FOR_DELIVERY → DELIVERED` in admin. After each step, confirm the customer tracking page updates within the next successful 5-second poll; also test manual Refresh. Ensure history is ordered with no duplicate entries.
- [ ] During tracking, block the API or go offline for two polling intervals. Verify last-known order details/timeline stay visible and an error notice appears. Restore access; confirm tracking recovers on the next poll without refreshing the page.
- [ ] After delivery, verify polling stops and manual Refresh remains available. Confirm public UI exposes no status-update/simulation button. Unauthenticated `PATCH /api/orders/:id/status` and `POST /api/orders/:id/simulate` must return 401.
- [ ] At every viewport, check menu, basket, checkout, long order number, confirmation, tracking and admin. No page-level horizontal overflow, clipped text/buttons, obscured inputs or inaccessible basket close/checkout controls. Admin table may scroll within its own container.
- [ ] Use Tab/Shift+Tab/Enter/Space without a mouse. Verify visible focus, checkout labels, button names, category selection, add/remove controls, basket close, tracking search/refresh, validation errors and admin login. Check Escape behavior/focus recovery for the basket; record any remaining accessibility defect instead of assuming it passed.
- [ ] Check browser console for errors; verify no customer contact details, request bodies, admin key or connection URI are logged. Clear synthetic data and test credentials only through your authorized disposable test workflow.

## Deployment and submission gates

- [ ] Review README environment configuration and run `npm test`, `npm run lint`, `npm run build` from the root. `lint` is TypeScript checking; there is no ESLint setup.
- [ ] After authorization, provision Atlas with a dedicated database user and approved hosting egress IP access. Store the connection URI only in backend secrets.
- [ ] Render API: root `server`, build `npm ci && npm run build`, start `npm run start`, health `/api/health`. Set `NODE_ENV=production`, `MONGODB_URI`, unique `ADMIN_API_KEY` (at least 16 characters), exact frontend `CORS_ORIGIN`, `DELIVERY_FEE=40`, `USE_MEMORY_DB=false`; use the host-provided `PORT` or 10000.
- [ ] Vercel SPA: root `client`, build `npm run build`, output `dist`, `VITE_API_URL=<actual backend HTTPS origin>/api` at build time. Keep `client/vercel.json` SPA routing. Never place admin/MongoDB secrets in a `VITE_` variable.
- [ ] Optional Render frontend: root `client`, `npm ci && npm run build`, static publish `dist`, rewrite `/*` to `/index.html`, same public API URL. Use only the actual selected frontend origin in backend CORS.
- [ ] Verify actual HTTPS health/menu/tracking URLs, frontend-to-backend CORS, unauthorized admin protection, sanitized public responses, admin details, direct confirmation/tracking URL reloads and the full desktop/mobile journey above.
- [ ] Restart the hosted API and verify the same synthetic order persists in Atlas. Local isolated restart verification does not establish hosted persistence.
- [ ] Inspect the final diff, remove accidental secrets/temporary files, and accurately disclose AI assistance and remaining limitations. No commit, push, publication or deployment is authorized by this checklist itself.
- [ ] Submit only verified live URLs, repository and requested walkthrough. Record results and evidence; do not present unchecked gates as complete.
