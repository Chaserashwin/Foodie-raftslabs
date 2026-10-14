import assert from 'node:assert/strict';
const base = process.env.AUDIT_API_URL || 'http://localhost:5000/api';
const key = process.env.AUDIT_ADMIN_KEY;
if (!key) throw new Error('Set AUDIT_ADMIN_KEY for the disposable local QA server');
async function call(path, method='GET', body, headers={}) {
  const response = await fetch(base+path, { method, headers: { 'Content-Type':'application/json', ...headers }, ...(body && {body:JSON.stringify(body)}), signal:AbortSignal.timeout(15000) });
  return {status:response.status, data:await response.json()};
}
const health = await call('/health'); assert.equal(health.status,200); assert.equal(health.data.database.readyState,1);
const menu = await call('/menu'); assert.equal(menu.status,200); assert.equal(menu.data.data.length,16);
const products = menu.data.data;
for (const item of products) for (const field of ['name','description','price','imageUrl']) assert.ok(item[field]);
console.log('PASS: live health, seeded menu and product fields');
const cart = new Map();
cart.set(products[0].id,1); cart.set(products[1].id,1); cart.set(products[0].id,3); cart.delete(products[1].id);
const customer = {name:'Disposable QA Customer',phone:'9876543210',address:'42 Synthetic QA Road'};
const payload = { customer, items:[...cart].map(([productId,quantity])=>({productId,quantity})) };
assert.equal((await call('/orders','POST',{...payload,customer:{...customer,phone:'bad'}})).status,400);
const attemptKey = crypto.randomUUID();
const created = await call('/orders','POST',payload,{'Idempotency-Key':attemptKey});
assert.equal(created.status,201);
let order = created.data.data;
assert.equal(order.subtotal,products[0].price*3);
const config = await call('/config'); assert.equal(order.total,order.subtotal+config.data.data.deliveryFee);
assert.equal((await call('/orders','POST',payload,{'Idempotency-Key':attemptKey})).data.data.id,order.id);
console.log('PASS: invalid checkout, trusted totals, valid checkout and idempotent retry');
assert.equal((await call(`/orders/${order.id}/simulate`,'POST')).status,401);
assert.equal((await call(`/orders/${order.id}/status`,'PATCH',{status:'DELIVERED'},{'x-admin-key':key})).status,400);
for (const status of ['PREPARING','OUT_FOR_DELIVERY','DELIVERED']) {
  const updated = await call(`/orders/${order.id}/status`,'PATCH',{status},{'x-admin-key':key});
  assert.equal(updated.status,200);
  const refreshed = await call(`/orders/${order.orderNumber}`);
  assert.equal(refreshed.data.data.status,status);
  order = refreshed.data.data;
}
assert.equal(order.timeline.length,4);
assert.equal((await call(`/orders/${order.id}`)).data.data.status,'DELIVERED');
console.log('PASS: order retrieval, authorized status lifecycle, refreshed tracking data and history');
const client = await fetch('http://localhost:5173/track/'+order.orderNumber);
assert.equal(client.status,200); assert.match(await client.text(),/id="root"/);
const proxy = await fetch('http://localhost:5173/api/menu'); assert.equal(proxy.status,200); assert.equal((await proxy.json()).data.length,16);
console.log('PASS: frontend HTTP startup, direct SPA route and Vite API proxy (no browser rendering claimed)');
let imageOK=0, imageFailed=0;
const imageFailures = [];
for (let start=0;start<products.length;start+=4) {
  await Promise.all(products.slice(start,start+4).map(async item=>{
    try { const response = await fetch(item.imageUrl,{method:'HEAD',signal:AbortSignal.timeout(12000)}); if(response.ok && response.headers.get('content-type')?.startsWith('image/')) imageOK++; else { imageFailed++; imageFailures.push({name:item.name,status:response.status}); } }
    catch { imageFailed++; imageFailures.push({name:item.name,status:'network failure'}); }
  }));
}
console.log(`Image HEAD checks: ${imageOK} successful, ${imageFailed} unsuccessful (network/HTTP; browser rendering unverified)`);
if(imageFailures.length) console.log(JSON.stringify(imageFailures));
