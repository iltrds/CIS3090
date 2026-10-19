/* Questions built from the prof's recommended review exercises (Moodle, Week 5).
   Loaded after data/bank.js; appends to QUIZ_BANK under topic 'review'. Same schema as bank.js. */
(function () {
  const COUNTER2 = `int count = 0;                           /* shared */
pthread_mutex_t m = PTHREAD_MUTEX_INITIALIZER;

void* worker(void* arg) {                /* run by 2 threads */
    for (int i = 0; i < 1000000; i++) {
        pthread_mutex_lock(&m);
        count++;
        pthread_mutex_unlock(&m);
    }
    return NULL;
}`;

  const HELLO_FOREVER = `void* Hello(void* rank) {
    printf("Hello from thread %ld\\n", (long) rank);
    return NULL;
}

/* in main: no thread is ever joined */
pthread_t handle;
for (long thread = 0; ; thread++)
    pthread_create(&handle, NULL, Hello, (void*) thread);`;

  const MATVEC = `/* Program 4.13: y = A*x, A is m x n; m, n, A, x, y are shared */
void* Pth_mat_vect(void* rank) {
    long my_rank = (long) rank;
    int local_m = m / thread_count;
    int my_first_row = my_rank * local_m;
    int my_last_row  = (my_rank + 1) * local_m - 1;
    for (int i = my_first_row; i <= my_last_row; i++) {
        y[i] = 0.0;
        for (int j = 0; j < n; j++)
            y[i] += A[i][j] * x[j];
    }
    return NULL;
}`;

  const PI_TABLE = `Table 4.1: π program run times in seconds (10^8 terms, 8 cores)
threads    busy-wait    mutex
   1         2.90        2.90
   2         1.45        1.45
   4         0.73        0.73
   8         0.38        0.38
  16         0.50        0.38
  32         0.80        0.40
  64         3.56        0.38`;

  const TABLE45 = `Table 4.5: Program 4.13 run times (s) and efficiencies
            8,000,000 x 8     8000 x 8000     8 x 8,000,000
threads     time    eff.      time    eff.    time    eff.
   1        0.393   1.000     0.345   1.000   0.441   1.000
   2        0.217   0.906     0.188   0.918   0.300   0.735
   4        0.139   0.707     0.115   0.750   0.388   0.290`;

  const TREE = `sum = my_sum;  divisor = 2;  core_difference = 1;
while (core_difference < p) {
    if (my_rank % divisor == 0) {
        partner = my_rank + core_difference;
        if (partner < p) { receive value from partner; sum += value; }
    } else {
        send sum to my_rank - core_difference;
        break;
    }
    divisor *= 2;  core_difference *= 2;
}`;

  const TREE_SHARED = `while (diff < thread_count) {
    pthread_barrier_wait(&barrier);
    if (my_rank % divisor == 0) {
        partner = my_rank + diff;
        if (partner < thread_count)
            for (b = 0; b < bin_count; b++)
                loc_bin_cts[my_rank][b] += loc_bin_cts[partner][b];
    }
    divisor *= 2;  diff *= 2;
}`;

  const CONSUMER = `while (1) {
    pthread_mutex_lock(&m);
    if (message_available) { print message; pthread_mutex_unlock(&m); break; }
    pthread_mutex_unlock(&m);
}`;

  const DEADLOCK = `/* time   thread 0                     thread 1                    */
/*  0     pthread_mutex_lock(&mut0);   pthread_mutex_lock(&mut1);  */
/*  1     pthread_mutex_lock(&mut1);   pthread_mutex_lock(&mut0);  */`;

  const R = [
    { id: 'r1', kind: 'calc', ex: '1.1',
      q: 'Exercise 1.1: n = 30 items over p = 4 cores; each gets ⌊n/p⌋ and the first n mod p get one extra. Core 3\'s first index is ___.',
      options: ['21', '22', '23', '24'], answer: 2,
      why: 'q = 7, r = 2: first = 3·7 + min(3, 2) = 23.' },
    { id: 'r2', kind: 'calc', ex: '1.1',
      q: "Exercise 1.1: n = 50 items over p = 8 cores; each gets ⌊n/p⌋ and the first n mod p get one extra. Core 1 handles indices ___.",
      options: ['7–13', '6–12', '7–12', '8–14'], answer: 0,
      why: 'q = 6, r = 2, so core 1 gets 7 items starting at 1·6 + 1 = 7.' },
    { id: 'r3', kind: 'calc', ex: '1.2',
      q: 'Exercise 1.2: call i costs i + 1 units. With n = 24, p = 8 and blocked assignment (core k gets calls 3k to 3k + 2), the slowest core does ___ units.',
      options: ['37.5', '48', '300', '69'], answer: 3,
      why: 'Core 7 gets calls 21–23: 22 + 23 + 24 = 69. The ideal would be 300 / 8 = 37.5.' },
    { id: 'r4', kind: 'concept', ex: '1.2',
      q: "Exercise 1.2: 24 calls are split over 8 cores (3 each), and call i costs i + 1 units, so later calls cost more. Which assignment gives the most even load?",
      options: ['Blocked', 'Cyclic: core c gets calls c, c + 8, c + 16', 'Snake: calls 0–7 to cores 0→7, 8–15 to cores 7→0, 16–23 to cores 0→7', 'Any of them: the total work is the same'], answer: 2,
      why: 'Snake gives 34–41 units per core, against 27–48 for cyclic and 6–69 for blocked.' },
    { id: 'r5', kind: 'calc', ex: '1.6',
      ctx: "Global sum of p partial sums (Chapter 1).\nOriginal: core 0 receives each other core's partial sum, one at a time, and adds it.\nTree-structured: cores pair up in rounds — 0←1, 2←3, 4←5, …; then 0←2, 4←6, …; and so on until core 0 holds the total.",
      q: "Exercise 1.6: with 256 cores, core 0 does ___ receives in the original global sum and ___ in the tree-structured sum.",
      options: ['255 and 8', '256 and 16', '128 and 8', '255 and 16'], answer: 0,
      why: 'Original: p − 1 = 255. Tree: log₂ 256 = 8.' },
    { id: 'r6', kind: 'concept', ex: '1.7',
      ctx: "Global sum of p partial sums (Chapter 1).\nOriginal: core 0 receives each other core's partial sum, one at a time, and adds it.\nTree-structured: cores pair up in rounds — 0←1, 2←3, 4←5, …; then 0←2, 4←6, …; and so on until core 0 holds the total.",
      q: "Exercise 1.7: in each round of the tree-structured sum, the receiving cores all do the same receive-and-add on different data, which is ___; meanwhile some cores send while others receive, which is ___.",
      options: ['task parallelism; data parallelism', 'data parallelism; task parallelism', 'data parallelism; data parallelism', 'SIMD; MIMD'], answer: 1,
      why: 'Same operation on different data is data parallelism; different operations at the same time is task parallelism. The tree sum shows both.' },
    { id: 'r7', kind: 'code', ex: '1.5', code: TREE,
      ctx: "Tree-structured global sum for any number of cores p (Exercises 1.3 and 1.5). Every core runs:",
      q: "Exercise 1.5: with p = 6, in the stage where core_difference = 2, core 4 ___.",
      options: ['receives from core 6', 'sends its sum to core 2', 'skips the stage, because its partner 6 is not less than p', 'breaks out of the loop'], answer: 2,
      why: '4 % 4 == 0, so core 4 is a receiver, but its partner 4 + 2 = 6 doesn\'t exist. The `partner < p` check is what makes the tree work when p isn\'t a power of two.' },
    { id: 'r8', kind: 'concept', ex: '2.22',
      q: "Exercise 2.22: apply Foster's method to vector addition, z[i] = x[i] + y[i] for i = 0 … n − 1. The communication step finds ___.",
      options: ['each task needs its neighbours\' values', 'no communication between tasks: each needs only x[i] and y[i]', 'a reduction at the end', 'a barrier after every element'], answer: 1,
      why: 'Elementwise and independent: embarrassingly parallel. Agglomerate into blocks of n/p and map one block per thread.' },
    { id: 'r9', kind: 'concept', ex: '2.23',
      ctx: "Histogram (textbook Section 2.7): count how many of n data values fall into each of bin_count bins.\nTextbook design: split the data. Each thread counts its block into a private loc_bin_counts array, then the arrays are added with a tree-structured sum.\nAlternative (Exercise 2.23): split the bins. Each thread owns some bins and scans all the data, counting only elements in its bins.",
      q: "Exercise 2.23: the alternative, bin-split design scales worse because ___.",
      options: ['every thread still reads all n elements, so its time stays O(n)', 'it needs a mutex for every bin', 'it has a race on bin_counts', 'its final tree sum takes O(p) steps'], answer: 0,
      why: 'It has no races and no reduction, but per-thread time can\'t drop below reading all n elements. Splitting the data gives O(n/p) per thread.' },
    { id: 'r10', kind: 'code', ex: '2.24', code: TREE_SHARED,
      ctx: "Exercise 2.24: each thread has counted its block of the histogram data into its own row `loc_bin_cts[my_rank][0 .. bin_count−1]`. The rows are then combined with this shared-memory tree sum; row 0 ends up with the totals.",
      q: "Which of these must be shared between the threads?",
      options: ['my_rank', 'divisor', 'partner', 'the loc_bin_cts rows'], answer: 3,
      why: 'A partner reads your row directly, so the rows (plus bin_count, thread_count and the barrier) are shared. The loop variables are private.' },
    { id: 'r11', kind: 'code', ex: '2.24', code: TREE_SHARED,
      ctx: "Exercise 2.24 shared-memory tree sum. In the message-passing version, a core that has sent its partial sum breaks out of the loop. Here nobody sends: a thread reads its partner's row directly.",
      q: "Threads with nothing left to add don't break out of this loop because ___.",
      options: ['every thread must reach the barrier in every stage', 'C doesn\'t allow break inside a while loop', 'breaking would cause a race on divisor', 'those threads still need to send their counts'], answer: 0,
      why: 'A thread that leaves the loop never reaches the later barriers, so the remaining threads wait forever.' },
    { id: 'r12', kind: 'concept', ex: '4.4', code: PI_TABLE,
      ctx: "Textbook π program: each thread sums its block of terms of π = 4(1 − 1/3 + 1/5 − …) into a private `my_sum`, then adds it once to the shared `sum`, protecting that update either with a busy-wait flag or with a mutex.",
      q: "Exercise 4.4: in Table 4.1 below, the mutex version's run time stays flat past 8 threads because threads waiting for the lock ___.",
      options: ['spin until it\'s their turn', 'run on spare virtual cores', 'block and are descheduled, so only threads with work use the cores', 'skip the critical section'], answer: 2,
      why: 'Blocked threads don\'t use a core. Busy-waiting threads do, which is why that version degrades.' },
    { id: 'r13', kind: 'code', ex: '4.5', code: COUNTER2,
      q: "Exercise 4.5 (counter2.c from Lecture 5): two threads run `worker()` below on a shared `count`. Compared with one thread doing all 2,000,000 increments in a plain loop, it is ___.",
      options: ['wrong, but faster', 'correct, but much slower', 'correct, and about p times faster', 'deadlocked'], answer: 1,
      why: 'The increments are serialized, plus lock overhead and cache-line bouncing. Counting privately and locking once after the loop is correct and fast.' },
    { id: 'r14', kind: 'code', ex: '4.7', code: HELLO_FOREVER,
      q: "Exercise 4.7: main creates threads forever with the loop below and never joins them. Eventually the messages stop because pthread_create starts returning ___.",
      options: ['EAGAIN, "Resource temporarily unavailable"', '0 every time', 'EDEADLK', 'a NULL handle'], answer: 0,
      why: 'Each finished but unjoined thread keeps its resources until joined, so the system runs out.' },
    { id: 'r15', kind: 'code', ex: '4.7', code: HELLO_FOREVER,
      q: "Exercise 4.7: if each new thread is detached (call `pthread_detach(handle)` after each create), ___.",
      options: ['creation fails sooner', 'finished threads free their resources, so creation keeps succeeding', 'the threads can still be joined', 'the program deadlocks'], answer: 1,
      why: 'Detached threads clean up when they finish; only the number alive at once is limited.' },
    { id: 'r16', kind: 'code', ex: '4.8', code: CONSUMER,
      ctx: "Exercise 4.8: the producer creates a message and sets the shared flag `message_available = 1`, both while holding mutex m. The flag starts at 0. The consumer runs the loop below.",
      q: "Does this consumer busy-wait?",
      options: ['No: pthread_mutex_lock puts it to sleep', 'No: the flag is protected by the mutex', 'Only when there are more than two threads', 'Yes: it keeps locking, checking and unlocking until the flag is set'], answer: 3,
      why: 'It spins on the flag. A semaphore or condition variable would let it sleep.' },
    { id: 'r17', kind: 'code', ex: '4.9', code: DEADLOCK,
      ctx: "Exercise 4.9: a program protects two shared data structures with mutexes mut0 and mut1. Two threads run:",
      q: "What happens?",
      options: ['Thread 0 gets both mutexes first', 'Each thread holds one mutex and waits forever for the other: deadlock', 'A race on mut1 corrupts it', 'It works, just slowly'], answer: 1,
      why: 'Circular wait: thread 0 holds mut0 and wants mut1; thread 1 holds mut1 and wants mut0.' },
    { id: 'r18', kind: 'code', ex: '4.9', code: DEADLOCK,
      ctx: "Exercise 4.9: a program protects two shared data structures with mutexes mut0 and mut1. Two threads run:",
      q: "Replacing the two mutexes with semaphores initialized to 1 ___.",
      options: ['fixes the problem', 'turns it into a race condition', 'still deadlocks: each sem_wait blocks forever', 'works only with counting semaphores'], answer: 2,
      why: 'sem_wait blocks just like a mutex lock. Two spinning flags would also hang, just while burning CPU.' },
    { id: 'r19', kind: 'code', ex: '4.9', code: DEADLOCK,
      ctx: "Exercise 4.9: a program protects two shared data structures with mutexes mut0 and mut1. Two threads run:",
      q: "The standard fix for this kind of deadlock is to ___.",
      options: ['acquire the locks in the same order in every thread', 'use busy-waiting with two flags instead', 'add a third mutex', 'unlock mut0 before locking it'], answer: 0,
      why: 'A single global lock order removes the circular wait.' },
    { id: 'r20', kind: 'concept', ex: '4.12',
      q: 'Exercise 4.12: on the list 2 → 8, T0 runs Insert(5) and T1 runs Insert(6). Both find pred 2 and curr 8; T0 sets 2.next = 5, then T1 sets 2.next = 6. The result is that ___.',
      options: ['both nodes are inserted correctly', 'a segfault is guaranteed', 'the list becomes circular', 'node 5 is lost from the list'], answer: 3,
      why: 'T1\'s write overwrites T0\'s link to 5: a leak and a wrong list.' },
    { id: 'r21', kind: 'concept', ex: '4.13',
      q: "Exercise 4.13: Insert on a shared sorted linked list has two phases: search for the position (read-only), then link in the new node (writes). Taking a read lock for the search, releasing it, then taking a write lock for the update is ___.",
      options: ['safe, because the search never writes', 'safe, as long as the write lock is requested before the read lock is released', 'unsafe: another thread can change the list between the two phases', 'unsafe only for Member'], answer: 2,
      why: 'The pred or curr found under the read lock can be deleted, or the same key inserted, before the write lock is taken. Pthreads read-write locks can\'t be upgraded atomically either.' },
    { id: 'r22', kind: 'code', ex: '4.17', code: MATVEC,
      q: "Exercise 4.17: the program below runs with m = n = 8000 on 4 threads, and a cache line holds 8 doubles. Threads 0 and 2 run on different processors. False sharing on y between them is ___.",
      options: ['likely, because they run on different processors', 'impossible: their elements of y are 2001 apart, farther than a cache line', 'possible at y[4000]', 'possible only if they share a processor'], answer: 1,
      why: 'Thread 0 owns y[0..1999] and thread 2 owns y[4000..5999]. Only adjacent threads\' blocks meet at a boundary.' },
    { id: 'r23', kind: 'calc', ex: '4.18',
      q: "Exercise 4.18: in the 8 × 8,000,000 matrix-vector multiply, y has 8 doubles (64 bytes). Cache lines are 64 bytes and line boundaries fall on double boundaries. The minimum and maximum number of lines needed to store y are ___.",
      options: ['1 and 8', '2 and 2', '8 and 8', '1 and 2'], answer: 3,
      why: 'Aligned: exactly 1 line. Any of the other 7 alignments splits y across 2 lines.' },
    { id: 'r24', kind: 'concept', ex: '4.18',
      ctx: "Matrix-vector multiply y = A·x (textbook Program 4.13) with m = 8 rows and n = 8,000,000 columns on 4 threads: thread t computes y[2t] and y[2t+1], updating each with `y[i] += A[i][j]*x[j]` 8,000,000 times. The machine has two dual-core processors; the two cores on a processor share a cache. Cache lines are 64 bytes (8 doubles).",
      q: "Exercise 4.18: there is no false sharing on y when ___.",
      options: ['y starts a cache line and threads 0 and 2 share a processor', 'the line boundary falls between y[3] and y[4], threads 0 and 1 share one processor and 2 and 3 the other', 'never: some false sharing always happens', 'threads 0 and 3 share a processor'], answer: 1,
      why: 'Of the 8 alignments × 3 ways to pair threads (24 arrangements), this is the only one where each processor\'s threads write only their own line.' },
    { id: 'r25', kind: 'concept', ex: '4.19',
      ctx: "Matrix-vector multiply y = A·x (textbook Program 4.13) with m = 8 rows and n = 8,000,000 columns on 4 threads: thread t computes y[2t] and y[2t+1], updating each with `y[i] += A[i][j]*x[j]` 8,000,000 times. The machine has two dual-core processors; the two cores on a processor share a cache. Cache lines are 64 bytes (8 doubles).\nBecause all of y can sit in one cache line, that line bounces between the processors (false sharing). Fix (a) is to pad y so each thread's elements sit on separate lines.",
      q: "Exercise 4.19: fix (b) is ___.",
      options: ['declaring y volatile', 'a mutex around each update of y', 'accumulating in thread-private storage and writing y once at the end', 'using more threads'], answer: 2,
      why: 'Writes to the shared cache line drop from 16,000,000 to a handful, with no alignment assumptions.' },
    { id: 'r26', kind: 'concept', ex: '4.18', code: TABLE45,
      ctx: "Program 4.13 computes y = A·x. Each input below does the same 64,000,000 floating-point operations; m × n is the matrix size, so y has m elements and x has n.",
      q: "With 4 threads the 8 × 8,000,000 input has efficiency 0.290, against 0.750 for 8000 × 8000, mainly because ___.",
      options: ['x is too small to cache', 'that input does fewer floating-point operations', 'of TLB misses', 'of false sharing: all of y sits in one cache line that every thread keeps writing'], answer: 3,
      why: 'Each thread updates its 2 elements of y 8,000,000 times, invalidating the line in the other processor\'s cache each time.' }
  ];
  R.forEach(q => { q.topic = 'review'; });
  window.REVIEW_BANK = R;
  window.QUIZ_BANK = (window.QUIZ_BANK || []).concat(R);
})();
