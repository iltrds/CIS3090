# CIS*3090 Midterm 1 study site

A static study site for the CIS*3090 Parallel Programming Midterm 1 (Tuesday, October 20, 2026). It has no build step and no dependencies.

- **Read** (`read.html`) — all eight topics from Lectures 1–8 and textbook Ch. 1, 2 and 4, plus a cheat sheet.
- **Flashcards** (`flashcards.html`) — 101 cards by topic. Marks which ones you know.
- **Quizzes** (`quiz.html`) — 84 multiple-choice questions by topic, with an explanation after each answer.
- **Practice exam** (`exam.html`) — a timed 60-minute, 50-question exam. Exam A is 50 questions not used in the quizzes; Exam B draws 50 from the quiz bank. Includes code-reading and graph-reading questions, a topic breakdown and a full review.

Progress (known cards, best quiz scores, exam history, an exam in progress) is saved in your browser's local storage. Nothing is sent anywhere.

## Deploy to GitHub Pages

1. Create a new repository on GitHub (for example `cis3090-midterm`). It can be public or private, but free accounts need it public for Pages.
2. Upload every file in this folder to the repository root, keeping the `assets/` and `data/` folders. Include the empty `.nojekyll` file.
   - From the command line:
     ```bash
     cd cis3090-study
     git init
     git add .
     git commit -m "Study site"
     git branch -M main
     git remote add origin https://github.com/<your-username>/cis3090-midterm.git
     git push -u origin main
     ```
   - Or on github.com: **Add file → Upload files**, then drag in the folder's contents.
3. In the repository, open **Settings → Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**, pick **main** and **/ (root)**, and save.
4. After a minute or two the site is live at `https://<your-username>.github.io/cis3090-midterm/`.

## Run locally

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Editing content

- Flashcards: `data/flashcards.js`
- Quiz questions: `data/bank.js`
- Practice Exam A: `data/exam.js`

Each question has `topic`, `kind` (`concept`, `calc`, `code` or `graph`), `q`, optional `code` or `chart`, four `options`, the index of the correct `answer`, and a `why` explanation. Answer choices are shuffled when shown, so the stored order doesn't matter. Wrap code words in backticks to format them.

Topic keys: `why`, `design`, `pthreads`, `oddeven`, `sync`, `perf`, `hw`, `heat`.

The site uses Atkinson Hyperlegible and JetBrains Mono from Google Fonts and falls back to system fonts offline.
