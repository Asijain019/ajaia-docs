import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { markdownToHtml, clean } from '../src/convert.js';

let server, base;
test.before(async () => { server = createApp(':memory:').listen(0); base = `http://localhost:${server.address().port}`; });
test.after(() => server.close());

test('file-backed database creates a missing parent directory', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ajaia-docs-db-'));
  const nestedDb = path.join(dir, 'data', 'nested', 'docs.db');
  let app;
  try {
    app = createApp(nestedDb);
    assert.equal(existsSync(nestedDb), true);
  } finally {
    app?.locals.closeDatabase();
    rmSync(dir, { recursive: true, force: true });
  }
});

const call = (user, path, method = 'GET', body) => fetch(base + '/api' + path, {
  method, headers: { 'Content-Type': 'application/json', Cookie: `uid=${user}` }, body: body ? JSON.stringify(body) : undefined,
}).then(async (r) => ({ status: r.status, body: await r.json() }));

test('sharing: owner grants access, roles are enforced, strangers get 404', async () => {
  const { body: { id } } = await call('u_alice', '/docs', 'POST', { title: 'Plan' });
  assert.equal((await call('u_bob', `/docs/${id}`)).status, 404);

  assert.equal((await call('u_alice', `/docs/${id}/share`, 'POST', { email: 'bob@example.com', role: 'view' })).status, 200);
  assert.equal((await call('u_bob', `/docs/${id}`)).body.role, 'view');
  assert.equal((await call('u_bob', `/docs/${id}`, 'PUT', { content: '<p>x</p>' })).status, 403);
  assert.equal((await call('u_bob', `/docs/${id}/share`, 'POST', { email: 'carol@example.com', role: 'edit' })).status, 403);

  await call('u_alice', `/docs/${id}/share`, 'POST', { email: 'bob@example.com', role: 'edit' });
  assert.equal((await call('u_bob', `/docs/${id}`, 'PUT', { content: '<p>hi</p>' })).status, 200);
  assert.equal((await call('u_bob', `/docs/${id}`, 'PUT', { title: 'Hijack' })).status, 403);

  const list = await call('u_bob', '/docs');
  assert.equal(list.body.shared.length, 1);
  assert.equal(list.body.owned.length, 0);
  assert.equal((await call('u_carol', `/docs/${id}`)).status, 404);
});

test('persistence + validation + sanitization', async () => {
  const { body: { id } } = await call('u_alice', '/docs', 'POST', { title: 'Doc' });
  await call('u_alice', `/docs/${id}`, 'PUT', { title: ' Renamed ', content: '<h1>Hi</h1><p style="text-align:center"><span style="color:#167454;font-size:24px;background-color:#fff2b3">Styled</span> <b>b</b><script>alert(1)</script></p>' });
  const d = (await call('u_alice', `/docs/${id}`)).body;
  assert.equal(d.title, 'Renamed');
  assert.ok(d.content.includes('<h1>Hi</h1>') && d.content.includes('<b>b</b>'));
  assert.ok(d.content.includes('text-align:center') && d.content.includes('color:#167454') && d.content.includes('font-size:24px') && d.content.includes('background-color:#fff2b3'));
  assert.ok(!d.content.includes('script'));
  assert.equal((await call('u_alice', `/docs/${id}`, 'PUT', { title: '   ' })).status, 400);
  assert.equal((await call('nobody', '/docs')).status, 401);
});

test('upload converts markdown to a new owned document; rejects bad types', async () => {
  const send = (name, content) => { const fd = new FormData(); fd.append('file', new Blob([content]), name);
    return fetch(base + '/api/upload', { method: 'POST', headers: { Cookie: 'uid=u_alice' }, body: fd }).then(async (r) => ({ status: r.status, body: await r.json() })); };
  const ok = await send('notes.md', '# Title\n\n- one\n- two\n\nSome **bold** text');
  assert.equal(ok.status, 201);
  const d = (await call('u_alice', `/docs/${ok.body.id}`)).body;
  assert.equal(d.title, 'notes');
  assert.ok(d.content.includes('<h1>Title</h1>') && d.content.includes('<li>two</li>') && d.content.includes('<b>bold</b>'));
  assert.equal((await send('evil.exe', 'x')).status, 400);
});

test('converters', () => {
  assert.equal(markdownToHtml('1. a\n2. b'), '<ol><li>a</li><li>b</li></ol>');
  assert.equal(clean('<p onclick="x">ok</p>'), '<p>ok</p>');
  const styled = clean('<p style="text-align:center;background-image:url(javascript:alert(1))"><span style="color:#167454;font-size:24px;background-color:#fff2b3">Styled</span></p>');
  assert.match(styled, /text-align:center/);
  assert.match(styled, /color:#167454/);
  assert.match(styled, /font-size:24px/);
  assert.match(styled, /background-color:#fff2b3/);
  assert.match(clean('<span style="font-size:22px">Readable</span>'), /font-size:22px/);
  assert.match(clean('<span style="background-color:rgb(255, 242, 179);color:rgb(22, 116, 84)">RGB color</span>'), /rgb\(255, 242, 179\)/);
  assert.doesNotMatch(styled, /background-image|javascript:/);
  assert.doesNotMatch(clean('<span style="font-size:999px;color:red">Unsafe</span>'), /font-size|color:/);
});

test('demo account list is available even with a stale cookie', async () => {
  const r = await fetch(`${base}/api/users`, { headers: { Cookie: 'uid=stale-user' } });
  assert.equal(r.status, 200);
  assert.deepEqual((await r.json()).map((user) => user.email), [
    'alice@example.com', 'bob@example.com', 'carol@example.com',
  ]);
});

test('markdown export: round-trips formatting, respects access', async () => {
  const { body: { id } } = await call('u_alice', '/docs', 'POST', { title: 'My: Spec!' });
  await call('u_alice', `/docs/${id}`, 'PUT', { content: '<h2>Goals</h2><p>Ship <b>fast</b> &amp; <i>safe</i></p><ul><li>one</li><li>two</li></ul><ol><li>a</li></ol>' });
  const get = (u) => fetch(`${base}/api/docs/${id}/export`, { headers: { Cookie: `uid=${u}` } });
  const r = await get('u_alice');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-disposition'), /My-Spec\.md/);
  assert.equal(await r.text(), '# My: Spec!\n\n## Goals\n\nShip **fast** & *safe*\n\n- one\n- two\n\n1. a\n');
  assert.equal((await get('u_bob')).status, 404);
  await call('u_alice', `/docs/${id}/share`, 'POST', { email: 'bob@example.com', role: 'view' });
  assert.equal((await get('u_bob')).status, 200); // view-only can export
});
