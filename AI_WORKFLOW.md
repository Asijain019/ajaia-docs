# AI workflow note

**Tools used:** The initial application draft was created with Claude (chat and code-execution sandbox). GitHub Copilot CLI was used for the follow-up review, diagnosis, UI refinement, and regression test.

**Where AI helped:** AI accelerated the first Express/SQLite API, HTML sanitizer and file converters, editor UI, and test scaffolding. During the follow-up it helped reshape the interface and implement templates, title search, browser-local favorites, duplicate, print, writing statistics, and word-processor-style font size/color/highlight/alignment controls.

**Judgment and corrections:** The chosen scope remains intentionally small: no frontend framework/build pipeline, built-in Node SQLite, mocked seeded accounts, and role enforcement in server routes. A user-provided browser screenshot exposed missing demo-account buttons when an old cookie was present. The account-list route was made public and a regression test was added. The interface additions reuse the existing API and database instead of adding unrelated services or dependencies.

The text-formatting controls required extending the HTML sanitizer carefully. Only selected style properties and constrained values are accepted, with a regression test for persisted styles and rejected unsafe CSS.

**Verification:** `npm test` passes six tests covering role enforcement, validation and sanitization, Markdown upload and conversion, public demo-account loading (including stale cookies), and export access. A local HTTP smoke check confirmed that the app served its page. The redesigned interface still needs a human browser pass, and deployment/persistent storage have not yet been verified. Record any additional manual checks honestly during the walkthrough.
