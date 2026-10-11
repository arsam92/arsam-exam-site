# ARSAM Exam Lab

A Persian, RTL exam dashboard and intentionally vulnerable **security-learning lab**. It is a static front-end prototype built with HTML, CSS and vanilla JavaScript.

## Demo login
- Username: `ARSAM`
- Password: `ARSAM92$#`

## Features
- Responsive student dashboard with an exam library and progress history
- A sample five-question web-security quiz with local scoring
- A local-only admin panel for creating practice exams and questions
- An "تحلیل آزمون" video section shown after a test result
- Persian RTL layout, mobile navigation and local-browser persistence

## Run it
Open `index.html` in a modern browser. For a local web server, you can run `python -m http.server 8000` from this directory, then visit `http://localhost:8000`.

To publish using GitHub Pages: open **Settings → Pages**, choose the `main` branch and `/ (root)` as the source, then save.

## Important safety note
This project intentionally demonstrates insecure client-side patterns for authorized practice. Authentication, admin access, exam content, answer keys and results are client-side only and can be inspected or changed by the person using the browser. Admin-created exams and results are saved only in that browser's `localStorage`; there is no server, database, user isolation, or real authentication. The supplied video is a public static asset and cannot be made truly confidential by hiding the download control.

**Do not use this project for real accounts, real exams, private files, or production data.** Keep all test data fictional and use the lab only in environments you own or have explicit permission to assess.
