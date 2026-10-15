const { createRequire } = require('node:module');
const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { mkdirSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const serverRequire = createRequire(path.resolve('server/package.json'));
const { MongoMemoryServer } = serverRequire('mongodb-memory-server');
const base = 'http://127.0.0.1:5011/api';
let mongo, child, adminKey;
let serverLogs = '';
async function start() {
  adminKey = randomBytes(32).toString('hex');
  child = spawn(process.execPath, ['dist/server.js'], {
    cwd:path.resolve('server'), stdio:['ignore','pipe','pipe'],
    env:{...process.env, NODE_ENV:'production', PORT:'5011', MONGODB_URI:mongo.getUri('audit_persistence'), CORS_ORIGIN:'http://localhost:5173', ADMIN_API_KEY:adminKey, USE_MEMORY_DB:'false'},
  });
  child.stdout.on('data', data => { serverLogs += data.toString(); });
  child.stderr.on('data', data => { serverLogs += data.toString(); });
  const deadline = Date.now()+60000;
  while (Date.now()<deadline) {
    if (child.exitCode !== null) throw new Error('Production server exited during startup');
    try { if ((await fetch(base+'/health', {signal:AbortSignal.timeout(1500)})).status === 200) return; } catch {}
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  throw new Error('Production startup timed out');
}
async function stop() {
  if (child && child.exitCode === null) {
    const exited = new Promise(resolve=>child.once('exit',resolve));
    child.kill('SIGTERM'); await exited;
  }
}
(async()=>{
  const dbPath = path.resolve('.audit-runtime/persistence-db'); mkdirSync(dbPath,{recursive:true});
  mongo = await MongoMemoryServer.create({binary:{downloadDir:path.resolve('server/node_modules/.cache/mongodb-memory-server')},instance:{dbPath,storageEngine:'wiredTiger',launchTimeout:60000}});
  await start();
  const menu = await (await fetch(base+'/menu')).json();
  const customer = {name:'Restart QA',phone:'9123456789',address:'42 Synthetic QA Street'};
  const response = await fetch(base+'/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer,items:[{productId:menu.data[0].id,quantity:2}]})});
  assert.equal(response.status,201); const order = (await response.json()).data;
  await stop(); await start();
  const read = await fetch(base+'/orders/'+order.id); assert.equal(read.status,200);
  const restored = (await read.json()).data;
  assert.ok(!('customer' in order) && !('customer' in restored), 'Public responses must omit customer fields');
  const byNumber = await (await fetch(base+'/orders/'+order.orderNumber)).json();
  assert.ok(!('customer' in byNumber.data), 'Public number lookup must omit customer fields');
  const admin = await (await fetch(base+'/orders',{headers:{'x-admin-key':adminKey}})).json();
  assert.deepEqual(admin.data.find(item=>item.id===order.id).customer,customer);
  for(const value of Object.values(customer)) {
    assert.ok(!JSON.stringify(restored).includes(value), 'Public response leaked customer value');
    assert.ok(!serverLogs.includes(value), 'Production application logs leaked customer value');
  }
  const privateInput = Object.values(customer).join(' ');
  const missing = await fetch(base+'/orders/'+encodeURIComponent(privateInput));
  assert.equal(missing.status,404);
  const missingBody = await missing.json();
  for(const value of Object.values(customer)) {
    assert.ok(!JSON.stringify(missingBody).includes(value), 'Error response leaked private input');
    assert.ok(!serverLogs.includes(value) && !serverLogs.includes(encodeURIComponent(value)), 'Application logs leaked private lookup input');
  }
  assert.equal(restored.orderNumber,order.orderNumber); assert.equal(restored.total,order.total);
  const reseeded = await (await fetch(base+'/menu')).json(); assert.equal(reseeded.data.length,16);
  console.log('PASS: compiled production server startup, saved order survives server restart, seed does not duplicate menu');
  console.log('PASS: public privacy and authorized dispatch details survive restart; production logs and errors omit customer values');
  await mongo.stop();
  const health = await fetch(base+'/health'); assert.equal(health.status,503);
  console.log('PASS: disconnected database changes live readiness endpoint to HTTP 503');
})().catch(err=>{console.error(err.message);process.exitCode=1;}).finally(async()=>{await stop();if(mongo)await mongo.stop();});
