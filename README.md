# Ajaia Docs

A polished, lightweight collaborative document workspace built for the Ajaia Full Stack Product Engineer assignment. It focuses on a useful writing loop—create, organize, edit, import, share, and export—rather than attempting to reproduce every feature of Google Docs.

## Run locally

Requirements: Node.js **22.13 or newer** and npm. The app uses Node's built-in `node:sqlite` module.

```sh
npm ci
npm start
```

Open [http://localhost:3000](http://localhost:3000). Run the automated tests in another terminal with:

```sh
npm test
```

There is no frontend build step. Optional environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `DB_FILE` | `./data.db` | SQLite database file path |

## Demo accounts

Authentication is intentionally mocked; select an account on the sign-in screen. There are no passwords.

| Name | Email |
|---|---|
| Alice Chen | `alice@example.com` |
| Bob Okafor | `bob@example.com` |
| Carol Singh | `carol@example.com` |

To try sharing, sign in as Alice, create a document, and use **Share** to grant Bob **Can edit** or **Can view**. Sign in as Bob in a separate browser or private window to see the shared document and role restrictions.

## What works

- Create, rename, edit, autosave, and reopen documents; saved content survives refreshes and server restarts when the SQLite file is retained.
- Rich-text bold, italic, underline, title/headings, quotes, left/center/right/justified alignment, selected-text font sizes and colors, highlighting, ordered and unordered lists, indent/outdent, undo, and redo.
- Import `.txt`, `.md`, or `.docx` files into a new editable document. The UI and server enforce a **5 MB** limit. Markdown import supports a small subset: headings, bold/italic, lists, and paragraphs.
- Share with existing demo users as editor or viewer; owners can update or revoke access. Owned and shared documents are shown separately.
- Export documents as Markdown or print/save to PDF from the browser.
- Search document titles, favorite documents in the current browser, and start from meeting notes, project brief, or weekly update templates.
- Duplicate readable documents, switch between light and dark appearance, and see a live word/character count.
- Server-side permission checks, title validation, HTML allow-list sanitization, and visible save/error status.

## Persistence and deployment

Documents and sharing data are stored in SQLite. For local development, the default `data.db` is created in the project directory and is excluded from Git. Set `DB_FILE` to change its location.

Render is the recommended deployment target for the included Docker setup (`Dockerfile` and `render.yaml`). After connecting the repository, deploy it as a Blueprint. The app listens on `PORT` and is configured to use `/data/data.db` in the container. **A container's local filesystem is not durable across redeploys/restarts unless a persistent disk is configured and mounted at `/data`.** Confirm current Render plan and disk requirements before relying on hosted persistence. The included free-plan Blueprint does not provision a persistent disk.

Vercel is not a drop-in deployment target: its serverless filesystem is ephemeral, which conflicts with this app's SQLite storage. Deploying there reliably would require replacing SQLite with a hosted database and adapting the server entry point.

## Tests

`npm test` runs six automated tests covering sharing permissions, document validation, safe formatting-style persistence and sanitization, Markdown upload, converters, public demo-account listing, and Markdown export access rules.

## Known limitations

- Demo sign-in identifies a seeded user but provides **no real authentication**. Do not expose this app as a production service or store sensitive documents.
- Sharing is limited to the seeded users; there is no external invitation flow.
- Saves are last-write-wins. There is no live co-editing, conflict resolution, history, comments, or offline mode.
- The editor uses the browser's `contenteditable` and deprecated `execCommand` APIs to keep the implementation small and build-free.

The assignment handoff notes are in [ARCHITECTURE.md](ARCHITECTURE.md), [AI_WORKFLOW.md](AI_WORKFLOW.md), and [SUBMISSION.md](SUBMISSION.md). The live URL and walkthrough link are not yet filled in; see `VIDEO_URL.txt`.
