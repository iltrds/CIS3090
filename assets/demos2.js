/* Midterm 2 demonstrations: MPI collectives, MPI message matching, convolution and borders,
   mean vs median filtering, and the cost of moving data to the GPU.
   Registered into window.StudyDemos; assets/demos.js mounts every .demo[data-demo] on load,
   so this file must be loaded after demos.js. */
(function () {
  'use strict';
  const S = window.Study;
  const K = window.DemoKit;
  const esc = S.esc;
  const { shell, btn, modes, transport, slider, svg, txt } = K;

  function fmt(v, d) { const m = Math.pow(10, d === undefined ? 2 : d); return String(Math.round(v * m) / m); }
  function grey(v) {
    const g = Math.max(0, Math.min(255, Math.round(v)));
    return 'background:rgb(' + g + ',' + g + ',' + g + ');color:' + (g < 140 ? '#fff' : '#111');
  }
  function select(host, label, options, value, onChange) {
    const wrap = document.createElement('label');
    wrap.className = 'demo-select';
    wrap.innerHTML = '<span>' + esc(label) + '</span><select>' +
      options.map(o => '<option value="' + esc(o[0]) + '"' + (o[0] === value ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>';
    wrap.querySelector('select').addEventListener('change', e => onChange(e.target.value));
    host.appendChild(wrap);
    return wrap.querySelector('select');
  }

  /* =====================================================================
     1. Collective communication on 8 processes
     ===================================================================== */
  function collectives(root) {
    const ui = shell(root, 'Collectives on 8 processes', 'Every rank in the communicator makes the same call. Step through to see where the data ends up.');
    const P = 8, LOCAL = [3, 1, 4, 1, 5, 9, 2, 6];
    const TREE_DOWN = [[[0, 4]], [[0, 2], [4, 6]], [[0, 1], [2, 3], [4, 5], [6, 7]]];
    const TREE_UP = [[[1, 0], [3, 2], [5, 4], [7, 6]], [[2, 0], [6, 4]], [[4, 0]]];
    const INFO = {
      bcast: {
        call: 'MPI_Bcast(&n, 1, MPI_INT, 0, MPI_COMM_WORLD);',
        rounds: TREE_DOWN,
        start: () => [1024, null, null, null, null, null, null, null],
        apply: (v, pr) => { v[pr[1]] = v[pr[0]]; },
        intro: 'Rank 0 read n = 1024 from stdin. The other ranks have nothing yet.',
        end: 'Every rank now has n = 1024 after log₂ 8 = 3 rounds. Rank 0 sent and the others received through the same MPI_Bcast call.'
      },
      reduce: {
        call: 'MPI_Reduce(&local, &total, 1, MPI_INT, MPI_SUM, 0, MPI_COMM_WORLD);',
        rounds: TREE_UP,
        start: () => LOCAL.slice(),
        apply: (v, pr) => { v[pr[1]] += v[pr[0]]; },
        intro: 'Each rank holds its local sum. Total = 31.',
        end: 'Only rank 0 (the dest argument) has total = 31. The numbers left on ranks 2, 4 and 6 are partial sums MPI passed along internally; their total variable is not set.'
      },
      allreduce: {
        call: 'MPI_Allreduce(&local, &total, 1, MPI_INT, MPI_SUM, MPI_COMM_WORLD);',
        rounds: TREE_UP.concat(TREE_DOWN),
        start: () => LOCAL.slice(),
        apply: (v, pr, r) => { if (r < 3) v[pr[1]] += v[pr[0]]; else v[pr[1]] = v[pr[0]]; },
        intro: 'Same local sums. There is no dest argument: everyone gets the answer.',
        end: 'Every rank has total = 31: a reduce followed by a broadcast, as drawn in Lecture 10. Real libraries may use a butterfly exchange instead.'
      },
      scatter: {
        call: 'MPI_Scatter(all, 1, MPI_INT, &mine, 1, MPI_INT, 0, MPI_COMM_WORLD);',
        rounds: [Array.from({ length: P - 1 }, (_, k) => [0, k + 1])],
        start: () => ['10…80', null, null, null, null, null, null, null],
        apply: (v, pr) => { v[pr[1]] = 10 * (pr[1] + 1); v[0] = 10; },
        intro: 'Rank 0 holds the whole array {10, 20, …, 80}. Each rank needs a different piece.',
        end: 'Rank k received element k (rank 0 keeps 10). Unlike MPI_Bcast, every rank got a different value.'
      },
      gather: {
        call: 'MPI_Gather(&mine, 1, MPI_INT, all, 1, MPI_INT, 0, MPI_COMM_WORLD);',
        rounds: [Array.from({ length: P - 1 }, (_, k) => [k + 1, 0])],
        start: () => [10, 20, 30, 40, 50, 60, 70, 80],
        apply: () => {},
        intro: 'Each rank has computed one value. Rank 0 wants them all in one array, in rank order.',
        end: 'Rank 0 now holds {10, 20, …, 80}. Only the dest process\'s receive buffer is filled.'
      }
    };
    let mode = 'reduce', r = 0, vals, got;
    function resetState() { r = 0; vals = INFO[mode].start(); got = new Set(); }
    function render() {
      const I = INFO[mode], W = 680, bw = 70, gap = 12, x = k => 10 + k * (bw + gap), y = 78;
      const cur = r > 0 ? I.rounds[r - 1] : [];
      let b = '<defs><marker id="col-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker></defs>';
      cur.forEach(pr => {
        const x1 = x(pr[0]) + bw / 2, x2 = x(pr[1]) + bw / 2, top = y - 14 - Math.min(52, Math.abs(pr[0] - pr[1]) * 9);
        b += '<path d="M' + x1 + ' ' + (y - 2) + ' C' + x1 + ' ' + top + ' ' + x2 + ' ' + top + ' ' + x2 + ' ' + (y - 6) + '" fill="none" stroke="var(--accent)" stroke-width="2" marker-end="url(#col-arrow)"/>';
      });
      for (let k = 0; k < P; k++) {
        const recv = cur.some(pr => pr[1] === k);
        let label;
        if (mode === 'gather') label = k === 0 ? (r ? '10…80' : '10') : String(vals[k]);
        else label = vals[k] === null ? '—' : String(vals[k]);
        b += '<rect x="' + x(k) + '" y="' + y + '" width="' + bw + '" height="56" rx="8" fill="' + (recv ? 'var(--accent-soft)' : 'var(--paper)') + '" stroke="' + (recv ? 'var(--accent)' : 'var(--rule)') + '" stroke-width="' + (recv ? 2 : 1) + '"/>';
        b += txt(x(k) + bw / 2, y + 21, 'rank ' + k, 'text-anchor="middle" font-size="11" fill="var(--ink-2)" font-family="var(--mono)"');
        b += txt(x(k) + bw / 2, y + 45, label, 'text-anchor="middle" font-size="17" font-weight="700" fill="var(--ink)"');
      }
      b += txt(10, 160, I.call, 'font-family="var(--mono)" font-size="12" fill="var(--ink-2)"');
      ui.stage.innerHTML = svg(W, 172, b, 'Eight MPI processes in a collective operation');
      const total = I.rounds.length;
      ui.readout.textContent = r === 0 ? I.intro :
        (r < total ? 'Round ' + r + ' of ' + total + ': ' + cur.map(pr => pr[0] + ' → ' + pr[1]).join(', ') + '.' : I.end);
    }
    function step() {
      const I = INFO[mode];
      if (r >= I.rounds.length) return false;
      I.rounds[r].forEach(pr => I.apply(vals, pr, r));
      r++; render(); return r < I.rounds.length;
    }
    modes(ui.modes, [['bcast', 'MPI_Bcast'], ['reduce', 'MPI_Reduce'], ['allreduce', 'MPI_Allreduce'], ['scatter', 'MPI_Scatter'], ['gather', 'MPI_Gather']], mode,
      m => { mode = m; ctl.stop(); resetState(); render(); });
    const ctl = transport(ui.controls, step, () => { resetState(); render(); }, 1100);
    resetState(); render();
  }

  /* =====================================================================
     2. Message matching: source, tag, communicator, status
     ===================================================================== */
  function matching(root) {
    const ui = shell(root, 'Which message does MPI_Recv match?', 'Rank 0 posts one receive. Four messages have already been sent to it, listed in the order they were sent.');
    const START = [
      { id: 'm1', src: 1, tag: 0, n: 5, comm: 'MPI_COMM_WORLD' },
      { id: 'm2', src: 2, tag: 1, n: 3, comm: 'MPI_COMM_WORLD' },
      { id: 'm3', src: 1, tag: 1, n: 2, comm: 'MPI_COMM_WORLD' },
      { id: 'm4', src: 2, tag: 0, n: 4, comm: 'other_comm' }
    ];
    let queue, src = 'any', tag = 'any', comm = 'MPI_COMM_WORLD', last = null;
    function resetState() { queue = START.map(m => Object.assign({}, m)); last = null; }
    const matches = m => (src === 'any' || Number(src) === m.src) && (tag === 'any' || Number(tag) === m.tag) && comm === m.comm;
    function render() {
      const srcTxt = src === 'any' ? 'MPI_ANY_SOURCE' : src, tagTxt = tag === 'any' ? 'MPI_ANY_TAG' : tag;
      let h = '<pre class="demo-code"><code>MPI_Recv(buf, 100, MPI_INT, ' + esc(srcTxt) + ', ' + esc(tagTxt) + ', ' + esc(comm) + ', &amp;status);</code></pre>';
      h += '<ol class="msg-list">';
      if (!queue.length) h += '<li class="msg empty">No messages left.</li>';
      queue.forEach(m => {
        const ok = matches(m);
        h += '<li class="msg' + (ok ? ' eligible' : '') + '"><span class="msg-id">' + m.id + '</span>' +
          '<span>from rank <strong>' + m.src + '</strong>, tag <strong>' + m.tag + '</strong>, ' + m.n + ' ints, ' + esc(m.comm) + '</span>' +
          '<span class="msg-flag">' + (ok ? 'matches' : 'no match') + '</span></li>';
      });
      h += '</ol>';
      if (last) h += last;
      ui.stage.innerHTML = h;
    }
    function receive() {
      const eligible = queue.filter(matches);
      if (!eligible.length) {
        last = '<p class="msg-result bad"><strong>MPI_Recv blocks forever.</strong> No pending message matches the source, tag and communicator, so rank 0 hangs (unless a matching send comes later).</p>';
        ui.readout.textContent = 'A receive with no matching send never returns. Check the source, tag and communicator.';
        render(); return;
      }
      const m = eligible[0];
      const others = eligible.filter(x => x.src !== m.src);
      queue = queue.filter(x => x !== m);
      last = '<p class="msg-result"><strong>Received ' + m.id + '.</strong> status.MPI_SOURCE = ' + m.src + ', status.MPI_TAG = ' + m.tag +
        ', and MPI_Get_count(&amp;status, MPI_INT, &amp;n) sets n = ' + m.n + '.</p>';
      ui.readout.textContent = src === 'any' && others.length
        ? 'With MPI_ANY_SOURCE, a matching message from another sender (' + others.map(x => x.id).join(', ') + ') could equally have arrived first: MPI gives no order across senders. Messages from the same sender are never overtaken.'
        : 'Messages from one sender are received in the order that sender sent them (nonovertaking).';
      render();
    }
    select(ui.modes, 'source', [['any', 'MPI_ANY_SOURCE'], ['1', '1'], ['2', '2'], ['3', '3']], src, v => { src = v; last = null; render(); });
    select(ui.modes, 'tag', [['any', 'MPI_ANY_TAG'], ['0', '0'], ['1', '1'], ['2', '2']], tag, v => { tag = v; last = null; render(); });
    select(ui.modes, 'comm', [['MPI_COMM_WORLD', 'MPI_COMM_WORLD'], ['other_comm', 'other_comm']], comm, v => { comm = v; last = null; render(); });
    ui.controls.append(btn('Receive one message', receive, 'primary'), btn('Reset messages', () => { resetState(); ui.readout.textContent = ''; render(); }));
    resetState(); render();
    ui.readout.textContent = 'Change the receive arguments, then press Receive. Senders can\'t use wildcards; only the receiver can.';
  }

  /* =====================================================================
     3. Convolution with border strategies
     ===================================================================== */
  function convolution(root) {
    const ui = shell(root, 'Convolution and border strategies', 'The 4 × 4 image from Lecture 16. Choose a kernel and a border strategy, then pick an output pixel to see its sum. (The lecture\'s output grid matches the mean filter with reflection.)');
    const IMG = [[74, 72, 77, 62], [131, 134, 193, 183], [251, 249, 221, 226], [220, 206, 230, 230]];
    const M = 4, N = 4;
    const KERNELS = {
      mean: { label: '3×3 mean (1/9 each)', w: [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map(r => r.map(v => v / 9)), show: '1/9 ×\n1 1 1\n1 1 1\n1 1 1' },
      ones: { label: 'Forgot to divide (all 1s)', w: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], show: '1 1 1\n1 1 1\n1 1 1' },
      hpf: { label: 'High-pass (sums to 0)', w: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]], show: '−1 −1 −1\n−1  8 −1\n−1 −1 −1' },
      um: { label: 'Unsharp mask, k = 0.5', w: [[-1, -1, -1], [-1, 26, -1], [-1, -1, -1]].map(r => r.map(v => v / 18)), show: 'f + 0.5·(f − mean)\n= 1/18 ×\n−1 −1 −1\n−1 26 −1\n−1 −1 −1' }
    };
    const BORDERS = {
      copy: 'Copy input pixels: border pixels are copied unchanged; output stays 4 × 4.',
      trunc: 'Truncate the image: border pixels are dropped; output is (M−2) × (N−2) = 2 × 2.',
      reflect: 'Reflection: an out-of-range index is mirrored back into the image (here, −1 → 0 and 4 → 3). Output stays 4 × 4.',
      kernel: 'Truncate the kernel: use only the weights that land inside the image, rescaled so they still sum to the full kernel\'s sum.'
    };
    let kern = 'mean', border = 'copy', sel = [2, 1];
    const refl = (v, n) => (v < 0 ? -v - 1 : v >= n ? 2 * n - v - 1 : v);
    function compute(i, j) {
      const w = KERNELS[kern].w;
      const interior = i > 0 && j > 0 && i < M - 1 && j < N - 1;
      if (!interior && border === 'trunc') return null;
      if (!interior && border === 'copy') return { v: IMG[i][j], copied: true, terms: [] };
      let sum = 0, wsum = 0, wall = 0; const terms = [];
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        const wt = w[a + 1][b + 1]; wall += wt;
        let y = i + a, x = j + b;
        if (border === 'reflect') { y = refl(y, M); x = refl(x, N); }
        if (y < 0 || x < 0 || y >= M || x >= N) continue;
        sum += wt * IMG[y][x]; wsum += wt; terms.push([wt, IMG[y][x]]);
      }
      if (border === 'kernel' && !interior && Math.abs(wall) > 1e-9 && Math.abs(wsum) > 1e-9) {
        const scale = wall / wsum; sum *= scale; terms.forEach(t => { t[0] *= scale; });
      }
      return { v: sum, copied: false, terms: terms };
    }
    function cell(v, attrs) {
      const shown = Math.round(v), clipped = shown < 0 || shown > 255;
      return '<td ' + (attrs || '') + ' style="' + grey(v) + '">' + (clipped ? '<span class="clip">' + shown + '</span>' : shown) + '</td>';
    }
    function render() {
      let inH = '<table class="px-grid"><caption>Input f</caption>' + IMG.map((row, i) => '<tr>' + row.map((v, j) => {
        const inNb = Math.abs(i - sel[0]) <= 1 && Math.abs(j - sel[1]) <= 1;
        return cell(v, inNb ? 'class="nb"' : '');
      }).join('') + '</tr>').join('') + '</table>';
      let outRows = '';
      for (let i = 0; i < M; i++) {
        let row = '';
        for (let j = 0; j < N; j++) {
          const r = compute(i, j);
          if (r === null) continue;
          const isSel = i === sel[0] && j === sel[1];
          row += '<td class="pick' + (isSel ? ' sel' : '') + (r.copied ? ' copied' : '') + '" style="' + grey(r.v) + '"><button type="button" data-i="' + i + '" data-j="' + j + '" aria-label="Output pixel row ' + i + ' column ' + j + '">' +
            (Math.round(r.v) < 0 || Math.round(r.v) > 255 ? '<span class="clip">' + Math.round(r.v) + '</span>' : Math.round(r.v)) + '</button></td>';
        }
        if (row) outRows += '<tr>' + row + '</tr>';
      }
      const outH = '<table class="px-grid out"><caption>Output' + (border === 'trunc' ? ' (2 × 2)' : '') + '</caption>' + outRows + '</table>';
      const kH = '<div class="kern"><div class="kern-cap">Kernel</div><pre>' + esc(KERNELS[kern].show) + '</pre></div>';
      ui.stage.innerHTML = '<div class="conv-row">' + inH + kH + outH + '</div>';
      ui.stage.querySelectorAll('button[data-i]').forEach(b => b.addEventListener('click', () => { sel = [Number(b.dataset.i), Number(b.dataset.j)]; render(); }));
      const r = compute(sel[0], sel[1]);
      let msg = BORDERS[border] + ' ';
      if (r === null) msg += 'That pixel was removed. Pick one in the output grid.';
      else if (r.copied) msg += 'Pixel (' + sel[0] + ', ' + sel[1] + ') is on the border, so it was copied: ' + r.v + '.';
      else {
        const raw = r.terms.reduce((s, t) => s + t[0] * t[1], 0);
        const expr = r.terms.map((t, n) => (n === 0 ? (t[0] < 0 ? '−' : '') : (t[0] < 0 ? ' − ' : ' + ')) + fmt(Math.abs(t[0]), 3) + '×' + t[1]).join('');
        msg += 'Pixel (' + sel[0] + ', ' + sel[1] + ') = ' + expr + ' = ' + fmt(raw, 1) +
          (Math.round(raw) > 255 || Math.round(raw) < 0 ? ', which is clipped to ' + Math.max(0, Math.min(255, Math.round(raw))) + ' when saved as 8-bit.' : '.');
      }
      ui.readout.textContent = msg;
    }
    modes(ui.modes, Object.keys(KERNELS).map(k => [k, KERNELS[k].label]), kern, v => { kern = v; render(); });
    const bhost = document.createElement('div'); bhost.className = 'demo-modes';
    ui.modes.after(bhost);
    modes(bhost, [['copy', 'Copy input'], ['trunc', 'Truncate image'], ['reflect', 'Reflect'], ['kernel', 'Truncate kernel']], border, v => {
      border = v;
      if (border === 'trunc' && (sel[0] === 0 || sel[1] === 0 || sel[0] === M - 1 || sel[1] === N - 1)) sel = [1, 1];
      render();
    });
    render();
  }

  /* =====================================================================
     4. Mean vs median vs Gaussian on one row of pixels
     ===================================================================== */
  function median(root) {
    const ui = shell(root, 'Mean vs median filtering', 'One row of a greyscale image: a dark region, a single bright pixel, then a sharp edge to a bright region.');
    const ROW = [40, 40, 40, 40, 230, 40, 40, 40, 40, 200, 200, 200, 200, 200, 200, 200];
    let size = 3;
    const refl = (v, n) => (v < 0 ? -v - 1 : v >= n ? 2 * n - v - 1 : v);
    function filt(kind) {
      const h = (size - 1) / 2;
      return ROW.map((_, i) => {
        const win = [];
        for (let d = -h; d <= h; d++) win.push(ROW[refl(i + d, ROW.length)]);
        if (kind === 'mean') return win.reduce((a, b) => a + b, 0) / win.length;
        if (kind === 'median') return win.slice().sort((a, b) => a - b)[h];
        // binomial weights approximate a Gaussian: 1 2 1, 1 4 6 4 1, 1 6 15 20 15 6 1
        const w = size === 3 ? [1, 2, 1] : size === 5 ? [1, 4, 6, 4, 1] : [1, 6, 15, 20, 15, 6, 1];
        const tot = w.reduce((a, b) => a + b, 0);
        return win.reduce((s, v, k) => s + v * w[k], 0) / tot;
      });
    }
    function strip(label, vals) {
      return '<div class="strip"><span class="strip-label">' + esc(label) + '</span><div class="strip-cells">' +
        vals.map(v => '<span style="' + grey(v) + '">' + Math.round(v) + '</span>').join('') + '</div></div>';
    }
    function render() {
      ui.stage.innerHTML = strip('Input', ROW) + strip(size + '-wide mean', filt('mean')) + strip(size + '-wide Gaussian', filt('gauss')) + strip(size + '-wide median', filt('median'));
      ui.readout.textContent = size === 3
        ? 'Mean and Gaussian spread the bright pixel into its neighbours and smear the edge. The median removes the bright pixel completely (it is 1 of 3 values, less than half) and keeps the edge sharp. It would also remove a genuine one-pixel-wide line: the median can\'t tell noise from small detail.'
        : 'A wider window smooths more: the mean and Gaussian blur the edge over more pixels, while the median still keeps the edge sharp and still deletes anything narrower than half the window.';
    }
    slider(ui.controls, 'Window size', 0, 2, 0, v => { size = 3 + 2 * v; render(); }, v => String(3 + 2 * v));
    render();
  }

  /* =====================================================================
     5. Moving data to the GPU: transfer vs compute
     ===================================================================== */
  function transfer(root) {
    const ui = shell(root, 'Is the GPU worth the copy?', 'Lecture 18\'s measurements: a 3000 × 4000 RGB float32 image (144 MB), Colab T4 GPU vs one CPU thread.');
    const MEASURED = {
      /* Lecture 18's own speedups come from unrounded medians, so they're stored rather than recomputed. */
      sharpen: { label: 'Sharpen 3×3 (measured)', gpu: 9, cpu: 5200, xfer: 132, total: 141, kOnly: 555, e2e: 37 },
      median: { label: 'Median 3×3 (measured)', gpu: 16, cpu: 20000, xfer: 135, total: 151, kOnly: 1270, e2e: 134 }
    };
    let mode = 'sharpen', n = 3;
    function numbers() {
      if (mode !== 'model') return MEASURED[mode];
      const f = (n * n) / 9;  // work per pixel grows with the neighbourhood
      return { label: n + '×' + n + ' sum filter (scaled from the sharpen numbers)', gpu: 9 * f, cpu: 5200 * f, xfer: 132 };
    }
    function render() {
      const d = numbers(), gpuTotal = d.total || d.gpu + d.xfer;
      const kOnly = d.kOnly || d.cpu / d.gpu, e2e = d.e2e || d.cpu / gpuTotal, share = 100 * d.xfer / (d.gpu + d.xfer);
      const W = 680, L = 120, R = 20, bar = W - L - R;
      const up = d.xfer / 2, dn = d.xfer / 2;
      let b = '';
      // GPU breakdown as a 100% bar
      const seg = (x, w, fill, label) => '<rect x="' + x + '" y="30" width="' + Math.max(1.5, w) + '" height="30" fill="' + fill + '"/>' +
        (w > 70 ? txt(x + w / 2, 50, label, 'text-anchor="middle" font-size="12" fill="var(--paper)" font-weight="700"') : '');
      const sum = d.gpu + d.xfer, s1 = bar * up / sum, s2 = bar * d.gpu / sum, s3 = bar * dn / sum;
      b += txt(0, 50, 'GPU time', 'font-size="13" fill="var(--ink)" font-weight="700"');
      b += seg(L, s1, 'var(--t2)', 'upload') + seg(L + s1, s2, 'var(--accent)', 'kernel') + seg(L + s1 + s2, s3, 'var(--t2)', 'download');
      b += txt(L, 78, fmt(share, 0) + '% moving data, ' + fmt(100 - share, 0) + '% computing (' + fmt(gpuTotal, 0) + ' ms end to end)', 'font-size="12" fill="var(--ink-2)"');
      // speedup comparison
      const maxS = Math.max(kOnly, 1);
      const sb = (y, v, label, fill) => '<rect x="' + L + '" y="' + y + '" width="' + Math.max(2, bar * v / maxS) + '" height="22" rx="3" fill="' + fill + '"/>' +
        txt(0, y + 16, label, 'font-size="13" fill="var(--ink)"') + txt(Math.min(L + bar * v / maxS + 8, W - 60), y + 16, fmt(v, 0) + '×', 'font-size="13" font-weight="700" fill="var(--ink)"');
      b += sb(104, kOnly, 'Kernel only', 'var(--chart-muted)') + sb(136, e2e, 'End to end', 'var(--accent)');
      ui.stage.innerHTML = svg(W, 170, b, 'GPU time breakdown and speedups');
      ui.readout.textContent = d.label + ': CPU ' + fmt(d.cpu / 1000, 1) + ' s, GPU kernel ' + fmt(d.gpu, 0) + ' ms plus ' + fmt(d.xfer, 0) + ' ms of copying. ' +
        'The kernel alone is ' + (mode === 'model' ? '' : '~') + fmt(kOnly, 0) + '× faster, but end to end it\'s ' + (mode === 'model' ? '' : '~') + fmt(e2e, 0) + '×. ' +
        (mode === 'model' ? 'More work per byte moved pushes the end-to-end speedup toward the kernel-only speedup.' : 'The more work per byte moved, the better the GPU looks.');
    }
    const sl = document.createElement('div');
    modes(ui.modes, [['sharpen', 'Sharpen (measured)'], ['median', 'Median (measured)'], ['model', 'Bigger neighbourhood (model)']], mode, m => { mode = m; sl.hidden = m !== 'model'; render(); });
    slider(sl, 'Neighbourhood', 1, 7, 1, v => { n = 2 * v + 1; render(); }, v => (2 * v + 1) + ' × ' + (2 * v + 1));
    sl.hidden = true; ui.controls.appendChild(sl);
    render();
  }

  Object.assign(window.StudyDemos, { collectives, matching, convolution, median, transfer });
})();
