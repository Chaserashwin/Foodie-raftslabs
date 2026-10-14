const { createRequire } = require('node:module');
const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { mkdirSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const serverRequire = createRequire(path.resolve('server/package.json'));
const { MongoMemoryServer } = serverRequire('mongodb-memory-server');
const base = 'http://127.0.0.1:5011/api';
let mongo, child;
async function start() {
  child = spawn(process.execPath, ['dist/server.js'], {
    cwd:path.resolve('server'), stdio:['ignore','inherit','inherit'],
    env:{...process.env, NODE_ENV:'production', PORT:'5011', MONGODB_URI:mongo.getUri('audit_persistence'), CORS_ORIGIN:'http://localhost:5173', ADMIN_API_KEY:randomBytes(32).toString('hex'), USE_MEMORY_DB:'false'},
  });
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
  const response = await fetch(base+'/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer:{name:'Restart QA',phone:'9876543210',address:'42 Synthetic QA Street'},items:[{productId:menu.data[0].id,quantity:2}]})});
  assert.equal(response.status,201); const order = (await response.json()).data;
  await stop(); await start();
  const read = await fetch(base+'/orders/'+order.id); assert.equal(read.status,200);
  const restored = (await read.json()).data;
  assert.equal(restored.orderNumber,order.orderNumber); assert.equal(restored.total,order.total);
  const reseeded = await (await fetch(base+'/menu')).json(); assert.equal(reseeded.data.length,16);
  console.log('PASS: compiled production server startup, saved order survives server restart, seed does not duplicate menu');
  await mongo.stop();
  const health = await fetch(base+'/health'); assert.equal(health.status,503);
  console.log('PASS: disconnected database changes live readiness endpoint to HTTP 503');
})().catch(err=>{console.error(err.message);process.exitCode=1;}).finally(async()=>{await stop();if(mongo)await mongo.stop();});
