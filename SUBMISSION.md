# Assignment submission checklist

## Included in this repository

| Deliverable | File or directory |
|---|---|
| Application source | `src/`, `public/` |
| Automated tests | `test/` |
| Setup, features, demo accounts, and deployment instructions | `README.md` |
| Architecture note and system flowcharts | `ARCHITECTURE.md` |
| AI workflow note and workflow flowchart | `AI_WORKFLOW.md` |
| Submission checklist | `SUBMISSION.md` |
| Docker/Render deployment configuration | `Dockerfile`, `render.yaml` |
| Dependency manifest and lockfile | `package.json`, `package-lock.json` |

The local SQLite database and `node_modules` are intentionally excluded from the repository.

## Assignment links and remaining handoff

- **Live product URL:** [https://ajaia-docs-9w27.onrender.com](https://ajaia-docs-9w27.onrender.com) (responding; persistence across restarts still needs verification).
- **Google Drive folder URL:** upload this repository’s source and required documents, then add the share link.
- **Walkthrough video URL:** add your unlisted video URL directly to the Google Drive folder after recording.
- **Screenshots/demo GIF:** include only if reviewers need visual setup guidance; no special setup is currently required.

## Reviewer access

The sign-in page offers these simulated accounts; no password is required:

| Name | Email |
|---|---|
| Alice Chen | `alice@example.com` |
| Bob Okafor | `bob@example.com` |
| Carol Singh | `carol@example.com` |

For the sharing demonstration, sign in as Alice, create a document, share it with Bob as **Can edit** or **Can view**, then sign in as Bob in a separate browser window.

## Feature status

**Working:** create, rename, rich-text edit, autosave, reopen, SQLite persistence, formatting, file import (`.txt`, `.md`, `.docx`), owner/editor/viewer sharing, title search, browser-local favorites, starter templates, duplicate, print, Markdown export, appearance toggle, writing statistics, server-side authorization/sanitization, and automatic creation of the configured database directory. Seven automated tests pass.

**Incomplete:** hosted persistence verification, walkthrough recording, real authentication, invitations to unknown users, multi-user live editing, conflict resolution, comments, and version history.

**Next with another 2–4 hours:** deploy and manually verify end-to-end flows; add real authentication/invitations; add version-aware saves; add a browser-level sharing test.
