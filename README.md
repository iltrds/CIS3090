# CIS*3090 midterm study site

A static study site for CIS*3090 Parallel Programming with no build step and no dependencies. A switch in the header moves between the two midterms.

## Midterm 2 (Thursday, November 26, 2026) — `m2/`

Covers Lectures 9–11 and 14–18 (MPI, collectives, performance, GPGPU and Warp, image processing) plus data layout from Lecture 7, following the prof's study guide. Lectures 12–13 are excluded.

- **Read** (`m2/read.html`) — eight topics, a Pthreads vs MPI vs Warp comparison, a cheat sheet, and demos for MPI collectives, message matching, convolution and border strategies, mean vs median filtering, GPU transfer cost, Amdahl's law and caches.
- **Flashcards** (`m2/flashcards.html`) — 117 cards.
- **Quizzes** (`m2/quiz.html`) — 126 questions, including 15 select-all-that-apply questions scored like the midterm (partial credit, any wrong pick scores 0) and the study guide's five practice questions.
- **Practice exam** (`m2/exam.html`) — 27 questions. Exam A is 27 new questions; Exam B draws 27 from the quiz bank. The timer assumes 60 minutes.

## Midterm 1 (Tuesday, October 20, 2026) — site root

- **Read** (`read.html`) — all eight topics from Lectures 1–8 and textbook Ch. 1, 2 and 4, plus a cheat sheet and ten interactive demos (concurrency, work splitting, reductions, create/join, odd-even sort, race conditions, Amdahl's law, caches, pipelining, heat diffusion).
- **Review** (`review.html`) — the prof's recommended textbook exercises (Moodle, Week 5) with a worked solution for each, hidden until you open it, and a done checklist.
- **Flashcards** (`flashcards.html`) — 110 cards by topic. Marks which ones you know.
- **Quizzes** (`quiz.html`) — 110 multiple-choice questions by topic, including 26 built from the recommended exercises, with an explanation after each answer.
- **Practice exam** (`exam.html`) — a timed 60-minute, 50-question exam. Exam A is 50 questions not used in the quizzes; Exam B draws 50 from the quiz bank. Exam C has all 26 recommended-exercise questions plus 24 from the other topics. Includes code-reading and graph-reading questions, a topic breakdown and a full review.

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

- Midterm 1: `data/flashcards.js`, `data/bank.js`, `data/exam.js`, `data/review.js`
- Midterm 2: `m2/data/flashcards.js`, `m2/data/bank.js`, `m2/data/exam.js`

Each question has `topic`, `kind` (`concept`, `calc`, `code` or `graph`), `q`, optional `ctx`, `code` or `chart`, its `options`, the correct `answer`, and a `why` explanation. For a select-all-that-apply question, `answer` is an array of option indices. Answer choices are shuffled when shown, so the stored order doesn't matter. Wrap code words in backticks to format them.

Midterm 1 topic keys: `why`, `design`, `pthreads`, `oddeven`, `sync`, `perf`, `hw`, `heat`, `review`.
Midterm 2 topic keys: `perf`, `arch`, `mpi`, `coll`, `gpu`, `warp`, `img`, `compare`, `guide`.

A page belongs to Midterm 2 when its `<html>` tag has `data-exam="mt2"`; `assets/common.js` then uses Midterm 2's topics, date and storage.

The site uses Atkinson Hyperlegible and JetBrains Mono from Google Fonts and falls back to system fonts offline.
