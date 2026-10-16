import assert from 'node:assert/strict';
import { lessons } from '../lib/course.mjs';
import { runCode, environment } from '../lib/runner.mjs';

console.log(`Verifying course with Zig ${environment().version} (${environment().mode})`);
let failures = 0;
const exercises = lessons.filter(item => item.kind === 'exercise' && (!item.engine || item.engine === 'zig'));
for (const lesson of exercises) {
  const solution = await runCode({ code: lesson.solution, lesson });
  const starter = await runCode({ code: lesson.starter, lesson });
  try {
    assert.equal(solution.passed, true, `Reference solution failed:\n${solution.output}`);
    assert.equal(starter.passed, false, 'Unfinished starter unexpectedly passed');
    console.log(`✓ ${lesson.id}: solution passes, starter fails`);
  } catch (error) { failures++; console.error(`✗ ${lesson.id}: ${error.message}`); }
}
if (failures) process.exitCode = 1;
else console.log(`All ${exercises.length} Zig reference solutions and unfinished starters verified.`);
