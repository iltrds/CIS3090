/* Questions built from the prof's recommended review exercises (Moodle, Week 5).
   Loaded after data/bank.js; appends to QUIZ_BANK under topic 'review'. Same schema as bank.js. */
(function () {
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
      q: 'Exercise 1.1: n = 50, p = 8, same rule. Core 1 handles indices ___.',
      options: ['7–13', '6–12', '7–12', '8–14'], answer: 0,
      why: 'q = 6, r = 2, so core 1 gets 7 items starting at 1·6 + 1 = 7.' },
    { id: 'r3', kind: 'calc', ex: '1.2',
      q: 'Exercise 1.2: call i costs i + 1 units. With n = 24, p = 8 and blocked assignment (core k gets calls 3k to 3k + 2), the slowest core does ___ units.',
      options: ['37.5', '48', '300', '69'], answer: 3,
      why: 'Core 7 gets calls 21–23: 22 + 23 + 24 = 69. The ideal would be 300 / 8 = 37.5.' },
    { id: 'r4', kind: 'concept', ex: '1.2',
      q: 'Exercise 1.2: for the same calls, which assignment gives the most even load?',
      options: ['Blocked', 'Cyclic: core c gets calls c, c + 8, c + 16', 'Snake: calls 0–7 to cores 0→7, 8–15 to cores 7→0, 16–23 to cores 0→7', 'Any of them: the total work is the same'], answer: 2,
      why: 'Snake gives 34–41 units per core, against 27–48 for cyclic and 6–69 for blocked.' },
    { id: 'r5', kind: 'calc', ex: '1.6',
      q: 'Exercise 1.6: with 256 cores, core 0 does ___ receives in the original global sum and ___ in the tree-structured sum.',
      options: ['255 and 8', '256 and 16', '128 and 8', '255 and 16'], answer: 0,
      why: 'Original: p − 1 = 255. Tree: log₂ 256 = 8.' },
    { id: 'r6', kind: 'concept', ex: '1.7',
      q: 'Exercise 1.7: in the tree-structured sum, receiving cores doing the same receive-and-add on different data is ___; some cores sending while others receive is ___.',
      options: ['task parallelism; data parallelism', 'data parallelism; task parallelism', 'data parallelism; data parallelism', 'SIMD; MIMD'], answer: 1,
      why: 'Same operation on different data is data parallelism; different operations at the same time is task parallelism. The tree sum shows both.' },
    { id: 'r7', kind: 'code', ex: '1.5', code: TREE,
      q: 'Exercise 1.5: with p = 6, in the stage where core_difference = 2, core 4 ___.',
      options: ['receives from core 6', 'sends its sum to core 2', 'skips the stage, because its partner 6 is not less than p', 'breaks out of the loop'], answer: 2,
      why: '4 % 4 == 0, so core 4 is a receiver, but its partner 4 + 2 = 6 doesn\'t exist. The `partner < p` check is what makes the tree work when p isn\'t a power of two.' },
    { id: 'r8', kind: 'concept', ex: '2.22',
      q: 'Exercise 2.22: applying Foster\'s method to vector addition, the communication step finds ___.',
      options: ['each task needs its neighbours\' values', 'no communication between tasks: each needs only x[i] and y[i]', 'a reduction at the end', 'a barrier after every element'], answer: 1,
      why: 'Elementwise and independent: embarrassingly parallel. Agglomerate into blocks of n/p and map one block per thread.' },
    { id: 'r9', kind: 'concept', ex: '2.23',
      q: 'Exercise 2.23: splitting the histogram by bins (each thread scans all the data and counts only its own bins) scales worse because ___.',
      options: ['every thread still reads all n elements, so its time stays O(n)', 'it needs a mutex for every bin', 'it has a race on bin_counts', 'its final tree sum takes O(p) steps'], answer: 0,
      why: 'It has no races and no reduction, but per-thread time can\'t drop below reading all n elements. Splitting the data gives O(n/p) per thread.' },
    { id: 'r10', kind: 'concept', ex: '2.24',
      q: 'Exercise 2.24: in the shared-memory tree sum of loc_bin_cts, which of these must be shared?',
      options: ['my_rank', 'divisor', 'partner', 'the loc_bin_cts rows'], answer: 3,
      why: 'A partner reads your row directly, so the rows (plus bin_count, thread_count and the barrier) are shared. The loop variables are private.' },
    { id: 'r11', kind: 'code', ex: '2.24', code: TREE_SHARED,
      q: 'Exercise 2.24: unlike the message-passing tree sum, threads with nothing left to add don\'t break out of this loop because ___.',
      options: ['every thread must reach the barrier in every stage', 'C doesn\'t allow break inside a while loop', 'breaking would cause a race on divisor', 'those threads still need to send their counts'], answer: 0,
      why: 'A thread that leaves the loop never reaches the later barriers, so the remaining threads wait forever.' },
    { id: 'r12', kind: 'concept', ex: '4.4',
      q: 'Exercise 4.4: past the number of cores, the mutex π program\'s run time stays flat because threads waiting for the lock ___.',
      options: ['spin until it\'s their turn', 'run on spare virtual cores', 'block and are descheduled, so only threads with work use the cores', 'skip the critical section'], answer: 2,
      why: 'Blocked threads don\'t use a core. Busy-waiting threads do, which is why that version degrades.' },
    { id: 'r13', kind: 'concept', ex: '4.5',
      q: 'Exercise 4.5: counter2.c locks around every `count++`. Compared with one thread doing the same total number of increments, it is ___.',
      options: ['wrong, but faster', 'correct, but much slower', 'correct, and about p times faster', 'deadlocked'], answer: 1,
      why: 'The increments are serialized, plus lock overhead and cache-line bouncing. Counting privately and locking once after the loop is correct and fast.' },
    { id: 'r14', kind: 'concept', ex: '4.7',
      q: 'Exercise 4.7: a loop creates joinable threads forever and never joins them. pthread_create eventually returns ___.',
      options: ['EAGAIN, "Resource temporarily unavailable"', '0 every time', 'EDEADLK', 'a NULL handle'], answer: 0,
      why: 'Each finished but unjoined thread keeps its resources until joined, so the system runs out.' },
    { id: 'r15', kind: 'concept', ex: '4.7',
      q: 'Exercise 4.7: after each new thread is detached, ___.',
      options: ['creation fails sooner', 'finished threads free their resources, so creation keeps succeeding', 'the threads can still be joined', 'the program deadlocks'], answer: 1,
      why: 'Detached threads clean up when they finish; only the number alive at once is limited.' },
    { id: 'r16', kind: 'code', ex: '4.8', code: CONSUMER,
      q: 'Exercise 4.8: does this consumer busy-wait?',
      options: ['No: pthread_mutex_lock puts it to sleep', 'No: the flag is protected by the mutex', 'Only when there are more than two threads', 'Yes: it keeps locking, checking and unlocking until the flag is set'], answer: 3,
      why: 'It spins on the flag. A semaphore or condition variable would let it sleep.' },
    { id: 'r17', kind: 'code', ex: '4.9', code: DEADLOCK,
      q: 'Exercise 4.9: what happens?',
      options: ['Thread 0 gets both mutexes first', 'Each thread holds one mutex and waits forever for the other: deadlock', 'A race on mut1 corrupts it', 'It works, just slowly'], answer: 1,
      why: 'Circular wait: thread 0 holds mut0 and wants mut1; thread 1 holds mut1 and wants mut0.' },
    { id: 'r18', kind: 'code', ex: '4.9', code: DEADLOCK,
      q: 'Exercise 4.9: replacing the two mutexes with semaphores initialized to 1 ___.',
      options: ['fixes the problem', 'turns it into a race condition', 'still deadlocks: each sem_wait blocks forever', 'works only with counting semaphores'], answer: 2,
      why: 'sem_wait blocks just like a mutex lock. Two spinning flags would also hang, just while burning CPU.' },
    { id: 'r19', kind: 'concept', ex: '4.9',
      q: 'Exercise 4.9: the standard fix for a deadlock between two locks taken in opposite orders is to ___.',
      options: ['acquire the locks in the same order in every thread', 'use busy-waiting with two flags instead', 'add a third mutex', 'unlock mut0 before locking it'], answer: 0,
      why: 'A single global lock order removes the circular wait.' },
    { id: 'r20', kind: 'concept', ex: '4.12',
      q: 'Exercise 4.12: on the list 2 → 8, T0 runs Insert(5) and T1 runs Insert(6). Both find pred 2 and curr 8; T0 sets 2.next = 5, then T1 sets 2.next = 6. The result is that ___.',
      options: ['both nodes are inserted correctly', 'a segfault is guaranteed', 'the list becomes circular', 'node 5 is lost from the list'], answer: 3,
      why: 'T1\'s write overwrites T0\'s link to 5: a leak and a wrong list.' },
    { id: 'r21', kind: 'concept', ex: '4.13',
      q: 'Exercise 4.13: taking a read lock for the search phase of Insert, then a write lock for the update phase, is ___.',
      options: ['safe, because the search never writes', 'safe, as long as the write lock is requested before the read lock is released', 'unsafe: another thread can change the list between the two phases', 'unsafe only for Member'], answer: 2,
      why: 'The pred or curr found under the read lock can be deleted, or the same key inserted, before the write lock is taken. Pthreads read-write locks can\'t be upgraded atomically either.' },
    { id: 'r22', kind: 'calc', ex: '4.17',
      q: 'Exercise 4.17: 8000 × 8000 input, 4 threads, 8 doubles per cache line. False sharing on y between threads 0 and 2 is ___.',
      options: ['likely, because they run on different processors', 'impossible: their elements of y are 2001 apart, farther than a cache line', 'possible at y[4000]', 'possible only if they share a processor'], answer: 1,
      why: 'Thread 0 owns y[0..1999] and thread 2 owns y[4000..5999]. Only adjacent threads\' blocks meet at a boundary.' },
    { id: 'r23', kind: 'calc', ex: '4.18',
      q: 'Exercise 4.18: y has 8 doubles, lines are 64 bytes, and line boundaries fall on double boundaries. The minimum and maximum number of lines needed to store y are ___.',
      options: ['1 and 8', '2 and 2', '8 and 8', '1 and 2'], answer: 3,
      why: 'Aligned: exactly 1 line. Any of the other 7 alignments splits y across 2 lines.' },
    { id: 'r24', kind: 'concept', ex: '4.18',
      q: 'Exercise 4.18: with two dual-core processors and 4 threads owning 2 elements of y each, there is no false sharing when ___.',
      options: ['y starts a cache line and threads 0 and 2 share a processor', 'the line boundary falls between y[3] and y[4], threads 0 and 1 share one processor and 2 and 3 the other', 'never: some false sharing always happens', 'threads 0 and 3 share a processor'], answer: 1,
      why: 'Of the 8 alignments × 3 ways to pair threads (24 arrangements), this is the only one where each processor\'s threads write only their own line.' },
    { id: 'r25', kind: 'concept', ex: '4.19',
      q: 'Exercise 4.19: the alternative to padding y is ___.',
      options: ['declaring y volatile', 'a mutex around each update of y', 'accumulating in thread-private storage and writing y once at the end', 'using more threads'], answer: 2,
      why: 'Writes to the shared cache line drop from 16,000,000 to a handful, with no alignment assumptions.' },
    { id: 'r26', kind: 'concept', ex: '4.18',
      q: 'Table 4.5: with 4 threads the 8 × 8,000,000 input has efficiency 0.290, against 0.750 for 8000 × 8000, mainly because ___.',
      options: ['x is too small to cache', 'that input does fewer floating-point operations', 'of TLB misses', 'of false sharing: all of y sits in one cache line that every thread keeps writing'], answer: 3,
      why: 'Each thread updates its 2 elements of y 8,000,000 times, invalidating the line in the other processor\'s cache each time.' }
  ];
  R.forEach(q => { q.topic = 'review'; });
  window.REVIEW_BANK = R;
  window.QUIZ_BANK = (window.QUIZ_BANK || []).concat(R);
})();
