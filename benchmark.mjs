const NUM_PROJECTS = 1000;
const COMMENTS_PER_PROJECT = 20;

// Generate mock data
const projects = Array.from({ length: NUM_PROJECTS }, (_, i) => ({ id: i }));
const projectComments = [];
for (let i = 0; i < NUM_PROJECTS; i++) {
  for (let j = 0; j < COMMENTS_PER_PROJECT; j++) {
    projectComments.push({ id: `${i}-${j}`, projectId: i, body: 'Test comment' });
  }
}

console.log(`Benchmarking with ${NUM_PROJECTS} projects and ${projectComments.length} total comments...`);

// 1. Current Approach (O(N^2))
function runCurrentApproach() {
  const start = performance.now();
  let totalCommentsFound = 0;

  projects.forEach(project => {
    // This happens in the map of the current component
    const commentsForProject = projectComments.filter(c => c.projectId === project.id);
    totalCommentsFound += commentsForProject.length;
  });

  const end = performance.now();
  return { time: end - start, found: totalCommentsFound };
}

// 2. Optimized Approach (O(N) with Map)
function runOptimizedApproach() {
  const start = performance.now();
  let totalCommentsFound = 0;

  // This happens once in useMemo
  const commentsByProject = new Map();
  for (const comment of projectComments) {
    if (!commentsByProject.has(comment.projectId)) {
      commentsByProject.set(comment.projectId, []);
    }
    commentsByProject.get(comment.projectId).push(comment);
  }

  // This happens in the map of the component
  projects.forEach(project => {
    const commentsForProject = commentsByProject.get(project.id) || [];
    totalCommentsFound += commentsForProject.length;
  });

  const end = performance.now();
  return { time: end - start, found: totalCommentsFound };
}

// Run benchmarks
const currentRes = runCurrentApproach();
const optimizedRes = runOptimizedApproach();

console.log(`Current O(N^2) time: ${currentRes.time.toFixed(2)} ms (Found: ${currentRes.found})`);
console.log(`Optimized O(N) time: ${optimizedRes.time.toFixed(2)} ms (Found: ${optimizedRes.found})`);
console.log(`Improvement: ${(currentRes.time / optimizedRes.time).toFixed(2)}x faster`);
