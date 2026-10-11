# ARSAM Exam Lab

A Persian, RTL exam dashboard and intentionally vulnerable **security-learning lab**. This is a static front-end prototype built with HTML, CSS and vanilla JavaScript. All data is fictional and local to the browser.

## Demo login
- Username: `ARSAM`
- Password: `ARSAM92$#`

## Features
- Responsive student dashboard with three-dot menu, exam library and progress history
- Five-question web-security demo exam with local scoring and answer review
- Local-only admin panel for creating practice exams
- "تحلیل آزمون" video section displayed after a result
- Persian RTL UI and local-browser persistence
- GitHub Actions workflow for GitHub Pages deployment

## Run locally
1. Download the ZIP from this ChatGPT conversation and extract it.
2. Open `index.html` in a modern browser, or run `python -m http.server 8000` from the project directory and visit `http://localhost:8000`.

The ZIP contains `assets/analysis.mp4`. The video binary is not included in this GitHub repository commit yet; to make it appear on the hosted site, upload that file from the ZIP to the repository at exactly `assets/analysis.mp4`.

## Publish with GitHub Pages
In **Settings → Pages**, select **GitHub Actions** as the build/deployment source. A workflow in `.github/workflows/pages.yml` then attempts to deploy the static site after pushes to `main`. Check the Actions tab for its status.

## Intentionally vulnerable patterns
This project intentionally demonstrates risks for authorized practice:
- Demo credentials are embedded in client-side JavaScript.
- `?mode=admin` grants an admin view on the client without authentication.
- The browser receives exam answer keys before the exam starts.
- Scores, sessions and admin-created exams are stored in editable `localStorage`.
- Hiding the browser video download control does not secure a publicly served media file.

These are **training vulnerabilities only**. There is no backend, database, server-side authorization, private media storage, or real user isolation.

**Never use this project for real accounts, real exams, private documents, or production data.** Test only this lab or systems you own / have explicit permission to assess.
