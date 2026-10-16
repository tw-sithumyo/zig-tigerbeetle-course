import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, TOOL_DIR } from './lib/config.mjs';
import { publicCourse, lessonById, gradeQuiz } from './lib/course.mjs';
import { environment, runCode, invalidateEnvironment } from './lib/runner.mjs';
import { createStore } from './lib/store.mjs';
import { tigerEnvironment, runTigerExercise, readSource } from './lib/tigerbeetle-runner.mjs';

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };
const fail = (status, message) => Object.assign(new Error(message), { status });
const learningEnvironment = () => ({ ...environment(), tigerbeetle: tigerEnvironment() });

export function createApp({ dataDirectory } = {}) {
  const store = createStore(dataDirectory);
  const token = randomBytes(24).toString('hex');
  const json = (res, status, value) => { res.writeHead(status, { 'Content-Type': MIME['.json'] }); res.end(JSON.stringify(value)); };
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
    try {
      const host = req.headers.host || '';
      if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) throw fail(403, 'This app only accepts localhost requests.');
      const url = new URL(req.url, `http://${host}`);
      if (req.headers.origin && req.headers.origin !== url.origin) throw fail(403, 'Cross-origin requests are not allowed.');
      if (req.headers['sec-fetch-site'] === 'cross-site') throw fail(403, 'Cross-site requests are not allowed.');
      if (url.pathname.startsWith('/api/')) {
        if (req.method === 'GET') {
          if (url.pathname === '/api/session') return json(res, 200, { token, course: publicCourse(), progress: store.snapshot(), environment: learningEnvironment() });
          if (url.pathname === '/api/environment') { invalidateEnvironment(); return json(res, 200, learningEnvironment()); }
          if (url.pathname === '/api/tigerbeetle/source') return json(res, 200, await readSource(url.searchParams.get('key')));
          if (url.pathname === '/api/progress') return json(res, 200, store.snapshot());
          throw fail(404, 'API route not found.');
        }
        if (req.method !== 'POST') throw fail(405, 'Use GET or POST.');
        const provided = req.headers['x-forge-token'];
        if (typeof provided !== 'string' || provided.length !== token.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(token))) throw fail(403, 'Invalid local session. Reload this page.');
        if (!req.headers['content-type']?.startsWith('application/json')) throw fail(415, 'Expected JSON.');
        let size = 0;
        const chunks = [];
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 100 * 1024) throw fail(413, 'Request is too large.');
          chunks.push(chunk);
        }
        let body;
        try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch { throw fail(400, 'Invalid JSON.'); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail(400, 'Expected a JSON object.');
        const lesson = lessonById.get(body.lessonId);
        if (url.pathname === '/api/draft') {
          if ((!lesson && body.lessonId !== 'playground') || typeof body.code !== 'string' || Buffer.byteLength(body.code) > 64 * 1024) throw fail(400, 'Invalid draft.');
          store.saveDraft(body.lessonId, body.code);
          return json(res, 200, { saved: true });
        }
        if (url.pathname === '/api/visit') {
          if (!lesson) throw fail(404, 'Lesson not found.');
          store.visit(lesson.id);
          return json(res, 200, { saved: true });
        }
        if (url.pathname === '/api/complete') {
          if (lesson?.kind !== 'reading') throw fail(400, 'Complete exercises with the compiler and quizzes with a passing answer.');
          store.complete(lesson.id);
          return json(res, 200, { progress: store.snapshot() });
        }
        if (url.pathname === '/api/quiz') {
          if (lesson?.kind !== 'quiz') throw fail(404, 'Quiz not found.');
          let result;
          try { result = gradeQuiz(lesson, body.answers); } catch (error) { throw fail(400, error.message); }
          store.saveQuiz(lesson.id, body.answers, result);
          return json(res, 200, { ...result, progress: store.snapshot() });
        }
        if (url.pathname === '/api/solution') {
          if (lesson?.kind !== 'exercise') throw fail(404, 'Exercise not found.');
          store.reveal(lesson.id);
          return json(res, 200, { code: lesson.solution, progress: store.snapshot() });
        }
        if (url.pathname === '/api/execute') {
          if (body.lessonId !== 'playground' && lesson?.kind !== 'exercise') throw fail(404, 'Exercise not found.');
          const action = body.action || 'check';
          const runner = lesson?.engine && lesson.engine !== 'zig' ? runTigerExercise : runCode;
          const result = await runner({ code: body.code, action, lesson });
          if (action === 'check' && lesson && result.passed) store.complete(lesson.id);
          return json(res, 200, { ...result, progress: store.snapshot() });
        }
        throw fail(404, 'API route not found.');
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') throw fail(405, 'Method not allowed.');
      let file;
      if (url.pathname === '/reference') file = path.join(TOOL_DIR, 'doc', 'langref.html');
      else {
        const requested = decodeURIComponent(url.pathname === '/' ? 'index.html' : url.pathname.slice(1));
        file = path.resolve(ROOT, 'public', requested);
        if (!file.startsWith(path.join(ROOT, 'public') + path.sep)) throw fail(404, 'File not found.');
      }
      if (!(await stat(file).catch(() => null))?.isFile()) throw fail(404, 'File not found.');
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : await readFile(file));
    } catch (error) {
      if (!res.headersSent) json(res, error.status || 500, { error: error.status ? error.message : 'Something went wrong. Check the local server terminal.' });
      else res.end();
      if (!error.status) console.error(error);
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 3030);
  const server = createApp();
  server.requestTimeout = 45_000;
  server.headersTimeout = 10_000;
  server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use. Try PORT=3031 npm start.` : error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => {
    console.log(`\n  ⚡ Zig Forge\n  http://localhost:${port}\n  ${environment().message}\n  Execution: ${environment().mode}\n`);
  });
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
