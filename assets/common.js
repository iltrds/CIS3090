/* Shared helpers for every page: header/nav, theme, storage, text formatting, charts, shuffling. */
(function () {
  'use strict';

  const EXAM_DATE = new Date('2026-10-20T00:00:00-04:00');

  const TOPICS = {
    why: 'Why parallel computing',
    design: 'Designing parallel programs',
    pthreads: 'Pthreads basics and POSIX',
    oddeven: 'Barriers and odd-even sort',
    sync: 'Thread synchronization',
    perf: 'Performance analysis',
    hw: 'Hardware and caches',
    heat: 'Heat diffusion case study'
  };
  const TOPIC_ORDER = Object.keys(TOPICS);

  /* ---------- Storage (per-browser conveniences only; never required) ---------- */
  const NS = 'cis3090-mt1:';
  const store = {
    get(key, fallback) {
      try {
        const raw = window.localStorage.getItem(NS + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { window.localStorage.setItem(NS + key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
    },
    remove(key) {
      try { window.localStorage.removeItem(NS + key); } catch (e) { /* ignore */ }
    }
  };

  /* ---------- Text ---------- */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  /* Minimal inline markdown: `code` and **bold** on escaped text. */
  function md(s) {
    const parts = String(s).split('`');
    return parts.map((p, i) => {
      if (i % 2 === 1) return '<code>' + esc(p) + '</code>';
      return esc(p).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    }).join('');
  }

  /* ---------- Random ---------- */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function optionOrder(q) { return shuffle(q.options.map((_, i) => i)); }

  /* ---------- Charts (inline SVG, themed through CSS variables) ---------- */
  function fmt(v) { return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100); }

  function chartFrame(spec, W, H, body) {
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(spec.title) + '" font-family="var(--font)" font-size="13">' +
      '<text x="16" y="26" font-size="15" font-weight="700" fill="var(--ink)">' + esc(spec.title) + '</text>' +
      (spec.note ? '<text x="16" y="46" font-size="12" fill="var(--ink-2)">' + esc(spec.note) + '</text>' : '') +
      body + '</svg>';
  }

  function lineChart(spec) {
    const W = 720, H = 400, L = 64, R = 120, T = 84, B = 62;
    const pw = W - L - R, ph = H - T - B, n = spec.x.length;
    const xAt = i => L + (n === 1 ? pw / 2 : (i * pw) / (n - 1));
    const yAt = v => T + (1 - v / spec.yMax) * ph;
    let s = '';
    const step = spec.yMax / 4;
    for (let k = 0; k <= 4; k++) {
      const v = k * step, y = yAt(v);
      s += '<line x1="' + L + '" x2="' + (L + pw) + '" y1="' + y + '" y2="' + y + '" stroke="var(--chart-grid)"/>';
      s += '<text x="' + (L - 10) + '" y="' + (y + 4) + '" text-anchor="end" fill="var(--ink-2)">' + fmt(v) + '</text>';
    }
    s += '<text x="16" y="' + (T - 14) + '" font-size="12" fill="var(--ink-2)">' + esc(spec.yLabel) + '</text>';
    spec.x.forEach((xv, i) => {
      s += '<text x="' + xAt(i) + '" y="' + (T + ph + 22) + '" text-anchor="middle" fill="var(--ink-2)">' + esc(xv) + '</text>';
    });
    s += '<text x="' + (L + pw / 2) + '" y="' + (H - 12) + '" text-anchor="middle" font-size="12" fill="var(--ink-2)">' + esc(spec.xLabel) + '</text>';

    const styles = {
      reference: { stroke: 'var(--ink-2)', width: 1.5, dash: '6 5', dot: false, label: 'var(--ink-2)', weight: 400 },
      muted: { stroke: 'var(--chart-muted)', width: 2.5, dash: '', dot: true, label: 'var(--ink)', weight: 700 },
      accent: { stroke: 'var(--accent)', width: 2.5, dash: '', dot: true, label: 'var(--accent)', weight: 700 }
    };
    spec.series.forEach(ser => {
      const st = styles[ser.style] || styles.accent;
      const d = ser.values.map((v, i) => (i ? 'L' : 'M') + xAt(i) + ' ' + yAt(v)).join(' ');
      s += '<path d="' + d + '" fill="none" stroke="' + st.stroke + '" stroke-width="' + st.width + '"' + (st.dash ? ' stroke-dasharray="' + st.dash + '"' : '') + '/>';
      ser.values.forEach((v, i) => {
        if (st.dot) s += '<circle cx="' + xAt(i) + '" cy="' + yAt(v) + '" r="4" fill="' + st.stroke + '"><title>' + esc(ser.name + ', ' + spec.x[i] + ': ' + v) + '</title></circle>';
        if (ser.labels && i > 0) {
          const dy = ser.labels === 'above' ? -10 : 20;
          s += '<text x="' + xAt(i) + '" y="' + (yAt(v) + dy) + '" text-anchor="middle" font-size="12" fill="var(--ink)">' + fmt(v) + '</text>';
        }
      });
      const lastV = ser.values[ser.values.length - 1];
      s += '<text x="' + (xAt(n - 1) + 16) + '" y="' + (yAt(lastV) + 4) + '" font-weight="' + st.weight + '" fill="' + st.label + '">' + esc(ser.name) + '</text>';
    });
    return chartFrame(spec, W, H, s);
  }

  function histChart(spec) {
    const W = 720, H = 360, L = 40, R = 24, T = 72, B = 60;
    const pw = W - L - R, ph = H - T - B, n = spec.counts.length, band = pw / n;
    const peak = Math.max.apply(null, spec.counts);
    const yAt = v => T + ph - (v / peak) * ph;
    let s = '';
    spec.counts.forEach((c, i) => {
      const x = L + i * band;
      if (c > 0) {
        s += '<rect x="' + (x + 3) + '" y="' + yAt(c) + '" width="' + (band - 6) + '" height="' + (T + ph - yAt(c)) + '" fill="var(--chart-muted)"><title>' + esc(spec.bins[i] + ' s: ' + c + ' runs') + '</title></rect>';
        s += '<text x="' + (x + band / 2) + '" y="' + (yAt(c) - 7) + '" text-anchor="middle" fill="var(--ink)">' + c + '</text>';
      }
      s += '<text x="' + (x + band / 2) + '" y="' + (T + ph + 20) + '" text-anchor="middle" font-size="11" fill="var(--ink-2)">' + esc(spec.bins[i]) + '</text>';
    });
    s += '<line x1="' + L + '" x2="' + (L + pw) + '" y1="' + (T + ph) + '" y2="' + (T + ph) + '" stroke="var(--ink-2)"/>';
    s += '<text x="' + (L + pw / 2) + '" y="' + (H - 12) + '" text-anchor="middle" font-size="12" fill="var(--ink-2)">' + esc(spec.xLabel) + ' — bar labels are number of runs</text>';
    return chartFrame(spec, W, H, s);
  }

  function boxChart(spec) {
    const W = 720, H = 400, L = 64, R = 40, T = 84, B = 62;
    const pw = W - L - R, ph = H - T - B, n = spec.groups.length, band = pw / n;
    const yAt = v => T + (1 - v / spec.yMax) * ph;
    let s = '';
    const step = spec.yMax / 4;
    for (let k = 0; k <= 4; k++) {
      const v = k * step, y = yAt(v);
      s += '<line x1="' + L + '" x2="' + (L + pw) + '" y1="' + y + '" y2="' + y + '" stroke="var(--chart-grid)"/>';
      s += '<text x="' + (L - 10) + '" y="' + (y + 4) + '" text-anchor="end" fill="var(--ink-2)">' + fmt(v) + '</text>';
    }
    s += '<text x="16" y="' + (T - 14) + '" font-size="12" fill="var(--ink-2)">' + esc(spec.yLabel) + '</text>';
    spec.groups.forEach((g, i) => {
      const cx = L + band * (i + 0.5), bw = Math.min(56, band * 0.45);
      s += '<g><title>' + esc('p = ' + g.label + ': min ' + g.min + ', Q1 ' + g.q1 + ', median ' + g.med + ', Q3 ' + g.q3 + ', max ' + g.max + ' s') + '</title>';
      s += '<line x1="' + cx + '" x2="' + cx + '" y1="' + yAt(g.max) + '" y2="' + yAt(g.q3) + '" stroke="var(--ink-2)" stroke-width="1.5"/>';
      s += '<line x1="' + cx + '" x2="' + cx + '" y1="' + yAt(g.q1) + '" y2="' + yAt(g.min) + '" stroke="var(--ink-2)" stroke-width="1.5"/>';
      s += '<line x1="' + (cx - bw / 4) + '" x2="' + (cx + bw / 4) + '" y1="' + yAt(g.max) + '" y2="' + yAt(g.max) + '" stroke="var(--ink-2)" stroke-width="1.5"/>';
      s += '<line x1="' + (cx - bw / 4) + '" x2="' + (cx + bw / 4) + '" y1="' + yAt(g.min) + '" y2="' + yAt(g.min) + '" stroke="var(--ink-2)" stroke-width="1.5"/>';
      s += '<rect x="' + (cx - bw / 2) + '" y="' + yAt(g.q3) + '" width="' + bw + '" height="' + Math.max(1, yAt(g.q1) - yAt(g.q3)) + '" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5"/>';
      s += '<line x1="' + (cx - bw / 2) + '" x2="' + (cx + bw / 2) + '" y1="' + yAt(g.med) + '" y2="' + yAt(g.med) + '" stroke="var(--accent)" stroke-width="3"/>';
      s += '<text x="' + (cx + bw / 2 + 8) + '" y="' + (yAt(g.med) + 4) + '" font-size="12" fill="var(--ink)">' + fmt(g.med) + '</text>';
      s += '<text x="' + cx + '" y="' + (T + ph + 22) + '" text-anchor="middle" fill="var(--ink-2)">' + esc(g.label) + '</text></g>';
    });
    s += '<text x="' + (L + pw / 2) + '" y="' + (H - 12) + '" text-anchor="middle" font-size="12" fill="var(--ink-2)">' + esc(spec.xLabel) + ' — numbers beside boxes are medians</text>';
    return chartFrame(spec, W, H, s);
  }

  function renderChart(spec) {
    if (!spec) return '';
    const svg = spec.type === 'line' ? lineChart(spec) : spec.type === 'hist' ? histChart(spec) : boxChart(spec);
    return '<figure class="chart">' + svg + '</figure>';
  }

  /* Question stem: text, optional code block, optional chart. */
  function stemHTML(q) {
    let h = '<div class="q-text">' + md(q.q) + '</div>';
    if (q.code) h += '<pre><code>' + esc(q.code) + '</code></pre>';
    if (q.chart) h += renderChart(q.chart);
    return h;
  }

  const KIND_LABEL = { concept: 'Concept', calc: 'Calculation', code: 'Code reading', graph: 'Graph reading' };

  /* ---------- Header, nav and theme ---------- */
  const PAGES = [
    ['index.html', 'Home', 'home'],
    ['read.html', 'Read', 'read'],
    ['flashcards.html', 'Flashcards', 'flashcards'],
    ['quiz.html', 'Quizzes', 'quiz'],
    ['exam.html', 'Practice exam', 'exam']
  ];

  function applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }
  applyTheme(store.get('theme', null));

  function currentTheme() {
    const set = document.documentElement.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function buildHeader() {
    const host = document.getElementById('site-header');
    if (!host) return;
    const page = document.body.getAttribute('data-page');
    const links = PAGES.map(p => '<a href="' + p[0] + '"' + (p[2] === page ? ' aria-current="page"' : '') + '>' + p[1] + '</a>').join('');
    host.className = 'site-header';
    host.innerHTML = '<div class="inner">' +
      '<a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span><span></span></span>CIS*3090 Midterm 1</a>' +
      '<nav class="site-nav" aria-label="Main">' + links + '</nav>' +
      '<button class="theme-toggle" type="button"></button></div>';
    const btn = host.querySelector('.theme-toggle');
    const label = () => { btn.textContent = currentTheme() === 'dark' ? 'Light mode' : 'Dark mode'; };
    label();
    btn.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next); store.set('theme', next); label();
    });
  }

  function daysUntilExam(now) {
    const ms = EXAM_DATE.getTime() - (now || new Date()).getTime();
    return Math.ceil(ms / 86400000);
  }

  document.addEventListener('DOMContentLoaded', buildHeader);

  window.Study = { TOPICS, TOPIC_ORDER, store, esc, md, shuffle, optionOrder, renderChart, stemHTML, KIND_LABEL, daysUntilExam, EXAM_DATE };
})();
