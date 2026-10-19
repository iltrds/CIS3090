/* Practice Exam A: 50 fresh questions, none repeated from the quiz bank.
   Same schema as data/bank.js. */

(function () {
  const BOX = {
    type: 'box',
    title: 'Run times of a parallel sort, 25 runs per thread count',
    note: 'Box = middle 50% of runs, line = median, whiskers = min and max',
    xLabel: 'Threads (p)', yLabel: 'Run time (s)', yMax: 24,
    groups: [
      { label: '1', min: 19.2, q1: 19.6, med: 20.0, q3: 20.3, max: 21.0 },
      { label: '2', min: 11.2, q1: 11.6, med: 12.0, q3: 12.5, max: 13.4 },
      { label: '4', min: 6.0, q1: 6.3, med: 6.5, q3: 6.8, max: 7.2 },
      { label: '8', min: 2.9, q1: 3.1, med: 3.6, q3: 5.0, max: 7.9 }
    ]
  };

  const AMDAHL = {
    type: 'line',
    title: 'Speedup of Program Q by thread count',
    note: 'Mean of 25 runs per point; dashed line = perfect (linear) speedup',
    xLabel: 'Threads (p)', yLabel: 'Speedup (×)', yMax: 16,
    x: [1, 2, 4, 8, 16],
    series: [
      { name: 'Perfect', values: [1, 2, 4, 8, 16], style: 'reference' },
      { name: 'Program Q', values: [1, 1.67, 2.5, 3.33, 4.0], style: 'accent', labels: 'above' }
    ]
  };

  const RACE = `            Thread 0            Thread 1
time 1      load  r, &x
time 2                          load  r, &x
time 3      inc   r
time 4                          inc   r
time 5      store r, &x
time 6                          store r, &x`;

  const HELLO_OK = `void* f(void* a) {
    printf("%ld ", (long) a);
    return NULL;
}
int main(void) {
    pthread_t t[4];
    for (long i = 0; i < 4; i++)
        pthread_create(&t[i], NULL, f, (void*) i);
    for (int i = 0; i < 4; i++)
        pthread_join(t[i], NULL);
    printf("done\\n");
    return 0;
}`;

  const HELLO_BAD = `void* g(void* arg) {
    int id = *(int*) arg;
    printf("thread %d\\n", id);
    return NULL;
}
/* in main: */
for (int i = 0; i < 4; i++)
    pthread_create(&t[i], NULL, g, &i);`;

  const DETACH = `pthread_attr_t attr;
pthread_attr_init(&attr);
pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);
pthread_create(&tid, &attr, save_image, img);
pthread_attr_destroy(&attr);
pthread_join(tid, NULL);`;

  const LOCK_IN_LOOP = `for (i = my_first; i < my_last; i++) {
    pthread_mutex_lock(&m);
    sum += f(i);
    pthread_mutex_unlock(&m);
}`;

  const SEM_MSG = `/* sem[] all initialized to 0; dest = (my_rank + 1) % n */
messages[dest] = my_msg;
sem_post(&sem[dest]);
sem_wait(&sem[my_rank]);
printf("%s\\n", messages[my_rank]);`;

  const PRODUCER = `/* producer */
pthread_mutex_lock(&m);
enqueue(msg);
pthread_cond_signal(&c);
pthread_mutex_unlock(&m);

/* consumer */
pthread_mutex_lock(&m);
while (queue_empty())
    pthread_cond_wait(&c, &m);
msg = dequeue();
pthread_mutex_unlock(&m);`;

  const COLUMN_LOOP = `double sum = 0;
for (j = 0; j < N; j++)
    for (i = 0; i < N; i++)
        sum += A[i][j];`;

  const HEAT_LOOP = `while (1) {
    compute_my_rows();                   /* writes next[] for my rows */
    thread_max_diff[tid] = localMax;
    pthread_barrier_wait(&b1);
    if (tid == 0) {
        reduce_max(); swap(&cur, &next);
        if (globalMax < EPS || iter >= MAX - 1) converged = 1;
        iter++;
    }
    /* pthread_barrier_wait(&b2);  <-- removed */
    if (converged) break;
}`;

  window.EXAM_A = [
    /* ---------- Why parallel (4) ---------- */
    { id: 'e1', topic: 'why', kind: 'concept',
      q: 'A program in which closely coupled tasks execute simultaneously to solve one problem is an example of ___ computing.',
      options: ['parallel', 'concurrent but not parallel', 'distributed', 'time-sliced'], answer: 0,
      why: 'Parallel tasks cooperate closely and make progress at the same time on multiple cores.' },
    { id: 'e2', topic: 'why', kind: 'calc',
      q: 'After 2002, CPU performance grew about 20% per year. Over 10 years that is roughly ___.',
      options: ['6×', '2×', '20×', '60×'], answer: 0,
      why: '1.2¹⁰ ≈ 6.2, compared with ≈ 58 at 50% per year.' },
    { id: 'e3', topic: 'why', kind: 'concept',
      q: 'Which statement about the operating system is TRUE?',
      options: ['It schedules many threads across cores but cannot parallelize a compiled serial program', 'It automatically splits loops across cores', 'It makes single-threaded programs use every core', 'It needs OpenMP to schedule threads'], answer: 0,
      why: 'The OS provides concurrency. Automatic parallelization of binaries has not been solved.' },
    { id: 'e4', topic: 'why', kind: 'concept',
      q: 'Running one copy of an image-conversion program per core, each on its own folder, is ___.',
      options: ['easy parallelism with no code changes, because the copies never interact', 'task parallelism within one program', 'impossible without MPI', 'distributed computing'], answer: 0,
      why: 'Independent copies need no communication. It does not make one program faster, which is what we usually want.' },

    /* ---------- Design (6) ---------- */
    { id: 'e5', topic: 'design', kind: 'calc',
      q: 'n = 30 items over p = 4 threads using ⌊n/p⌋ each plus one extra for the first n mod p threads. The counts are ___.',
      options: ['8, 8, 7, 7', '7, 7, 7, 9', '8, 8, 8, 6', '7, 8, 7, 8'], answer: 0,
      why: '⌊30/4⌋ = 7, 30 mod 4 = 2, so threads 0 and 1 get 8.' },
    { id: 'e6', topic: 'design', kind: 'calc',
      q: "n = 30 items over p = 4 threads: each gets ⌊n/p⌋ and the first n mod p threads get one extra. Thread 2's first index is ___.",
      options: ['16', '15', '14', '21'], answer: 0,
      why: 'first = 2·7 + min(2, 2) = 16. Threads cover 0–7, 8–15, 16–22, 23–29.' },
    { id: 'e7', topic: 'design', kind: 'concept',
      q: 'Which step of Foster\'s methodology assigns composite tasks to threads so work is balanced and communication is minimized?',
      options: ['Mapping', 'Partitioning', 'Communication', 'Agglomeration'], answer: 0,
      why: 'Mapping is the last step.' },
    { id: 'e8', topic: 'design', kind: 'calc',
      q: 'Combining partial sums on 32 cores, the tree-structured sum needs ___ fewer sequential steps on core 0 than the serial combine.',
      options: ['26', '16', '27', '31'], answer: 0,
      why: 'Serial: 31 steps. Tree: log₂ 32 = 5. Difference 26.' },
    { id: 'e9', topic: 'design', kind: 'concept',
      q: 'Parallel sum time is O(n/p) + O(log p). The O(log p) term matters most when ___.',
      options: ['n is only slightly larger than p', 'n is very large', 'p = 1', 'each compute() call takes minutes'], answer: 0,
      why: 'Then each core does little work before the reduction, so the reduction dominates.' },
    { id: 'e10', topic: 'design', kind: 'concept',
      ctx: "Histogram example (textbook Section 2.7): count how many of n data values fall into each of bin_count bins. p threads each take a contiguous block of data; for every element they find its bin b and increment `bin_counts[b]`.",
      q: "On a GPU, which may run thousands of threads, the races on `bin_counts` are usually handled with ___.",
      options: ['fast atomic increments on one shared array', 'a private bin array for each of thousands of threads', 'one thread per bin', 'a barrier after every element'], answer: 0,
      why: 'Thousands of private copies would not fit; GPUs provide fast atomic increments.' },

    /* ---------- Pthreads (7) ---------- */
    { id: 'e11', topic: 'pthreads', kind: 'code', code: HELLO_OK,
      q: 'Which output is possible?',
      options: ['2 0 3 1 done', '0 1 2 done 3', 'done 0 1 2 3', '0 0 0 0 done'], answer: 0,
      why: 'Thread order is nondeterministic, but all joins finish before "done", and each thread gets its own value cast from i.' },
    { id: 'e12', topic: 'pthreads', kind: 'code', code: HELLO_BAD,
      q: 'What is wrong with how the rank is passed?',
      options: ['Every thread gets a pointer to the same changing variable, so ids may repeat or even be 4', '&i is always NULL', 'pthread_create copies the int, so nothing is wrong', 'An int cannot be passed to a thread'], answer: 0,
      why: 'Pass `(void*)(long) i` or a pointer to a separate per-thread struct instead.' },
    { id: 'e13', topic: 'pthreads', kind: 'concept',
      q: '`pthread_t` is ___.',
      options: ['an opaque handle that identifies a thread', 'the thread\'s integer rank', 'a pointer to the thread\'s stack', 'the number of the core it runs on'], answer: 0,
      why: 'Its contents are system-specific. Ranks are our own convention passed through the argument.' },
    { id: 'e14', topic: 'pthreads', kind: 'concept',
      q: 'In a Pthreads program, which variables are shared by all threads?',
      options: ['Global variables (and heap memory reachable through shared pointers)', 'Local variables', 'Function parameters', 'Each thread\'s copy of argv'], answer: 0,
      why: 'Locals and parameters live on each thread\'s private stack.' },
    { id: 'e15', topic: 'pthreads', kind: 'concept',
      q: '`pthread_create` returns ___ on success.',
      options: ['0', 'the new thread\'s id', '1', 'a pointer to the thread'], answer: 0,
      why: 'Like most Pthreads functions, 0 means success; the id comes back through the first argument.' },
    { id: 'e16', topic: 'pthreads', kind: 'concept',
      q: 'The process primitive `waitpid` corresponds to the thread primitive ___.',
      options: ['pthread_join', 'pthread_create', 'pthread_exit', 'pthread_self'], answer: 0,
      why: 'fork ↔ pthread_create, exit ↔ pthread_exit, waitpid ↔ pthread_join, getpid ↔ pthread_self.' },
    { id: 'e17', topic: 'pthreads', kind: 'code', code: DETACH,
      q: 'What is wrong with this code?',
      options: ['A detached thread cannot be joined', 'attr must stay alive until the thread exits', 'save_image must return int', 'attr must be initialized after pthread_create'], answer: 0,
      why: 'Detach is for threads nobody waits for. Destroying attr after create is fine.' },

    /* ---------- Odd-even & barriers (5) ---------- */
    { id: 'e18', topic: 'oddeven', kind: 'calc',
      ctx: "Odd-even transposition sort alternates two kinds of phase.\nEven phase: compare-swap the pairs (a[0],a[1]), (a[2],a[3]), …\nOdd phase: compare-swap the pairs (a[1],a[2]), (a[3],a[4]), …",
      q: "On the list 4 2 3 1, after phase 0 (even) and phase 1 (odd), the list is ___.",
      options: ['2 1 4 3', '2 4 1 3', '1 2 3 4', '2 1 3 4'], answer: 0,
      why: 'Even: (4,2)→2 4 and (3,1)→1 3 gives 2 4 1 3. Odd: (4,1)→1 4 gives 2 1 4 3.' },
    { id: 'e19', topic: 'oddeven', kind: 'calc',
      ctx: "Block-parallel odd-even sort: each of p threads first sorts its own contiguous block with qsort. Then, in each phase, paired threads do a compare-split: merge their two sorted blocks; the lower-ranked thread keeps the smaller half and the higher-ranked thread the larger half.",
      q: "With p = 8 threads, at most ___ compare-split phases are needed.",
      options: ['8', '3', '64', 'n'], answer: 0,
      why: 'p blocks need at most p phases.' },
    { id: 'e20', topic: 'oddeven', kind: 'calc',
      q: 'With p = 5 threads, which thread is idle in an even phase?',
      options: ['4', '0', '0 and 4', 'none'], answer: 0,
      why: 'Even phases pair (0,1) and (2,3); thread 4\'s partner would be 5, which does not exist.' },
    { id: 'e21', topic: 'oddeven', kind: 'concept',
      q: 'Which statement distinguishes a barrier from pthread_join?',
      options: ['A barrier makes many threads wait for each other, repeatedly, at a point in execution; join waits once for one thread to end', 'A barrier terminates threads', 'join can be reused every round', 'A barrier waits for one specific thread'], answer: 0,
      why: 'The barrier auto-resets so it can be used in every phase.' },
    { id: 'e22', topic: 'oddeven', kind: 'calc',
      ctx: "Block-parallel odd-even sort: each of p threads first sorts its own contiguous block with qsort. Then, in each phase, paired threads do a compare-split: merge their two sorted blocks; the lower-ranked thread keeps the smaller half and the higher-ranked thread the larger half.",
      q: "Thread 0 holds {3, 8, 10} and thread 1 holds {1, 9, 12}. After a compare-split, thread 1 holds ___.",
      options: ['{9, 10, 12}', '{1, 3, 8}', '{3, 8, 10}', '{1, 9, 12}'], answer: 0,
      why: 'Merged: 1 3 8 9 10 12. The higher rank keeps the larger half.' },

    /* ---------- Synchronization (9) ---------- */
    { id: 'e23', topic: 'sync', kind: 'code', code: RACE,
      q: 'x starts at 5 and both threads run `x++` in this interleaving. Afterwards x = ___.',
      options: ['6', '7', '5', '8'], answer: 0,
      why: 'Both threads load 5 and store 6, so one increment is lost.' },
    { id: 'e24', topic: 'sync', kind: 'code', code: LOCK_IN_LOOP,
      q: 'This is correct but slow. The best change is to ___.',
      options: ['accumulate into a local my_sum in the loop, then lock once afterwards to add it', 'use a semaphore instead of the mutex', 'remove the lock', 'add a barrier after the loop'], answer: 0,
      why: 'Critical sections serialize; enter them as rarely as possible.' },
    { id: 'e25', topic: 'sync', kind: 'concept',
      q: 'A binary semaphore initialized to 1 behaves like ___.',
      options: ['an unlocked mutex', 'a barrier', 'a locked mutex', 'a condition variable'], answer: 0,
      why: 'sem_wait acts as lock and sem_post as unlock. Initialized to 0 it would be "locked".' },
    { id: 'e26', topic: 'sync', kind: 'code', code: SEM_MSG,
      q: 'Why can a thread never print a message before its sender has stored it?',
      options: ['sem_wait blocks until the sender has stored the message and called sem_post', 'sem_post copies the message', 'printf locks the messages array', 'The semaphores start unlocked'], answer: 0,
      why: 'This is producer–consumer synchronization: the semaphore starts at 0 and only the producer can raise it.' },
    { id: 'e27', topic: 'sync', kind: 'concept',
      q: 'Which problem can a mutex NOT solve cleanly, which motivated semaphores?',
      options: ['One thread waiting until another thread has done something (producer–consumer)', 'Protecting a shared counter', 'Making a critical section run one thread at a time', 'Guarding a linked list'], answer: 0,
      why: 'Mutexes start unlocked and must be unlocked by their owner, so they cannot signal "you may proceed" between threads.' },
    { id: 'e28', topic: 'sync', kind: 'code', code: PRODUCER,
      q: 'Compared with having the consumer poll the queue in a loop, this design ___.',
      options: ['drops the consumer\'s CPU use to near zero while it waits', 'makes enqueue faster', 'removes the need for the mutex', 'guarantees first-in, first-out wake-ups'], answer: 0,
      why: 'The waiting consumer sleeps instead of busy-waiting at 100% of a core.' },
    { id: 'e29', topic: 'sync', kind: 'concept',
      q: 'Busy-waiting on a flag can fail when compiled with -O2 because ___.',
      options: ['the compiler, unaware of other threads, may reorder or hoist the loads of the flag', '-O2 removes all loops', 'flags must be doubles', '-O2 disables threads'], answer: 0,
      why: 'Declare shared flags volatile or turn optimization off. Mutexes and semaphores are not affected.' },
    { id: 'e30', topic: 'sync', kind: 'concept',
      q: 'Two threads tokenize different lines with strtok and sometimes get each other\'s tokens. Why?',
      options: ['strtok keeps its position in a static variable that all threads share', 'The lines are in shared memory', 'printf interleaves output', 'strtok is too slow'], answer: 0,
      why: 'strtok is not thread-safe; use strtok_r. One correct run proves nothing.' },
    { id: 'e31', topic: 'sync', kind: 'concept',
      q: 'Which valgrind option must you pass so threaded programs do not hang?',
      options: ['--fair-sched=yes', '--leak-check=full', '--threads=on', '--tool=helgrind'], answer: 0,
      why: 'It makes valgrind time-slice between threads round-robin.' },

    /* ---------- Performance (10) ---------- */
    { id: 'e32', topic: 'perf', kind: 'calc',
      q: 'T_serial = 50 s and T_parallel = 12.5 s on 5 threads. Speedup and efficiency are ___.',
      options: ['4.0 and 0.80', '0.25 and 0.05', '4.0 and 1.25', '5.0 and 1.00'], answer: 0,
      why: 'S = 50 / 12.5 = 4; E = 4 / 5 = 0.80.' },
    { id: 'e33', topic: 'perf', kind: 'calc',
      q: 'A program is 75% parallelizable. By Amdahl\'s law, its speedup on 3 cores is ___.',
      options: ['2.0', '3.0', '2.25', '4.0'], answer: 0,
      why: '1 / (0.25 + 0.75/3) = 1 / 0.5 = 2.0.' },
    { id: 'e34', topic: 'perf', kind: 'calc',
      q: 'For a maximum possible speedup of 50, the inherently serial fraction can be at most ___.',
      options: ['2%', '5%', '0.5%', '50%'], answer: 0,
      why: 'S ≤ 1/r, so r ≤ 1/50 = 2%.' },
    { id: 'e35', topic: 'perf', kind: 'calc',
      q: 'T_parallel = T_serial/p + T_overhead with T_serial = 64 s, p = 8 and T_overhead = 2 s. The efficiency is ___.',
      options: ['0.80', '0.64', '0.75', '6.4'], answer: 0,
      why: 'T_parallel = 8 + 2 = 10 s. S = 6.4, E = 6.4 / 8 = 0.80.' },
    { id: 'e36', topic: 'perf', kind: 'concept',
      q: 'Which time should you report for a parallel region?',
      options: ['Wall-clock time, measured from a barrier to the latest finish among threads', 'Thread 0\'s CPU time', 'The sum of all threads\' CPU times', 'The user time from the shell\'s time command'], answer: 0,
      why: 'CPU time misses time spent blocked; the shell command times the whole program, including setup.' },
    { id: 'e37', topic: 'perf', kind: 'concept',
      q: 'A program\'s efficiency stays at 0.9 as p grows while the problem size stays fixed. It is ___.',
      options: ['strongly scalable', 'weakly scalable only', 'not scalable', 'superlinear'], answer: 0,
      why: 'Constant efficiency with a fixed problem size is strong scalability.' },
    { id: 'e38', topic: 'perf', kind: 'graph', chart: BOX,
      q: 'Which thread count has the most variable run times?',
      options: ['8', '1', '2', '4'], answer: 0,
      why: 'Its box and whiskers are by far the widest (2.9 s to 7.9 s).' },
    { id: 'e39', topic: 'perf', kind: 'graph', chart: BOX,
      q: 'Using the medians, the speedup at 4 threads is about ___.',
      options: ['3.1', '4.0', '6.5', '0.33'], answer: 0,
      why: 'S = 20.0 / 6.5 ≈ 3.1.' },
    { id: 'e40', topic: 'perf', kind: 'graph', chart: AMDAHL,
      q: 'If Program Q follows Amdahl\'s law exactly, its inherently serial fraction is ___.',
      options: ['20%', '4%', '25%', '80%'], answer: 0,
      why: 'With r = 0.2: S(2) = 1/(0.2+0.4) = 1.67, S(4) = 2.5, S(8) = 3.33, S(16) = 4.0 — every point matches.' },
    { id: 'e41', topic: 'perf', kind: 'graph', chart: AMDAHL,
      q: 'With unlimited cores, Program Q\'s speedup can never exceed ___.',
      options: ['5', '4', '16', '20'], answer: 0,
      why: '1/r = 1/0.2 = 5.' },

    /* ---------- Hardware (6) ---------- */
    { id: 'e42', topic: 'hw', kind: 'concept',
      q: 'A 7-stage pipelined adder is less than 7× faster than an unpipelined one partly because ___.',
      options: ['the pipeline runs at the pace of its slowest stage, and stalls leave stages idle', 'pipelines cannot add floating-point numbers', 'only two stages can run at once', 'multiple issue disables pipelining'], answer: 0,
      why: 'Unequal stage times and stalls (operand not ready, cache miss) both cut into the ideal k-fold gain.' },
    { id: 'e43', topic: 'hw', kind: 'calc',
      q: 'With 32-bit virtual addresses and 4 KB pages, how many virtual pages can a program have?',
      options: ['2²⁰', '2¹²', '2³²', '2¹⁰'], answer: 0,
      why: '12 bits are the byte offset, leaving 20 bits of page number.' },
    { id: 'e44', topic: 'hw', kind: 'code', code: COLUMN_LOOP,
      q: 'N is large. Swapping the loops so i is outer makes this faster because ___.',
      options: ['C is row-major, so i-outer walks memory contiguously and uses every element of each cache line', 'it performs fewer additions', 'it avoids false sharing', 'the compiler cannot optimize column loops at all'], answer: 0,
      why: 'Column order jumps a whole row between accesses and misses far more often.' },
    { id: 'e45', topic: 'hw', kind: 'concept',
      q: 'In a write-back cache, modified data reaches main memory ___.',
      options: ['when the dirty line is evicted', 'immediately on every write', 'never', 'at every barrier'], answer: 0,
      why: 'Write-through caches write immediately.' },
    { id: 'e46', topic: 'hw', kind: 'concept',
      q: 'Snooping cache coherence works by ___.',
      options: ['broadcasting updates on the shared interconnect so other caches invalidate their copies', 'keeping a directory of which cores hold each line', 'using the OS page table', 'making every cache write-through'], answer: 0,
      why: 'Directory-based coherence is the alternative that scales to larger systems.' },
    { id: 'e47', topic: 'hw', kind: 'concept',
      q: 'Compared with two physical cores, one hyper-threaded physical core running two threads is ___.',
      options: ['slower, because both threads share one core\'s functional units', 'equally fast', 'faster', 'unable to run two threads'], answer: 0,
      why: 'Hyper-threading helps when one thread stalls, but it is not a second core.' },

    /* ---------- Heat (3) ---------- */
    { id: 'e48', topic: 'heat', kind: 'code', code: HEAT_LOOP,
      ctx: "Heat diffusion case study (Lecture 8): a 2D grid models a metal plate. The outer border is fixed at 0 (cold) and a centred block is fixed hot. Every iteration, each other cell becomes the average of its four neighbours from the previous iteration:\n`next[i][j] = 0.25 * (cur[i-1][j] + cur[i+1][j] + cur[i][j-1] + cur[i][j+1])`\nPthreads version: each thread updates its own band of rows.\nEach thread runs the loop below, but barrier 2 has been removed.",
      q: "What can go wrong now?",
      options: ['Threads may start the next iteration before thread 0 has swapped the grids and set converged', 'Nothing: barrier 1 is enough', 'Thread 0 deadlocks', 'thread_max_diff overflows'], answer: 0,
      why: 'A single-threaded section must be closed on both sides by barriers.' },
    { id: 'e49', topic: 'heat', kind: 'calc',
      ctx: "Heat diffusion case study (Lecture 8): a 2D grid models a metal plate. The outer border is fixed at 0 (cold) and a centred block is fixed hot. Every iteration, each other cell becomes the average of its four neighbours from the previous iteration:\n`next[i][j] = 0.25 * (cur[i-1][j] + cur[i+1][j] + cur[i][j-1] + cur[i][j+1])`\nPthreads version: each thread updates its own band of rows.",
      q: "An interior cell's neighbours in `cur` are 8, 4, 2 and 2. Its value in `next` is ___.",
      options: ['4.0', '16', '2.0', '3.5'], answer: 0,
      why: '0.25 × (8 + 4 + 2 + 2) = 4.0.' },
    { id: 'e50', topic: 'heat', kind: 'concept',
      ctx: "Heat diffusion case study (Lecture 8): a 2D grid models a metal plate. The outer border is fixed at 0 (cold) and a centred block is fixed hot. Every iteration, each other cell becomes the average of its four neighbours from the previous iteration:\n`next[i][j] = 0.25 * (cur[i-1][j] + cur[i+1][j] + cur[i][j-1] + cur[i][j+1])`\nPthreads version: each thread updates its own band of rows.",
      q: "With the hot block fixed at 9 and the border at 0, once the simulation converges the grid ___.",
      options: ['forms a stable hot-to-cold gradient', 'is all 0', 'is all 9', 'oscillates between two states'], answer: 0,
      why: 'The source keeps reheating what the boundary cools, so it settles to a gradient, not a flat field.' }
  ];
})();
