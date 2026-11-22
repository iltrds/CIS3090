/* Midterm 2 Practice Exam A: 27 questions not used in the topic quizzes.
   Same schema as data/bank.js; answer arrays mark "select all that apply" questions. */
(function () {
  const amdahl = (a, ps) => ps.map(p => Math.round(100 / ((1 - a) / p + a)) / 100);
  const P9 = [1, 2, 4, 8, 16, 32, 64, 128, 256];

  window.EXAM_A = [
    { id: 'e1', topic: 'perf', kind: 'calc', q: 'A simulation takes 120 s on one core and 15 s on 10 cores. Its speedup and efficiency are ___.',
      options: ['S = 8, E = 0.8', 'S = 10, E = 1', 'S = 8, E = 1.25', 'S = 0.125, E = 0.0125'], answer: 0,
      why: 'S = 120/15 = 8; E = 8/10 = 0.8.' },
    { id: 'e2', topic: 'perf', kind: 'calc', q: 'A program\'s serial fraction is a = 0.25. By Amdahl\'s law, its speedup on 3 cores is ___.',
      options: ['3', '2.25', '4', '2'], answer: 3,
      why: 'S = 1 / ((1 − 0.25)/3 + 0.25) = 1 / (0.25 + 0.25) = 2.' },
    { id: 'e3', topic: 'perf', kind: 'graph', q: 'The chart shows a program\'s run time. Its speedup on 8 cores is ___.',
      chart: { type: 'line', title: 'Run time of an image filter', note: 'Median of 10 runs at each core count',
        x: ['1', '2', '4', '8', '16'], xLabel: 'cores p', yLabel: 'run time (s)', yMax: 80,
        series: [{ name: 'run time', style: 'accent', values: [64, 33, 17.5, 10, 7], labels: 'above' }] },
      options: ['10', '8', '6.4', '0.8'], answer: 2,
      why: 'S = T(1)/T(8) = 64/10 = 6.4 (and E = 6.4/8 = 0.8, which is a different quantity).' },
    { id: 'e4', topic: 'perf', kind: 'concept', q: 'Which of these typically make efficiency fall as p grows?',
      options: ['Thread-management overhead that grows with the number of threads', 'A fixed serial fraction of the program', 'More contention for a shared mutex', 'Growing the problem size along with p'], answer: [0, 1, 2],
      why: 'Growing overheads and a fixed serial part both shrink each core\'s useful share. Growing the problem usually raises efficiency, since overhead grows more slowly than the work.' },
    { id: 'e5', topic: 'perf', kind: 'graph', q: 'This program parallelizes perfectly except for its serial part. Using Amdahl\'s law, its serial fraction is about ___.',
      chart: { type: 'line', title: 'Speedup as cores double', note: 'The curve flattens out',
        x: P9.map(String), xLabel: 'cores p', yLabel: 'speedup S', yMax: 6,
        series: [{ name: 'speedup', style: 'accent', values: amdahl(0.2, P9) }] },
      options: ['0.02', '0.2', '0.5', '0.8'], answer: 1,
      why: 'The speedup levels off near 5, and the limit is 1/a, so a ≈ 1/5 = 0.2.' },
    { id: 'e6', topic: 'arch', kind: 'concept', q: 'An x86 SSE instruction adds four pairs of floats at once, using one instruction. In Flynn\'s taxonomy this is ___.',
      options: ['SISD', 'SIMD', 'MISD', 'MIMD'], answer: 1,
      why: 'One instruction applied to multiple data elements: SIMD, the same idea as a vector processor.' },
    { id: 'e7', topic: 'arch', kind: 'concept', q: 'Which are drawbacks of vector processors?',
      options: ['They work poorly with irregular data structures', 'They are hard to scale, since longer vectors aren\'t very useful', 'Compilers can\'t vectorize any code automatically', 'They have low memory bandwidth'], answer: [0, 1],
      why: 'Lecture 14\'s two disadvantages. Compilers are good at vectorizing, and high memory bandwidth is a benefit.' },
    { id: 'e8', topic: 'arch', kind: 'concept', q: 'An image is stored as an array of pointers, one separately allocated row per pointer. Why is that a problem for a GPU program?',
      options: ['GPUs can\'t store floating-point data', 'The rows aren\'t contiguous, so the image can\'t be copied to the device as one block', 'Pointer arrays are slower to allocate', 'The GPU reads rows in reverse order'], answer: 1,
      why: 'One flat, contiguous buffer moves in a single transfer and gives neighbouring threads neighbouring addresses. Separate rows need one copy each or a packing step.' },
    { id: 'e9', topic: 'mpi', kind: 'code', q: 'What happens when this runs?',
      ctx: 'my_comm is a communicator that contains ranks 0 and 1 of MPI_COMM_WORLD.',
      code: `if (my_rank == 1)
    MPI_Send(&x, 1, MPI_INT, 0, 5, my_comm);
else if (my_rank == 0)
    MPI_Recv(&x, 1, MPI_INT, 1, 5, MPI_COMM_WORLD, MPI_STATUS_IGNORE);`,
      options: ['Rank 0 receives x, because source and tag match', 'Rank 0\'s receive never matches, because the communicators differ', 'MPI uses whichever communicator is larger', 'It works only if both ranks use MPI_ANY_TAG'], answer: 1,
      why: 'Communicator, source and tag must all agree. A message sent on my_comm can\'t be received on MPI_COMM_WORLD, so rank 0 hangs.' },
    { id: 'e10', topic: 'mpi', kind: 'code', q: 'Workers finish in an unpredictable order. Why does the manager use `MPI_ANY_SOURCE` here instead of receiving from rank 1, then 2, and so on?',
      code: `for (int i = 1; i < comm_sz; i++) {
    MPI_Recv(result, 100, MPI_DOUBLE, MPI_ANY_SOURCE, TAG_RESULT,
             MPI_COMM_WORLD, &status);
    Process_result(result, status.MPI_SOURCE);
}`,
      options: ['It handles each result as soon as any worker finishes, instead of waiting on a slow rank 1', 'MPI_ANY_SOURCE receives every worker\'s result in one call', 'It guarantees results arrive in rank order', 'Workers can\'t name rank 0 as a destination otherwise'], answer: 0,
      why: 'With a fixed source, a fast worker\'s result waits until every lower rank has reported. MPI_ANY_SOURCE takes them in completion order; status.MPI_SOURCE says who sent each.' },
    { id: 'e11', topic: 'mpi', kind: 'concept', q: 'Which statements about `MPI_Recv` are true?',
      options: ['It blocks until a matching message arrives', 'Its count argument is the capacity of the receive buffer', 'It can use MPI_ANY_TAG to accept any tag', 'Its return value is the number of elements received', 'It accepts a message from another communicator if the tag matches'], answer: [0, 1, 2],
      why: 'MPI_Recv returns an error code (use MPI_Get_count for the count), and communicators must match exactly.' },
    { id: 'e12', topic: 'mpi', kind: 'code', q: 'With `comm_sz = 5`, how many `MPI_Send` calls does rank 0 make in this function?',
      code: `if (my_rank == 0) {
    scanf("%lf %lf %d", a_p, b_p, n_p);
    for (dest = 1; dest < comm_sz; dest++) {
        MPI_Send(a_p, 1, MPI_DOUBLE, dest, 0, MPI_COMM_WORLD);
        MPI_Send(b_p, 1, MPI_DOUBLE, dest, 0, MPI_COMM_WORLD);
        MPI_Send(n_p, 1, MPI_INT,    dest, 0, MPI_COMM_WORLD);
    }
} else { /* three matching MPI_Recv calls from rank 0 */ }`,
      options: ['3', '5', '12', '15'], answer: 2,
      why: '3 values to each of the 4 other ranks: 12 sends. Three MPI_Bcast calls would replace them.' },
    { id: 'e13', topic: 'mpi', kind: 'concept', q: 'In that same function, a, b and n are all sent with tag 0, yet each receiving rank always gets them into the right variables. Why?',
      options: ['MPI sorts messages by data type', 'Messages from one sender to one receiver are nonovertaking, so they arrive in the order sent', 'MPI_DOUBLE messages are always delivered before MPI_INT ones', 'It isn\'t safe; the values may be swapped'], answer: 1,
      why: 'Nonovertaking: the receiver\'s three receives from rank 0 match the three sends in order.' },
    { id: 'e14', topic: 'compare', kind: 'concept', q: 'In which approaches must the programmer explicitly move data between separate memories before computing on it?',
      options: ['MPI', 'Warp', 'Pthreads'], answer: [0, 1],
      why: 'MPI processes share nothing and exchange messages; Warp copies data between host and device memory. Pthreads threads share one address space.' },
    { id: 'e15', topic: 'coll', kind: 'concept', q: 'Calling `MPI_Allreduce` gives the same final state as ___.',
      options: ['MPI_Reduce to rank 0 followed by MPI_Bcast from rank 0', 'MPI_Scatter followed by MPI_Gather', 'MPI_Bcast followed by MPI_Reduce', 'One MPI_Send from every rank to every other rank, with no combining'], answer: 0,
      why: 'Allreduce combines the values and gives everyone the result: a reduce followed by a broadcast, as drawn in Lecture 10.' },
    { id: 'e16', topic: 'coll', kind: 'code', q: 'Rank 0 holds `int all[400]`, and 4 ranks should each get 100 elements. What should go in the blanks?',
      code: 'MPI_Scatter(all, ___, MPI_INT, mine, ___, MPI_INT, 0, MPI_COMM_WORLD);',
      options: ['400 and 100', '100 and 100', '400 and 400', '1 and 100'], answer: 1,
      why: 'Both counts are per process: each rank is sent, and receives, 100 elements.' },
    { id: 'e17', topic: 'coll', kind: 'calc', q: 'The MPI trapezoidal rule runs with a = 1, b = 5, n = 8 and 4 processes. Which interval does rank 3 integrate?',
      ctx: 'h = (b − a)/n, local_n = n/comm_sz, local_a = a + my_rank × local_n × h, local_b = local_a + local_n × h.',
      options: ['[4, 5]', '[3.5, 5]', '[4, 6]', '[1, 2]'], answer: 0,
      why: 'h = 4/8 = 0.5, local_n = 2, local_a = 1 + 3 × 2 × 0.5 = 4, local_b = 4 + 1 = 5.' },
    { id: 'e18', topic: 'coll', kind: 'code', q: 'Four ranks run this. Which statements are true afterwards?',
      code: 'MPI_Bcast(&x, 1, MPI_INT, 2, MPI_COMM_WORLD);',
      options: ['Every rank holds the value rank 2 had in x', 'Rank 2 is the root', 'All four ranks called MPI_Bcast', 'Only rank 2 holds a value in x'], answer: [0, 1, 2],
      why: 'The fourth argument is the root, which sends; every rank calls the collective and ends up with the root\'s value.' },
    { id: 'e19', topic: 'gpu', kind: 'code', q: 'Why does this kernel run slowly on a GPU when the values in `x` are mixed?',
      code: `@wp.kernel
def f(x: wp.array(dtype=float), out: wp.array(dtype=float)):
    i = wp.tid()
    if x[i] > 0.5:
        out[i] = expensive(x[i])
    else:
        out[i] = 0.0`,
      options: ['Threads in a lockstep group that take different branches run both paths, so the group always pays for `expensive`', 'Kernels can\'t contain if statements', 'Each thread must wait for the previous thread\'s output', 'The CPU executes the else branch'], answer: 0,
      why: 'Branch divergence: lanes are masked off rather than skipped. Uniform work per thread avoids it.' },
    { id: 'e20', topic: 'gpu', kind: 'concept', q: 'A Warp kernel launched with `device="cuda"` reads its input array from ___.',
      options: ['the CPU\'s main memory, directly', 'GPU device memory, after the array was copied there', 'a file on disk', 'another kernel\'s return value'], answer: 1,
      why: 'Host and device have separate memories. wp.array(..., device="cuda") copies the data to the GPU, and kernels work on device memory.' },
    { id: 'e21', topic: 'warp', kind: 'code', q: 'Which launch correctly passes the box-filter radius as 2?',
      code: `@wp.kernel
def box(src: wp.array3d(dtype=wp.float32),
        dst: wp.array3d(dtype=wp.float32),
        radius: int):
    i, j, k = wp.tid()
    ...`,
      options: ['`wp.launch(box, dim=src.shape, inputs=[src, dst, 2], device=device)`', '`wp.launch(box, dim=src.shape, inputs=[2, src, dst], device=device)`', '`wp.launch(box, dim=2, inputs=[src, dst], device=device)`', '`box.radius = 2` before `wp.launch(box, inputs=[src, dst])`'], answer: 0,
      why: 'Constants are typed kernel arguments passed in order with the arrays. dim is the launch grid, not a constant.' },
    { id: 'e22', topic: 'warp', kind: 'code', q: 'This 3D filter kernel is launched over an RGBA image of shape (h, w, 4). Which body is correct?',
      code: `i, j, k = wp.tid()
# option body goes here`,
      options: ['Filter every channel, including k = 3', 'If k < 3, filter; otherwise copy the input value through unchanged', 'If k < 3, filter; otherwise do nothing', 'If k == 3, filter; otherwise copy'], answer: 1,
      why: 'Alpha (k = 3) must be copied. Doing nothing leaves it 0 in a wp.zeros_like output, which saves a fully transparent image.' },
    { id: 'e23', topic: 'warp', kind: 'code', q: '`npOut` holds a sharpened image as float32 values, some below 0 and some above 255. Which line builds the output image correctly?',
      options: ['`Image.fromarray(np.uint8(npOut))`', '`Image.fromarray(np.uint8(np.clip(np.rint(npOut), 0, 255)))`', '`Image.fromarray(npOut)`', '`Image.fromarray(np.clip(npOut, 0, 1))`'], answer: 1,
      why: 'Round, clip to 0–255, then convert to uint8. Without clipping, uint8 wraps out-of-range values and creates salt-and-pepper along edges.' },
    { id: 'e24', topic: 'warp', kind: 'concept', q: 'Which statements about Warp kernels are true?',
      options: ['Every argument needs a type annotation', 'Results are written into array arguments', '`wp.tid()` gives each thread its index in the launch grid', 'A kernel can return a value to the host', 'With `device="cpu"` the kernel runs in parallel on all CPU cores'], answer: [0, 1, 2],
      why: 'Kernels are statically typed and don\'t return values. On the CPU, Warp currently runs kernels serially.' },
    { id: 'e25', topic: 'img', kind: 'calc', q: 'Unsharp masking with k = 0.4: a pixel has value 150 and its blurred value is 130. The sharpened value is ___.',
      ctx: 'g = f − blur(f); f_UM = f + k·g.',
      options: ['158', '142', '170', '152'], answer: 0,
      why: 'g = 150 − 130 = 20; f_UM = 150 + 0.4 × 20 = 158.' },
    { id: 'e26', topic: 'img', kind: 'calc', q: 'A 7 × 7 kernel is applied to a 100 × 80 image with truncation of the image. The output is ___.',
      options: ['100 × 80', '94 × 74', '93 × 73', '98 × 78'], answer: 1,
      why: 'Half-size 3 on each side: (100 − 6) × (80 − 6) = 94 × 74.' },
    { id: 'e27', topic: 'img', kind: 'concept', q: 'Compared with a mean filter of the same size, a Gaussian filter ___.',
      options: ['gives more weight to the central pixels, so it blurs more gently', 'removes impulse noise completely', 'sharpens edges', 'only works on colour images'], answer: 0,
      why: 'Gaussian weights fall off with distance from the centre (nonuniform), while a mean filter weighs every neighbour equally. Removing impulses is the median filter\'s job.' }
  ];
})();
