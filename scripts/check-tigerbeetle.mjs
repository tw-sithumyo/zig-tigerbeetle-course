import assert from 'node:assert/strict';
import { lessons } from '../lib/course.mjs';
import { runTigerExercise, tigerEnvironment } from '../lib/tigerbeetle-runner.mjs';
const env = tigerEnvironment();
if (!env.ready || !env.sourceBuildReady) throw new Error('Run npm run setup:tigerbeetle before verifying live and source labs.');
const exercises = lessons.filter(lesson => ['tigerbeetle', 'source', 'upstream'].includes(lesson.engine));
let failures = 0;
console.log(`Real TigerBeetle ${env.expectedVersion}, source ${env.sourceCommit.slice(0, 12)}, upstream Zig ${env.sourceZig}`);
for (const lesson of exercises) {
  try {
    const solution = await runTigerExercise({ code: lesson.solution, lesson });
    assert.equal(solution.passed, true, `Reference failed:\n${solution.output}`);
    const starter = await runTigerExercise({ code: lesson.starter, lesson });
    assert.equal(starter.passed, false, `Unfinished starter passed:\n${starter.output}`);
    console.log(`✓ ${lesson.id}: reference passes, unfinished starter fails`);
  } catch (error) { failures++; console.error(`✗ ${lesson.id}: ${error.message}`); }
}
console.log(`${exercises.length - failures}/${exercises.length} live/source/upstream labs verified.`);
if (failures) process.exitCode = 1;
