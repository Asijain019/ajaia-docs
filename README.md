# Ajaia Docs

**A calm, capable workspace for writing and sharing team documents.**

| Live product | Source |
|---|---|
| [ajaia-docs-9w27.onrender.com](https://ajaia-docs-9w27.onrender.com) | [github.com/Asijain019/ajaia-docs](https://github.com/Asijain019/ajaia-docs) |

The live service responds successfully. Its SQLite data may not survive a service restart unless a persistent disk is mounted at `/data`; hosted persistence has not been confirmed.

## Run locally

**Requirements:** Node.js 22.13 or newer and npm.

```powershell
cd ajaia-docs
npm ci
npm start
```

Open [http://localhost:3000](http://localhost:3000). Keep the terminal running while using the application; press **Ctrl+C** to stop the server. Run checks in another terminal with `npm test`. There is no frontend build step.

Optional settings: `PORT` (default `3000`) and `DB_FILE` (default `./data.db`).

## Try the product

Sign-in uses simulated demo accounts with no passwords. Do not store private or sensitive documents.

| Profile | Email |
|---|---|
| Alice Chen | `alice@example.com` |
| Bob Okafor | `bob@example.com` |
| Carol Singh | `carol@example.com` |

To test sharing, sign in as Alice, create a document, select **Share**, and grant Bob **Can edit** or **Can view**. Sign in as Bob in a second browser window to see the shared document and role restrictions.

## Features

- Create, rename, edit, autosave, reopen, duplicate, and delete documents.
- Format selected text: bold, italic, underline, font size, text color, highlight; set paragraph styles and alignment; create lists; undo and redo.
- Adjust the overall document reading size from 18px to 30px (22px default).
- Import `.txt`, `.md`, and `.docx` files into editable documents (5 MB maximum).
- Share with seeded users as editor or viewer; owners can update and revoke access.
- Search document titles; favorite documents in the current browser; start from meeting, project, and weekly-update templates.
- Switch light/dark appearance, view word and character counts, print/save from the browser, and export Markdown.
- Persist documents and shares in SQLite; sanitize saved HTML with an allow-list.

Markdown conversion deliberately supports a subset of Markdown. Favorites and appearance preferences are stored in the browser.

## Assignment handoff

The submission bundle also includes:

- [Architecture](ARCHITECTURE.md) — system diagrams, data flow, deployment path, and tradeoffs.
- [AI workflow](AI_WORKFLOW.md) — tools used, engineering judgment, and verification.
- [Submission checklist](SUBMISSION.md) — exact contents, reviewer accounts, live URL, and remaining video/Drive steps.

The walkthrough video and Google Drive folder are still to be added by the submitter. Record a 3–5 minute walkthrough and add its unlisted URL to the Drive folder.

## Known limitations

- Demo authentication is simulated and unsuitable for production or sensitive data.
- Sharing only supports seeded users; there is no external invitation flow.
- Saving is last-write-wins; real-time editing, version history, comments, and conflict handling are not implemented.
- The editor uses browser `contenteditable` and deprecated `execCommand`.
- SQLite persistence on the hosted service depends on its Render disk configuration.
