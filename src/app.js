import express from 'express';
import multer from 'multer';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clean, fileToHtml, htmlToMarkdown, ALLOWED_UPLOADS } from './convert.js';

const SEED_USERS = [
  ['u_alice', 'alice@example.com', 'Alice Chen'],
  ['u_bob', 'bob@example.com', 'Bob Okafor'],
  ['u_carol', 'carol@example.com', 'Carol Singh'],
];
const httpErr = (status, message) => Object.assign(new Error(message), { status });

export function createApp(dbFile = ':memory:') {
  const db = new DatabaseSync(dbFile);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '<p><br></p>',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS shares (
      doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      role TEXT NOT NULL CHECK (role IN ('edit','view')),
      PRIMARY KEY (doc_id, user_id));
  `);
  db.exec('PRAGMA foreign_keys = ON');
  const seed = db.prepare('INSERT OR IGNORE INTO users VALUES (?,?,?)');
  SEED_USERS.forEach((u) => seed.run(...u));

  const q = (sql) => db.prepare(sql);
  const now = () => new Date().toISOString();

  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), '../public')));

  // Mocked auth: a "uid" cookie set by /api/login for one of the seeded users. NOT production auth.
  app.use('/api', (req, res, next) => {
    if (req.path === '/login' || req.path === '/users' && req.method === 'GET') return next();
    const uid = /(?:^|;\s*)uid=([^;]+)/.exec(req.headers.cookie || '')?.[1];
    const user = uid && q('SELECT * FROM users WHERE id=?').get(uid);
    if (!user) return next(httpErr(401, 'Not signed in'));
    req.user = user; next();
  });

  app.get('/api/users', (req, res) => res.json(q('SELECT id,email,name FROM users').all()));
  app.post('/api/login', (req, res, next) => {
    const user = q('SELECT * FROM users WHERE email=?').get(String(req.body?.email || '').toLowerCase());
    if (!user) return next(httpErr(404, 'Unknown user'));
    res.setHeader('Set-Cookie', `uid=${user.id}; Path=/; HttpOnly; SameSite=Lax`);
    res.json(user);
  });
  app.post('/api/logout', (req, res) => { res.setHeader('Set-Cookie', 'uid=; Path=/; Max-Age=0'); res.json({ ok: true }); });
  app.get('/api/me', (req, res) => res.json(req.user));

  // Resolve a doc + the caller's role, or 404 (we don't reveal existence of docs the caller can't see).
  function access(id, user) {
    const doc = q('SELECT * FROM documents WHERE id=?').get(id);
    if (!doc) throw httpErr(404, 'Document not found');
    if (doc.owner_id === user.id) return { doc, role: 'owner' };
    const s = q('SELECT role FROM shares WHERE doc_id=? AND user_id=?').get(id, user.id);
    if (!s) throw httpErr(404, 'Document not found');
    return { doc, role: s.role };
  }
  const summary = `d.id, d.title, d.updated_at, u.name AS owner_name, u.email AS owner_email`;

  app.get('/api/docs', (req, res) => {
    const owned = q(`SELECT ${summary} FROM documents d JOIN users u ON u.id=d.owner_id WHERE d.owner_id=? ORDER BY d.updated_at DESC`).all(req.user.id);
    const shared = q(`SELECT ${summary}, s.role FROM shares s JOIN documents d ON d.id=s.doc_id JOIN users u ON u.id=d.owner_id WHERE s.user_id=? ORDER BY d.updated_at DESC`).all(req.user.id);
    res.json({ owned, shared });
  });

  const validTitle = (t) => {
    const title = String(t ?? '').trim();
    if (!title || title.length > 120) throw httpErr(400, 'Title must be 1-120 characters');
    return title;
  };

  app.post('/api/docs', (req, res, next) => {
    try {
      const id = randomUUID(); const t = now();
      q('INSERT INTO documents (id,owner_id,title,content,created_at,updated_at) VALUES (?,?,?,?,?,?)')
        .run(id, req.user.id, validTitle(req.body?.title ?? 'Untitled document'), clean(req.body?.content) || '<p><br></p>', t, t);
      res.status(201).json({ id });
    } catch (e) { next(e); }
  });

  app.get('/api/docs/:id', (req, res, next) => {
    try {
      const { doc, role } = access(req.params.id, req.user);
      const owner = q('SELECT name,email FROM users WHERE id=?').get(doc.owner_id);
      const shares = role === 'owner'
        ? q('SELECT u.email,u.name,s.role FROM shares s JOIN users u ON u.id=s.user_id WHERE s.doc_id=?').all(doc.id) : undefined;
      res.json({ ...doc, role, owner, shares });
    } catch (e) { next(e); }
  });

  // Export as Markdown: any role (owner/edit/view) may export what they can read.
  app.get('/api/docs/:id/export', (req, res, next) => {
    try {
      const { doc } = access(req.params.id, req.user);
      const slug = doc.title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 80) || 'document';
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${slug}.md"`);
      res.send(`# ${doc.title}\n\n${htmlToMarkdown(doc.content)}`);
    } catch (e) { next(e); }
  });

  app.put('/api/docs/:id', (req, res, next) => {
    try {
      const { doc, role } = access(req.params.id, req.user);
      if (role === 'view') throw httpErr(403, 'You have view-only access');
      const { title, content } = req.body || {};
      if (title !== undefined && role !== 'owner') throw httpErr(403, 'Only the owner can rename');
      const newTitle = title !== undefined ? validTitle(title) : doc.title;
      const newContent = content !== undefined ? clean(String(content)) : doc.content;
      const t = now();
      q('UPDATE documents SET title=?,content=?,updated_at=? WHERE id=?').run(newTitle, newContent, t, doc.id);
      res.json({ updated_at: t });
    } catch (e) { next(e); }
  });

  app.delete('/api/docs/:id', (req, res, next) => {
    try {
      const { doc, role } = access(req.params.id, req.user);
      if (role !== 'owner') throw httpErr(403, 'Only the owner can delete');
      q('DELETE FROM shares WHERE doc_id=?').run(doc.id); q('DELETE FROM documents WHERE id=?').run(doc.id);
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  app.post('/api/docs/:id/share', (req, res, next) => {
    try {
      const { doc, role } = access(req.params.id, req.user);
      if (role !== 'owner') throw httpErr(403, 'Only the owner can share');
      const target = q('SELECT * FROM users WHERE email=?').get(String(req.body?.email || '').trim().toLowerCase());
      if (!target) throw httpErr(404, 'No user with that email (try alice/bob/carol@example.com)');
      if (target.id === doc.owner_id) throw httpErr(400, 'You already own this document');
      const r = req.body?.role === 'view' ? 'view' : req.body?.role === 'edit' ? 'edit' : null;
      if (!r) throw httpErr(400, "Role must be 'edit' or 'view'");
      q('INSERT INTO shares VALUES (?,?,?) ON CONFLICT(doc_id,user_id) DO UPDATE SET role=excluded.role').run(doc.id, target.id, r);
      res.json({ email: target.email, name: target.name, role: r });
    } catch (e) { next(e); }
  });

  app.delete('/api/docs/:id/share/:email', (req, res, next) => {
    try {
      const { doc, role } = access(req.params.id, req.user);
      if (role !== 'owner') throw httpErr(403, 'Only the owner can change sharing');
      q('DELETE FROM shares WHERE doc_id=? AND user_id=(SELECT id FROM users WHERE email=?)').run(doc.id, req.params.email);
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  // Upload: .txt / .md / .docx -> new editable document owned by the uploader.
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
  app.post('/api/upload', upload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) throw httpErr(400, `Choose a file (${ALLOWED_UPLOADS.join(', ')})`);
      const name = req.file.originalname;
      const html = await fileToHtml(name, req.file.buffer);
      const id = randomUUID(); const t = now();
      const title = name.replace(/\.[^.]+$/, '').slice(0, 120) || 'Imported document';
      q('INSERT INTO documents (id,owner_id,title,content,created_at,updated_at) VALUES (?,?,?,?,?,?)').run(id, req.user.id, title, html, t, t);
      res.status(201).json({ id });
    } catch (e) { next(e.status ? e : httpErr(400, 'Could not read that file. Is it a valid .docx?')); }
  });

  app.use('/api', (req, res, next) => next(httpErr(404, 'Not found')));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : err.status || 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (5 MB max)' : status === 500 ? 'Server error' : err.message });
  });
  return app;
}
