/* Interactive demonstrations for the reading page.
   Each <div class="demo" data-demo="name"></div> is mounted by the matching function below.
   Motion only happens when the reader presses Play or Step. */
(function () {
  'use strict';
  const S = window.Study;
  const esc = S.esc;
  const T = ['var(--t0)', 'var(--t1)', 'var(--t2)', 'var(--t3)'];
  const tc = k => T[k % 4];

  /* ---------- shared building blocks ---------- */
  function shell(root, title, sub) {
    root.innerHTML =
      '<div class="demo-head"><span class="demo-title">' + esc(title) + '</span>' +
      (sub ? '<span class="demo-sub">' + sub + '</span>' : '') + '</div>' +
      '<div class="demo-modes"></div><div class="demo-stage"></div>' +
      '<div class="demo-controls"></div><p class="demo-readout" aria-live="polite"></p>';
    return {
      modes: root.querySelector('.demo-modes'),
      stage: root.querySelector('.demo-stage'),
      controls: root.querySelector('.demo-controls'),
      readout: root.querySelector('.demo-readout')
    };
  }

  function btn(label, onClick, cls) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'demo-btn' + (cls ? ' ' + cls : ''); b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  /* Segmented choice: [[value, label], ...] */
  function modes(host, options, current, onChange) {
    host.innerHTML = '';
    host.setAttribute('role', 'group');
    options.forEach(o => {
      const b = btn(o[1], () => {
        host.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        onChange(o[0]);
      }, 'seg');
      b.setAttribute('aria-pressed', String(o[0] === current));
      host.appendChild(b);
    });
  }

  /* Play/Pause + Step + Reset. step() returns false when there is nothing more to do. */
  function transport(host, step, reset, ms) {
    let timer = null;
    const play = btn('Play', () => (timer ? stop() : start()), 'primary');
    const stepB = btn('Step', () => { stop(); step(); });
    const resetB = btn('Reset', () => { stop(); reset(); });
    function start() {
      if (step() === false) { reset(); step(); }
      timer = setInterval(() => { if (step() === false) stop(); }, ms);
      play.textContent = 'Pause';
    }
    function stop() { if (timer) clearInterval(timer); timer = null; play.textContent = 'Play'; }
    host.append(play, stepB, resetB);
    return { stop: stop };
  }

  function slider(host, label, min, max, value, onInput, fmt) {
    const id = 'sl' + Math.random().toString(36).slice(2, 8);
    const wrap = document.createElement('label');
    wrap.className = 'demo-slider'; wrap.htmlFor = id;
    wrap.innerHTML = '<span>' + esc(label) + ' <strong></strong></span><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" value="' + value + '">';
    const out = wrap.querySelector('strong'), input = wrap.querySelector('input');
    const show = () => { out.textContent = fmt ? fmt(Number(input.value)) : input.value; };
    input.addEventListener('input', () => { show(); onInput(Number(input.value)); });
    show(); host.appendChild(wrap);
    return input;
  }

  function svg(w, h, body, label) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(label || '') + '" font-family="var(--font)" font-size="13">' + body + '</svg>';
  }
  const txt = (x, y, s, attrs) => '<text x="' + x + '" y="' + y + '" ' + (attrs || '') + '>' + esc(s) + '</text>';

  /* =====================================================================
     1. Concurrency vs parallelism
     ===================================================================== */
  function concurrency(root) {
    const ui = shell(root, 'Concurrency vs parallelism', 'Two tasks, each needing 6 time units of work.');
    let mode = 'one', t = 0;
    const W = 680, X0 = 96, CW = 46;
    const schedule = () => mode === 'one'
      ? [Array.from({ length: 12 }, (_, i) => (i % 2 === 0 ? 'A' : 'B'))]
      : [Array(6).fill('A'), Array(6).fill('B')];
    const total = () => (mode === 'one' ? 12 : 6);

    function render() {
      const rows = schedule();
      let b = '';
      for (let i = 0; i <= 12; i++) {
        b += '<line x1="' + (X0 + i * CW) + '" x2="' + (X0 + i * CW) + '" y1="26" y2="' + (40 + rows.length * 44) + '" stroke="var(--chart-grid)"/>';
        b += txt(X0 + i * CW, 18, String(i), 'text-anchor="middle" font-size="11" fill="var(--ink-2)"');
      }
      rows.forEach((row, r) => {
        const y = 34 + r * 44;
        b += txt(10, y + 22, 'core ' + r, 'font-family="var(--mono)" font-size="12" fill="var(--ink-2)"');
        row.forEach((task, i) => {
          if (i >= t) return;
          const col = task === 'A' ? tc(0) : tc(1);
          b += '<rect x="' + (X0 + i * CW + 2) + '" y="' + y + '" width="' + (CW - 4) + '" height="32" rx="5" fill="' + col + '"/>';
          b += txt(X0 + i * CW + CW / 2, y + 21, task, 'text-anchor="middle" font-weight="700" fill="var(--paper)"');
        });
      });
      const px = X0 + t * CW;
      b += '<line x1="' + px + '" x2="' + px + '" y1="26" y2="' + (40 + rows.length * 44) + '" stroke="var(--accent)" stroke-width="2"/>';
      const doneA = countDone('A'), doneB = countDone('B');
      const y2 = 60 + rows.length * 44;
      b += bar(y2, 'Task A', doneA, tc(0)) + bar(y2 + 26, 'Task B', doneB, tc(1));
      ui.stage.innerHTML = svg(W, y2 + 46, b, 'Timeline of two tasks on ' + (mode === 'one' ? 'one core' : 'two cores'));
      ui.readout.textContent = t < total()
        ? 'Time ' + t + '. Task A ' + doneA + '/6 done, task B ' + doneB + '/6 done.'
        : (mode === 'one'
          ? 'Both finished at t = 12. Both tasks were in progress the whole time, but only one ran at any instant: concurrent, not parallel.'
          : 'Both finished at t = 6. The tasks ran at the same instant on separate cores: parallel (and concurrent).');
    }
    function countDone(task) { return schedule().reduce((s, row) => s + row.slice(0, t).filter(x => x === task).length, 0); }
    function bar(y, label, done, col) {
      return txt(10, y + 12, label, 'font-size="12" fill="var(--ink-2)"') +
        '<rect x="' + X0 + '" y="' + y + '" width="276" height="14" rx="4" fill="var(--rule)"/>' +
        '<rect x="' + X0 + '" y="' + y + '" width="' + (276 * done / 6) + '" height="14" rx="4" fill="' + col + '"/>' +
        txt(X0 + 286, y + 12, done + ' of 6 units', 'font-size="12" fill="var(--ink-2)"');
    }
    modes(ui.modes, [['one', '1 core: time-slicing'], ['two', '2 cores']], mode, m => { mode = m; t = 0; ctl.stop(); render(); });
    const ctl = transport(ui.controls, () => { if (t >= total()) return false; t++; render(); return t < total(); }, () => { t = 0; render(); }, 450);
    render();
  }

  /* =====================================================================
     2. Dividing n items among p threads
     ===================================================================== */
  function split(root) {
    const ui = shell(root, 'Dividing n items among p threads', 'Drag the sliders. Each square is one item, coloured by the thread that owns it.');
    let n = 30, p = 4, method = 'even';
    function counts() {
      if (method === 'even') {
        const q = Math.floor(n / p), r = n % p;
        return Array.from({ length: p }, (_, k) => q + (k < r ? 1 : 0));
      }
      const c = Math.ceil(n / p); let left = n;
      return Array.from({ length: p }, (_, k) => { const v = k < p - 1 ? Math.min(c, left) : left; left -= v; return v; });
    }
    function render() {
      const cs = counts(), W = 680, cell = Math.min(30, (W - 20) / n);
      let b = '', x = 10, first = 0;
      const owner = [];
      cs.forEach((c, k) => { for (let i = 0; i < c; i++) owner.push(k); });
      owner.forEach((k, i) => {
        b += '<rect x="' + (10 + i * cell + 1) + '" y="8" width="' + (cell - 2) + '" height="26" rx="3" fill="' + tc(k) + '" fill-opacity="' + (k >= 4 ? 0.55 : 1) + '"><title>item ' + i + ': thread ' + k + '</title></rect>';
      });
      const max = Math.max.apply(null, cs);
      cs.forEach((c, k) => {
        const y = 56 + k * 26;
        b += txt(10, y + 13, 'thread ' + k, 'font-family="var(--mono)" font-size="12" fill="var(--ink-2)"');
        b += '<rect x="96" y="' + (y + 2) + '" width="' + (max ? 330 * c / max : 0) + '" height="14" rx="4" fill="' + tc(k) + '" fill-opacity="' + (k >= 4 ? 0.55 : 1) + '"/>';
        b += txt(440, y + 13, c ? 'indices ' + first + '–' + (first + c - 1) + ' (' + c + ')' : 'no items', 'font-size="12" fill="var(--ink)"');
        first += c;
      });
      ui.stage.innerHTML = svg(W, 64 + p * 26, b, 'Work split of ' + n + ' items over ' + p + ' threads');
      const min = Math.min.apply(null, cs);
      ui.readout.textContent = 'Largest share ' + max + ', smallest ' + min + ' (sum ' + cs.reduce((a, c) => a + c, 0) + '). ' +
        (method === 'even'
          ? 'Every thread gets ⌊' + n + '/' + p + '⌋ = ' + Math.floor(n / p) + ', and the first ' + (n % p) + ' get one extra, so shares differ by at most 1.'
          : 'The first threads get ⌈' + n + '/' + p + '⌉ = ' + Math.ceil(n / p) + ' and the last takes what is left, which can be much less.');
    }
    modes(ui.modes, [['even', 'Lecture split: ⌊n/p⌋ + 1 for the first n mod p'], ['ceil', 'Alternative: ⌈n/p⌉, remainder to the last']], method, m => { method = m; render(); });
    slider(ui.controls, 'n =', 1, 40, n, v => { n = v; render(); });
    slider(ui.controls, 'p =', 1, 8, p, v => { p = v; render(); });
    render();
  }

  /* =====================================================================
     3. Serial vs tree-structured global sum
     ===================================================================== */
  function reduction(root) {
    const ui = shell(root, 'Combining partial sums: serial vs tree', 'Eight cores hold the partial sums from the textbook example (total 95).');
    const START = [8, 19, 7, 15, 7, 13, 12, 14];
    const PLANS = {
      serial: [1, 2, 3, 4, 5, 6, 7].map(k => [[k, 0]]),
      tree: [[[1, 0], [3, 2], [5, 4], [7, 6]], [[2, 0], [6, 4]], [[4, 0]]]
    };
    let mode = 'tree', s = 0, vals, sent;
    function resetState() { s = 0; vals = START.slice(); sent = new Set(); }
    function render() {
      const W = 680, bw = 66, gap = 14, x = k => 18 + k * (bw + gap), y = 70;
      const cur = s > 0 ? PLANS[mode][s - 1] : [];
      let b = '';
      cur.forEach(pr => {
        const x1 = x(pr[0]) + bw / 2, x2 = x(pr[1]) + bw / 2, top = y - 18 - Math.abs(pr[0] - pr[1]) * 6;
        b += '<path d="M' + x1 + ' ' + (y - 2) + ' C' + x1 + ' ' + top + ' ' + x2 + ' ' + top + ' ' + x2 + ' ' + (y - 6) + '" fill="none" stroke="var(--accent)" stroke-width="2" marker-end="url(#red-arrow)"/>';
      });
      START.forEach((_, k) => {
        const recv = cur.some(pr => pr[1] === k), gone = sent.has(k);
        b += '<rect x="' + x(k) + '" y="' + y + '" width="' + bw + '" height="54" rx="8" fill="' + (recv ? 'var(--accent-soft)' : 'var(--paper)') + '" stroke="' + (recv ? 'var(--accent)' : 'var(--rule)') + '" stroke-width="' + (recv ? 2 : 1) + '" opacity="' + (gone ? 0.4 : 1) + '"/>';
        b += txt(x(k) + bw / 2, y + 22, 'core ' + k, 'text-anchor="middle" font-size="11" fill="var(--ink-2)" font-family="var(--mono)"');
        b += txt(x(k) + bw / 2, y + 44, gone ? '—' : String(vals[k]), 'text-anchor="middle" font-size="17" font-weight="700" fill="var(--ink)"');
      });
      const defs = '<defs><marker id="red-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker></defs>';
      ui.stage.innerHTML = svg(W, 140, defs + b, 'Cores combining partial sums');
      const total = PLANS[mode].length;
      ui.readout.textContent = s === 0
        ? (mode === 'serial' ? 'Core 0 will receive and add the other seven sums one at a time.' : 'Cores pair up; each round halves the number of active cores.')
        : 'Step ' + s + ' of ' + total + ': ' + cur.map(pr => 'core ' + pr[1] + ' ← core ' + pr[0]).join(', ') + '.' +
          (s === total ? ' Done: core 0 holds ' + vals[0] + ' after ' + total + ' sequential steps (' + (mode === 'tree' ? 'serial needs 7' : 'the tree needs only 3') + ').' : '');
    }
    function step() {
      const plan = PLANS[mode];
      if (s >= plan.length) return false;
      plan[s].forEach(pr => { vals[pr[1]] += vals[pr[0]]; sent.add(pr[0]); });
      s++; render(); return s < plan.length;
    }
    modes(ui.modes, [['serial', 'Serial: core 0 adds everything'], ['tree', 'Tree-structured']], mode, m => { mode = m; ctl.stop(); resetState(); render(); });
    const ctl = transport(ui.controls, step, () => { resetState(); render(); }, 1100);
    resetState(); render();
  }

  /* =====================================================================
     4. pthread_create / pthread_join lifecycle
     ===================================================================== */
  function join(root) {
    const ui = shell(root, 'Creating and joining threads', 'Main creates three threads at t = 1. They need 5, 8 and 6 time units.');
    let mode = 'join', t = 0;
    const DUR = [5, 8, 6], START = 1, END_THREADS = START + Math.max.apply(null, DUR);
    const mainEnd = () => (mode === 'join' ? END_THREADS + 0.5 : 3);
    const finish = () => (mode === 'join' ? END_THREADS + 0.5 : 3);
    function render() {
      const W = 680, X0 = 96, U = 46, x = v => X0 + v * U;
      let b = '';
      for (let i = 0; i <= 12; i++) {
        b += '<line x1="' + x(i) + '" x2="' + x(i) + '" y1="24" y2="186" stroke="var(--chart-grid)"/>' + txt(x(i), 16, String(i), 'text-anchor="middle" font-size="11" fill="var(--ink-2)"');
      }
      const rowY = r => 30 + r * 40;
      // main
      b += txt(10, rowY(0) + 18, 'main', 'font-family="var(--mono)" font-size="12" fill="var(--ink-2)"');
      const me = Math.min(t, mainEnd());
      if (mode === 'join') {
        b += '<rect x="' + x(0) + '" y="' + rowY(0) + '" width="' + (Math.min(me, 2) * U) + '" height="26" rx="5" fill="var(--ink-2)"/>';
        if (me > 2) b += '<rect x="' + x(2) + '" y="' + (rowY(0) + 1) + '" width="' + ((Math.min(me, END_THREADS) - 2) * U) + '" height="24" rx="5" fill="none" stroke="var(--ink-2)" stroke-dasharray="5 4"/>' +
          txt(x(2) + 8, rowY(0) + 17, 'blocked in pthread_join', 'font-size="12" fill="var(--ink-2)"');
        if (me > END_THREADS) b += '<rect x="' + x(END_THREADS) + '" y="' + rowY(0) + '" width="' + ((me - END_THREADS) * U) + '" height="26" rx="5" fill="var(--ink-2)"/>';
      } else {
        b += '<rect x="' + x(0) + '" y="' + rowY(0) + '" width="' + (me * U) + '" height="26" rx="5" fill="var(--ink-2)"/>';
        if (t >= 3) b += txt(x(3) + 8, rowY(0) + 18, 'return 0 → process ends', 'font-size="12" fill="var(--bad)" font-weight="700"');
      }
      DUR.forEach((d, k) => {
        const y = rowY(k + 1), end = START + d;
        b += txt(10, y + 18, 'thread ' + k, 'font-family="var(--mono)" font-size="12" fill="var(--ink-2)"');
        if (t <= START) return;
        const killedAt = mode === 'join' ? Infinity : 3;
        const stopAt = Math.min(t, end, killedAt);
        b += '<rect x="' + x(START) + '" y="' + y + '" width="' + ((stopAt - START) * U) + '" height="26" rx="5" fill="' + tc(k) + '"/>';
        if (mode === 'join' && t >= end) b += txt(x(end) + 6, y + 18, 'done', 'font-size="12" fill="var(--ink-2)"');
        if (mode !== 'join' && t >= 3) b += '<rect x="' + x(3) + '" y="' + y + '" width="' + ((end - 3) * U) + '" height="26" rx="5" fill="none" stroke="var(--bad)" stroke-dasharray="4 4"/>' +
          txt(x(3) + 8, y + 18, 'killed: ' + (end - 3) + ' units never ran', 'font-size="12" fill="var(--bad)"');
      });
      b += '<line x1="' + x(t) + '" x2="' + x(t) + '" y1="24" y2="186" stroke="var(--accent)" stroke-width="2"/>';
      ui.stage.innerHTML = svg(W, 196, b, 'Thread lifecycle timeline');
      ui.readout.textContent = t < finish() ? 'Time ' + t + '.'
        : (mode === 'join'
          ? 'Main waited in pthread_join until the slowest thread finished at t = 9, then printed and returned. All work completed, and every joinable thread was cleaned up.'
          : 'Main returned at t = 3. Returning from main ends the whole process, so all three threads were killed mid-work. Without joins the joinable threads would also leak.');
    }
    modes(ui.modes, [['join', 'Main joins every thread'], ['nojoin', 'Main returns without joining']], mode, m => { mode = m; t = 0; ctl.stop(); render(); });
    const ctl = transport(ui.controls, () => { if (t >= finish()) return false; t = Math.min(finish(), t + 0.5); render(); return t < finish(); }, () => { t = 0; render(); }, 220);
    render();
  }

  /* =====================================================================
     5. Block odd-even transposition sort
     ===================================================================== */
  function oddeven(root) {
    const ui = shell(root, 'Parallel odd-even sort, 4 threads, 16 keys', 'The lecture\'s data. Each lane is one thread\'s block.');
    const INIT = [[33, 36, 27, 15], [43, 35, 36, 42], [49, 21, 12, 27], [40, 9, 18, 6]];
    const P = 4;
    const partner = (r, ph) => { const q = ph % 2 === 0 ? (r % 2 === 0 ? r + 1 : r - 1) : (r % 2 === 0 ? r - 1 : r + 1); return q >= 0 && q < P ? q : null; };
    const stages = [{ label: 'Start: unsorted blocks', blocks: INIT.map(b => b.slice()), pairs: [], idle: [] }];
    let cur = INIT.map(b => b.slice().sort((a, c) => a - c));
    stages.push({ label: 'Each thread sorts its own block with qsort()', blocks: cur.map(b => b.slice()), pairs: [], idle: [] });
    for (let ph = 0; ph < P; ph++) {
      const next = cur.map(b => b.slice()), pairs = [], idle = [];
      for (let r = 0; r < P; r++) {
        const q = partner(r, ph);
        if (q === null) { idle.push(r); continue; }
        if (r < q) {
          const m = cur[r].concat(cur[q]).sort((a, c) => a - c);
          next[r] = m.slice(0, 4); next[q] = m.slice(4); pairs.push([r, q]);
        }
      }
      stages.push({ label: 'Phase ' + ph + ' (' + (ph % 2 === 0 ? 'even' : 'odd') + '): compare-split ' + pairs.map(p => '(' + p[0] + ',' + p[1] + ')').join(' and '), blocks: next.map(b => b.slice()), pairs: pairs, idle: idle, prev: cur.map(b => b.slice()) });
      cur = next;
    }
    let s = 0;
    function render() {
      const st = stages[s], W = 680, X0 = 96, cw = 50, y = r => 22 + r * 46;
      let b = '';
      st.blocks.forEach((blk, r) => {
        b += txt(10, y(r) + 22, 'thread ' + r, 'font-family="var(--mono)" font-size="12" fill="var(--ink-2)"');
        blk.forEach((v, i) => {
          const changed = st.prev && st.prev[r][i] !== v;
          b += '<rect x="' + (X0 + i * cw) + '" y="' + y(r) + '" width="' + (cw - 6) + '" height="34" rx="6" fill="' + tc(r) + '" fill-opacity="' + (changed ? 0.9 : 0.16) + '" stroke="' + tc(r) + '"/>';
          b += txt(X0 + i * cw + (cw - 6) / 2, y(r) + 22, String(v), 'text-anchor="middle" font-weight="700" fill="' + (changed ? 'var(--paper)' : 'var(--ink)') + '"');
        });
        if (st.idle.indexOf(r) >= 0) b += txt(X0 + 4 * cw + 70, y(r) + 22, 'idle, but still waits at both barriers', 'font-size="12" fill="var(--ink-2)"');
      });
      st.pairs.forEach(pr => {
        const xb = X0 + 4 * cw + 6, y1 = y(pr[0]) + 17, y2 = y(pr[1]) + 17;
        b += '<path d="M' + xb + ' ' + y1 + 'H' + (xb + 22) + 'V' + y2 + 'H' + xb + '" fill="none" stroke="var(--accent)" stroke-width="2"/>';
        b += txt(xb + 30, (y1 + y2) / 2 + 4, 'merge 8 keys: lower rank keeps the low 4', 'font-size="12" fill="var(--ink)"');
      });
      const dashed = s >= 2;
      if (dashed) b += '<line x1="' + (X0 - 12) + '" x2="' + (X0 - 12) + '" y1="16" y2="' + (y(3) + 40) + '" stroke="var(--ink-2)" stroke-dasharray="4 4"/>';
      const all = st.blocks.flat();
      const sorted = all.every((v, i) => i === 0 || all[i - 1] <= v);
      ui.stage.innerHTML = svg(W, y(3) + 50, b, st.label);
      ui.readout.textContent = st.label + '.' + (s >= 2 ? ' Solid cells changed this phase. Barrier 1 before reading the partner\'s block, barrier 2 before overwriting your own.' : '') +
        (s === stages.length - 1 ? (sorted ? ' Sorted after p = 4 phases.' : '') : '');
    }
    const ctl = transport(ui.controls, () => { if (s >= stages.length - 1) return false; s++; render(); return s < stages.length - 1; }, () => { s = 0; render(); }, 1500);
    render();
  }

  /* =====================================================================
     6. Race condition on x++ (with and without a mutex)
     ===================================================================== */
  function race(root) {
    const ui = shell(root, 'Two threads run x++ on a shared x', 'You are the scheduler. Choose which thread runs its next instruction.');
    let mode = 'plain', st, auto = null;
    const PROG = { plain: ['load  r, x', 'inc   r', 'store r, x'], mutex: ['lock(m)', 'load  r, x', 'inc   r', 'store r, x', 'unlock(m)'] };
    function resetState() { if (auto) { clearInterval(auto); auto = null; } st = { pc: [0, 0], r: [null, null], x: 0, owner: null, note: '' }; }
    function done(k) { return st.pc[k] >= PROG[mode].length; }
    function exec(k) {
      if (done(k)) { st.note = 'Thread ' + k + ' has finished.'; return; }
      const ins = PROG[mode][st.pc[k]];
      if (ins.indexOf('lock(m)') === 0) {
        if (st.owner !== null && st.owner !== k) { st.note = 'Thread ' + k + ' blocks in pthread_mutex_lock: thread ' + st.owner + ' holds m.'; return; }
        st.owner = k;
      } else if (ins.indexOf('unlock') === 0) st.owner = null;
      else if (ins.indexOf('load') === 0) st.r[k] = st.x;
      else if (ins.indexOf('inc') === 0) st.r[k] += 1;
      else if (ins.indexOf('store') === 0) st.x = st.r[k];
      st.note = 'Thread ' + k + ' ran "' + ins.replace(/\s+/g, ' ') + '".';
      st.pc[k]++;
    }
    function render() {
      const col = k => '<div class="race-col"><div class="race-name" style="color:' + tc(k) + '">thread ' + k + '</div><ol class="race-prog">' +
        PROG[mode].map((ins, i) => '<li class="' + (i === st.pc[k] ? 'next' : (i < st.pc[k] ? 'ran' : '')) + '"><code>' + esc(ins) + '</code></li>').join('') +
        '</ol><div class="race-reg">register r = <strong>' + (st.r[k] === null ? '–' : st.r[k]) + '</strong></div></div>';
      ui.stage.innerHTML = '<div class="race">' + col(0) +
        '<div class="race-mem"><div class="race-label">shared memory</div><div class="race-x">x = ' + st.x + '</div>' +
        (mode === 'mutex' ? '<div class="race-lock">m held by: ' + (st.owner === null ? 'nobody' : 'thread ' + st.owner) + '</div>' : '') + '</div>' + col(1) + '</div>';
      let msg = st.note;
      if (done(0) && done(1)) msg += st.x === 2 ? ' Both increments landed: x = 2.' : ' Both threads finished, but x = ' + st.x + ': one increment was lost. That is a race condition.';
      ui.readout.textContent = msg || 'x starts at 0. After both threads run x++, it should be 2.';
    }
    modes(ui.modes, [['plain', 'No lock'], ['mutex', 'With a mutex']], mode, m => { mode = m; resetState(); render(); });
    ui.controls.append(
      btn('Run thread 0', () => { exec(0); render(); }, 'primary'),
      btn('Run thread 1', () => { exec(1); render(); }, 'primary'),
      btn('Play 0, 1, 0, 1, …', () => {
        resetState(); render();
        const seq = mode === 'plain' ? [0, 1, 0, 1, 0, 1] : [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1];
        let i = 0; auto = setInterval(() => { if (i >= seq.length) { clearInterval(auto); auto = null; return; } exec(seq[i++]); render(); }, 650);
      }),
      btn('Reset', () => { resetState(); render(); })
    );
    resetState(); render();
  }

  /* =====================================================================
     7. Amdahl's law
     ===================================================================== */
  function amdahl(root) {
    const ui = shell(root, 'Amdahl\'s law', 'Set how much of the program can be parallelized and see where speedup stops growing.');
    let pct = 90, pSel = 6; // 2^6 = 64
    function render() {
      const r = 1 - pct / 100, cap = 1 / r, W = 680, H = 300, L = 54, R = 120, Tp = 20, B = 40;
      const pw = W - L - R, ph = H - Tp - B, xs = Array.from({ length: 11 }, (_, i) => i);
      const ymax = Math.max(4, Math.ceil(cap * 1.15));
      const xAt = i => L + i * pw / 10, yAt = v => Tp + ph - Math.min(v, ymax) / ymax * ph;
      const S2 = p => 1 / (r + (1 - r) / p);
      let b = '';
      const ticks = [0, ymax / 4, ymax / 2, 3 * ymax / 4, ymax].map(v => Math.round(v * 10) / 10);
      ticks.forEach(v => { b += '<line x1="' + L + '" x2="' + (L + pw) + '" y1="' + yAt(v) + '" y2="' + yAt(v) + '" stroke="var(--chart-grid)"/>' + txt(L - 8, yAt(v) + 4, String(v), 'text-anchor="end" font-size="11" fill="var(--ink-2)"'); });
      xs.forEach(i => { b += txt(xAt(i), H - B + 18, String(Math.pow(2, i)), 'text-anchor="middle" font-size="11" fill="var(--ink-2)"'); });
      b += txt(L + pw / 2, H - 4, 'cores p (doubling each step)', 'text-anchor="middle" font-size="12" fill="var(--ink-2)"');
      // perfect line (clipped)
      const perf = xs.filter(i => Math.pow(2, i) <= ymax * 1.0001);
      b += '<path d="' + perf.map((i, k) => (k ? 'L' : 'M') + xAt(i) + ' ' + yAt(Math.pow(2, i))).join(' ') + '" fill="none" stroke="var(--ink-2)" stroke-dasharray="6 5" stroke-width="1.5"/>';
      const lastPerf = perf[perf.length - 1];
      b += txt(xAt(lastPerf) + 6, yAt(Math.pow(2, lastPerf)) - 6, 'perfect (S = p)', 'font-size="12" fill="var(--ink-2)"');
      // cap
      b += '<line x1="' + L + '" x2="' + (L + pw) + '" y1="' + yAt(cap) + '" y2="' + yAt(cap) + '" stroke="var(--bad)" stroke-dasharray="3 4"/>' +
        txt(L + pw + 8, yAt(cap) + 4, 'limit 1/r = ' + fmt(cap), 'font-size="12" fill="var(--bad)" font-weight="700"');
      // amdahl curve
      b += '<path d="' + xs.map((i, k) => (k ? 'L' : 'M') + xAt(i) + ' ' + yAt(S2(Math.pow(2, i)))).join(' ') + '" fill="none" stroke="var(--accent)" stroke-width="2.5"/>';
      const sp = S2(Math.pow(2, pSel));
      b += '<circle cx="' + xAt(pSel) + '" cy="' + yAt(sp) + '" r="5" fill="var(--accent)"/>' + txt(xAt(pSel), yAt(sp) - 10, fmt(sp) + '×', 'text-anchor="middle" font-weight="700" fill="var(--ink)"');
      ui.stage.innerHTML = svg(W, H, b, 'Amdahl speedup curve');
      ui.readout.textContent = pct + '% parallel, so r = ' + fmt(r) + '. On ' + Math.pow(2, pSel) + ' cores S = 1 / (' + fmt(r) + ' + ' + fmt(1 - r) + '/' + Math.pow(2, pSel) +
        ') = ' + fmt(sp) + '. No number of cores can beat 1/r = ' + fmt(cap) + '.';
    }
    function fmt(v) { return String(Math.round(v * 100) / 100); }
    slider(ui.controls, 'Parallel fraction', 50, 99, pct, v => { pct = v; render(); }, v => v + '%');
    slider(ui.controls, 'Cores', 0, 10, pSel, v => { pSel = v; render(); }, v => String(Math.pow(2, v)));
    render();
  }

  /* =====================================================================
     8. Cache: row-order vs column-order traversal
     ===================================================================== */
  function cache(root) {
    const ui = shell(root, 'Row order vs column order in a cache', 'The textbook setup: double A[4][4], 4 doubles per cache line, a 2-line direct-mapped cache.');
    let order = 'row', k = 0, slots, hits, misses, marks, last;
    function seq() { const a = []; for (let o = 0; o < 4; o++) for (let q = 0; q < 4; q++) a.push(order === 'row' ? [o, q] : [q, o]); return a; }
    function resetState() { k = 0; slots = [null, null]; hits = 0; misses = 0; marks = {}; last = null; }
    function step() {
      const s = seq();
      if (k >= s.length) return false;
      const ij = s[k], line = ij[0], slot = line % 2;
      const hit = slots[slot] === line;
      if (hit) hits++; else { misses++; slots[slot] = line; }
      marks[ij[0] + ',' + ij[1]] = hit ? 'H' : 'M';
      last = { ij: ij, hit: hit, line: line, slot: slot }; k++;
      render(); return k < s.length;
    }
    function render() {
      const W = 680, cs = 64, X0 = 20, Y0 = 26;
      let b = txt(X0, 16, 'Matrix A (each row is one cache line)', 'font-size="12" fill="var(--ink-2)"');
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const m = marks[i + ',' + j], curr = last && last.ij[0] === i && last.ij[1] === j;
        b += '<rect x="' + (X0 + j * cs) + '" y="' + (Y0 + i * 44) + '" width="' + (cs - 4) + '" height="40" rx="5" fill="' + tc(i) + '" fill-opacity="0.14" stroke="' + (curr ? 'var(--accent)' : tc(i)) + '" stroke-width="' + (curr ? 3 : 1) + '"/>';
        b += txt(X0 + j * cs + (cs - 4) / 2, Y0 + i * 44 + 17, 'A[' + i + '][' + j + ']', 'text-anchor="middle" font-size="11" font-family="var(--mono)" fill="var(--ink)"');
        if (m) b += txt(X0 + j * cs + (cs - 4) / 2, Y0 + i * 44 + 33, m === 'H' ? 'hit' : 'miss', 'text-anchor="middle" font-size="11" font-weight="700" fill="' + (m === 'H' ? 'var(--ok)' : 'var(--bad)') + '"');
      }
      const cx = 330;
      b += txt(cx, 16, 'Cache (slot = line mod 2)', 'font-size="12" fill="var(--ink-2)"');
      [0, 1].forEach(sl => {
        const ln = slots[sl], y = Y0 + sl * 56;
        b += '<rect x="' + cx + '" y="' + y + '" width="320" height="46" rx="6" fill="' + (ln === null ? 'none' : tc(ln)) + '" fill-opacity="0.14" stroke="' + (ln === null ? 'var(--rule)' : tc(ln)) + '" stroke-width="' + (last && last.slot === sl ? 2.5 : 1) + '"/>';
        b += txt(cx + 12, y + 28, 'slot ' + sl + ':  ' + (ln === null ? 'empty' : 'line ' + ln + ' = A[' + ln + '][0..3]'), 'font-size="13" font-family="var(--mono)" fill="var(--ink)"');
      });
      b += txt(cx, Y0 + 140, 'Hits ' + hits + '   Misses ' + misses, 'font-size="16" font-weight="700" fill="var(--ink)"');
      ui.stage.innerHTML = svg(W, 210, b, 'Cache simulation');
      const total = 16;
      ui.readout.textContent = k === 0
        ? (order === 'row' ? 'Row order reads A[0][0], A[0][1], … along each line.' : 'Column order reads A[0][0], A[1][0], … jumping a whole line each time.')
        : 'Access ' + k + ' of 16: A[' + last.ij[0] + '][' + last.ij[1] + '] is in line ' + last.line + ' → ' + (last.hit ? 'hit.' : 'miss, so line ' + last.line + ' loads into slot ' + last.slot + '.') +
          (k === total ? (order === 'row' ? ' Done: 4 misses, one per line; the other 12 reads use data already loaded.' : ' Done: 16 misses. Each line is evicted before the loop comes back to it.') : '');
    }
    modes(ui.modes, [['row', 'i outer, j inner (row order)'], ['col', 'j outer, i inner (column order)']], order, m => { order = m; ctl.stop(); resetState(); render(); });
    const ctl = transport(ui.controls, step, () => { resetState(); render(); }, 450);
    resetState(); render();
  }

  /* =====================================================================
     9. Pipelining
     ===================================================================== */
  function pipeline(root) {
    const ui = shell(root, 'Pipelined floating-point add', 'Six additions through the textbook\'s 7 stages, 1 ns per stage.');
    const STAGES = ['Fetch', 'Compare', 'Shift', 'Add', 'Normalize', 'Round', 'Store'], N = 6, K = 7;
    let mode = 'pipe', t = 0;
    const total = () => (mode === 'pipe' ? K + N - 1 : K * N);
    const timeOf = (op, s) => (mode === 'pipe' ? op + s : op * K + s);
    function render() {
      const W = 680, X0 = 92, T = total(), cw = Math.min(40, (W - X0 - 10) / T), rh = 26;
      let b = '';
      for (let c = 0; c < T; c++) if (cw >= 22 || c % 7 === 0) b += txt(X0 + c * cw + cw / 2, 14, String(c), 'text-anchor="middle" font-size="10" fill="var(--ink-2)"');
      STAGES.forEach((name, s) => {
        const y = 22 + s * rh;
        b += txt(8, y + 17, name, 'font-size="12" fill="var(--ink-2)"');
        b += '<rect x="' + X0 + '" y="' + y + '" width="' + T * cw + '" height="' + (rh - 4) + '" fill="var(--paper)" stroke="var(--rule)"/>';
        for (let op = 0; op < N; op++) {
          const c = timeOf(op, s);
          if (c >= t) continue;
          b += '<rect x="' + (X0 + c * cw + 1) + '" y="' + (y + 1) + '" width="' + (cw - 2) + '" height="' + (rh - 6) + '" rx="3" fill="' + tc(op) + '" fill-opacity="' + (op >= 4 ? 0.6 : 1) + '"/>';
          if (cw >= 16) b += txt(X0 + c * cw + cw / 2, y + 16, String(op), 'text-anchor="middle" font-size="11" font-weight="700" fill="var(--paper)"');
        }
      });
      b += '<line x1="' + (X0 + t * cw) + '" x2="' + (X0 + t * cw) + '" y1="20" y2="' + (22 + K * rh) + '" stroke="var(--accent)" stroke-width="2"/>';
      ui.stage.innerHTML = svg(W, 30 + K * rh, b, 'Pipeline timing table');
      const busy = mode === 'pipe' ? STAGES.filter((_, s) => { const op = t - 1 - s; return op >= 0 && op < N; }).length : (t > 0 && t <= T ? 1 : 0);
      ui.readout.textContent = t < T
        ? 'Time ' + t + ' ns. ' + busy + ' of 7 stages busy right now.'
        : (mode === 'pipe'
          ? 'Done at ' + T + ' ns = k + n − 1 = 7 + 6 − 1. Once full, the pipeline finishes one addition every nanosecond.'
          : 'Done at ' + T + ' ns = k × n = 7 × 6. Only one stage works at a time.');
    }
    modes(ui.modes, [['pipe', 'Pipelined'], ['flat', 'Not pipelined']], mode, m => { mode = m; t = 0; ctl.stop(); render(); });
    const ctl = transport(ui.controls, () => { if (t >= total()) return false; t++; render(); return t < total(); }, () => { t = 0; render(); }, 260);
    render();
  }

  /* =====================================================================
     10. Heat diffusion with row bands and two barriers
     ===================================================================== */
  function heat(root) {
    const ui = shell(root, 'Heat diffusion on 4 threads', 'The lecture\'s 16 × 16 plate: border fixed at 0, a 6 × 6 block fixed at 9.');
    const N = 16, K = 6, lo = (N - K) / 2, EPS = 0.0009; /* lecture's ε = 1e-4 on a 0–1 scale, here scaled to 0–9 */
    const BANDS = [[1, 4], [5, 8], [9, 11], [12, 14]];
    const PHASES = ['Each thread computes its own rows of next[]', 'Barrier 1: wait until every row and max_diff is written', 'Thread 0 alone: max of max_diff, swap cur and next, check convergence', 'Barrier 2: wait until the swap and converged flag are visible'];
    const fixed = (i, j) => i === 0 || j === 0 || i === N - 1 || j === N - 1 || (i >= lo && i < lo + K && j >= lo && j < lo + K);
    let cur, nxt, iter, phase, maxDiff, converged, showNums = true;
    function resetState() {
      cur = []; for (let i = 0; i < N; i++) { cur.push([]); for (let j = 0; j < N; j++) cur[i].push(i >= lo && i < lo + K && j >= lo && j < lo + K ? 9 : 0); }
      nxt = cur.map(r => r.slice()); iter = 0; phase = -1; maxDiff = null; converged = false;
    }
    function compute() {
      maxDiff = 0;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        if (fixed(i, j)) { nxt[i][j] = cur[i][j]; continue; }
        nxt[i][j] = 0.25 * (cur[i - 1][j] + cur[i + 1][j] + cur[i][j - 1] + cur[i][j + 1]);
        maxDiff = Math.max(maxDiff, Math.abs(nxt[i][j] - cur[i][j]));
      }
    }
    function sub() {
      if (converged && phase === 3) return false;
      phase = (phase + 1) % 4;
      if (phase === 0) compute();
      if (phase === 2) { const t = cur; cur = nxt; nxt = t; iter++; if (maxDiff < EPS) converged = true; }
      render();
      return !(converged && phase === 3);
    }
    function color(v) {
      const t = Math.max(0, Math.min(1, v / 9));
      let r, g, b;
      if (t < 1 / 3) { const u = t * 3; r = 40 + 180 * u; g = 30 * u; b = 30 * u; }
      else if (t < 2 / 3) { const u = (t - 1 / 3) * 3; r = 220 + 35 * u; g = 30 + 170 * u; b = 30; }
      else { const u = (t - 2 / 3) * 3; r = 255; g = 200 + 55 * u; b = 30 + 225 * u; }
      return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
    }
    function render() {
      const cs = 24, X0 = 110, Y0 = 8, W = 680;
      let b = '';
      const shown = cur;
      BANDS.forEach((bd, k) => {
        const y = Y0 + bd[0] * cs, h = (bd[1] - bd[0] + 1) * cs;
        const active = phase === 0 || (phase === 2 && k === 0);
        b += '<rect x="10" y="' + (y + 1) + '" width="92" height="' + (h - 2) + '" rx="5" fill="' + tc(k) + '" fill-opacity="' + (active ? 0.9 : 0.2) + '"/>';
        b += txt(18, y + h / 2 - 2, 'thread ' + k, 'font-family="var(--mono)" font-size="12" font-weight="700" fill="' + (active ? 'var(--paper)' : 'var(--ink)') + '"');
        b += txt(18, y + h / 2 + 13, 'rows ' + bd[0] + '–' + bd[1], 'font-size="11" fill="' + (active ? 'var(--paper)' : 'var(--ink-2)') + '"');
      });
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const v = shown[i][j];
        b += '<rect x="' + (X0 + j * cs) + '" y="' + (Y0 + i * cs) + '" width="' + cs + '" height="' + cs + '" fill="' + color(v) + '"/>';
        if (showNums) b += txt(X0 + j * cs + cs / 2, Y0 + i * cs + 16, String(Math.round(v)), 'text-anchor="middle" font-size="10" fill="' + (v > 5.5 ? '#222' : '#eee') + '"');
      }
      BANDS.forEach((bd, k) => {
        b += '<rect x="' + X0 + '" y="' + (Y0 + bd[0] * cs) + '" width="' + N * cs + '" height="' + (bd[1] - bd[0] + 1) * cs + '" fill="none" stroke="' + tc(k) + '" stroke-width="' + (phase === 0 ? 2.5 : 1) + '"/>';
      });
      if (phase === 1 || phase === 3) b += '<line x1="' + (X0 + N * cs + 14) + '" x2="' + (X0 + N * cs + 14) + '" y1="' + Y0 + '" y2="' + (Y0 + N * cs) + '" stroke="var(--ink-2)" stroke-width="2" stroke-dasharray="5 4"/>';
      const px = X0 + N * cs + 28;
      b += txt(px, 30, 'iteration ' + iter, 'font-size="15" font-weight="700" fill="var(--ink)"');
      b += txt(px, 54, 'max_diff ' + (maxDiff === null ? '–' : maxDiff.toFixed(4)), 'font-size="13" font-family="var(--mono)" fill="var(--ink)"');
      b += txt(px, 76, 'stop when < 0.0009', 'font-size="12" fill="var(--ink-2)"');
      PHASES.forEach((p, k) => {
        const y = 110 + k * 30;
        b += '<circle cx="' + (px + 6) + '" cy="' + (y - 4) + '" r="5" fill="' + (phase === k ? 'var(--accent)' : 'var(--rule)') + '"/>';
        b += txt(px + 18, y, ['compute rows', 'barrier 1', 'thread 0: reduce, swap', 'barrier 2'][k], 'font-size="12" fill="' + (phase === k ? 'var(--ink)' : 'var(--ink-2)') + '" font-weight="' + (phase === k ? 700 : 400) + '"');
      });
      if (converged) b += txt(px, 248, 'converged', 'font-size="14" font-weight="700" fill="var(--ok)"');
      ui.stage.innerHTML = svg(W, Y0 * 2 + N * cs, b, 'Heat grid, iteration ' + iter);
      ui.readout.textContent = phase === -1 ? 'Frame before the first iteration. Step goes through one phase at a time; Play runs to convergence.'
        : PHASES[phase] + '.' + (converged ? ' Converged after ' + iter + ' iterations: a stable hot-to-cold gradient, because the source keeps reheating what the border cools.' : '');
    }
    const ctl = transport(ui.controls, sub, () => { resetState(); render(); }, 45);
    const lbl = document.createElement('label'); lbl.className = 'demo-check';
    lbl.innerHTML = '<input type="checkbox" checked> Show values';
    lbl.querySelector('input').addEventListener('change', e => { showNums = e.target.checked; render(); });
    ui.controls.appendChild(lbl);
    resetState(); render();
  }

  const DEMOS = { concurrency, split, reduction, join, oddeven, race, amdahl, cache, pipeline, heat };
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.demo[data-demo]').forEach(el => {
      const f = DEMOS[el.getAttribute('data-demo')];
      if (f) f(el);
    });
  });
})();
