# Architecture

## System overview

Ajaia Docs is a single-process Node.js application. Express serves the static browser UI and JSON API; SQLite stores seeded demo users, documents, and document shares. There is no frontend build step, external API, or required paid software dependency.

```mermaid
flowchart TB
    Browser[Browser workspace<br/>HTML, CSS, JavaScript]
    Static[Express static hosting]
    API[Express JSON API<br/>login, documents, sharing, import, export]
    Auth[Demo identity middleware]
    Access[Document access resolver<br/>owner / edit / view]
    Sanitize[HTML allow-list sanitizer]
    Convert[File converters<br/>TXT / Markdown / DOCX]
    DB[(SQLite<br/>users · documents · shares)]

    Browser -->|GET /| Static
    Browser -->|JSON + upload requests| API
    API --> Auth --> Access
    Access --> DB
    API --> Sanitize --> DB
    API --> Convert --> Sanitize
    API -->|Markdown export| DB
    API -->|JSON responses| Browser
```

## Source map

| Path | Responsibility |
|---|---|
| `public/index.html` | Responsive workspace, formatting toolbar, editor, templates, search, dialogs, browser-local preferences |
| `src/server.js` | Starts the Express app and selects the SQLite file |
| `src/app.js` | SQLite schema, seeded users, authentication simulation, document API, access checks, upload and export endpoints |
| `src/convert.js` | Plain-text/Markdown/DOCX conversion, HTML sanitization, Markdown export |
| `test/api.test.js` | Automated API, permission, conversion, persistence, sanitization, and deployment-path tests |
| `Dockerfile`, `render.yaml` | Container build and Render Blueprint |

## Document lifecycle and access

```mermaid
sequenceDiagram
    actor Writer
    participant Browser
    participant Server as Express server
    participant Policy as Access check and sanitizer
    participant Store as SQLite database
    Writer->>Browser: Create or import document
    Browser->>Server: Create or upload request
    Server->>Policy: Validate and sanitize content
    Policy->>Store: Save document and owner
    Store-->>Browser: Return document ID
    Writer->>Browser: Edit document
    Browser->>Browser: Debounce edits and show save status
    Browser->>Server: Save document changes
    Server->>Policy: Check owner or editor role
    Policy->>Store: Save sanitized content
    Writer->>Browser: Share with a teammate
    Browser->>Server: Request a share change
    Server->>Policy: Require owner role
    Policy->>Store: Save teammate access role
```

The `users`, `documents`, and `shares` tables store identity, document content, and access grants. The server resolves a document role for every document operation. An unshared document is returned as 404, viewers cannot write, and only owners may rename, delete, or manage shares. Editors can update content but cannot change the title.

## Editor and content safety

The browser uses `contenteditable` and the browser’s formatting commands to avoid a frontend dependency/build step. Formatting includes paragraph styles, alignment, selected-text font size, text color, highlight, emphasis, lists, and indentation. The base page reading size defaults to 22px and can be adjusted between 18px and 30px; that preference is stored locally in the browser. Autosave is debounced and reports save status; it is last-write-wins and does not resolve simultaneous edits.

The server sanitizes all editor and imported HTML before persistence. The sanitizer allows only needed structure and tightly constrained styles: supported pixel font sizes (including the 22px option), hex/RGB colors, and standard text alignment values. It removes unsupported attributes and CSS. Imported files become new editable documents owned by the uploader.

## Browser-local state

Favorites and the light/dark appearance preference are stored in `localStorage`, scoped by demo account where appropriate. They are convenience features, not server-backed collaboration data. Document content and shares are persisted in SQLite.

## Deployment path

```mermaid
flowchart LR
    Dev[Local source] --> Commit[Git commit]
    Commit --> GitHub[Public GitHub repository]
    GitHub --> Service[Live Render service]
    Service --> Container[Node 22 Docker service]
    Container --> App[Express app]
    App --> Disk[(SQLite at /data/data.db)]
    Note[Persistent disk mounted at /data<br/>required to retain data through restarts]
    Note -. configure in Render .-> Disk
```

The live service is available at [https://ajaia-docs-9w27.onrender.com](https://ajaia-docs-9w27.onrender.com). The server creates the configured SQLite parent directory at startup. The Render service stores SQLite at `/data/data.db`; a persistent disk mounted at `/data` is required for records to survive service restarts/redeploys. The current disk configuration has not been verified. The Vercel serverless filesystem is ephemeral and is not a drop-in storage solution for this SQLite app.

## Deliberate tradeoffs

- **No real authentication:** seeded demo accounts keep sharing easy to review; the app is not suitable for sensitive or production use.
- **No live collaboration:** saves use last-write-wins, with no history, presence, or conflict detection.
- **Small editor dependency footprint:** `execCommand` is deprecated; a maintained editor should replace it if the product is extended.
- **Conversion is intentionally bounded:** Markdown supports a small subset and DOCX is imported through Mammoth. Export targets that subset; browser print can save a PDF.

## Next engineering steps

1. Add version-aware saves to detect and explain concurrent edits.
2. Replace demo authentication with a secure sign-in and invitation flow.
3. Move to a maintained rich-text editor and add browser end-to-end tests.
4. Consider version history, comments, and real-time collaboration only after the core product is reliable.
