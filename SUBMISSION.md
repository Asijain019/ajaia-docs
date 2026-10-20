# Submission contents

| Deliverable | Location / status |
|---|---|
| Source code | `src/`, `public/`, `test/` |
| Local setup, features, demo accounts, deployment notes | `README.md` |
| Architecture note | `ARCHITECTURE.md` |
| AI workflow note | `AI_WORKFLOW.md` |
| Submission checklist | `SUBMISSION.md` |
| Walkthrough video URL | `VIDEO_URL.txt` (replace placeholder after recording) |
| Deployment files | `Dockerfile`, `render.yaml` |
| Dependencies | `package.json`, `package-lock.json` |

## Links still to add

- **Live product:** Deploy first, then add the public URL here.
- **Walkthrough:** Record a 3–5 minute video and paste its unlisted URL into `VIDEO_URL.txt`.
- **Google Drive folder:** Create the folder and add its share link when preparing the final submission.

## Reviewer access

Choose a demo profile from the sign-in page; no password is required:

- Alice Chen — `alice@example.com`
- Bob Okafor — `bob@example.com`
- Carol Singh — `carol@example.com`

For the sharing flow, sign in as Alice, create a document, share it with Bob as editor or viewer, then sign in as Bob in a separate browser window.

## Status

**Implemented:** document create/rename/edit/autosave/reopen; formatting; `.txt`, `.md`, and `.docx` import; SQLite persistence; owner/editor/viewer sharing; Markdown export; title search; browser-local favorites; templates; duplicate; print; light/dark appearance; word/character count; server-side validation and sanitization. Six automated tests pass.

**Still required from the submitter:** deploy the application and verify persistent storage, record the walkthrough, add the live/video/Drive URLs, and perform a human browser pass of the new UI and sharing flow.
