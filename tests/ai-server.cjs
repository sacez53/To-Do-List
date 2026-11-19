const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const api = import('../server/worker.mjs');
function database() {
  const db = new DatabaseSync(':memory:'); db.exec(fs.readFileSync('server/schema.sql', 'utf8'));
  return { db, prepare(sql) { return { bind(...values) { return { async first() { return db.prepare(sql).get(...values) || null; }, async run() { return db.prepare(sql).run(...values); } }; } }; } };
}
const env = () => ({ GEMINI_API_KEY: 'fake-provider-secret', GEMINI_MODEL: 'test-model', AI_ACCESS_CODE: 'test-access-code-1234567890', ALLOWED_ORIGINS: 'https://todo.example', AI_QUOTA: database() });
const proposal = { text: 'Appeler le garage', notes: '', priority: 'normal', due: '2026-11-20', dueTime: '14:00', subtasks: ['Trouver le numéro'] };
const payload = { mode: 'phrase', text: 'Appeler le garage demain à 14 h', notes: '', today: '2026-11-19', timeZone: 'Europe/Paris', language: 'fr' };
async function withService(provider, action) {
  const { handleRequest } = await api; const config = env(); const pending = [];
  const call = (body = payload, headers = {}, method = 'POST') => handleRequest(new Request('https://worker.example/api/ai', {
    method, headers: { Origin: config.ALLOWED_ORIGINS, Authorization: `Bearer ${config.AI_ACCESS_CODE}`, 'Content-Type': 'application/json', ...headers },
    ...(method === 'POST' ? { body: JSON.stringify(body) } : {})
  }), config, { waitUntil(promise) { pending.push(promise); } }, provider);
  try { await action(call, config); } finally { await Promise.all(pending); config.AI_QUOTA.db.close(); }
}
const output = value => Response.json({ status: 'completed', steps: [{ type: 'model_output', content: [{ type: 'text', text: JSON.stringify(value) }] }] });
test('Worker fails closed without secrets and never forwards account data or the access code to Google', async () => {
  let captured;
  await withService(async (url, options) => { captured = { url, options }; return output(proposal); }, async (call, config) => {
    const response = await call({ ...payload, username: 'private', todos: ['secret'], encKey: 'never-forward' });
    assert.equal(response.status, 200); assert.deepEqual(await response.json(), proposal);
    assert.equal(captured.options.headers['x-goog-api-key'], config.GEMINI_API_KEY);
    const body = JSON.parse(captured.options.body); assert.equal(body.store, false);
    assert.deepEqual(JSON.parse(body.input), payload);
    assert(!captured.options.body.includes('never-forward')); assert(!captured.options.body.includes(config.AI_ACCESS_CODE));
    delete config.GEMINI_API_KEY; assert.equal((await call()).status, 503);
  });
});
test('Worker access checks, body validation and persisted rate limit run before provider calls', async () => {
  let calls = 0;
  await withService(async () => { calls++; return output(proposal); }, async call => {
    assert.equal((await call(payload, { Authorization: 'Bearer wrong' })).status, 401);
    assert.equal((await call(payload, { Origin: 'https://other.example' })).status, 403);
    assert.equal((await call({ ...payload, mode: 'arbitrary-tool' })).status, 400);
    assert.equal((await call({ ...payload, notes: 'x'.repeat(17000) })).status, 413);
    assert.equal(calls, 0);
    for (let i = 0; i < 6; i++) assert.equal((await call()).status, 200);
    assert.equal((await call()).status, 429); assert.equal(calls, 6);
    const preflight = await call(null, {}, 'OPTIONS'); assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), 'https://todo.example');
  });
});
test('Worker errors and invalid dates or subtasks cannot become accepted drafts', async () => {
  for (const invalid of [{ ...proposal, due: '2026-02-30' }, { ...proposal, due: null }, { ...proposal, subtasks: [''] }, { ...proposal, subtasks: Array(31).fill('step') }]) {
    await withService(async () => output(invalid), async call => assert.equal((await call()).status, 502));
  }
  await withService(async () => new Response('{}', { status: 429 }), async call => assert.equal((await call()).status, 429));
  await withService(async () => { throw new Error('provider secret must not leak'); }, async call => {
    const response = await call(); assert.equal(response.status, 503); assert.equal((await response.text()).includes('secret'), false);
  });
});
test('D1 SQL limits parallel calls across addresses to 100 per UTC day and six per minute', async () => {
  const { reserveQuota } = await api, db = database(), now = Date.parse('2026-11-19T12:00:00Z');
  try {
    const checks = await Promise.all(Array.from({ length: 110 }, (_, index) => reserveQuota(db, 'ip-'+index, now)));
    assert.equal(checks.filter(Boolean).length, 100);
    assert.equal(await reserveQuota(db, 'new-address', now+86400000), true);
    const sameAddress = await Promise.all(Array.from({ length: 7 }, () => reserveQuota(db, 'same-ip', now+86400000)));
    assert.equal(sameAddress.filter(Boolean).length, 6);
    assert.equal(await reserveQuota(db, 'same-ip', now+86460000), true);
  } finally { db.db.close(); }
});
