# TalkCS thesis – LaTeX source

## Build
- **Overleaf:** upload the zip as a new project and click Recompile (pdfLaTeX, BibTeX run automatically).
- **Local:** `latexmk -pdf main.tex`  (or pdflatex → bibtex → pdflatex → pdflatex)
- **Lightweight alternative:** `tectonic -X compile main.tex` (`brew install tectonic`, ~20 MB; downloads only the packages it needs and caches them)

## Fill in before submitting
1. `main.tex`, lines 13–19: your surname, supervisor name and title, and department.
2. Put the signed **Thesis Topic Registration Form** next to `main.tex` as
   `topic_registration_form.pdf`. It replaces the red placeholder page automatically.
3. Put the official ELTE crest as `figures/elte_logo.png` (or `.pdf`). The ELTE IK thesis
   template ships it as `elte_cimer_szines`.
4. Take screenshots and save them in `figures/screenshots/` under these exact names.
   Each one replaces its grey placeholder box automatically. Use PNG and the dark theme
   unless the caption says otherwise.

| File | What to capture |
|---|---|
| register.png | /register page |
| login.png | /login page |
| forgot-password.png | /forgot-password after submitting (the "Check your email" state) |
| home.png | Home page, with posts in the feed and trending sidebars filled |
| category.png | A category page, Posts tab |
| composer.png | Create Post dialog with tags filled in and the "similar posts found" box visible |
| post.png | A post with nested comments and one accepted answer (green) |
| resources.png | A category page, Resources tab with a few files |
| search.png | Search results showing posts, categories and users |
| badges.png | /profile/<user>/badges |
| leaderboard.png | /leaderboard |
| profile.png | Someone else's profile (Follow button and level progress bar visible) |
| notifications.png | Notification bell opened, with a few notifications |
| chat.png | /chat with an open conversation |
| calendar.png | /calendar month view with events of several types |
| admin.png | Admin Panel, Analytics tab |
| theme-dark.png, theme-light.png | The same page in both themes |
| backend-tests.png | `backend/build/reports/tests/test/index.html` opened in a browser after `./gradlew test` |
| frontend-tests.png | Terminal output of `npm test -- --run` |

## Structure
- `main.tex` – document skeleton and the fields to fill in
- `preamble.tex` – packages, page style, code listing style, screenshot macro
- `titlepage.tex`
- `chapters/` – introduction, userdoc, devdoc, tables (database schema), testing, conclusion, acknowledgements
- `figures/` – TikZ diagrams (architecture, sequence diagrams, ER, use case, wireframes) and `screenshots/`
- `references.bib`
