import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import os from 'node:os';
import http from 'node:http';
import path from 'node:path';
import { createApp } from '../server.mjs';
import { lessons, lessonById, publicCourse, gradeQuiz } from '../lib/course.mjs';
import { createStore } from '../lib/store.mjs';
import { runCode, environment } from '../lib/runner.mjs';

let directory, server, base, session;
before(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'zig-tigerbeetle-course-test-'));
  server = createApp({ dataDirectory: directory });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  session = await (await fetch(`${base}/api/session`)).json();
});
after(async () => { await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); });

const post = (route, value, headers = {}) => fetch(`${base}/api/${route}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forge-Token': session.token, ...headers }, body: JSON.stringify(value),
});

test('complete curriculum exposes tests and hides answer keys', () => {
  assert.equal(lessons.length, 98);
  assert.equal(new Set(lessons.map(lesson => lesson.id)).size, 98);
  assert.equal(lessons.filter(lesson => lesson.kind === 'exercise').length, 55);
  const publicLessons = publicCourse().chapters.flatMap(ch => ch.lessons);
  for (const lesson of publicLessons) {
    assert.equal(lesson.solution, undefined);
    assert.equal(lesson.sourceAnswers, undefined);
    assert.equal(lesson.checks, undefined);
    for (const question of lesson.questions || []) { assert.equal(question.answer, undefined); assert.equal(question.explanation, undefined); }
  }
  assert.ok(publicLessons.find(lesson => lesson.id === 'allocation').tests.includes('OutOfMemory'));
});

test('static app and offline reference are served locally', async () => {
  const routes = ['/', '/app.js', '/style.css', '/favicon.svg'];
  if (environment().ready) routes.push('/reference');
  for (const route of routes) {
    const response = await fetch(`${base}${route}`);
    assert.equal(response.status, 200, route);
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
  }
});

test('session tokens, origin checks, and host checks guard compiler actions', async () => {
  assert.equal((await post('draft', { lessonId: 'hello-zig', code: 'code' }, { 'X-Forge-Token': 'wrong' })).status, 403);
  assert.equal((await post('draft', { lessonId: 'hello-zig', code: 'code' }, { Origin: 'https://other.example' })).status, 403);
  const badHostStatus = await new Promise((resolve, reject) => {
    const request = http.get(`${base}/api/session`, { headers: { Host: 'evil.example' } }, response => { response.resume(); resolve(response.statusCode); });
    request.on('error', reject);
  });
  assert.equal(badHostStatus, 403);
  assert.equal((await fetch(`${base}/api/session`, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
  assert.equal((await fetch(`${base}/lib/config.mjs`)).status, 404);
  assert.equal((await fetch(`${base}/.data/progress.json`)).status, 404);
});

test('invalid API inputs cannot grant completion', async () => {
  assert.equal((await post('complete', { lessonId: 'hello-zig' })).status, 400);
  assert.equal((await post('execute', { lessonId: '../../bad', code: 'x' })).status, 404);
  assert.equal((await post('draft', { lessonId: 'missing', code: 'x' })).status, 400);
  assert.equal((await post('quiz', { lessonId: 'quiz-foundations', answers: [0] })).status, 400);
  assert.equal((await post('quiz', { lessonId: 'quiz-foundations', answers: [0, 1, null] })).status, 400);
  assert.equal((await post('execute', { lessonId: 'playground', code: 'x'.repeat(65537) })).status, 400);
});

test('drafts survive store reopening and completion awards XP once', async () => {
  const code = 'pub fn main() void {}\n// my draft';
  assert.equal((await post('draft', { lessonId: 'hello-zig', code })).status, 200);
  await post('complete', { lessonId: 'welcome' });
  await post('complete', { lessonId: 'welcome' });
  const reopened = createStore(directory).snapshot();
  assert.equal(reopened.drafts['hello-zig'], code);
  assert.equal(reopened.xp, 25);
  assert.equal((await readFile(path.join(directory, 'progress.json'), 'utf8')).includes('my draft'), true);
});

test('quiz grading explains mistakes, persists attempts, and needs all answers correct', async () => {
  const lesson = lessonById.get('quiz-foundations');
  const wrong = gradeQuiz(lesson, [1, 0, 0]);
  assert.equal(wrong.passed, false);
  assert.ok(wrong.results.every(result => result.explanation.length > 10));
  const failed = await (await post('quiz', { lessonId: lesson.id, answers: [1, 0, 0] })).json();
  assert.equal(failed.progress.completed[lesson.id], undefined);
  const correct = lesson.questions.map(question => question.answer);
  const passed = await (await post('quiz', { lessonId: lesson.id, answers: correct })).json();
  assert.equal(passed.passed, true);
  const repeated = await (await post('quiz', { lessonId: lesson.id, answers: correct })).json();
  assert.equal(repeated.progress.xp, passed.progress.xp);
  assert.deepEqual(repeated.progress.quizzes[lesson.id].answers, correct);
});

test('real compiler rejects starter, accepts solution, and completion is idempotent', { skip: !environment().ready }, async () => {
  const lesson = lessonById.get('functions');
  const failed = await (await post('execute', { lessonId: lesson.id, code: lesson.starter, action: 'check' })).json();
  assert.equal(failed.passed, false);
  assert.equal(failed.progress.completed[lesson.id], undefined);
  const passed = await (await post('execute', { lessonId: lesson.id, code: lesson.solution, action: 'check' })).json();
  assert.equal(passed.passed, true, passed.output);
  assert.ok(passed.progress.completed[lesson.id]);
  const repeated = await (await post('execute', { lessonId: lesson.id, code: lesson.solution, action: 'check' })).json();
  assert.equal(repeated.progress.xp, passed.progress.xp);
});

test('playground runs, formats, builds, and reports compiler errors', { skip: !environment().ready }, async () => {
  const code = 'const std = @import("std");\npub fn main() void { std.debug.print("local\\n", .{}); }';
  const run = await runCode({ code, action: 'run' });
  assert.equal(run.passed, true, run.output);
  assert.equal(run.output, 'local\n');
  const format = await runCode({ code, action: 'format' });
  assert.equal(format.passed, true);
  assert.ok(format.code.includes('\n    std.debug.print'));
  const build = await runCode({ code, action: 'build' });
  assert.equal(build.passed, true, build.output);
  const broken = await runCode({ code: 'pub fn main() void { this is invalid; }', action: 'run' });
  assert.equal(broken.passed, false);
  assert.match(broken.output, /error:/);
});

test('unbounded output is stopped and the compiler remains usable', { skip: !environment().ready }, async () => {
  const result = await runCode({ code: 'const std = @import("std"); pub fn main() void { while (true) std.debug.print("xxxxxxxxxxxxxxxx\\n", .{}); }', action: 'run' });
  assert.equal(result.passed, false);
  assert.equal(result.truncated, true);
  assert.ok(Buffer.byteLength(result.output) < 66000);
  const next = await runCode({ code: 'pub fn main() void {}', action: 'build' });
  assert.equal(next.passed, true, next.output);
});
