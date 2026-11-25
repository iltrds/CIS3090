/* Midterm 2 topic quiz bank. Each question:
   { id, topic, kind: 'concept'|'calc'|'code'|'graph', q, ctx?, code?, chart?, options[], answer, why }
   answer is an option index, or an array of indices for "select all that apply" questions.
   Inline `code` and **bold** in q/options/why are rendered by assets/common.js. */
(function () {
  const amdahl = (a, ps) => ps.map(p => Math.round(100 / ((1 - a) / p + a)) / 100);
  const P9 = [1, 2, 4, 8, 16, 32, 64, 128, 256];

  const SPEEDUP_CHART = {
    type: 'line', title: 'Measured speedup', note: 'Lecture 14 example program',
    x: ['1', '2', '4', '8', '16'], xLabel: 'processors p', yLabel: 'speedup S', yMax: 16,
    series: [
      { name: 'perfect (S = p)', style: 'reference', values: [1, 2, 4, 8, 16] },
      { name: 'measured', style: 'accent', values: [1, 1.9, 3.6, 6.5, 10.8], labels: 'below' }
    ]
  };

  const AMDAHL_CHART = {
    type: 'line', title: 'Speedup of three programs', note: 'Each program is perfectly parallel except for its serial fraction',
    x: P9.map(String), xLabel: 'cores p (doubling)', yLabel: 'speedup S', yMax: 20,
    series: [
      { name: 'X', style: 'muted', values: amdahl(0.5, P9) },
      { name: 'Y', style: 'accent', values: amdahl(0.1, P9) },
      { name: 'Z', style: 'muted', values: amdahl(0.05, P9) }
    ]
  };

  const HELLO = `int main(void) {
    char greeting[100];
    int comm_sz, my_rank;
    MPI_Init(NULL, NULL);
    MPI_Comm_size(MPI_COMM_WORLD, &comm_sz);
    MPI_Comm_rank(MPI_COMM_WORLD, &my_rank);
    if (my_rank != 0) {
        sprintf(greeting, "Greetings from process %d of %d!", my_rank, comm_sz);
        MPI_Send(greeting, strlen(greeting)+1, MPI_CHAR, 0, 0, MPI_COMM_WORLD);
    } else {
        printf("Process %d of %d is ready\\n", my_rank, comm_sz);
        for (int q = 1; q < comm_sz; q++) {
            MPI_Recv(greeting, 100, MPI_CHAR, q, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
            printf("%s\\n", greeting);
        }
    }
    MPI_Finalize();
    return 0;
}`;

  const ADD_KERNEL = `@wp.kernel
def addArrays(x: wp.array(dtype=float),
              y: wp.array(dtype=float),
              z: wp.array(dtype=float)):
    tid = wp.tid()
    z[tid] = x[tid] + y[tid]`;

  const BLUR = `@wp.kernel
def blurGreyscale(inputImage: wp.array2d(dtype=wp.float32),
                  outputImage: wp.array2d(dtype=wp.float32)):
    i, j = wp.tid()
    height = inputImage.shape[0]
    width = inputImage.shape[1]
    if i == 0 or j == 0 or i == height - 1 or j == width - 1:
        outputImage[i, j] = inputImage[i, j]
        return
    acc = 0.2 * inputImage[i, j]
    acc += 0.2 * inputImage[i - 1, j]
    acc += 0.2 * inputImage[i + 1, j]
    acc += 0.2 * inputImage[i, j - 1]
    acc += 0.2 * inputImage[i, j + 1]
    outputImage[i, j] = acc`;

  window.QUIZ_BANK = [
    /* ===================== Performance ===================== */
    { id: 'p1', topic: 'perf', kind: 'calc', q: 'A program takes 48 s serially and 8 s on 8 cores. Its speedup and efficiency are ___.',
      options: ['S = 6, E = 0.75', 'S = 6, E = 1.33', 'S = 0.17, E = 0.02', 'S = 8, E = 1'], answer: 0,
      why: 'S = 48/8 = 6 and E = S/p = 6/8 = 0.75.' },
    { id: 'p2', topic: 'perf', kind: 'calc', q: 'A program is 80% parallelizable; the rest is inherently serial. By Amdahl\'s law, its speedup on 4 cores is ___.',
      options: ['3.2', '4', '2.5', '5'], answer: 2,
      why: 'S = 1 / ((1 − a)/p + a) with a = 0.2: 1 / (0.8/4 + 0.2) = 1 / 0.4 = 2.5.' },
    { id: 'p3', topic: 'perf', kind: 'calc', q: 'A program\'s inherently serial fraction is a = 0.05. No matter how many cores you use, its speedup can never exceed ___.',
      options: ['5', '20', '95', 'There is no limit with enough cores'], answer: 1,
      why: 'As p → ∞, S → 1/a = 1/0.05 = 20.' },
    { id: 'p4', topic: 'perf', kind: 'concept', q: 'Which of these overheads grow as you add threads or processes?',
      options: ['Creating and managing threads', 'Contention for critical sections and mutex calls', 'Network I/O between processes on different machines', 'The arithmetic done in one iteration of the parallel loop'], answer: [0, 1, 2],
      why: 'Lecture 14 lists managing threads, critical sections, mutex functions, network I/O and file I/O as overheads that grow with p. The per-iteration arithmetic is the useful work; it doesn\'t grow with p.' },
    { id: 'p5', topic: 'perf', kind: 'concept', q: 'You keep p fixed and make the problem much larger. If the overhead grows more slowly than T_serial, then ___.',
      options: ['speedup and efficiency both increase', 'speedup increases but efficiency decreases', 'both stay the same, since p didn\'t change', 'efficiency increases but speedup decreases'], answer: 0,
      why: 'With more work per core, the fixed or slow-growing overhead is a smaller share of T_parallel, so S and E both rise (Lecture 14).' },
    { id: 'p6', topic: 'perf', kind: 'calc', q: 'T_serial = 24 s and the program takes 5 s on 6 cores. How much of each core\'s 5 s is overhead?',
      options: ['4 s', '0.8 s', '5 s', '1 s'], answer: 3,
      why: 'T_parallel = T_serial/p + T_overhead, so 5 = 24/6 + T_overhead = 4 + 1. Each core does 4 s of useful work and 1 s of overhead.' },
    { id: 'p7', topic: 'perf', kind: 'graph', q: 'From the chart, the program\'s efficiency on 16 processors is about ___.', chart: SPEEDUP_CHART,
      options: ['10.8', '0.81', '0.675', '1.48'], answer: 2,
      why: 'E = S/p = 10.8/16 = 0.675. 0.81 is the efficiency at p = 8 (6.5/8).' },
    { id: 'p8', topic: 'perf', kind: 'graph', q: 'Which statement best describes the program in the chart as p grows from 1 to 16?', chart: SPEEDUP_CHART,
      options: ['Speedup and efficiency both increase', 'Speedup increases while efficiency decreases', 'Speedup is linear, so efficiency stays at 1', 'Speedup increases faster than p, so the program is super-linear'], answer: 1,
      why: 'S rises (1 → 10.8) but stays below the perfect line, and E = S/p falls (1 → 0.675): each extra processor is worth less.' },
    { id: 'p9', topic: 'perf', kind: 'calc', q: 'You need a maximum possible speedup of at least 50. By Amdahl\'s law, at least what fraction of the program must be parallelizable?',
      options: ['50%', '98%', '95%', '99.5%'], answer: 1,
      why: 'Max speedup = 1/a ≥ 50 means a ≤ 0.02, so at least 98% must be parallelizable.' },
    { id: 'p10', topic: 'perf', kind: 'concept', q: 'Which statements about Amdahl\'s law are true?',
      options: ['Speedup approaches 1/a as p grows, where a is the serial fraction', 'If the serial fraction is 0, speedup equals p', 'Past some point, adding cores gives almost no benefit', 'For large p it predicts super-linear speedup', 'Doubling the cores always doubles the speedup'], answer: [0, 1, 2],
      why: 'S = 1/((1−a)/p + a) → 1/a; with a = 0 it\'s p (linear). Amdahl\'s law rules out super-linear speedup from parallelization, and doubling cores doubles S only when a = 0.' },
    { id: 'p11', topic: 'perf', kind: 'calc', q: 'A program takes 20 s serially and 90% of it parallelizes perfectly. How long does it take on 4 cores?',
      options: ['6.5 s', '5 s', '4.5 s', '2 s'], answer: 0,
      why: 'T_parallel = 0.9 × 20 / 4 + 0.1 × 20 = 4.5 + 2 = 6.5 s.' },
    { id: 'p12', topic: 'perf', kind: 'concept', q: 'Linear speedup means ___.',
      options: ['S = p, so p cores run the program p times faster', 'speedup grows by a constant amount per core, even if below p', 'efficiency falls linearly as p grows', 'S = 1/a, the Amdahl limit'], answer: 0,
      why: 'Linear speedup is the ideal S = p (T_parallel = T_serial/p, E = 1).' },
    { id: 'p13', topic: 'perf', kind: 'graph', q: 'The chart shows three programs that differ only in their serial fraction. Program Y levels off near 10. What is Y\'s serial fraction?', chart: AMDAHL_CHART,
      options: ['0.5', '0.05', '0.01', '0.1'], answer: 3,
      why: 'Speedup approaches 1/a, and 1/a = 10 gives a = 0.1. X (a = 0.5) levels off at 2 and Z (a = 0.05) heads for 20.' },
    { id: 'p14', topic: 'perf', kind: 'calc', q: 'A program is 75% parallelizable. What is its maximum possible speedup on any number of cores?',
      options: ['1.33', '4', '75', '3'], answer: 1,
      why: 'a = 0.25, so the limit is 1/a = 4.' },

    /* ===================== Architectures and data layout ===================== */
    { id: 'a1', topic: 'arch', kind: 'concept', q: 'A vector processor applies one instruction to all 64 elements of a vector register at once. In Flynn\'s taxonomy it is ___.',
      options: ['SISD', 'SIMD', 'MISD', 'MIMD'], answer: 1,
      why: 'One instruction, many data items: single instruction, multiple data.' },
    { id: 'a2', topic: 'arch', kind: 'concept', q: 'An 8-core laptop runs 8 Pthreads, each executing different code at its own pace on its own data. In Flynn\'s taxonomy it is ___.',
      options: ['SIMD', 'MISD', 'MIMD', 'SISD'], answer: 2,
      why: 'Independent cores with their own control units running asynchronously: multiple instruction, multiple data. MIMD covers both shared-memory multicores and clusters.' },
    { id: 'a3', topic: 'arch', kind: 'concept', q: 'Which are benefits of vector processors?',
      options: ['Compilers are good at finding loops to vectorize and report on ones they can\'t', 'High memory bandwidth', 'Every data item loaded is used, unlike a cache line', 'They handle linked lists and trees as efficiently as arrays', 'They scale easily: longer vectors keep giving more speed'], answer: [0, 1, 2],
      why: 'Lecture 14 lists fast and easy to use, good compiler support, high bandwidth and all loaded data used. The drawbacks are the last two: irregular data structures and poor scaling to longer vectors.' },
    { id: 'a4', topic: 'arch', kind: 'concept', q: 'Which workload is the worst fit for a vector processor?',
      options: ['Adding two large arrays element by element', 'Scaling every pixel in a large image buffer', 'Walking a linked list and updating each node', 'Multiplying every element of a vector by a constant'], answer: 2,
      why: 'Vector processors don\'t work well with irregular data structures; a linked list isn\'t a contiguous array.' },
    { id: 'a5', topic: 'arch', kind: 'concept', q: 'Which class in Flynn\'s taxonomy has very few real systems?',
      options: ['MISD', 'SIMD', 'MIMD', 'SISD'], answer: 0,
      why: 'Multiple instructions on a single data stream is rarely built.' },
    { id: 'a6', topic: 'arch', kind: 'concept', q: 'In a NUMA shared-memory system, ___.',
      options: ['every core sees the same access time for every memory address', 'a core reaches its own chip\'s memory faster than another chip\'s', 'each core has private memory that the other cores can\'t access', 'cores never share memory and exchange data only through messages'], answer: 1,
      why: 'Nonuniform memory access: local memory is faster, remote is slower. UMA has uniform access times; private-only memory is distributed memory.' },
    { id: 'a7', topic: 'arch', kind: 'concept', q: 'A cluster\'s nodes are each multicore shared-memory machines, connected by Ethernet. This is called a ___ system.',
      options: ['NUMA', 'grid', 'SIMD', 'hybrid'], answer: 3,
      why: 'Shared memory inside each node plus distributed memory between nodes makes a hybrid system. A grid is many clusters spread over a large area.' },
    { id: 'a8', topic: 'arch', kind: 'concept', q: 'Compared with a bus, a crossbar switch connecting 4 CPUs to 4 memory modules ___.',
      options: ['is cheaper to build, but every CPU waits its turn for memory', 'lets 4 CPUs use 4 different modules at once, at a higher cost', 'removes every conflict, even when two CPUs want the same module', 'permanently wires each CPU to one memory module of its own'], answer: 1,
      why: 'The crossbar gives multiple paths chosen by the switch, so CPUs don\'t block each other, but it\'s expensive. Two CPUs wanting the same module still conflict, and connections aren\'t permanent.' },
    { id: 'a9', topic: 'arch', kind: 'code', q: 'Rank 0 must send an M × N matrix of doubles to rank 1. Which layout can it send with a single `MPI_Send`?',
      code: `/* Layout 1 */
double **rows = malloc(M * sizeof(double*));
for (int i = 0; i < M; i++) rows[i] = malloc(N * sizeof(double));

/* Layout 2 */
double *flat = malloc(M * N * sizeof(double));   /* (i, j) at flat[i*N + j] */`,
      options: ['Layout 1, by sending `rows` with count M*N', 'Both, since MPI follows the pointers', 'Layout 2, by sending `flat` with count M*N', 'Neither; MPI can only send one row at a time'], answer: 2,
      why: 'A message is a buffer pointer plus a count of contiguous elements. Layout 2 is one contiguous block. Layout 1\'s rows are separate allocations, so it needs one message per row (or packing first); MPI doesn\'t follow pointers.' },
    { id: 'a10', topic: 'arch', kind: 'concept', q: 'Which are advantages of storing a 2D grid as one flat, contiguous array?',
      options: ['Looping over it touches neighbouring addresses, giving good spatial locality', 'It can go to another MPI process in one message', 'It can be copied to the GPU in one transfer', 'Each element gets its own cache line, which prevents false sharing'], answer: [0, 1, 2],
      why: 'Contiguous data gives spatial locality and moves in one piece. Contiguous elements share cache lines (that\'s why locality is good); it does not give each element its own line.' },
    { id: 'a11', topic: 'arch', kind: 'calc', q: 'A 4 × 6 matrix (4 rows, 6 columns) is stored row by row in a flat array `a`. Element (row 2, column 3), counting from 0, is at index ___.',
      options: ['14', '15', '11', '20'], answer: 1,
      why: 'Index = i × N + j = 2 × 6 + 3 = 15.' },
    { id: 'a12', topic: 'arch', kind: 'concept', q: 'In a classic SIMD system, ___.',
      options: ['one control unit drives many ALUs applying the same instruction', 'each ALU fetches and runs its own independent instruction stream', 'one ALU applies several different instructions to one data item', 'processors share no memory and communicate only by message passing'], answer: 0,
      why: 'SIMD is one control unit with multiple ALUs in lockstep. With m ALUs, arithmetic can be up to m times faster, but it\'s mostly useful for data parallelism.' },

    /* ===================== MPI basics ===================== */
    { id: 'm1', topic: 'mpi', kind: 'code', q: 'Rank 0 receives a message that might have either of two tags. How does it find out which tag the message had?',
      code: 'MPI_Recv(buf, 100, MPI_INT, 3, MPI_ANY_TAG, MPI_COMM_WORLD, &status);',
      options: ['Read `status.MPI_TAG`', 'Read `status.MPI_SOURCE`, which MPI sets to the tag for wildcard receives', 'Use the return value of `MPI_Recv`', 'It can\'t; the sender must put the tag inside the message'], answer: 0,
      why: 'After the receive, `status.MPI_TAG` holds the tag and `status.MPI_SOURCE` the sender. MPI_Recv returns only an error code.' },
    { id: 'm2', topic: 'mpi', kind: 'code', q: 'What happens when this runs with 2 processes?',
      code: `if (my_rank == 1)
    MPI_Send(&x, 1, MPI_INT, 0, 1, MPI_COMM_WORLD);   /* tag 1 */
else
    MPI_Recv(&x, 1, MPI_INT, 1, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);   /* tag 0 */`,
      options: ['Rank 0 receives x, since source and communicator match', 'Rank 0\'s receive never completes because the tags don\'t match', 'MPI converts the tag automatically', 'Rank 1\'s send fails with an error'], answer: 1,
      why: 'Communicator, source and tag must all agree. With tag 1 sent and tag 0 expected, the receive never matches and rank 0 hangs.' },
    { id: 'm3', topic: 'mpi', kind: 'code', q: 'Rank 1 sends two messages to rank 0 with the same tag; rank 0 receives twice from rank 1 with that tag. Which statement is true?',
      code: `/* rank 1 */
MPI_Send(&a, 1, MPI_INT, 0, 7, MPI_COMM_WORLD);   /* sent first  */
MPI_Send(&b, 1, MPI_INT, 0, 7, MPI_COMM_WORLD);   /* sent second */
/* rank 0 */
MPI_Recv(&first,  1, MPI_INT, 1, 7, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
MPI_Recv(&second, 1, MPI_INT, 1, 7, MPI_COMM_WORLD, MPI_STATUS_IGNORE);`,
      options: ['`first` could be b or a, depending on the network', '`first` gets a and `second` gets b, guaranteed', 'The second receive overwrites both values with b', 'It deadlocks because both messages use tag 7'], answer: 1,
      why: 'Messages are nonovertaking: from one sender to one receiver (with matching receives), they arrive in the order sent.' },
    { id: 'm4', topic: 'mpi', kind: 'code', q: 'Ranks 1 and 2 each send one message to rank 0 at about the same time. Rank 0 runs this. Which message does it get first?',
      code: `MPI_Recv(&v1, 1, MPI_INT, MPI_ANY_SOURCE, 0, MPI_COMM_WORLD, &status);
MPI_Recv(&v2, 1, MPI_INT, MPI_ANY_SOURCE, 0, MPI_COMM_WORLD, &status);`,
      options: ['Always rank 1\'s, because lower ranks are delivered first', 'Always rank 2\'s, because the last sender is matched first', 'Either one; MPI sets no order between different senders', 'Neither; MPI_ANY_SOURCE can\'t be used twice in a row'], answer: 2,
      why: 'Ordering is only guaranteed per sender. Across senders there is no global order, so check `status.MPI_SOURCE` to see who it was.' },
    { id: 'm5', topic: 'mpi', kind: 'concept', q: 'An MPI program needs the user to type n. Following the course conventions, ___.',
      options: ['every rank calls scanf and reads its own copy of n from stdin', 'rank 0 reads n, then sends or broadcasts it to the other ranks', 'the highest rank reads n, since it is the last one to start', 'any rank may read n, since all ranks share the same stdin stream'], answer: 1,
      why: 'Assume only rank 0 in MPI_COMM_WORLD can read stdin; it must pass the value on (MPI_Send loop or MPI_Bcast).' },
    { id: 'm6', topic: 'mpi', kind: 'concept', q: 'Every rank of a 4-process program executes `printf("rank %d done\\n", my_rank);`. The output ___.',
      options: ['always appears in rank order 0, 1, 2, 3', 'appears only from rank 0, since it owns stdout', 'can appear in any order, and lines may interleave', 'is held by MPI and printed in rank order at MPI_Finalize'], answer: 2,
      why: 'Most implementations let every rank print, but output from multiple processes is nondeterministic. Send results to rank 0 to print in order.' },
    { id: 'm7', topic: 'mpi', kind: 'code', q: 'This is run with `mpiexec -n 4 ./mpi_hello`. Which describes its output?', code: HELLO,
      options: ['The three greetings appear in a different order on each run', 'The ready line, then greetings from 1, 2 and 3, in that order', 'Four greeting lines, one from every process including rank 0', 'Only the ready line, because the other ranks never call printf'], answer: 1,
      why: 'Only rank 0 prints. It receives with source q = 1, 2, 3 in turn, so even if rank 3\'s message arrives first, it\'s printed third.' },
    { id: 'm8', topic: 'mpi', kind: 'concept', q: 'After `MPI_Send` returns, what do you know?',
      options: ['The destination process has already received the message', 'Only that the buffer is reusable; the message may just be buffered', 'The message was dropped unless a matching receive was posted', 'The destination has posted a receive with MPI_ANY_SOURCE'], answer: 1,
      why: 'MPI_Send may buffer and return or block until received; the behaviour is implementation-dependent, so you can\'t assume delivery.' },
    { id: 'm9', topic: 'mpi', kind: 'concept', q: 'Which arguments can take an MPI wildcard (`MPI_ANY_SOURCE` or `MPI_ANY_TAG`)?',
      options: ['The source in `MPI_Recv`', 'The tag in `MPI_Recv`', 'The destination in `MPI_Send`', 'The communicator in `MPI_Recv`'], answer: [0, 1],
      why: 'Only receivers use wildcards, and only for source and tag. Senders must name a rank and a tag, and there is no wildcard communicator.' },
    { id: 'm10', topic: 'mpi', kind: 'code', q: 'Why does this send use `strlen(greeting)+1` as the count?',
      code: 'MPI_Send(greeting, strlen(greeting)+1, MPI_CHAR, 0, 0, MPI_COMM_WORLD);',
      options: ['To include the terminating `\\0`, so the receiver gets a C string', 'Because MPI counts elements from 1 rather than from 0', 'The extra character carries the message tag to the receiver', 'To leave one character free for the sender\'s rank number'], answer: 0,
      why: 'count is the number of elements. strlen excludes the null terminator, so +1 sends it too.' },
    { id: 'm11', topic: 'mpi', kind: 'concept', q: 'How do you compile `trap.c` as an MPI program and run it with 8 processes?',
      options: ['`gcc -pthread trap.c -o trap` then `./trap 8`', '`mpicc trap.c -o trap` then `mpiexec -n 8 ./trap`', '`mpicc trap.c -o trap` then `./trap -n 8`', '`gcc -lmpi trap.c` then `mpiexec ./trap`'], answer: 1,
      why: 'MPI programs are compiled with the mpicc wrapper and launched with mpiexec; -n sets the number of processes.' },
    { id: 'm12', topic: 'mpi', kind: 'code', q: 'Two processes run this. What happens?',
      code: `int other = 1 - my_rank;
MPI_Recv(&in,  1, MPI_INT, other, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
MPI_Send(&out, 1, MPI_INT, other, 0, MPI_COMM_WORLD);`,
      options: ['They swap values correctly', 'Both block in MPI_Recv forever: deadlock', 'Rank 0 gets rank 1\'s value; rank 1 gets nothing', 'MPI reorders the calls so the sends happen first'], answer: 1,
      why: 'MPI_Recv always blocks until a matching message arrives, and neither process ever reaches its send. Have one rank send first, or the other receive first.' },
    { id: 'm13', topic: 'mpi', kind: 'code', q: 'A worker sends 40 chars to rank 0, which receives them with the call below. Which is true?',
      code: `MPI_Status status;
int n;
MPI_Recv(buf, 256, MPI_CHAR, 1, 0, MPI_COMM_WORLD, &status);
MPI_Get_count(&status, MPI_CHAR, &n);`,
      options: ['The receive fails because 40 ≠ 256', 'It succeeds, and n is 40', 'It succeeds, and n is 256', 'It waits until 256 chars have arrived'], answer: 1,
      why: 'The receive count is the buffer capacity; a shorter message is fine. MPI_Get_count gives the number actually received.' },
    { id: 'm14', topic: 'mpi', kind: 'concept', q: 'Your program uses two independent MPI libraries, an atmosphere model and an ocean model, that each send messages internally. The simplest way to stop one library receiving the other\'s messages is to ___.',
      options: ['give each library its own communicator', 'give the two libraries different ranks', 'make every receive use MPI_ANY_SOURCE', 'call MPI_Init once per library'], answer: 0,
      why: 'A message sent on one communicator can\'t be received on another, so separate communicators isolate them (textbook 3.1). Tags would work only by carefully splitting tag ranges.' },
    { id: 'm15', topic: 'mpi', kind: 'concept', q: 'Which of these can leave an MPI program hanging?',
      options: ['A receive whose matching send is never made', 'A send and receive whose tags don\'t match', 'Two ranks that both call a blocking receive before sending to each other', 'Rank 1 sends tag 3 to rank 0, which receives with MPI_ANY_TAG'], answer: [0, 1, 2],
      why: 'Missing or mismatched sends and receives block forever, and so do mutual receives. MPI_ANY_TAG matches tag 3, so the last one completes.' },
    { id: 'm16', topic: 'mpi', kind: 'concept', q: 'Compared with Pthreads, MPI ___.',
      options: ['uses threads that all share a single address space', 'uses processes with separate memory and explicit messages', 'requires all of its processes to run on a single machine', 'has no built-in operations designed for parallel computation'], answer: 1,
      why: 'MPI works with processes that share nothing, possibly on many machines, and was designed for parallel computation (it has collectives). Pthreads uses threads in shared memory.' },
    { id: 'm17', topic: 'mpi', kind: 'concept', q: 'A distributed-memory system with MPI is most worthwhile when ___.',
      options: ['each machine spends much more time computing than communicating', 'processes must exchange small messages after every operation', 'the whole problem fits in one machine\'s cache', 'the program is mostly serial'], answer: 0,
      why: 'Network transfers are slow, so the computation has to take even longer to get a speedup. Long, data-parallel jobs like a render farm are a good fit.' },
    { id: 'm18', topic: 'mpi', kind: 'concept', q: 'In MPI, a process\'s rank is ___.',
      options: ['the operating system\'s process ID (PID) for the process', 'its ID within a communicator, from 0 to comm_sz − 1', 'its scheduling priority relative to the other processes', 'the number of messages it has sent so far'], answer: 1,
      why: '`MPI_Comm_rank` gives the process\'s rank in the communicator; it plays the role of a thread ID and is system-independent.' },

    /* ===================== Collectives ===================== */
    { id: 'c1', topic: 'coll', kind: 'concept', q: 'Every rank computes a local maximum, and every rank needs the global maximum before its next step. The best single call is ___.',
      options: ['`MPI_Reduce` with `MPI_MAX` to rank 0', '`MPI_Allreduce` with `MPI_MAX`', '`MPI_Bcast` from each rank in turn', '`MPI_Gather` to every rank'], answer: 1,
      why: 'Allreduce combines the values and gives the result to every rank. Reduce would leave it only on rank 0, needing a broadcast too.' },
    { id: 'c2', topic: 'coll', kind: 'code', q: 'Four ranks run this. What is in `total` on rank 2 afterwards?',
      code: `int local = my_rank + 1, total = -1;
MPI_Reduce(&local, &total, 1, MPI_INT, MPI_SUM, 0, MPI_COMM_WORLD);`,
      options: ['10, the sum from all four ranks', '3, rank 2\'s own contribution', '-1, the value it started with', '6, the partial sum up to rank 2'], answer: 2,
      why: 'MPI_Reduce puts the result (1 + 2 + 3 + 4 = 10) only in the dest process\'s output buffer, here rank 0. Other ranks\' output is untouched.' },
    { id: 'c3', topic: 'coll', kind: 'code', q: 'What is wrong with this input code?',
      code: `if (my_rank == 0) {
    scanf("%d", &n);
    MPI_Bcast(&n, 1, MPI_INT, 0, MPI_COMM_WORLD);
}`,
      options: ['Nothing; only the root process needs to call MPI_Bcast', 'Every rank must call MPI_Bcast, so it belongs after the if', 'The root argument should be 1, since rank 0 does the input', 'scanf must run on every rank, so it belongs outside the if'], answer: 1,
      why: 'A collective involves every process in the communicator. The root sends and the others receive through the same call, so the others must call it too or they never get n.' },
    { id: 'c4', topic: 'coll', kind: 'concept', q: 'Rank 0 has read a 1,000-element array, and each of 10 ranks should work on a different 100-element slice. The best call is ___.',
      options: ['`MPI_Bcast` of the whole array', '`MPI_Scatter`', '`MPI_Gather`', '`MPI_Reduce` with `MPI_SUM`'], answer: 1,
      why: 'Scatter splits the array on the source and gives each rank (including the source) its own chunk. Bcast would send all 1,000 elements to everyone.' },
    { id: 'c5', topic: 'coll', kind: 'concept', q: 'Each rank has computed its slice of a result array, and rank 0 must print the whole array in order. The best call is ___.',
      options: ['`MPI_Scatter`', '`MPI_Allreduce`', '`MPI_Gather` to rank 0', '`MPI_Bcast` from each rank'], answer: 2,
      why: 'Gather collects one chunk from each rank and assembles them in rank order on the destination.' },
    { id: 'c6', topic: 'coll', kind: 'calc', q: 'The MPI trapezoidal rule runs with a = 0, b = 6, n = 600 and 3 processes. Which interval does rank 1 integrate?',
      ctx: 'h = (b − a)/n, local_n = n/comm_sz, local_a = a + my_rank × local_n × h, local_b = local_a + local_n × h.',
      options: ['[1, 2]', '[2, 4]', '[3, 6]', '[0, 2]'], answer: 1,
      why: 'h = 6/600 = 0.01, local_n = 200, local_a = 0 + 1 × 200 × 0.01 = 2, local_b = 2 + 2 = 4.' },
    { id: 'c7', topic: 'coll', kind: 'calc', q: 'Use the trapezoidal rule with n = 2 trapezoids to estimate the area under f(x) = x² from 0 to 2.',
      ctx: 'h = (b − a)/n; area ≈ h [ f(x₀)/2 + f(x₁) + … + f(xₙ)/2 ].',
      options: ['2', '2.67', '3', '4'], answer: 2,
      why: 'h = 1, points 0, 1, 2: 1 × (0/2 + 1 + 4/2) = 3. The true area is 8/3 ≈ 2.67; x² is convex, so trapezoids overestimate.' },
    { id: 'c8', topic: 'coll', kind: 'concept', q: 'Where a function is convex (the chord between two points lies above the curve), each trapezoid ___ the area under the curve.',
      options: ['underestimates', 'overestimates', 'exactly matches', 'can\'t estimate'], answer: 1,
      why: 'The trapezoid\'s top edge is the chord, which lies above a convex curve. For a concave function it underestimates.' },
    { id: 'c9', topic: 'coll', kind: 'calc', q: 'Combining 16 partial sums: rank 0 receiving each one in a loop takes 15 sequential receive-and-add steps. A tree-structured reduction like MPI_Reduce takes about ___.',
      options: ['4', '8', '15', '16'], answer: 0,
      why: 'Each round halves the number of active processes: log₂ 16 = 4 rounds.' },
    { id: 'c10', topic: 'coll', kind: 'concept', q: 'Which statements about MPI collectives are true?',
      options: ['Every process in the communicator must call the collective', 'Collectives take no tag argument', '`MPI_Allreduce` has no destination argument', '`MPI_Reduce` leaves the result on every process', 'In `MPI_Bcast` the root sends and the other ranks call `MPI_Recv`'], answer: [0, 1, 2],
      why: 'Collectives involve all processes and are matched without tags. Reduce leaves the result only on dest; in Bcast every rank, including receivers, calls MPI_Bcast.' },
    { id: 'c11', topic: 'coll', kind: 'code', q: 'In this call, which argument makes the total end up on rank 0?',
      code: 'MPI_Reduce(&local_int, &total_int, 1, MPI_DOUBLE, MPI_SUM, 0, MPI_COMM_WORLD);',
      options: ['The third argument, `1`', 'The fifth argument, `MPI_SUM`', 'The sixth argument, `0`', 'The communicator, `MPI_COMM_WORLD`'], answer: 2,
      why: 'The signature is (input, output, count, datatype, operator, dest_process, communicator). 1 is the count; MPI_SUM is the operation.' },
    { id: 'c12', topic: 'coll', kind: 'concept', q: 'An MPI program needs parameters from rank 0, a long computation over each rank\'s block, and one combined answer on rank 0. Which structure fits best?',
      options: ['Broadcast the parameters once, compute locally, then one MPI_Reduce', 'Send each element to a worker and receive its result straight back', 'Call MPI_Allreduce after every element to keep a running total', 'Have every rank read the parameters from stdin'], answer: 0,
      why: 'Broadcast once, compute locally, combine with one collective: as few messages as possible.' },
    { id: 'c13', topic: 'coll', kind: 'concept', q: 'To find the smallest value held by any rank, with the answer on rank 0, use ___.',
      options: ['`MPI_Reduce` with `MPI_MIN`', '`MPI_Reduce` with `MPI_PROD`', '`MPI_Scatter`', '`MPI_Bcast` with `MPI_MIN`'], answer: 0,
      why: 'MPI_Reduce with the MPI_MIN operator combines one value per rank into the minimum on dest. MPI_Bcast takes no operator.' },
    { id: 'c14', topic: 'coll', kind: 'code', q: 'The trapezoid code computes `local_n = n / comm_sz` with integer division. With n = 1000 and 3 processes, what happens?',
      ctx: 'local_n = n / comm_sz; local_a = a + my_rank × local_n × h; local_b = local_a + local_n × h; h = (b − a)/n.',
      options: ['Nothing; MPI spreads the remainder over the ranks automatically', 'Only 999 trapezoids are computed, so the integral stops short of b', 'Rank 2 picks up the extra trapezoid, doing 334 instead of 333', 'Rank 0 waits forever for a fourth result, so the program deadlocks'], answer: 1,
      why: '3 × 333 = 999 trapezoids cover only [a, a + 999h]. The lecture code assumes comm_sz divides n; full versions use the uneven split from Lecture 2.' },
    { id: 'c15', topic: 'coll', kind: 'concept', q: 'The first MPI trapezoid program ends with rank 0 receiving `comm_sz − 1` partial integrals in a loop. Replacing that loop with `MPI_Reduce` ___.',
      options: ['gives a different total, since MPI_Reduce averages the partial results', 'spreads the combining over many ranks instead of serially on rank 0', 'means every rank, not just rank 0, ends up holding the total', 'only works when comm_sz is a power of two, so the loop is safer'], answer: 1,
      why: 'The loop is a serial bottleneck; MPI_Reduce spreads the combining over several processes (an implementation-tuned tree) and leaves the total only on rank 0. MPI_SUM adds; it doesn\'t average.' },

    /* ===================== GPGPU concepts ===================== */
    { id: 'g1', topic: 'gpu', kind: 'concept', q: 'GPGPU is called heterogeneous computing because ___.',
      options: ['the GPU\'s cores run several different kernels at the same time', 'a CPU host and a GPU device with separate memories work together', 'the program can mix Intel and AMD CPUs in the same job', 'each GPU thread processes a different type of data'], answer: 1,
      why: 'The host program runs on the CPU and launches kernels compiled for the GPU. Pthreads and MPI run on CPU cores only: homogeneous.' },
    { id: 'g2', topic: 'gpu', kind: 'concept', q: 'A student ports a loop over a 1,000-element array to the GPU and it runs slower than on the CPU. The most likely reason is ___.',
      options: ['GPU cores are slower than CPU cores at floating-point arithmetic', 'copying the data to and from the GPU costs more than it saves', 'Warp ran the whole kernel on only one of the GPU\'s cores', 'GPU kernels need an array size that is a power of two'], answer: 1,
      why: 'CPU and GPU have separate memories, so data crosses the bus. For small problems that copy can be the dominant cost.' },
    { id: 'g3', topic: 'gpu', kind: 'concept', q: 'SIMT (single instruction, multiple threads) differs from CPU SIMD in that ___.',
      options: ['many lockstep threads share one fetch/decode, each with its own registers', 'each GPU thread fetches and decodes its own instructions independently', 'a single thread uses very wide registers spread across many lanes', 'it applies different instructions to the same data in each thread'], answer: 0,
      why: 'SIMT: one program counter, multiple register files. SIMD: one thread with one register file of very wide registers.' },
    { id: 'g4', topic: 'gpu', kind: 'code', q: 'Threads in one lockstep group run this kernel body. Roughly how long does the group take?',
      code: `i = wp.tid()
if i % 2 == 0:
    out[i] = pathA(x[i])    # takes time A
else:
    out[i] = pathB(x[i])    # takes time B`,
      options: ['max(A, B): the slower branch sets the pace', 'min(A, B): the faster branch finishes first', 'A + B: the group runs both paths in turn', '(A + B) / 2: half the threads take each path'], answer: 2,
      why: 'Divergent threads in a lockstep group execute both branches in turn, masking inactive lanes, so the divergent code costs the sum of both.' },
    { id: 'g5', topic: 'gpu', kind: 'concept', q: 'Which restriction lets the GPU run a kernel in parallel on every element?',
      options: ['A thread may read only its own element of each input array', 'A thread\'s output must not depend on another thread\'s output', 'Every thread must write its result to the same output element', 'Kernels may only use addition and multiplication operations'], answer: 1,
      why: 'Outputs depend only on kernel inputs. A thread may read any input element but writes its own output independently, so all threads can run at once.' },
    { id: 'g6', topic: 'gpu', kind: 'concept', q: 'In the stream programming model, a stream is ___.',
      options: ['an ordered set of data of one type, often thousands of elements', 'a single GPU thread together with the registers it uses', 'a network connection carrying messages between MPI ranks', 'a file that the host program reads from and the GPU writes to'], answer: 0,
      why: 'Streams are ordered collections of same-typed data (numbers, points, matrices) that kernels operate on.' },
    { id: 'g7', topic: 'gpu', kind: 'concept', q: 'The most typical use of a kernel, evaluating one function on every element of an input stream, is called a ___.',
      options: ['reduction', 'map', 'filter', 'expansion'], answer: 1,
      why: 'Map: one output per input element. Reductions combine elements, filters output a subset, expansions produce more outputs than inputs.' },
    { id: 'g8', topic: 'gpu', kind: 'concept', q: 'Which design choices help a GPU program perform well?',
      options: ['Flat, contiguous data buffers', 'The same amount of work for every thread', 'As few CPU–GPU transfers as possible', 'Lots of data-dependent branching inside each thread', 'Copying results back to the CPU after every element'], answer: [0, 1, 2],
      why: 'The study guide\'s design list: flat contiguous buffers, uniform work, minimal transfers. Branching causes divergence and frequent copies waste bus time.' },
    { id: 'g9', topic: 'gpu', kind: 'calc', q: 'A game renders 1920 × 1080 frames at 60 frames per second. About how many pixel colours must it compute per second?',
      options: ['2 million', '32 million', '120 million', '1.2 billion'], answer: 2,
      why: '1920 × 1080 ≈ 2.07 million pixels × 60 ≈ 124 million per second; the lecture rounds to about 120 million.' },
    { id: 'g10', topic: 'gpu', kind: 'concept', q: 'How do GPUs fit thousands of cores on a chip, compared with the dozens on a CPU?',
      options: ['Each GPU core is simpler, without complex branch and cache logic', 'GPU cores run at much higher clock speeds, so each one is smaller', 'GPUs give each core a larger cache, so cores can be packed densely', 'GPU cores are full CPU cores, just on a physically bigger chip'], answer: 0,
      why: 'GPUs specialize in matrix/vector math and drop general-purpose control hardware, dedicating most transistors to many small processing units.' },
    { id: 'g11', topic: 'gpu', kind: 'concept', q: 'Which GPGPU platform runs only on Nvidia hardware?',
      options: ['OpenCL', 'CUDA', 'MPI', 'Pthreads'], answer: 1,
      why: 'CUDA is Nvidia\'s proprietary platform and the industry favourite. OpenCL is an open standard for many platforms.' },
    { id: 'g12', topic: 'gpu', kind: 'concept', q: 'Which are examples of homogeneous computing?',
      options: ['A Pthreads program on an 8-core CPU', 'An MPI job across a cluster of Intel and AMD x86 machines', 'A Warp program launching kernels on an Nvidia GPU', 'An MPI job that mixes x86 and ARM machines running the same binary'], answer: [0, 1],
      why: 'Pthreads and MPI run on compatible CPU cores. Warp on a GPU is heterogeneous, and one compiled binary won\'t run on both x86 and ARM.' },
    { id: 'g13', topic: 'gpu', kind: 'concept', q: 'On a GPU, multiple SIMT threads run on a shading unit, and dozens of shading units are grouped into a ___.',
      options: ['communicator', 'compute unit', 'vector register', 'process'], answer: 1,
      why: 'Shading units (CUDA cores on Nvidia) are organized into compute units, and a GPU has many compute units.' },

    /* ===================== Warp ===================== */
    { id: 'w1', topic: 'warp', kind: 'code', q: 'A greyscale image is in a Warp array of shape (h, w), and the kernel starts with `i, j = wp.tid()`. Which launch runs one thread per pixel?',
      options: ['`wp.launch(k, dim=h, inputs=[img, out], device=device)`', '`wp.launch(k, dim=(h, w), inputs=[img, out], device=device)`', '`wp.launch(k, dim=(w, h), inputs=[img, out], device=device)`', '`wp.launch(k, inputs=[img, out, (h, w)], device=device)`'], answer: 1,
      why: 'dim is the launch grid. A 2D grid of (h, w) gives each thread one (i, j); (w, h) would swap the ranges and index outside the array whenever h ≠ w. A tuple in inputs= isn\'t a launch size.' },
    { id: 'w2', topic: 'warp', kind: 'code', q: 'What is wrong with this kernel?',
      code: `@wp.kernel
def square(x: wp.array(dtype=float)):
    i = wp.tid()
    return x[i] * x[i]`,
      options: ['Nothing; Warp copies the returned value into the array', 'Kernels can\'t return values; it needs an output array to write', '`wp.tid()` must be passed the array length to get an index', 'Warp kernels can\'t multiply floating-point values together'], answer: 1,
      why: 'Warp kernels write results into one of their array arguments; they don\'t return values.' },
    { id: 'w3', topic: 'warp', kind: 'code', q: 'Why won\'t Warp compile this kernel?',
      code: `@wp.kernel
def scale(src, dst, factor):
    i = wp.tid()
    dst[i] = factor * src[i]`,
      options: ['A kernel needs at least four arguments, including the device', 'Every argument needs a type annotation; Warp is statically typed', 'factor must be a global variable rather than an argument', 'dst must be returned instead of written inside the kernel'], answer: 1,
      why: 'Warp compiles the kernel from its type annotations, e.g. `src: wp.array(dtype=wp.float32)` and `factor: float`.' },
    { id: 'w4', topic: 'warp', kind: 'concept', q: 'A kernel is launched with `dim=npInData.shape` where the shape is (h, w, 3). What does `wp.tid()` return inside it?',
      options: ['One integer from 0 to h·w·3 − 1, the flattened index', 'A tuple of three indices: row, column and channel', 'The name of the device the thread is running on', 'A tuple of two indices, row and column, shared by channels'], answer: 1,
      why: 'For a 3D launch grid, `i, j, k = wp.tid()` gives one index per grid dimension. A 1D launch returns a scalar.' },
    { id: 'w5', topic: 'warp', kind: 'concept', q: 'You run a Warp program with `device="cpu"` in the course Docker container. The kernel runs ___.',
      options: ['in parallel on every CPU core, one thread per core', 'serially on one CPU thread, with the same results as on a GPU', 'on the GPU anyway, if the machine happens to have one', 'only after Warp converts the kernel to OpenCL for the CPU'], answer: 1,
      why: 'Warp\'s CPU mode is a single-threaded serial program (for now). It lets you learn and test GPGPU code without the speedup; "cuda" runs in parallel on Nvidia GPUs.' },
    { id: 'w6', topic: 'warp', kind: 'concept', q: 'Which call allocates an output array with the same shape, dtype and device as `inWarpImage`, filled with zeros?',
      options: ['`wp.array(inWarpImage)`', '`wp.zeros_like(inWarpImage)`', '`inWarpImage.numpy()`', '`np.zeros(inWarpImage.shape)`'], answer: 1,
      why: 'wp.zeros_like copies shape, dtype and device and initializes to zero. np.zeros would make a host array, not a Warp array.' },
    { id: 'w7', topic: 'warp', kind: 'code', q: 'The unsharp-mask kernel needs the constant k. Which is the course\'s way to provide it?',
      options: ['Add a typed argument `k: float` and pass k in `inputs=`', 'Store k in a global Python variable and read it in the kernel', 'Launch with `dim=k`, then read k back from `wp.tid()`', 'Type k into the kernel\'s source and recompile it for each value'], answer: 0,
      why: 'Constants are ordinary typed kernel arguments, read at launch, so k can change without recompiling. dim sets the launch grid, not a value the kernel can use as k.' },
    { id: 'w8', topic: 'warp', kind: 'code', q: 'The kernel is `def scale(src: wp.array(dtype=float), dst: wp.array(dtype=float), factor: float)`. From this launch, Warp builds the kernel\'s argument list as ___.',
      code: 'wp.launch(scale, dim=n, inputs=[src, 2.0], outputs=[dst], device=device)',
      options: ['(src, 2.0, dst), which doesn\'t match the signature\'s order', '(src, dst, 2.0), because Warp matches arguments to parameters by name', '(dst, src, 2.0), because outputs come first', '(src, dst); the 2.0 is dropped because it isn\'t an array'], answer: 0,
      why: 'Warp concatenates inputs= and then outputs= into positional arguments, in order, and doesn\'t match by name. Here the float lands where dst should be. Fix it with inputs=[src, dst, 2.0], or reorder the kernel\'s parameters.' },
    { id: 'w9', topic: 'warp', kind: 'concept', q: 'After `npData = np.asarray(Image.open("logo.png"), dtype=np.float32)`, an RGBA image has shape ___.',
      options: ['(w, h, 4)', '(h, w, 4)', '(4, h, w)', '(h, w)'], answer: 1,
      why: 'NumPy gives (height, width, channels): (h, w, 4) for RGBA, (h, w, 3) for RGB, (h, w) for greyscale.' },
    { id: 'w10', topic: 'warp', kind: 'calc', q: 'A photo is 640 pixels wide and 480 tall, mode RGB. What are `image.size` and `np.asarray(image).shape`?',
      options: ['(640, 480) and (480, 640, 3)', '(480, 640) and (480, 640, 3)', '(640, 480) and (640, 480, 3)', '(480, 640) and (3, 480, 640)'], answer: 0,
      why: 'Pillow\'s size is (width, height); NumPy\'s shape is (height, width, channels). Different orders, so be careful.' },
    { id: 'w11', topic: 'warp', kind: 'concept', q: 'Your 3D filter kernel (one thread per channel) is applied to an RGBA image. What should it do with the alpha channel (k = 3)?',
      options: ['Filter it like the colour channels', 'Copy it from the input unchanged', 'Leave it at 0 in the output', 'Set it to the average of R, G and B'], answer: 1,
      why: 'Filtering transparency is meaningless. Filter only k < 3 and copy alpha through; leaving it at 0 saves a fully transparent image.' },
    { id: 'w12', topic: 'warp', kind: 'concept', q: 'After sharpening, some output values are above 255 or below 0. What happens if you convert them with `np.uint8(npOut)` without clipping first?',
      options: ['NumPy clamps them to 0 and 255 automatically', 'They wrap to wrong values, causing salt-and-pepper along edges', 'NumPy raises an OverflowError and no image is saved', 'NumPy rescales the whole image so its values fit in 0–255'], answer: 1,
      why: 'np.uint8 does not clamp (Lecture 18): out-of-range values wrap, so 270 can become 14, a dark pixel where a bright one belongs. Unsharp masking overshoots at every strong edge, so use np.uint8(np.clip(np.rint(x), 0, 255)).' },
    { id: 'w13', topic: 'warp', kind: 'code', q: 'On a CUDA device, what does this measure?',
      code: `t0 = time.time()
wp.launch(kernel, dim=n, inputs=[a, out], device="cuda")
t1 = time.time()`,
      options: ['The kernel\'s full run time, from launch to completion', 'Mostly just the launch, since CUDA launches are asynchronous', 'The upload of the inputs plus the kernel\'s run time', 'Only the time to compile the kernel on its first launch'], answer: 1,
      why: 'wp.launch returns before the work is done. Use wp.ScopedTimer(name, synchronize=True), warm up first (the first launch compiles), and time upload, kernel and download separately.' },
    { id: 'w14', topic: 'warp', kind: 'code', q: 'A greyscale image goes through the pipeline below. Which step is needed before `Image.fromarray(...)`?',
      code: `npIn = np.asarray(image, dtype=np.float32)     # (h, w)
npIn = npIn[:, :, np.newaxis]                    # (h, w, 1)
# ... Warp kernel runs ...
npOut = outWarp.numpy()                          # (h, w, 1)`,
      options: ['Transpose the array to (w, h, 1) to match `image.size`', 'Remove the channel axis: `npOut = npOut[:, :, 0]`', 'Add another axis so the shape becomes (h, w, 1, 1)', 'Nothing; PIL builds a greyscale image from (h, w, 1)'], answer: 1,
      why: 'The channel axis lets one 3D kernel handle every mode, but PIL won\'t build an image from (h, w, 1), so drop it for mode L.' },
    { id: 'w15', topic: 'warp', kind: 'concept', q: 'Which of these belong in the course\'s PIL → Warp → PIL image pipeline?',
      options: ['`np.asarray(image, dtype=np.float32)`', '`wp.array(npInData, dtype=wp.float32, device=device)`', '`wp.zeros_like(inWarpImage)` for the output', '`outWarpImage.numpy()` before building the output image', 'Passing the Warp array directly to `Image.fromarray`'], answer: [0, 1, 2, 3],
      why: 'PIL → NumPy float32 → Warp array, allocate output, launch, back to NumPy, clip/round/uint8, then Image.fromarray. PIL needs a NumPy array, not a Warp array.' },
    { id: 'w16', topic: 'warp', kind: 'code', q: 'Why does this kernel need no locks or barriers?', code: BLUR,
      options: ['Warp puts a lock on every array a kernel writes to', 'Each thread writes only its own output cell and reads only input', 'Warp runs only one thread at a time on each array', 'The border threads return early, before reading neighbours'], answer: 1,
      why: 'No two threads write the same location, and nobody reads outputImage, so there is no race.' },
    { id: 'w17', topic: 'warp', kind: 'calc', q: 'On a 144 MB image, a sharpen kernel takes 9 ms on the GPU and 5.2 s on one CPU thread; uploading and downloading take about 132 ms. The end-to-end speedup is about ___.',
      options: ['555×', '37×', '5×', '1×'], answer: 1,
      why: 'GPU end to end ≈ 132 + 9 = 141 ms; 5200 / 141 ≈ 37×. The kernel alone is ~555× faster, but copying dominates.' },
    { id: 'w18', topic: 'warp', kind: 'concept', q: 'You time a Warp kernel for the very first time and it takes several seconds. The likely reason is ___.',
      options: ['the first launch of a module compiles it', 'Warp runs the first launch on the CPU', 'the GPU is warming up its clock', 'wp.tid() is slow on first use'], answer: 0,
      why: 'Warp JIT-compiles a module on first launch (seconds). Run once before timing; it isn\'t recompiled if the code hasn\'t changed.' },
    { id: 'w19', topic: 'warp', kind: 'concept', q: 'On the same 144 MB image, a median filter gets ~134× end-to-end speedup but a sharpen filter only ~37×. Why?',
      options: ['The median filter moves less data across the bus', 'The median filter does more computation per byte moved', 'The sharpen filter ran on the CPU instead of the GPU', 'Sharpening causes branch divergence in every lockstep group'], answer: 1,
      why: 'Both move the same 144 MB. The more work per byte, the better the GPU looks; a cheap 3×3 sharpen leaves the GPU mostly waiting on the bus.' },
    { id: 'w20', topic: 'warp', kind: 'code', q: 'What does this program print?', code: ADD_KERNEL + `

x = wp.array(np.array([1, 2, 3], dtype=np.float32), dtype=float, device="cpu")
y = wp.array(np.array([10, 20, 30], dtype=np.float32), dtype=float, device="cpu")
z = wp.zeros(3, dtype=float, device="cpu")
wp.launch(addArrays, dim=2, inputs=[x, y, z], device="cpu")
print(z.numpy())`,
      options: ['[11. 22. 33.]', '[11. 22.  0.]', '[ 0.  0.  0.]', 'An error, because dim must equal the array length'], answer: 1,
      why: 'dim is the launch grid: only threads 0 and 1 run, so z[2] keeps its zero. dim and the array length coincide only when you choose them to.' },

    /* ===================== Image processing ===================== */
    { id: 'i1', topic: 'img', kind: 'concept', q: 'A 3 × 3 smoothing kernel has every weight equal to 1/16 instead of 1/9. Applied to an image, it ___.',
      options: ['blurs exactly like the 1/9 mean filter, since the weights are equal', 'makes it darker, because the weights sum to 9/16 instead of 1', 'makes it about 16 times brighter, so most pixels clip to 255', 'sharpens it, because smaller weights emphasize the centre'], answer: 1,
      why: 'A smoothing kernel must sum to 1 to preserve mean intensity. Weights summing to 0.5625 scale every flat area to about 56% of its brightness.' },
    { id: 'i2', topic: 'img', kind: 'calc', q: 'A 3 × 3 mean filter is centred on a pixel whose neighbourhood is shown. The output pixel is ___.',
      code: `10  20  30
40  50  60
70  80  90`,
      options: ['50', '450', '90', '45'], answer: 0,
      why: 'Sum = 450; 450 / 9 = 50.' },
    { id: 'i3', topic: 'img', kind: 'calc', q: 'The kernel below is applied in a flat region where every pixel is 100. The output is ___.',
      code: `−1 −1 −1
−1  8 −1
−1 −1 −1`,
      options: ['100', '800', '0', '−100'], answer: 2,
      why: '8 × 100 − 8 × 100 = 0. A high-pass kernel sums to zero, so constant areas give zero.' },
    { id: 'i4', topic: 'img', kind: 'calc', q: 'The same −1/8 high-pass kernel is centred on the middle pixel of this neighbourhood at a vertical edge. Before clipping, the result is ___.',
      code: `Kernel:          Neighbourhood:
−1 −1 −1         0  90  90
−1  8 −1         0  90  90
−1 −1 −1         0  90  90`,
      options: ['0', '270', '90', '720'], answer: 1,
      why: '8 × 90 − (0 + 90 + 90 + 0 + 90 + 0 + 90 + 90) = 720 − 450 = 270, a large response at the edge. Saved as 8-bit it clips to 255.' },
    { id: 'i5', topic: 'img', kind: 'calc', q: 'A 5 × 5 kernel is applied to a 512 × 512 image using truncation of the image. The output size is ___.',
      options: ['512 × 512', '510 × 510', '508 × 508', '507 × 507'], answer: 2,
      why: 'A 5 × 5 kernel has half-size 2, so the processable region is (M − 4) × (N − 4) = 508 × 508.' },
    { id: 'i6', topic: 'img', kind: 'concept', q: 'Which border strategies produce an output the same size as the input?',
      options: ['Copying the input pixels at the border', 'Reflection', 'Truncation of the kernel', 'Truncation of the image'], answer: [0, 1, 2],
      why: 'Only truncation of the image drops the border, making the output smaller and offset.' },
    { id: 'i7', topic: 'img', kind: 'concept', q: 'Lecture 16 calls which border strategy "the most useful option"?',
      options: ['Copying input pixels', 'Reflected indexing', 'Circular indexing', 'Truncation of the image'], answer: 1,
      why: 'Reflection mirrors out-of-range indices back into the image, so every pixel is processed with plausible neighbours. Circular indexing is rarely used.' },
    { id: 'i8', topic: 'img', kind: 'concept', q: 'With the "copy of input pixels" border strategy, the output image ___.',
      options: ['is smaller than the input, offset by the kernel radius', 'has a frame of unprocessed pixels copied from the input', 'wraps around, so each edge uses pixels from the opposite side', 'uses specially modified kernels for the border pixels'], answer: 1,
      why: 'Where convolution isn\'t possible, the input pixel is copied, so the border is left unprocessed.' },
    { id: 'i9', topic: 'img', kind: 'calc', q: 'Unsharp masking with k = 0.5: a pixel has original value f = 100 and blurred value 80. The sharpened value is ___.',
      ctx: 'g = f − blur(f); f_UM = f + k·g.',
      options: ['110', '120', '90', '140'], answer: 0,
      why: 'g = 100 − 80 = 20; f_UM = 100 + 0.5 × 20 = 110.' },
    { id: 'i10', topic: 'img', kind: 'concept', q: 'In unsharp masking f_UM = f + k·g, using k greater than 1 ___.',
      options: ['blurs the image instead of sharpening it', 'makes it a high-boost filter', 'has no effect beyond what k = 1 gives', 'turns it into a median filter for noise'], answer: 1,
      why: 'Typical k is 0.2–0.7; above 1 it\'s called a high-boost filter.' },
    { id: 'i11', topic: 'img', kind: 'concept', q: 'Which are inherent limitations of unsharp masking?',
      options: ['It amplifies noise, since it emphasizes high frequencies', 'It overshoots at sharp edges', 'It can only be applied to greyscale images', 'It removes impulse noise along with thin lines'], answer: [0, 1],
      why: 'Lecture 17 names noise sensitivity and excessive overshoot. Colour images work channel by channel; removing thin lines is the median filter\'s weakness.' },
    { id: 'i12', topic: 'img', kind: 'calc', q: 'A 3 × 3 median filter is centred on the 255 (an impulse-noise pixel). The output is ___.',
      code: `12  15  14
13 255  16
15  14  13`,
      options: ['41', '255', '14', '15'], answer: 2,
      why: 'Sorted: 12, 13, 13, 14, 14, 15, 15, 16, 255. The middle (5th) value is 14. The mean would be about 41, still polluted by the noise.' },
    { id: 'i13', topic: 'img', kind: 'concept', q: 'A greyscale image has a genuine one-pixel-wide bright line. After a 3 × 3 median filter, the line ___.',
      options: ['is preserved exactly, since median filters preserve edges', 'is mostly removed, since it is under half of each neighbourhood', 'becomes about three pixels wide, as after a 3 × 3 mean', 'becomes brighter, since the median picks the larger values'], answer: 1,
      why: 'The line covers 3 of 9 pixels in a neighbourhood, so the median comes from the background. Median filtering is non-specific: small details go with the noise.' },
    { id: 'i14', topic: 'img', kind: 'concept', q: 'Increasing σ in a Gaussian filter ___.',
      options: ['blurs more, and the kernel gets bigger', 'blurs less, and the kernel gets smaller', 'makes the filter directional', 'turns it into a median filter'], answer: 0,
      why: 'Larger σ spreads the weights wider (the kernel extends to ±⌊3σ⌋), so it smooths more. It stays rotationally symmetric.' },
    { id: 'i15', topic: 'img', kind: 'concept', q: 'The coefficients of a normalized smoothing kernel sum to ___, and those of a high-pass sharpening kernel sum to ___.',
      options: ['1; 0', '0; 1', '9; 0', '1; 1'], answer: 0,
      why: 'Smoothing preserves mean intensity (sum 1). High-pass gives zero in flat regions (sum 0).' },
    { id: 'i16', topic: 'img', kind: 'concept', q: 'Which statements about median filtering are true?',
      options: ['It removes impulse noise covering less than half the neighbourhood', 'It keeps edges sharper than averaging does', 'It is a non-linear rank (order-statistic) filter', 'It preserves one-pixel-wide lines and other fine detail', 'It is a weighted average whose weights sum to 1'], answer: [0, 1, 2],
      why: 'It picks the middle sorted value, so it isn\'t an average. That kills impulses and keeps edges, but it also removes structures smaller than half the window.' },
    { id: 'i17', topic: 'img', kind: 'calc', q: 'A 5 × 5 circular (pill-box) smoothing kernel has 1s everywhere except its four corners, which are 0. Its normalization factor is ___.',
      options: ['1/25', '1/21', '1/20', '1/16'], answer: 1,
      why: '25 − 4 = 21 ones, so the kernel is scaled by 1/21.' },
    { id: 'i18', topic: 'img', kind: 'calc', q: 'A Gaussian kernel uses i, j from −⌊3σ⌋ to ⌊3σ⌋. With σ = 2, the kernel is ___.',
      options: ['7 × 7', '9 × 9', '13 × 13', '6 × 6'], answer: 2,
      why: '⌊3σ⌋ = 6, so indices −6 … 6: 13 values per side.' },
    { id: 'i19', topic: 'img', kind: 'concept', q: 'The 4-neighbours of pixel (x, y) are ___.',
      options: ['(x±1, y) and (x, y±1)', 'the four diagonal pixels', 'all 8 surrounding pixels', 'the pixels two steps away in each direction'], answer: 0,
      why: 'Horizontal and vertical neighbours. Adding the four diagonals gives the 8-neighbours.' },
    { id: 'i20', topic: 'img', kind: 'concept', q: 'Why is a mean filter effective against random noise but bad for edges?',
      options: ['Both are sharp intensity changes, and averaging smooths both', 'It only changes pixels near the image border, where edges are', 'It increases contrast at edges while flattening the noise', 'It ignores neighbours that differ much from the centre pixel'], answer: 0,
      why: 'Smoothing removes sharp transitions, which is exactly what noise and edges have in common.' },

    /* ===================== Compare ===================== */
    { id: 'x1', topic: 'compare', kind: 'concept', q: 'Many threads must make frequent, fine-grained updates to one shared hash table on a single machine. The best fit is ___.',
      options: ['Pthreads', 'MPI', 'Warp', 'None of them can do this'], answer: 0,
      why: 'Fine-grained updates to shared state suit Pthreads with careful synchronization. MPI would need a message per update; GPU kernels must not depend on each other\'s outputs.' },
    { id: 'x2', topic: 'compare', kind: 'concept', q: '10,000 independent simulations must run across 50 networked machines, with one summary at the end. The best fit is ___.',
      options: ['Pthreads', 'MPI', 'Warp', 'A single-threaded program'], answer: 1,
      why: 'Large independent chunks with modest communication across machines is MPI\'s sweet spot.' },
    { id: 'x3', topic: 'compare', kind: 'concept', q: 'A per-pixel filter must run on many 24-megapixel photos on a machine with an Nvidia GPU. The best fit is ___.',
      options: ['Pthreads', 'MPI', 'Warp', 'MPI_Bcast'], answer: 2,
      why: 'A large, uniform, data-parallel map with enough work per element is the GPU\'s best case.' },
    { id: 'x4', topic: 'compare', kind: 'concept', q: 'Which approach has built-in collective operations such as broadcast and all-reduce?',
      options: ['Pthreads', 'MPI', 'Warp', 'All three'], answer: 1,
      why: 'MPI has rich collectives. Pthreads has barriers but reductions are DIY; Warp offers kernel launches over N elements.' },
    { id: 'x5', topic: 'compare', kind: 'concept', q: 'Which are common pitfalls of GPU programming with Warp?',
      options: ['Copying data between host and device too often', 'Non-contiguous data', 'Problems too small to pay for the copies', 'Mismatched message tags between ranks'], answer: [0, 1, 2],
      why: 'The guide\'s Warp pitfalls. Mismatched tags are an MPI pitfall.' },
    { id: 'x6', topic: 'compare', kind: 'concept', q: 'How does Warp\'s memory model differ from Pthreads\'?',
      options: ['Warp has separate host and device memory, with explicit copies', 'Warp shares one address space between the CPU and GPU, like threads', 'Warp kernels pass messages to each other, like MPI ranks', 'There\'s no difference: both read the same main memory directly'], answer: 0,
      why: 'Pthreads shares one address space. Warp kernels operate on GPU device memory, filled by explicit copies.' },
    { id: 'x7', topic: 'compare', kind: 'concept', q: 'Oversubscription (more threads than cores) is a pitfall listed for ___.',
      options: ['Pthreads', 'MPI', 'Warp', 'Image convolution'], answer: 0,
      why: 'The guide lists data races, deadlocks and oversubscription for Pthreads; recall busy-waiting falling apart with more threads than cores.' },
    { id: 'x8', topic: 'compare', kind: 'concept', q: 'Which are MPI pitfalls?',
      options: ['Mismatched tags or ranks', 'Deadlocks', 'Frequent small messages between machines', 'Branch divergence within a compute unit'], answer: [0, 1, 2],
      why: 'Divergence is a GPU issue; the other three are the guide\'s MPI pitfalls.' },
    { id: 'x9', topic: 'compare', kind: 'concept', q: 'How does each approach identify "which piece of work am I?"',
      options: ['Pthreads: a rank you pass in; MPI: `MPI_Comm_rank`; Warp: `wp.tid()`', 'All three call `MPI_Comm_rank` to get a rank from the runtime', 'Pthreads: `wp.tid()`; MPI: `pthread_self()`; Warp: a message tag', 'Pthreads: `pthread_self()`; MPI: the tag; Warp: the device name'], answer: 0,
      why: 'Each needs a per-worker index to pick its data: a rank argument to the thread function, the MPI rank, or the Warp thread index.' },

    /* ===================== Study guide practice set (verbatim) ===================== */
    { id: 'sg1', topic: 'guide', kind: 'concept', q: 'A program uses MPI on p processes to compute the sum of g(a[i]) over a large array. The processes run on different machines connected by a slow network, so every message is expensive. Which design is the best fit?',
      options: ['Rank 0 sends each element to a worker, and the worker sends that element\'s result straight back.', 'Every rank reads the whole array from stdin and computes the full sum itself, so no messages are needed.', 'Each rank works on its own block and calls MPI_Allreduce after every element to keep a running total.', 'Each rank computes a local sum over its own block, and one MPI_Reduce combines the local sums on rank 0.'], answer: 3,
      why: 'One collective at the end means the fewest messages. A sends two messages per element; B breaks the stdin rule and does no parallel work; C sends a collective per element.' },
    { id: 'sg2', topic: 'guide', kind: 'code', q: 'A manager process receives a result from any worker with the call below. The result may be shorter than 256 characters. How does the manager find out which worker sent it, and how many characters it contains?',
      code: 'MPI_Recv(buf, 256, MPI_CHAR, MPI_ANY_SOURCE, TAG_RESULT, MPI_COMM_WORLD, &status);',
      options: ['It reads status.MPI_SOURCE, and calls MPI_Get_count(&status, MPI_CHAR, &n) for the number of characters.', 'MPI_Recv returns the number of characters, and MPI overwrites the source argument with the sender\'s rank.', 'It reads status.MPI_TAG, which MPI sets to the sender\'s rank, and uses sizeof(buf) for the number of characters.', 'It cannot find the sender, so each worker must include its rank in the message, and sizeof(buf) gives the count.'], answer: 0,
      why: 'status.MPI_SOURCE is the sender; MPI_Get_count gives the element count. MPI_Recv returns an error code, MPI_TAG is the tag, and sizeof(buf) is the capacity.' },
    { id: 'sg3', topic: 'guide', kind: 'concept', q: 'A Warp kernel needs to run over an array of N elements on an Nvidia GPU. What do you pass to wp.launch?',
      options: ['Only the kernel, because Warp works out the number of threads, the arguments, and the device on its own.', 'The kernel, its arguments, and the number of GPU cores to use, since Warp splits the array among them.', 'The kernel, dim=N, the kernel\'s arguments (in inputs=, in order), and device="cuda".', 'The kernel\'s arguments and the device, since Warp finds the right kernel from the arguments\' types.'], answer: 2,
      why: 'wp.launch(kernel, dim=N, inputs=[...], device="cuda"): one thread per element; arguments in order.' },
    { id: 'sg4', topic: 'guide', kind: 'concept', q: 'A student writes a 3 x 3 mean filter but forgets to divide by 9, so every kernel weight is 1 instead of 1/9. What happens when this filter is applied to an 8-bit greyscale image, and the output is clipped to 0-255?',
      options: ['The image is blurred exactly as before, because only the relative sizes of the weights matter.', 'The image becomes about nine times brighter, so most of it ends up at 255 after clipping.', 'The image is sharpened instead of blurred, because the larger weights emphasize the edges.', 'Only the border pixels change, because the interior pixels are averaged either way.'], answer: 1,
      why: 'Each output is the sum of 9 pixels, about 9× the average, so anything brighter than about 28 saturates at 255.' },
    { id: 'sg5', topic: 'guide', kind: 'calc', q: 'A program takes 100 s on one core, 40 s on 4 cores, and 25 s on 8 cores. Which statement about its speedup and efficiency is correct?',
      options: ['Speedup grows from 2.5 to 4, and efficiency drops from 0.625 to 0.5.', 'Speedup grows from 2.5 to 4, and efficiency rises from 0.5 to 0.625.', 'Speedup grows from 2.5 to 4, and efficiency drops from 0.4 to 0.25.', 'Speedup grows from 2.5 to 4, which is linear, so efficiency stays at 1.'], answer: 0,
      why: 'S = 100/40 = 2.5 and 100/25 = 4; E = 2.5/4 = 0.625 and 4/8 = 0.5.' }
  ];
})();
