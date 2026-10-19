/* Topic quiz bank. Each question:
   { id, topic, kind: 'concept'|'calc'|'code'|'graph', q, code?, chart?, options[4], answer (index), why }
   Inline `code` and **bold** in q/options/why are rendered by assets/common.js. */

(function () {
  const HEAT_LOOP_FULL = `while (1) {
    compute my rows of next[];           /* reads cur, writes only my rows */
    thread_max_diff[tid] = localMax;     /* each thread has its own slot */
    pthread_barrier_wait(&b1);           /* barrier 1 */
    if (tid == 0) {                      /* thread 0 alone */
        globalMax = max of thread_max_diff[];
        swap(cur, next);
        if (globalMax < EPSILON || iter >= MAX_ITERS - 1) converged = 1;
        iter++;
    }
    pthread_barrier_wait(&b2);           /* barrier 2 */
    if (converged) break;
}`;

  const LIST_TABLE = `Shared sorted linked list: 1,000 keys, 100,000 operations per thread.
Run times in seconds for 1 / 2 / 4 / 8 threads.

99.9% Member, 0.05% Insert, 0.05% Delete
  read-write lock          0.213   0.123   0.098   0.115
  one mutex for the list   0.211   0.450   0.385   0.457
  one mutex per node       1.680   5.700   3.450   2.700

80% Member, 10% Insert, 10% Delete
  read-write lock          2.48    4.97    4.69    4.71
  one mutex for the list   2.50    5.13    5.04    5.11
  one mutex per node      12.00   29.60   17.00   12.00`;

  const CODE_A = `int count = 0;
void* inc(void* arg) {
    for (int i = 0; i < 100000; i++) count++;
    return NULL;
}
int main(void) {
    pthread_t t1, t2;
    pthread_create(&t1, NULL, inc, NULL);
    pthread_create(&t2, NULL, inc, NULL);
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    printf("%d\\n", count);
    return 0;
}`;

  const CODE_B = `void* hello(void* arg) {
    long id = (long) arg;
    printf("thread %ld\\n", id);
    return NULL;
}
int main(void) {
    pthread_t t[3];
    for (long i = 0; i < 3; i++)
        pthread_create(&t[i], NULL, hello, (void*) i);
    return 0;
}`;

  const CODE_C = `pthread_mutex_lock(&m);
if (ready == 0)
    pthread_cond_wait(&cv, &m);
use(data);
pthread_mutex_unlock(&m);`;

  const CODE_D = `/* barrier b initialized for p threads */
for (int phase = 0; phase < p; phase++) {
    int partner = compute_partner(rank, phase);
    if (partner < 0 || partner >= p) continue;   /* idle this phase */
    pthread_barrier_wait(&b);                    /* barrier 1 */
    read_partner_block(partner);
    pthread_barrier_wait(&b);                    /* barrier 2 */
    write_my_block();
}`;

  const CODE_E = `double partial[4];   /* shared, one slot per thread */
void* work(void* arg) {
    long r = (long) arg;
    for (int i = start(r); i < end(r); i++)
        partial[r] += a[i];
    return NULL;
}`;

  const CODE_F = `/* flag and sum are shared */
while (flag != my_rank);
sum += my_sum;
flag = (flag + 1) % thread_count;`;

  const FIG_SPEEDUP = {
    type: 'line',
    title: 'Speedup of Programs X and Y by thread count',
    note: 'Mean of 25 runs per point; dashed line = perfect (linear) speedup',
    xLabel: 'Threads (p)', yLabel: 'Speedup (×)', yMax: 20,
    x: [1, 2, 4, 8, 16],
    series: [
      { name: 'Perfect', values: [1, 2, 4, 8, 16], style: 'reference' },
      { name: 'Program Y', values: [1, 2.2, 4.6, 9.1, 18.4], style: 'muted', labels: 'above' },
      { name: 'Program X', values: [1, 1.9, 3.6, 6.5, 10.8], style: 'accent', labels: 'below' }
    ]
  };

  const FIG_BIMODAL = {
    type: 'hist',
    title: 'Run-time histogram, Program Z, 4 threads',
    note: '25 runs, same input every run',
    xLabel: 'Run time (s)',
    bins: ['4.0–4.2', '4.2–4.4', '4.4–4.6', '4.6–4.8', '4.8–5.0', '5.0–5.2', '5.2–5.4', '5.4–5.6', '5.6–5.8', '5.8–6.0'],
    counts: [2, 6, 4, 1, 0, 0, 1, 5, 5, 1]
  };

  const FIG_SKEWED = {
    type: 'hist',
    title: 'Run-time histogram, Program W, 8 threads',
    note: '25 runs, same input every run',
    xLabel: 'Run time (s)',
    bins: ['3.0–3.2', '3.2–3.4', '3.4–3.6', '3.6–3.8', '3.8–4.0', '4.0–4.2', '4.2–4.4', '4.4–4.6'],
    counts: [7, 9, 4, 2, 1, 1, 0, 1]
  };

  window.QUIZ_BANK = [
    /* ---------- Why parallel computing ---------- */
    { id: 'b1', topic: 'why', kind: 'concept',
      q: 'A program in which multiple tasks can be in progress at any instant, even on a single core, is called ___.',
      options: ['parallel', 'distributed', 'concurrent', 'SIMD'], answer: 2,
      why: 'Concurrency only needs tasks to be in progress at once; time-slicing on one core qualifies. Parallelism needs simultaneous execution on multiple cores.' },
    { id: 'b2', topic: 'why', kind: 'calc',
      q: 'CPU performance growing 50% per year for 10 years improves by roughly ___.',
      options: ['5×', '15×', '60×', '500×'], answer: 2,
      why: '1.5¹⁰ ≈ 58, the "60×" from the lecture. At 20% per year it would be only 1.2¹⁰ ≈ 6×.' },
    { id: 'b3', topic: 'why', kind: 'concept',
      q: 'Which of these can happen on a single-core CPU?',
      options: ['Concurrency', 'Parallelism', 'Distributed computing', 'Two additions completing in the same clock cycle on separate cores'], answer: 0,
      why: 'A single core can time-slice between tasks (concurrency) but cannot execute two tasks simultaneously.' },
    { id: 'b4', topic: 'why', kind: 'concept',
      q: 'Moore\'s law describes ___.',
      options: ['transistor counts on a chip doubling roughly every two years', 'clock speed doubling every year', 'power use halving every two years', 'speedup being bounded by the serial fraction'], answer: 0,
      why: 'Gordon Moore\'s 1965 observation (later revised to every two years). It is an observation, not a physical law. The last option is Amdahl\'s law.' },
    { id: 'b5', topic: 'why', kind: 'concept',
      q: 'Why did chip makers switch to multicore processors in the 2000s?',
      options: ['Faster transistors draw more power and produce heat that air cooling can no longer remove', 'Compilers could not use faster single cores', 'Main memory became slower', 'Moore\'s law stopped completely'], answer: 0,
      why: 'Increasing speed increases power, which is dissipated as heat; air-cooled chips hit their limit. Adding cores adds compute without raising clock speed.' },
    { id: 'b6', topic: 'why', kind: 'concept',
      q: 'Which is an example of distributed computing?',
      options: ['A web app that queries a database on a remote server', 'pigz compressing a file on 10 cores', 'A GUI with separate input and drawing threads on one core', 'Vector addition on a GPU'], answer: 0,
      why: 'Distributed programs cooperate with other programs on separate machines, usually loosely coupled over a network.' },
    { id: 'b7', topic: 'why', kind: 'concept',
      q: 'Why can\'t a translation program simply convert serial programs into efficient parallel ones?',
      options: ['The best parallel algorithm is often entirely different from the serial one, like the tree-structured global sum', 'C has no threading library', 'The OS does not allow it', 'Serial programs use too much memory'], answer: 0,
      why: 'A tool can recognize simple constructs, but efficient parallel versions usually need a new algorithm that a translator would not discover.' },
    { id: 'b8', topic: 'why', kind: 'calc',
      q: 'pigz compressed a 1 GB file in 34.7 s with 1 core and 4.7 s with 10 cores. The speedup is about ___.',
      options: ['7.4', '0.74', '10', '29.9'], answer: 0,
      why: 'S = T_serial / T_parallel = 34.7 / 4.7 ≈ 7.4 (efficiency ≈ 0.74).' },
    { id: 'b9', topic: 'why', kind: 'concept',
      q: 'Six TAs each grade one page of every exam. This is ___.',
      options: ['data parallelism', 'task parallelism', 'an embarrassingly parallel split', 'SIMD execution'], answer: 1,
      why: 'Each TA performs a different operation (grading a different page), so it is task parallelism.' },

    /* ---------- Designing parallel programs ---------- */
    { id: 'b10', topic: 'design', kind: 'concept',
      q: 'The third step of Foster\'s methodology is ___.',
      options: ['agglomeration', 'mapping', 'communication', 'partitioning'], answer: 0,
      why: 'Partitioning → communication → agglomeration (aggregation) → mapping.' },
    { id: 'b11', topic: 'design', kind: 'concept',
      q: 'Making worker cores wait until the master core has finished reading the input into an array is an example of ___.',
      options: ['communication', 'synchronization', 'load balancing', 'agglomeration'], answer: 1,
      why: 'Cores run at their own pace; waiting for another core to reach a point is synchronization.' },
    { id: 'b12', topic: 'design', kind: 'calc',
      q: 'n = 100 items are split over p = 8 threads: each gets ⌊n/p⌋ and the first n mod p threads get one extra. Thread 5\'s first index is ___.',
      options: ['60', '64', '65', '63'], answer: 1,
      why: 'q = 12, r = 4. first = rank·q + min(rank, r) = 5·12 + 4 = 64.' },
    { id: 'b13', topic: 'design', kind: 'calc',
      q: 'With 64 cores, a tree-structured global sum needs ___ receive-and-add steps on core 0.',
      options: ['63', '32', '8', '6'], answer: 3,
      why: 'log₂ 64 = 6. A serial combine would take 63.' },
    { id: 'b14', topic: 'design', kind: 'concept',
      ctx: "Heat diffusion case study (Lecture 8): a 2D grid models a metal plate. The outer border is fixed at 0 (cold) and a centred block is fixed hot. Every iteration, each other cell becomes the average of its four neighbours from the previous iteration:\n`next[i][j] = 0.25 * (cur[i-1][j] + cur[i+1][j] + cur[i][j-1] + cur[i][j+1])`\nPthreads version: each thread updates its own band of rows.",
      q: "Applying Foster's methodology to this simulation, the agglomeration step turns the one-task-per-cell partition into ___.",
      options: ['a band of contiguous rows per thread', 'one task per column', 'one task per cell', 'a single task for the whole grid'], answer: 0,
      why: 'One task per cell is far too fine-grained, so cells are grouped into row bands; rows are contiguous in row-major memory.' },
    { id: 'b15', topic: 'design', kind: 'concept',
      q: 'An embarrassingly parallel problem is one where ___.',
      options: ['subtasks need little or no communication with each other', 'parallelization is impossible', 'the serial fraction dominates the run time', 'every task must synchronize after each step'], answer: 0,
      why: 'Each core works alone, e.g. applying a filter to each image in a folder.' },
    { id: 'b16', topic: 'design', kind: 'concept',
      q: 'Why is the recurrence `A[i] = F(A[i-1])` hard to parallelize?',
      options: ['Each value depends on the previous one, so a core cannot start at an arbitrary index', 'F might not be thread-safe', 'Arrays cannot be shared between threads', 'It needs too much memory'], answer: 0,
      why: 'To get A[k] you must compute every value before it; there is no independent starting point for each core.' },
    { id: 'b17', topic: 'design', kind: 'concept',
      q: 'In a shared-memory parallel sum, what does each worker need to be told at the start?',
      options: ['Its start and end indices', 'A copy of its data chunk sent as a message', 'The final global sum', 'Every other worker\'s partial sum'], answer: 0,
      why: 'With shared data, only the index range is needed. In distributed memory the chunk itself must be sent.' },
    { id: 'b18', topic: 'design', kind: 'calc',
      q: '217 exams are split over 6 TAs: everyone gets ⌊217/6⌋ and the first (217 mod 6) TAs get one extra. How many TAs grade 37 exams?',
      options: ['1', '5', '6', '0'], answer: 0,
      why: '⌊217/6⌋ = 36 and 217 mod 6 = 1, so one TA grades 37 and five grade 36 (5·36 + 37 = 217).' },
    { id: 'b19', topic: 'design', kind: 'concept',
      ctx: "Histogram example (textbook Section 2.7): count how many of n data values fall into each of bin_count bins. p threads each take a contiguous block of data; for every element they find its bin b and increment `bin_counts[b]`.",
      q: "On a MIMD (multicore CPU) system, the races on `bin_counts` are best avoided by ___.",
      options: ['giving each thread a private loc_bin_counts array, then summing the arrays', 'a mutex around every increment', 'atomic increments on the GPU', 'having one thread do all the counting'], answer: 0,
      why: 'Private per-thread counts avoid both races and lock overhead; a (tree) global sum combines them at the end.' },

    /* ---------- Pthreads basics & POSIX ---------- */
    { id: 'b20', topic: 'pthreads', kind: 'concept',
      q: '`pthread_join(tid, &ret)` ___.',
      options: ['detaches tid so its resources are freed automatically', 'forcibly terminates tid', 'blocks until tid terminates and can collect its return value', 'blocks until all threads reach the same point'], answer: 2,
      why: 'join waits once for one thread to finish. Waiting for many threads at a point is a barrier.' },
    { id: 'b21', topic: 'pthreads', kind: 'concept',
      q: 'Which statement about threads in one process is TRUE?',
      options: ['Each thread has its own heap.', 'Each thread has its own stack and program counter but shares globals and the heap.', 'A crash in one thread leaves the other threads running.', 'Threads are more expensive to create than processes.'], answer: 1,
      why: 'Threads share the process\'s data, code, heap and file descriptors; they need only their own stack and program counter.' },
    { id: 'b22', topic: 'pthreads', kind: 'concept',
      q: 'Creating a joinable thread and never calling pthread_join on it causes ___.',
      options: ['a deadlock', 'nothing; it is cleaned up automatically', 'a memory leak', 'a race condition'], answer: 2,
      why: 'Joinable threads keep their resources until joined. Use detached threads if nobody needs the result.' },
    { id: 'b23', topic: 'pthreads', kind: 'code', code: CODE_B,
      q: 'The main problem with this program is that ___.',
      options: ['threads always print in reverse order', 'casting a long to `void*` is invalid', 'main may return before the threads print, which ends the process, and the threads are never joined', '`hello` must call pthread_exit'], answer: 2,
      why: 'Returning from main terminates the whole process, killing its threads; the joinable threads also leak.' },
    { id: 'b24', topic: 'pthreads', kind: 'code', code: CODE_B,
      q: 'After adding a loop that joins all three threads, the output order is ___.',
      options: ['always thread 0, 1, 2', 'always thread 2, 1, 0', 'only thread 0 prints', 'nondeterministic'], answer: 3,
      why: 'The OS decides when each thread runs; you do not control the order.' },
    { id: 'b25', topic: 'pthreads', kind: 'concept',
      q: 'Which command compiles and links a Pthreads program correctly?',
      options: ['gcc -O2 -pthread prog.c -o prog', 'gcc -O2 -lpthreads prog.c', 'gcc -O2 -threads prog.c', 'gcc -O2 prog.c -lp'], answer: 0,
      why: 'Use `-pthread` (or `-lpthread`, singular). `-lpthreads` is a common typo.' },
    { id: 'b26', topic: 'pthreads', kind: 'concept',
      q: 'Which is the required signature for a Pthreads thread function?',
      options: ['void* work(void* arg)', 'void work(void)', 'int work(int arg)', 'void* work(int* arg, int n)'], answer: 0,
      why: 'One `void*` in, one `void*` out. Pass several values by pointing to a struct.' },
    { id: 'b27', topic: 'pthreads', kind: 'concept',
      q: 'The second argument of `pthread_create`, usually `NULL`, is ___.',
      options: ['a pointer to thread attributes such as detach state (NULL = defaults)', 'the argument passed to the thread', 'the thread\'s return value', 'the number of threads to create'], answer: 0,
      why: 'Order: handle out, attributes, function, argument.' },
    { id: 'b28', topic: 'pthreads', kind: 'concept',
      q: 'To compile strict C against POSIX.1-2008 in the course\'s Docker image, define ___.',
      options: ['_POSIX_C_SOURCE as 200809L', '_GNU_SOURCE', 'POSIX_2008 as 1', '_XOPEN_SOURCE as 2008'], answer: 0,
      why: '`#define _POSIX_C_SOURCE 200809L` on the first line, or `-D_POSIX_C_SOURCE=200809L` on the gcc command line. It is a feature-test macro.' },
    { id: 'b29', topic: 'pthreads', kind: 'concept',
      q: 'A detached thread ___.',
      options: ['frees its own resources when it ends and cannot be joined', 'must be joined to avoid a leak', 'keeps running after the process exits', 'always runs on its own core'], answer: 0,
      why: 'Create it with an attribute set to PTHREAD_CREATE_DETACHED when nobody needs its result.' },

    /* ---------- Barriers & odd-even sort ---------- */
    { id: 'b30', topic: 'oddeven', kind: 'calc',
      ctx: "Block-parallel odd-even sort: each of p threads first sorts its own contiguous block with qsort. Then, in each phase, paired threads do a compare-split: merge their two sorted blocks; the lower-ranked thread keeps the smaller half and the higher-ranked thread the larger half.",
      q: "With 4 threads sorting 10,000 elements, at most ___ compare-split phases are needed.",
      options: ['4', '2,500', '10,000', '16'], answer: 0,
      why: 'p blocks need at most p phases, just as n elements need at most n phases.' },
    { id: 'b31', topic: 'oddeven', kind: 'code', code: CODE_D,
      q: 'What happens with this loop?',
      options: ['It works correctly: idle threads have nothing to do.', 'It works but runs slower.', 'It sorts in fewer phases.', 'Idle threads skip the barriers, so barrier calls from different phases get matched: races or a hang.'], answer: 3,
      why: 'Every participating thread must reach every barrier, even in phases where it has no partner.' },
    { id: 'b32', topic: 'oddeven', kind: 'code', code: CODE_D,
      q: 'Which barrier stops a thread from overwriting its block while its partner is still reading it?',
      options: ['barrier 2', 'barrier 1', 'neither', 'only both together'], answer: 0,
      why: 'Barrier 2 sits between all reads and any writes. Barrier 1 ensures last phase\'s writes are done before reading.' },
    { id: 'b33', topic: 'oddeven', kind: 'calc',
      ctx: "Odd-even transposition sort alternates two kinds of phase.\nEven phase: compare-swap the pairs (a[0],a[1]), (a[2],a[3]), …\nOdd phase: compare-swap the pairs (a[1],a[2]), (a[3],a[4]), …",
      q: "After one even phase, the list 5 9 4 3 becomes ___.",
      options: ['5 9 3 4', '5 4 9 3', '3 4 5 9', '9 5 4 3'], answer: 0,
      why: 'Even phase compare-swaps (a[0],a[1]) and (a[2],a[3]): (5,9) stays, (4,3) swaps.' },
    { id: 'b34', topic: 'oddeven', kind: 'concept',
      ctx: "Odd-even transposition sort alternates two kinds of phase.\nEven phase: compare-swap the pairs (a[0],a[1]), (a[2],a[3]), …\nOdd phase: compare-swap the pairs (a[1],a[2]), (a[3],a[4]), …",
      q: "On n elements, the sort needs at most ___ phases.",
      options: ['n', 'log₂ n', 'n²', 'n/2'], answer: 0,
      why: 'n phases always suffice.' },
    { id: 'b35', topic: 'oddeven', kind: 'calc',
      q: 'With p = 6 threads, in an odd phase, thread 3\'s partner is ___.',
      options: ['4', '2', 'none (idle)', '5'], answer: 0,
      why: 'Odd phase: odd ranks pair with rank + 1, even ranks with rank − 1. Pairs are (1,2) and (3,4).' },
    { id: 'b36', topic: 'oddeven', kind: 'calc',
      q: 'With p = 6 threads, which threads are idle in an odd phase?',
      options: ['0 and 5', 'none', '5 only', '0 only'], answer: 0,
      why: 'Odd phases pair (1,2) and (3,4); thread 0\'s partner would be −1 and thread 5\'s would be 6, both out of range.' },
    { id: 'b37', topic: 'oddeven', kind: 'calc',
      ctx: "Block-parallel odd-even sort: each of p threads first sorts its own contiguous block with qsort. Then, in each phase, paired threads do a compare-split: merge their two sorted blocks; the lower-ranked thread keeps the smaller half and the higher-ranked thread the larger half.",
      q: "In a compare-split, thread 1 holds 35 36 42 43 and thread 2 holds 12 21 27 49. Afterwards thread 1 holds ___.",
      options: ['12 21 27 35', '36 42 43 49', '35 36 42 43', '12 21 27 49'], answer: 0,
      why: 'Merge to 12 21 27 35 36 42 43 49; the lower rank keeps the smaller half.' },
    { id: 'b38', topic: 'oddeven', kind: 'concept',
      q: 'Why is plain bubble sort hard to parallelize?',
      options: ['Each compare-swap depends on the result of the previous one as it walks the list', 'It is recursive', 'It needs extra memory', 'It is O(n log n)'], answer: 0,
      why: 'Odd-even transposition decouples the compare-swaps so each phase works on disjoint pairs.' },
    { id: 'b39', topic: 'oddeven', kind: 'concept',
      q: '`pthread_barrier_wait` returns `PTHREAD_BARRIER_SERIAL_THREAD` to ___.',
      options: ['exactly one arbitrary thread', 'always the last thread to arrive', 'always thread 0', 'every thread'], answer: 0,
      why: 'One arbitrary thread gets it; all others get 0. The barrier then auto-resets.' },

    /* ---------- Synchronization ---------- */
    { id: 'b40', topic: 'sync', kind: 'concept',
      q: 'Which function is NOT thread-safe because it keeps its state in a static variable?',
      options: ['strtok_r', 'pthread_mutex_lock', 'sem_post', 'strtok'], answer: 3,
      why: 'strtok\'s saved position is shared by every caller. strtok_r takes your own save pointer.' },
    { id: 'b41', topic: 'sync', kind: 'concept',
      q: '`pthread_cond_wait(&c, &m)` ___.',
      options: ['spins on the CPU until signalled', 'must be called with m unlocked', 'atomically releases m and sleeps, then re-acquires m before returning', 'wakes every thread waiting on c'], answer: 2,
      why: 'Releasing the mutex while asleep lets the producer change the condition.' },
    { id: 'b42', topic: 'sync', kind: 'code', code: CODE_A,
      q: 'Run normally on a multicore machine, this program prints ___.',
      options: ['always 200000', 'at most 200000, and often less', 'always 100000', 'nothing: it does not compile'], answer: 1,
      why: '`count++` is load, increment, store. Interleaved increments get lost.' },
    { id: 'b43', topic: 'sync', kind: 'code', code: CODE_A,
      q: 'Run under `valgrind --tool=drd --fair-sched=yes`, it most likely ___.',
      options: ['prints 200000, and DRD reports conflicting loads/stores on count', 'prints less than 200000, and DRD reports nothing', 'prints 200000, and DRD reports nothing', 'hangs forever'], answer: 0,
      why: 'Valgrind runs one thread at a time, so increments do not actually interleave, but DRD still detects the unsynchronized access.' },
    { id: 'b44', topic: 'sync', kind: 'code', code: CODE_A,
      q: 'The fix that is correct AND fastest is to ___.',
      options: ['wrap count++ in lock/unlock inside the loop', 'declare count volatile', 'count into a local variable, then lock once and add it to count', 'create the threads detached'], answer: 2,
      why: 'One critical-section entry per thread instead of 100,000.' },
    { id: 'b45', topic: 'sync', kind: 'code', code: CODE_C,
      q: 'What is wrong with this consumer code?',
      options: ['pthread_cond_wait must be called without holding m', '`if` should be `while`: after a spurious wake-up `ready` may still be 0', 'm must be unlocked before use(data)', 'pthread_cond_broadcast must be used here'], answer: 1,
      why: 'Always re-check the condition in a loop after waking.' },
    { id: 'b46', topic: 'sync', kind: 'code', code: CODE_F,
      ctx: "Textbook π program: each thread sums its block of terms of π = 4(1 − 1/3 + 1/5 − …) into a private `my_sum`, then adds it to the shared `sum`. Below, the threads take turns using a shared `flag` (thread 0, then 1, …).",
      q: "With 64 threads on 8 cores, this is far slower than the same program using a mutex because ___.",
      options: ['spinning threads hold cores while the thread whose turn it is may be descheduled', 'flag overflows', 'sum is private', 'mutex calls compile into spin loops'], answer: 0,
      why: 'Busy-waiting enforces a fixed turn order; with more threads than cores the next thread may not even be running.' },
    { id: 'b47', topic: 'sync', kind: 'code', code: CODE_F,
      ctx: "Textbook π program: each thread sums its block of terms of π = 4(1 − 1/3 + 1/5 − …) into a private `my_sum`, then adds it to the shared `sum`. Below, the threads take turns using a shared `flag` (thread 0, then 1, …).",
      q: "Compiled with -O2, this busy-wait can break unless flag (and sum) are declared ___.",
      options: ['static', 'const', 'volatile', 'extern'], answer: 2,
      why: 'The compiler does not know other threads change flag and may reorder or hoist the loads. volatile prevents that.' },
    { id: 'b48', topic: 'sync', kind: 'concept',
      q: 'Which tool lets many readers hold it at once but only one writer?',
      options: ['A read-write lock', 'A mutex', 'A binary semaphore', 'A barrier'], answer: 0,
      why: 'pthread_rwlock_rdlock can be held by many threads; pthread_rwlock_wrlock by one.' },
    { id: 'b49', topic: 'sync', kind: 'concept',
      q: 'Which is TRUE of POSIX semaphores but not of mutexes?',
      options: ['Any thread can post (there is no owner) and they can start at any non-negative value', 'They guarantee first-come, first-served order', 'They are part of the Pthreads library itself', 'They never block'], answer: 0,
      why: 'That is why semaphores handle producer–consumer signalling. They come from semaphore.h, not Pthreads.' },
    { id: 'b50', topic: 'sync', kind: 'concept', code: LIST_TABLE,
      q: "The textbook timed three ways of protecting a shared sorted linked list (table below). Read-write locks clearly beat a single mutex when ___.",
      options: ['almost all operations are Member (reads)', 'most operations are Insert and Delete', 'only one thread is used', 'every node has its own mutex'], answer: 0,
      why: 'With 99.9% Member, readers proceed concurrently. With 80% Member the two were nearly equal.' },

    /* ---------- Performance ---------- */
    { id: 'b51', topic: 'perf', kind: 'concept',
      q: 'The observation that a program\'s inherently serial fraction often shrinks as the problem size grows is known as ___ law.',
      options: ['Moore\'s', 'Gustafson\'s', 'Amdahl\'s', 'Flynn\'s'], answer: 1,
      why: 'Gustafson\'s law is the main reason not to despair about Amdahl\'s bound.' },
    { id: 'b52', topic: 'perf', kind: 'concept',
      q: 'A program whose efficiency stays constant when the problem size grows at the same rate as the number of threads is ___.',
      options: ['strongly scalable', 'linearly scalable', 'weakly scalable', 'embarrassingly parallel'], answer: 2,
      why: 'Strong scalability keeps E constant with the problem size fixed.' },
    { id: 'b53', topic: 'perf', kind: 'calc',
      q: 'A program takes 40 s serially and 6.25 s with 8 threads. Its efficiency is ___.',
      options: ['6.4', '0.64', '0.80', '1.25'], answer: 2,
      why: 'S = 40 / 6.25 = 6.4; E = S / p = 6.4 / 8 = 0.80.' },
    { id: 'b54', topic: 'perf', kind: 'calc',
      q: '80% of a program can be parallelized perfectly. By Amdahl\'s law, the maximum speedup with unlimited cores is ___.',
      options: ['4', '8', '80', '5'], answer: 3,
      why: 'S ≤ 1/r = 1/0.2 = 5.' },
    { id: 'b55', topic: 'perf', kind: 'calc',
      q: "A program is 80% parallelizable (that part speeds up perfectly) and 20% inherently serial. By Amdahl's law, its speedup on 4 cores is ___.",
      options: ['2.5', '3.2', '4.0', '1.6'], answer: 0,
      why: 'S = 1 / (0.2 + 0.8/4) = 1 / 0.4 = 2.5.' },
    { id: 'b56', topic: 'perf', kind: 'calc',
      q: 'A program has E = n / (n + p). If p is multiplied by 4, n must be multiplied by ___ to keep E unchanged.',
      options: ['2', '4', '16', '1 (unchanged)'], answer: 1,
      why: 'E = kn / (kn + kp) = n / (n + p). This program is weakly scalable.' },
    { id: 'b57', topic: 'perf', kind: 'calc',
      q: 'T_serial = 24 ms, p = 8, T_parallel = 4 ms. On average each thread spends ___ in parallel overhead.',
      options: ['0.5 ms', '3 ms', '4 ms', '1 ms'], answer: 3,
      why: 'E = 24 / (8·4) = 0.75. Useful time = E·T_parallel = 3 ms of 4, leaving 1 ms of overhead.' },
    { id: 'b58', topic: 'perf', kind: 'graph', chart: FIG_SPEEDUP,
      q: 'From the figure, Program X\'s efficiency at 8 threads is about ___.',
      options: ['6.5', '0.81', '1.23', '0.65'], answer: 1,
      why: 'E = S / p = 6.5 / 8 ≈ 0.81.' },
    { id: 'b59', topic: 'perf', kind: 'graph', chart: FIG_SPEEDUP,
      q: 'As the thread count rises, Program X\'s efficiency ___.',
      options: ['stays at 1', 'increases', 'decreases', 'falls, then rises'], answer: 2,
      why: '0.95 → 0.90 → 0.81 → 0.68: overhead grows relative to each thread\'s share of the work.' },
    { id: 'b60', topic: 'perf', kind: 'graph', chart: FIG_SPEEDUP,
      q: 'Program X takes 21.6 s serially. Its run time with 16 threads is ___.',
      options: ['1.35 s', '2.0 s', '10.8 s', '0.5 s'], answer: 1,
      why: 'T_parallel = T_serial / S = 21.6 / 10.8 = 2.0 s.' },
    { id: 'b61', topic: 'perf', kind: 'graph', chart: FIG_SPEEDUP,
      q: 'Program Y\'s curve lies above the dashed line. The most likely explanation is ___.',
      options: ['smaller per-core working sets fit in cache, or a measurement error', 'Amdahl\'s law permits it when the serial fraction is small', 'hyper-threading doubles each core\'s throughput', 'the dashed line should curve downward'], answer: 0,
      why: 'Superlinear speedup from an algorithm that cannot do it usually means cache effects, user error, too few trials or a timing bug.' },
    { id: 'b62', topic: 'perf', kind: 'graph', chart: FIG_BIMODAL,
      q: 'The histogram shows that Program Z\'s run times are ___.',
      options: ['normally distributed', 'right-skewed', 'bimodal: two distinct classes of run time', 'uniform'], answer: 2,
      why: 'Two separate peaks mean the program behaves in two different ways.' },
    { id: 'b63', topic: 'perf', kind: 'graph', chart: FIG_BIMODAL,
      q: 'The best next step before reporting Program Z\'s performance is to ___.',
      options: ['report the mean of all 25 runs', 'run more trials and find out what causes the two groups', 'report only the fastest run', 'run a t-test against the serial times'], answer: 1,
      why: 'A single average of a bimodal distribution is meaningless; too few trials can also fake modes.' },
    { id: 'b64', topic: 'perf', kind: 'graph', chart: FIG_SKEWED,
      q: 'If this shape persists after more trials, summarize Program W\'s run time with ___.',
      options: ['the maximum', 'the mode', 'the mean and a t-test', 'the median and a test that does not assume normality'], answer: 3,
      why: 'The t-test assumes normally distributed data; skewed data calls for the median.' },
    { id: 'b65', topic: 'perf', kind: 'graph', chart: FIG_SKEWED,
      q: 'The bars at the far left of this histogram represent ___.',
      options: ['the program\'s slowest runs', 'runs nearest the program\'s best-case performance', 'measurement errors to discard', 'runs with the most cache misses'], answer: 1,
      why: 'Most runs are near the best case; the right tail is the occasional slow run when the scheduler deprioritizes the program.' },

    /* ---------- Hardware & caches ---------- */
    { id: 'b66', topic: 'hw', kind: 'concept',
      q: 'A cache that marks updated lines dirty and writes them to memory only when they are evicted is a ___ cache.',
      options: ['write-through', 'fully associative', 'direct-mapped', 'write-back'], answer: 3,
      why: 'Write-through updates memory on every write; write-back delays it until eviction.' },
    { id: 'b67', topic: 'hw', kind: 'concept',
      q: 'Two threads repeatedly write different variables that sit in the same cache line, forcing repeated invalidations. This is ___.',
      options: ['false sharing', 'a race condition', 'a page fault', 'a TLB miss'], answer: 0,
      why: 'Results stay correct, but the line ping-pongs between caches and performance collapses.' },
    { id: 'b68', topic: 'hw', kind: 'concept',
      q: 'Reading z[i+1] right after z[i] benefits from ___ locality.',
      options: ['temporal', 'virtual', 'instruction-level', 'spatial'], answer: 3,
      why: 'Nearby address next = spatial. Same address again soon = temporal.' },
    { id: 'b69', topic: 'hw', kind: 'concept',
      q: 'Intel\'s hyper-threading is an implementation of ___.',
      options: ['simultaneous multithreading (SMT)', 'SIMD', 'static multiple issue', 'pipelining'], answer: 0,
      why: 'Each physical core appears as two logical cores sharing its functional units.' },
    { id: 'b70', topic: 'hw', kind: 'calc',
      q: 'A 5-stage pipeline takes 1 ns per stage. 100 independent operations take ___ when pipelined.',
      options: ['500 ns', '100 ns', '104 ns', '105 ns'], answer: 2,
      why: 'k + n − 1 = 5 + 99 = 104 ns. Unpipelined it would be 500 ns.' },
    { id: 'b71', topic: 'hw', kind: 'calc',
      q: '`double A[4][4]` is stored row-major. The cache is direct-mapped with 2 lines of 4 doubles and starts empty. A loop with j outer and i inner reads every A[i][j]. Number of misses: ___.',
      options: ['4', '8', '12', '16'], answer: 3,
      why: 'Column order evicts each line before it is reused, so every access misses. Row order would miss only 4 times.' },
    { id: 'b72', topic: 'hw', kind: 'calc',
      q: 'With 32-bit virtual addresses and 4 KB pages, the byte offset within a page uses ___ bits.',
      options: ['20', '32', '12', '4'], answer: 2,
      why: '2¹² = 4096 bytes. The remaining 20 bits are the virtual page number.' },
    { id: 'b73', topic: 'hw', kind: 'code', code: CODE_E,
      q: 'With 4 threads the result is correct but slower than 1 thread. The likely cause is ___.',
      options: ['a race on partial[]', 'false sharing: all four doubles sit in one 64-byte cache line', 'TLB misses', 'too few threads'], answer: 1,
      why: 'Each += invalidates the shared line in the other cores\' caches.' },
    { id: 'b74', topic: 'hw', kind: 'code', code: CODE_E,
      q: 'The best fix for this code is to ___.',
      options: ['put a mutex around the +=', 'declare partial volatile', 'sum into a local variable and write partial[r] once after the loop', 'create detached threads'], answer: 2,
      why: 'A private accumulator touches the shared line only once per thread. Padding each slot to its own line also works.' },
    { id: 'b75', topic: 'hw', kind: 'concept',
      q: 'A TLB caches ___.',
      options: ['page-table entries (virtual-to-physical translations)', 'instructions', 'dirty cache lines', 'thread stacks'], answer: 0,
      why: 'The translation-lookaside buffer avoids a page-table lookup in memory on every access.' },
    { id: 'b76', topic: 'hw', kind: 'calc',
      q: 'Memory has 16 lines and a direct-mapped cache has 4 lines (slot = line mod 4). Memory line 13 goes in slot ___.',
      options: ['1', '3', '13', 'any free slot'], answer: 0,
      why: '13 mod 4 = 1. "Any free slot" describes a fully associative cache.' },

    /* ---------- Heat diffusion ---------- */
    { id: 'b77', topic: 'heat', kind: 'calc',
      ctx: "Heat diffusion case study (Lecture 8): a 2D grid models a metal plate. The outer border is fixed at 0 (cold) and a centred block is fixed hot. Every iteration, each other cell becomes the average of its four neighbours from the previous iteration:\n`next[i][j] = 0.25 * (cur[i-1][j] + cur[i+1][j] + cur[i][j-1] + cur[i][j+1])`\nPthreads version: each thread updates its own band of rows.",
      q: "An interior cell's neighbours in `cur` are 6 (above), 2 (below), 4 (left) and 0 (right). Its value in `next` is ___.",
      options: ['3.0', '4.0', '12', '2.4'], answer: 0,
      why: '0.25 × (6 + 2 + 4 + 0) = 3.0.' },
    { id: 'b78', topic: 'heat', kind: 'concept',
      ctx: "Heat diffusion case study (Lecture 8): a 2D grid models a metal plate. The outer border is fixed at 0 (cold) and a centred block is fixed hot. Every iteration, each other cell becomes the average of its four neighbours from the previous iteration:\n`next[i][j] = 0.25 * (cur[i-1][j] + cur[i+1][j] + cur[i][j-1] + cur[i][j+1])`\nPthreads version: each thread updates its own band of rows.",
      q: "Why does the simulation keep two grids, `cur` and `next`?",
      options: ['So every update reads only step-t values, making the traversal order irrelevant', 'To halve memory use', 'So two threads can share one grid', 'To store the boundary separately'], answer: 0,
      why: 'Double (ping-pong) buffering: cur is read-only and next write-only within a step; swap at the end.' },
    { id: 'b79', topic: 'heat', kind: 'concept',
      ctx: "Heat diffusion case study (Lecture 8): a 2D grid models a metal plate. The outer border is fixed at 0 (cold) and a centred block is fixed hot. Every iteration, each other cell becomes the average of its four neighbours from the previous iteration:\n`next[i][j] = 0.25 * (cur[i-1][j] + cur[i+1][j] + cur[i][j-1] + cur[i][j+1])`\nPthreads version: each thread updates its own band of rows.",
      q: "The simulation stops when ___.",
      options: ['the largest per-cell change drops below epsilon, or the iteration cap is reached', 'every cell reaches 0', 'every cell equals the hot value', 'p iterations have run'], answer: 0,
      why: 'Convergence (max_diff < ε) or the cap, whichever comes first.' },
    { id: 'b80', topic: 'heat', kind: 'concept',
      ctx: "Heat diffusion case study (Lecture 8): a 2D grid models a metal plate. The outer border is fixed at 0 (cold) and a centred block is fixed hot. Every iteration, each other cell becomes the average of its four neighbours from the previous iteration:\n`next[i][j] = 0.25 * (cur[i-1][j] + cur[i+1][j] + cur[i][j-1] + cur[i][j+1])`\nPthreads version: each thread updates its own band of rows.",
      q: "Why are threads given bands of rows rather than bands of columns?",
      options: ['C arrays are row-major, so rows are contiguous in memory and cache-friendly', 'Columns cannot be divided evenly', 'Rows contain fewer cells', 'The hot block is horizontal'], answer: 0,
      why: 'Contiguous rows give spatial locality.' },
    { id: 'b81', topic: 'heat', kind: 'calc',
      ctx: "Heat diffusion case study (Lecture 8): a 2D grid models a metal plate. The outer border is fixed at 0 (cold) and a centred block is fixed hot. Every iteration, each other cell becomes the average of its four neighbours from the previous iteration:\n`next[i][j] = 0.25 * (cur[i-1][j] + cur[i+1][j] + cur[i][j-1] + cur[i][j+1])`\nPthreads version: each thread updates its own band of rows.",
      q: "A 12×12 grid has fixed border rows 0 and 11, so rows 1–10 are updated. They're split over 3 threads: each gets ⌊rows/p⌋ and the first (rows mod p) threads get one extra. Thread 0 gets rows ___.",
      options: ['1–4', '1–3', '0–3', '1–5'], answer: 0,
      why: '⌊10/3⌋ = 3, remainder 1: thread 0 gets 4 rows (1–4), then 5–7 and 8–10.' },
    { id: 'b82', topic: 'heat', kind: 'code', code: HEAT_LOOP_FULL,
      ctx: "Heat diffusion case study (Lecture 8): a 2D grid models a metal plate. The outer border is fixed at 0 (cold) and a centred block is fixed hot. Every iteration, each other cell becomes the average of its four neighbours from the previous iteration:\n`next[i][j] = 0.25 * (cur[i-1][j] + cur[i+1][j] + cur[i][j-1] + cur[i][j+1])`\nPthreads version: each thread updates its own band of rows.\nEach thread runs the loop below.",
      q: "Why does writing `thread_max_diff[tid]` need no mutex?",
      options: ['Each thread writes only its own slot, and barrier 1 orders those writes before thread 0 reads them', 'The array is volatile', 'Doubles are written atomically', 'Thread 0 locks the array'], answer: 0,
      why: 'Disjoint writes plus barriers make the code race-free without locks.' },
    { id: 'b83', topic: 'heat', kind: 'code', code: HEAT_LOOP_FULL,
      ctx: "Heat diffusion case study (Lecture 8): a 2D grid models a metal plate. The outer border is fixed at 0 (cold) and a centred block is fixed hot. Every iteration, each other cell becomes the average of its four neighbours from the previous iteration:\n`next[i][j] = 0.25 * (cur[i-1][j] + cur[i+1][j] + cur[i][j-1] + cur[i][j+1])`\nPthreads version: each thread updates its own band of rows.\nEach thread runs the loop below.",
      q: "Barrier 1 guarantees that ___.",
      options: ['every thread has finished writing next[] and its max_diff before thread 0 reads them', 'thread 0 has swapped the grids', 'converged has been set', 'all threads start the program together'], answer: 0,
      why: 'Barrier 2 is the one that makes thread 0\'s swap and converged flag visible to everyone.' },
    { id: 'b84', topic: 'heat', kind: 'concept',
      ctx: "Heat diffusion case study (Lecture 8): a 2D grid models a metal plate. The outer border is fixed at 0 (cold) and a centred block is fixed hot. Every iteration, each other cell becomes the average of its four neighbours from the previous iteration:\n`next[i][j] = 0.25 * (cur[i-1][j] + cur[i+1][j] + cur[i][j-1] + cur[i][j+1])`\nPthreads version: each thread updates its own band of rows.",
      q: "Running the simulation with 1, 4 and 7 threads gives different frames. The most likely cause is ___.",
      options: ['a missing or misplaced barrier', 'rounding differences in the physics', 'too few iterations', 'the hot block size'], answer: 0,
      why: 'Because any traversal order gives bit-identical results, frames must match for every thread count. A sync bug often shows as seams at band edges.' }
  ];
})();
