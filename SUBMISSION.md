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

## Add before final submission

- **Live product URL:** deploy the app and paste the public Render URL here.
- **Google Drive folder URL:** upload this repository’s source and required documents, then add the share link.
- **Walkthrough video URL:** after recording your 3–5 minute video, create `VIDEO_URL.txt` containing the unlisted video URL and include it in the Drive folder (and repository if desired).
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

**Working:** create, rename, rich-text edit, autosave, reopen, SQLite persistence, formatting, file import (`.txt`, `.md`, `.docx`), owner/editor/viewer sharing, title search, browser-local favorites, starter templates, duplicate, print, Markdown export, appearance toggle, writing statistics, server-side authorization/sanitization. Six automated tests pass.

**Incomplete:** live deployment and hosted persistence verification, walkthrough recording, real authentication, invitations to unknown users, multi-user live editing, conflict resolution, comments, and version history.

**Next with another 2–4 hours:** deploy and manually verify end-to-end flows; add real authentication/invitations; add version-aware saves; add a browser-level sharing test.
