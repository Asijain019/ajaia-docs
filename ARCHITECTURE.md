# Architecture note

Ajaia Docs is a single-process Node.js and Express application backed by SQLite (`node:sqlite`). The frontend is a responsive static page with a `contenteditable` editor; no frontend build step or paid service is required.

| Area | Implementation |
|---|---|
| UI | `public/index.html` — workspace, editor, templates, import, sharing, and local appearance/favorite preferences |
| API and persistence | `src/app.js` — Express routes, SQLite tables, authentication simulation, and server-side access checks |
| Import/export | `src/convert.js` — `.txt`, `.md`, and `.docx` conversion, allow-list sanitization, Markdown export |
| Verification | `test/api.test.js` — six API and converter tests |

SQLite stores seeded demo users, documents, and document shares. User roles are enforced on the server: owners manage documents and shares; editors update content; viewers can read and export but not edit. Unshared documents return 404 to avoid exposing their existence. All persisted editor and imported HTML is sanitized against a narrow allow-list before storage.

The writing flow uses debounced autosave, save status, role indicators, and a live word/character count. The workspace includes title search, local favorites, starter templates, document duplication, browser printing, and a light/dark appearance toggle. These additions use browser `localStorage` and do not require changes to the server data model.

The editor toolbar provides paragraph styles, alignment, font sizes, text color, and highlight. Inline formatting is applied to the current text selection. Persisted inline styles are constrained by the server sanitizer to known font sizes, six-digit hex colors, and standard paragraph alignments; arbitrary styles and attributes are discarded.

## Scope and tradeoffs

- `contenteditable` and `execCommand` were chosen over a larger editor dependency to keep setup simple and the assignment deliverable build-free. `execCommand` is deprecated and should be replaced with a maintained editor if the product grows.
- Authentication is deliberately mocked with seeded accounts and a `uid` cookie. It is only suitable for a demo, not a public production service.
- Saves are last-write-wins. There is no concurrent editing protocol, history, or conflict detection.
- The DOCX import uses Mammoth; Markdown import is a small subset. Markdown export is a compact converter for the supported HTML subset; nested list fidelity is limited.
- The app can print through the browser's print dialog, which lets users save a PDF without a server-side PDF dependency.
- Render configuration is included, but a mounted persistent disk is required to retain SQLite data across service restarts/redeploys. This hosted behavior still needs deployment verification.

## Next steps

If extending this beyond the assignment, first add conflict-aware saves, then real authentication and invitations. A maintained rich-text editor and a browser-level end-to-end sharing test would follow. Live collaboration, version history, and comments are intentionally out of scope for this slice.
