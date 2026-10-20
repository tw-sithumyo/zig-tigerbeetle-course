import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createApp } from '../server.mjs';
import { chapters, lessons, lessonById, gradeQuiz } from '../lib/course.mjs';
import { sourceCatalog, readSource, tigerEnvironment, runTigerExercise } from '../lib/tigerbeetle-runner.mjs';
import { TB_COMMIT } from '../lib/config.mjs';

let server, directory, base, session;
before(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'zig-tigerbeetle-course-tb-test-'));
  server = createApp({ dataDirectory: directory });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  session = await (await fetch(`${base}/api/session`)).json();
});
after(async () => { await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); });
const post = (route, value) => fetch(`${base}/api/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forge-Token': session.token }, body: JSON.stringify(value) });

test('both tracks retain distinct identities and the Zig track includes TigerStyle practice', () => {
  assert.equal(chapters.filter(ch => ch.trackId === 'zig').length, 10);
  assert.equal(chapters.filter(ch => ch.trackId === 'tigerbeetle').length, 10);
  assert.equal(lessons.filter(lesson => lesson.trackId === 'zig').length, 56);
  assert.equal(lessons.filter(lesson => lesson.trackId === 'tigerbeetle').length, 46);
  for (const id of ['zig-tigerstyle', 'zig-style-contracts', 'zig-style-bounds', 'zig-style-units', 'zig-packed-flags', 'zig-bounded-queue', 'zig-completion-callback']) {
    assert.equal(lessonById.get(id).trackId, 'zig');
    assert.ok(lessonById.get(id).references.some(ref => ref.url.includes(TB_COMMIT)));
  }
});

test('every quiz grades its correct answers and explains an incorrect answer', () => {
  for (const lesson of lessons.filter(lesson => lesson.kind === 'quiz')) {
    const answers = lesson.questions.map(question => question.answer);
    assert.equal(gradeQuiz(lesson, answers).passed, true, lesson.id);
    const wrong = [...answers]; wrong[0] = (wrong[0] + 1) % lesson.questions[0].options.length;
    const result = gradeQuiz(lesson, wrong);
    assert.equal(result.passed, false, lesson.id);
    assert.ok(result.results[0].explanation.length > 10);
  }
});

test('all local source excerpts resolve to real pinned declarations', { skip: !tigerEnvironment().sourceReady }, async () => {
  for (const key of Object.keys(sourceCatalog)) {
    const source = await readSource(key);
    assert.equal(source.commit, TB_COMMIT);
    assert.ok(source.content.length > 100, key);
    assert.ok(source.url.includes(`/blob/${TB_COMMIT}/`));
    if (sourceCatalog[key].needle) assert.ok(source.content.includes(sourceCatalog[key].needle), key);
  }
  assert.equal((await fetch(`${base}/api/tigerbeetle/source?key=../../etc/passwd`)).status, 404);
});

test('track visits are durable and do not overwrite the other track resume point', async () => {
  await post('visit', { lessonId: 'values' });
  await post('visit', { lessonId: 'tb-welcome' });
  const state = await (await fetch(`${base}/api/progress`)).json();
  assert.equal(state.lastByTrack.zig, 'values');
  assert.equal(state.lastByTrack.tigerbeetle, 'tb-welcome');
});

test('real lab API rejects unfinished work, does not complete on Run, and awards XP once on Check', { skip: !tigerEnvironment().ready }, async () => {
  const lesson = lessonById.get('tb-first-transfer');
  const send = (code, action) => post('execute', { lessonId: lesson.id, code, action }).then(response => response.json());
  const failed = await send(lesson.starter, 'check');
  assert.equal(failed.passed, false);
  assert.equal(failed.progress.completed[lesson.id], undefined);
  const run = await send(lesson.solution, 'run');
  assert.equal(run.passed, true, run.output);
  assert.equal(run.progress.completed[lesson.id], undefined);
  const passed = await send(lesson.solution, 'check');
  assert.equal(passed.passed, true, passed.output);
  const repeat = await send(lesson.solution, 'check');
  assert.equal(repeat.progress.xp, passed.progress.xp);
  assert.ok(passed.output.includes('debit counter increased by 125'));
});

test('source investigation checks actual files and cannot be marked complete manually', { skip: !tigerEnvironment().sourceReady }, async () => {
  const lesson = lessonById.get('tb-source-map');
  const bad = await (await post('execute', { lessonId: lesson.id, code: lesson.starter, action: 'check' })).json();
  assert.equal(bad.passed, false);
  const good = await (await post('execute', { lessonId: lesson.id, code: lesson.solution, action: 'check' })).json();
  assert.equal(good.passed, true, good.output);
  assert.match(good.output, /src\/lsm\/tree.zig:39/);
  assert.equal((await post('complete', { lessonId: lesson.id })).status, 400);
});

test('lab command grammar excludes shell commands and arbitrary startup commands', { skip: !tigerEnvironment().ready }, async () => {
  for (const code of ['format /home/my-data;', 'create_accounts id=1; $(touch /tmp/unwanted);', 'lookup_accounts id=1']) {
    await assert.rejects(runTigerExercise({ code, lesson: lessonById.get('tb-create-accounts') }), error => error.status === 400);
  }
  await assert.rejects(runTigerExercise({ code: '{}', action: 'format', lesson: lessonById.get('tb-source-map') }), error => error.status === 400);
});
