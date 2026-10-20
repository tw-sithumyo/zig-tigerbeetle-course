const paths = {
  bolt: '<path d="m13 2-9 12h7l-1 8L21 9h-8z"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15"/>',
  code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18"/>',
  terminal: '<path d="m5 7 5 5-5 5m8 0h6"/>',
  book: '<path d="M12 5v16M3 3c4-1 6 0 9 2 3-2 5-3 9-2v16c-4-1-6 0-9 2-3-2-5-3-9-2z"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  back: '<path d="m14 6-6 6 6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>',
  layers: '<path d="m12 3 10 6-10 6L2 9zm-9 11 9 5 9-5m-18 5 9 5 9-5"/>',
  branch: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M6 7v10m12-10c0 6-12 4-12 10"/>',
  box: '<path d="m12 3 9 5-9 5-9-5zm-9 5v10l9 5 9-5V8M12 13v10"/>',
  link: '<path d="m10 14 4-4m-6 6-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 0 2-2a4 4 0 1 1 6 6l-5 5a4 4 0 0 1-6 0"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
  file: '<path d="M14 2H5v20h14V7zm0 0v6h5M8 12h8m-8 4h6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  quiz: '<path d="M9 5h11M9 12h11M9 19h11M3 4l1 1 2-2m-3 8 1 1 2-2m-3 8 1 1 2-2"/>',
  bulb: '<path d="M9 18h6m-6 3h6M8 14a6 6 0 1 1 8 0l-1 3H9z"/>',
  external: '<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  refresh: '<path d="M20 7a9 9 0 1 0 1 9M20 3v5h-5"/>',
  play: '<path d="m7 4 14 8-14 8z"/>',
  close: '<path d="m5 5 14 14M5 19 19 5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.code}</svg>`;
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const $ = selector => document.querySelector(selector);
const app = $('#app');
let course, progress, env, token, currentId, currentLesson, currentView, editorTab = 'code', busy = false;
let allLessons = [], outputById = {}, hintCounts = {}, revealed = {}, quizDrafts = {};
let currentTrack = 'zig';
const activeChapters = () => course.chapters.filter(ch => ch.trackId === currentTrack);
const activeLessons = () => allLessons.filter(lesson => lesson.trackId === currentTrack);
const activeTrack = () => course.tracks.find(track => track.id === currentTrack);
const doneInTrack = () => activeLessons().filter(lesson => isDone(lesson.id)).length;
const nonZig = () => Boolean(currentLesson?.engine && currentLesson.engine !== 'zig');
const editorName = () => !nonZig() ? 'main.zig' : currentLesson.engine === 'tigerbeetle' ? 'commands.tb' : 'evidence.json';
const editorLabel = () => !nonZig() ? 'Zig source code editor' : currentLesson.engine === 'tigerbeetle' ? 'TigerBeetle REPL editor' : 'Source evidence editor';
const labLabel = lesson => lesson.engine === 'tigerbeetle' ? 'Real database lab' : lesson.engine === 'source' ? 'Source investigation' : lesson.engine === 'upstream' ? 'Upstream build and test' : 'Zig coding exercise';
let saveTimer, toastTimer, saveQueue = Promise.resolve();
let vimEditor = null, vimLoad = null, vimGeneration = 0, vimEnabled = false;
try { vimEnabled = (localStorage.getItem('zig-tigerbeetle-course-vim') ?? localStorage.getItem('zig-forge-vim')) === 'true'; } catch {}
const chapterIcons = ['bolt', 'layers', 'branch', 'box', 'link', 'shield', 'chip', 'terminal'];

async function api(route, body) {
  const response = await fetch(`/api/${route}`, body === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forge-Token': token }, body: JSON.stringify(body),
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || `Request failed (${response.status})`);
  return value;
}

function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3800);
}

function highlight(source) {
  const pattern = /\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|@[A-Za-z_][A-Za-z_0-9]*|\b(?:pub|fn|const|var|return|if|else|for|while|switch|break|continue|try|catch|defer|errdefer|comptime|struct|enum|union|test|true|false|null|undefined|and|or|orelse|error)\b|\b(?:u\d+|i\d+|f\d+|usize|isize|void|bool|type|anytype)\b|\b\d+(?:\.\d+)?\b/g;
  let result = '', last = 0;
  for (const match of source.matchAll(pattern)) {
    result += escape(source.slice(last, match.index));
    const value = match[0];
    const type = value.startsWith('//') ? 'comment' : /^["']/.test(value) ? 'string' : value.startsWith('@') ? 'builtin' : /^\d/.test(value) ? 'number' : /^(?:[uif]\d+|usize|isize|void|bool|type|anytype)$/.test(value) ? 'type' : 'keyword';
    result += `<span class="syn-${type}">${escape(value)}</span>`;
    last = match.index + value.length;
  }
  return result + escape(source.slice(last));
}

function inline(text) {
  return escape(text).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function markdown(text = '') {
  return text.split(/(```[\s\S]*?```)/g).map(part => {
    if (part.startsWith('```')) return `<pre><code>${highlight(part.replace(/^```[^\n]*\n?/, '').replace(/```$/, '').trimEnd())}</code></pre>`;
    const rendered = [];
    let paragraph = [];
    const flush = () => { if (paragraph.length) rendered.push(`<p>${inline(paragraph.join('\n')).replace(/\n/g, '<br>')}</p>`); paragraph = []; };
    for (const line of part.split('\n')) {
      if (line.startsWith('## ')) { flush(); rendered.push(`<h2>${inline(line.slice(3))}</h2>`); }
      else if (!line.trim()) flush();
      else paragraph.push(line);
    }
    flush();
    return rendered.join('');
  }).join('');
}

function isDone(id) { return Boolean(progress.completed[id]); }
function completion(ch) { return ch.lessons.filter(lesson => isDone(lesson.id)).length; }
function resumeLesson() {
  const items = activeLessons();
  const last = items.find(lesson => lesson.id === (progress.lastByTrack?.[currentTrack] || progress.lastLesson));
  return last && !isDone(last.id) ? last : items.find(lesson => !isDone(lesson.id)) || items[0];
}
function lessonLink(lesson) { return `#lesson/${lesson.id}`; }
function nextLesson() { const items = activeLessons(); return items[items.findIndex(lesson => lesson.id === currentId) + 1]; }
function xpFor(lesson) { return lesson.kind === 'exercise' ? 100 : lesson.kind === 'quiz' ? 75 : 25; }
function referenceLink(lesson) {
  const references = [...(lesson?.references || [])];
  if (lesson?.reference || !references.length) references.unshift({
    title: 'Language reference (offline)', url: `/reference#${lesson?.reference || 'Introduction'}`,
  });
  return `<span class="reference-links">${references.map(ref => `<a class="reference-link" href="${escape(ref.url)}" target="_blank" rel="noopener">${escape(ref.title)} ${icon('external')}</a>`).join('')}</span>`;
}
function sourceButtons(lesson) {
  return lesson?.sourceKeys?.length ? `<div class="source-section"><span class="subtle">READ THE PINNED SOURCE · LOCAL EXCERPTS</span><div class="source-buttons">${lesson.sourceKeys.map(key => `<button class="button quiet small" data-action="source" data-source="${escape(key)}">${icon('code')}${escape(key.replaceAll('-', ' '))}</button>`).join('')}</div></div>` : '';
}

function shell(content, breadcrumb = 'Course overview') {
  disposeVimEditor();
  const currentChapter = course.chapters.find(ch => ch.lessons.some(lesson => lesson.id === currentId));
  const ready = currentLesson?.engine === 'source' ? env.tigerbeetle.sourceReady : currentLesson?.engine === 'upstream' ? env.tigerbeetle.sourceBuildReady : currentLesson?.engine === 'tigerbeetle' || currentTrack === 'tigerbeetle' && !currentLesson ? env.tigerbeetle.ready : env.ready;
  app.innerHTML = `<div class="shell">
    <aside class="sidebar" aria-label="Course navigation">
      <a class="brand" href="#course"><span class="brand-mark">ϟ</span>Zig TigerBeetle Course <small>LOCAL</small></a>
      <nav class="track-switcher" aria-label="Learning tracks">${course.tracks.map(track => `<a class="track-link ${track.id === currentTrack ? 'active' : ''}" href="#course/${track.id}" ${track.id === currentTrack ? 'aria-current="true"' : ''}>${icon(track.id === 'zig' ? 'code' : 'layers')}${escape(track.title)}</a>`).join('')}</nav>
      <nav class="main-nav">
        <a href="#course/${currentTrack}" class="nav-link ${currentView === 'course' ? 'active' : ''}">${icon('map')}Learning path<span class="nav-small" id="progress-count">${doneInTrack()}/${activeLessons().length}</span></a>
        <a href="#playground" class="nav-link ${currentView === 'playground' ? 'active' : ''}">${icon('terminal')}Playground</a>
        <button class="nav-link" data-action="environment">${icon('chip')}Environment<span class="nav-small">${escape(activeTrack().version)}</span></button>
      </nav>
      <div class="sidebar-label"><span>YOUR CURRICULUM</span><span>${activeChapters().length} CH</span></div>
      <nav class="curriculum" aria-label="Lessons">${activeChapters().map(ch => `<details class="chapter-nav" ${ch.id === currentChapter?.id ? 'open' : ''}>
        <summary><span class="ch-number" data-chapter-number="${ch.id}">${completion(ch) === ch.lessons.length ? '✓' : ch.icon}</span>${escape(ch.title)}${icon('chevron').replace('<svg ', '<svg class="chevron" ')}</summary>
        ${ch.lessons.map(lesson => `<a class="lesson-link ${currentId === lesson.id ? 'active' : ''}" href="${lessonLink(lesson)}" ${currentId === lesson.id ? 'aria-current="page"' : ''}><span class="unit-dot ${isDone(lesson.id) ? 'done' : ''}"></span>${escape(lesson.title)}</a>`).join('')}
      </details>`).join('')}</nav>
      <div class="sidebar-bottom"><button class="local-card" data-action="environment"><span>${icon('shield')}</span><span><strong>Your machine. Your progress.</strong><small>Learning stays local.</small></span><span class="status-dot ${ready ? '' : 'off'}"></span></button></div>
    </aside>
    <div class="main-wrap">
      <header class="topbar"><div class="breadcrumbs"><button class="menu-button" data-action="menu" aria-label="Toggle navigation">${icon('menu')}</button><span class="course-crumb">Your workshop</span><span class="course-crumb">/</span><strong>${escape(breadcrumb)}</strong></div>
        <div class="top-right"><button class="environment-link" data-action="environment"><span class="status-dot ${ready ? '' : 'off'}"></span><span class="env-label">${ready ? 'Local environment ready' : 'Set up your environment'}</span></button><span class="top-divider"></span><span class="xp">${icon('bolt')}<span id="xp-value">${progress.xp.toLocaleString()} XP</span></span><span class="avatar" title="Local learner">YOU</span></div>
      </header>
      <main id="main" tabindex="-1">${content}</main>
    </div></div>`;
  bindGlobalActions();
}

function dashboard() {
  const track = activeTrack();
  const items = activeLessons();
  const done = doneInTrack();
  const percent = Math.round(done / items.length * 100);
  const exercises = items.filter(lesson => lesson.kind === 'exercise').length;
  const questions = items.filter(lesson => lesson.kind === 'quiz').reduce((sum, lesson) => sum + lesson.questions.length, 0);
  const resume = resumeLesson();
  shell(`<div class="content">
    <div class="page-heading"><div><div class="eyebrow">A little better, every build</div><h1>${currentTrack === 'zig' ? 'Welcome to your workshop.' : 'Your TigerBeetle workshop.'}</h1><p>${escape(track.description)}</p></div><span class="chip">${icon('code')}${currentTrack === 'zig' ? 'ZIG' : 'TIGERBEETLE'} ${escape(track.version)}</span></div>
    <section class="hero" aria-label="Continue learning"><div class="hero-copy"><span class="chip">${icon('bolt')}${currentTrack === 'zig' ? 'THE ZIG LEARNING PATH' : 'THE TIGERBEETLE PROJECT PATH'}</span><h2>${escape(track.hero)}<br><span>${escape(track.heroAccent)}</span></h2><p>${currentTrack === 'zig' ? 'Learn the language, then apply TigerStyle in code.' : 'Theory, real database labs, and source investigations.'}<br>Everything runs on your own computer.</p><a class="button primary" href="${lessonLink(resume)}">${done ? 'Continue learning' : 'Start your journey'}${icon('arrow')}</a><span class="hero-foot">${done ? `${done} lessons in. Keep building.` : 'No accounts. No subscriptions.'}</span></div>
      <div class="hero-visual" aria-hidden="true"><div class="mini-editor"><div class="mini-header"><span class="window-dot"></span><span class="window-dot"></span><span class="window-dot"></span><span>${currentTrack === 'zig' ? 'your_first_spark.zig' : 'your_first_transfer.tb'}</span></div><pre>${highlight(currentTrack === 'zig' ? 'const std = @import("std");\n\npub fn main() void {\n    const message = "I built this.";\n    std.debug.print("{s}\\n", .{message});\n}' : 'create_accounts\n  id=101 ledger=700 code=10,\n  id=102 ledger=700 code=10;\n\ncreate_transfers id=1001\n  debit_account_id=101\n  credit_account_id=102\n  amount=125 ledger=700 code=10;')}</pre><div class="mini-footer">${icon('check')}${currentTrack === 'zig' ? 'Real compiler. TigerStyle practice.' : 'Real replica. Verified account state.'}</div></div></div></section>
    <div class="metric-grid"><div class="metric"><span class="metric-label">${icon('book')}Guided chapters</span><div class="metric-value">${String(activeChapters().length).padStart(2, '0')}<small>theory and practice</small></div></div><div class="metric"><span class="metric-label">${icon('code')}Coding challenges</span><div class="metric-value">${exercises}<small>hands-on exercises</small></div></div><div class="metric"><span class="metric-label">${icon('quiz')}Knowledge checks</span><div class="metric-value">${questions}<small>questions to make it stick</small></div></div><div class="metric"><span class="metric-label">${icon('target')}Your progress</span><div class="metric-value">${percent}%<small>${done}/${items.length} complete</small></div></div></div>
    <section><div class="section-heading"><div><h2>Your learning path</h2><p class="subtle">Follow the chapters, or find something you’re curious about.</p></div><label class="search">${icon('search')}<input id="lesson-search" type="search" placeholder="Find a lesson…" aria-label="Find a lesson"></label></div>
      <div id="course-grid" class="chapter-grid">${activeChapters().map((ch, index) => {
        const count = completion(ch);
        const target = ch.lessons.find(lesson => !isDone(lesson.id)) || ch.lessons[0];
        return `<a class="chapter-card" href="${lessonLink(target)}"><div class="chapter-icon">${icon(chapterIcons[index % chapterIcons.length])}</div><div class="chapter-info"><div class="chapter-kicker">CHAPTER ${ch.icon}${ch.id === 'ledger-project' ? ' · MINI PROJECT' : ch.id.startsWith('zig-tiger') ? ' · TIGERBEETLE ZIG' : ''}</div><h3>${escape(ch.title)}</h3><p>${escape(ch.description)}</p><div class="chapter-meta"><span>${ch.lessons.length} lessons · ${ch.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)} min</span><span>${count === ch.lessons.length ? 'Completed ✓' : count ? `${count}/${ch.lessons.length} complete` : 'Ready when you are'}</span></div><div class="progress-track"><span style="width:${count / ch.lessons.length * 100}%"></span></div></div>${icon('arrow').replace('<svg ', '<svg class="card-arrow" ')}</a>`;
      }).join('')}</div><div id="search-results" class="search-results" hidden></div>
    </section><footer class="dashboard-footer"><span>${icon('shield')}Everything runs on your computer. Works offline after setup.</span><button class="tool-button" data-action="export">Export progress ${icon('download')}</button></footer></div>`);
  $('#lesson-search').addEventListener('input', event => {
    const query = event.target.value.trim().toLowerCase();
    $('#course-grid').hidden = Boolean(query);
    $('#search-results').hidden = !query;
    if (!query) return;
    const matches = activeLessons().filter(lesson => `${lesson.title} ${lesson.description} ${lesson.body || ''}`.toLowerCase().includes(query));
    $('#search-results').innerHTML = matches.length ? matches.map(lesson => `<a class="search-result" href="${lessonLink(lesson)}"><span>${escape(lesson.title)}<br><small class="subtle">${escape(lesson.description)}</small></span><span class="subtle">${lesson.kind} ${icon('arrow')}</span></a>`).join('') : '<div class="empty-state">No matching lessons. Try “memory”, “errors”, or “loops”.</div>';
  });
}

function lessonTop(lesson, chapter) {
  return `<div class="lesson-top"><div class="lesson-title-row"><a class="back-button" href="#course/${currentTrack}" aria-label="Back to learning path">${icon('back')}</a><div><div class="eyebrow">${chapter ? `Chapter ${chapter.icon} · ${escape(chapter.title)}` : 'Your own experiments'}</div><h1>${escape(lesson.title)}</h1></div></div><div class="lesson-meta"><span class="time-label">${icon('clock')} ${lesson.minutes || '∞'} min</span>${lesson.kind ? `<span class="chip" id="lesson-completion-chip">${isDone(lesson.id) ? '✓ Complete' : `+${xpFor(lesson)} XP`}</span>` : ''}</div></div>`;
}

function completeBanner(lesson) {
  const next = nextLesson();
  return `<div class="success-banner"><strong>${icon('check')} ${lesson.kind === 'exercise' ? 'Nicely built. All checks passed.' : 'One more step forward.'}</strong>${lesson.kind === 'exercise' ? 'Your solution passed the course checks.' : 'This lesson is complete.'}${progress.solutionsViewed[lesson.id] ? ' You studied the reference solution; try rebuilding it from memory later.' : ''}<br>${next ? `<a class="button small success" href="${lessonLink(next)}">Next: ${escape(next.title)} ${icon('arrow')}</a>` : '<a class="button small success" href="#course/${currentTrack}">You finished the path. See your progress →</a>'}</div>`;
}

function readingView(lesson, chapter) {
  shell(`${lessonTop(lesson, chapter)}<div class="reading-layout"><article class="lesson-reading"><span class="lesson-type">${icon('book')}Field notes</span><p class="lesson-desc">${escape(lesson.description)}</p><div class="prose">${markdown(lesson.body)}</div>${sourceButtons(lesson)}<div id="completion-banner">${isDone(lesson.id) ? completeBanner(lesson) : ''}</div><div class="reading-actions">${referenceLink(lesson)}<button class="button primary" data-action="complete-reading">${isDone(lesson.id) ? 'Continue learning' : 'Got it. Let’s build.'}${icon('arrow')}</button></div></article><aside class="toolkit"><h2>A good place to begin.</h2><div class="toolkit-item">${icon('code')}<span><strong>Learn by doing</strong>Guided practice, real feedback, and explicit contracts.</span></div><div class="toolkit-item">${icon('bulb')}<span><strong>A nudge when you need it</strong>Hints and reference solutions for every exercise.</span></div><div class="toolkit-item">${icon('shield')}<span><strong>Make yourself at home</strong>Your code and progress are saved locally.</span></div><a class="button quiet" href="#playground">Open the playground ${icon('arrow')}</a></aside></div>`, chapter.title);
}

function editorMarkup(playground = false) {
  const saved = outputById[currentId];
  return `<section class="workspace" aria-label="Coding and lab workspace"><div class="workspace-toolbar"><div class="editor-tabs" role="tablist" aria-label="Editor files"><button class="editor-tab ${editorTab === 'code' ? 'active' : ''}" role="tab" aria-selected="${editorTab === 'code'}" data-tab="code">${icon('file')}${editorName()}</button>${!playground && currentLesson.tests ? `<button class="editor-tab ${editorTab === 'tests' ? 'active' : ''}" role="tab" aria-selected="${editorTab === 'tests'}" data-tab="tests">${icon('shield')}Tests</button>` : ''}</div><span id="save-state" class="save-state">Saved locally</span></div>
    <div class="editor-tools">${!nonZig() ? `<button class="tool-button" data-action="format" title="Format with zig fmt">${icon('code')}Format</button><button class="tool-button" data-action="build" title="Compile without running">${icon('box')}Build</button>` : `<span class="lab-mode">${escape(labLabel(currentLesson))}</span>`}<button class="tool-button" data-action="download" title="Download ${editorName()}">${icon('download')}Save file</button><button class="tool-button" id="vim-toggle" data-action="toggle-vim" aria-pressed="${vimEnabled}">Vim: ${vimEnabled ? 'on' : 'off'}</button><button class="tool-button" data-action="vim-help" aria-label="Vim keybindings help">Keys</button><button class="tool-button tool-right" data-action="reset" title="Restore starter code">${icon('refresh')}</button></div>
    <div class="editor-wrap"><div class="line-numbers" aria-hidden="true" id="line-numbers"></div><div class="code-area"><pre class="code-highlight" id="code-highlight" aria-hidden="true"></pre><textarea id="code-input" class="code-input" aria-label="${editorLabel()}" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off"></textarea></div><div class="vim-editor" id="vim-editor" hidden></div></div>
    <div class="editor-status"><span>${playground ? 'YOUR OWN EXPERIMENTS' : 'UTF-8 · 4 SPACES'}</span><span id="vim-mode" class="vim-mode" role="status" aria-live="polite" hidden>NORMAL</span><span id="cursor-position">Ln 1, Col 1</span><span>${nonZig() ? currentLesson.engine === 'tigerbeetle' ? `TigerBeetle ${env.tigerbeetle.expectedVersion}` : currentLesson.engine === 'upstream' ? 'Upstream Zig 0.14.1' : 'Pinned source' : `Zig ${course.version}`} · local</span></div>
    <div class="terminal"><div class="terminal-header">${icon('terminal')}OUTPUT<span id="terminal-status" class="terminal-status ${saved ? saved.passed ? 'pass' : 'fail' : ''}">${saved ? `${saved.passed ? 'Passed' : 'Needs a little work'} · ${saved.durationMs} ms` : 'Ready when you are'}</span><button class="terminal-clear" data-action="clear-output">Clear</button></div><pre id="terminal-output" role="log" aria-live="polite" class="${saved && !saved.passed ? 'error' : ''}">${escape(saved ? `$ ${saved.command}\n\n${saved.output}` : playground ? 'Try an idea. Run it. See what happens.\n\nYour code compiles and runs on this computer.' : 'Your compiler is waiting.\n\nEdit the code, then check your solution.\nCompiler messages and test results will appear here.')}</pre></div>
    <div class="workspace-footer"><span class="keyboard">Ctrl / ⌘ + Enter to ${playground ? 'run' : 'check'}</span><div><button class="button quiet small" data-action="${playground ? 'test' : 'run'}">${icon(playground ? 'shield' : 'play')}${playground ? 'Run tests' : nonZig() ? currentLesson.engine === 'tigerbeetle' ? 'Run commands' : 'Inspect' : currentLesson.tests ? 'My tests' : 'Run'}</button> <button class="button primary" id="check-button" data-action="${playground ? 'run' : 'check'}">${icon(playground ? 'play' : 'check')}${playground ? 'Run code' : 'Check solution'}</button></div></div></section>`;
}

function exerciseView(lesson, chapter) {
  shell(`${lessonTop(lesson, chapter)}<div class="lesson-layout"><article class="lesson-reading"><span class="lesson-type">${icon('code')}${labLabel(lesson)}</span><p class="lesson-desc">${escape(lesson.description)}</p><div class="prose">${markdown(lesson.body)}</div>${sourceButtons(lesson)}<div class="assignment"><h2>${icon('target')}Your assignment</h2><div class="prose">${markdown(lesson.task)}</div>${lesson.expectedOutput ? `<div class="prose"><pre><code>${escape(lesson.expectedOutput.trimEnd())}</code></pre></div>` : ''}</div><div class="reading-actions"><button class="button quiet small" data-action="hint">${icon('bulb')}Get a hint <span id="hint-count">${hintCounts[lesson.id] || 0}/${lesson.hints.length}</span></button><button class="tool-button" data-action="solution">View solution</button></div><div id="hints">${renderHints(lesson)}</div><div id="completion-banner">${isDone(lesson.id) ? completeBanner(lesson) : ''}</div><div class="reading-actions">${referenceLink(lesson)}<span class="subtle">Progress, one checked contract at a time.</span></div></article>${editorMarkup()}</div>`, chapter.title);
  bindEditor();
}

function renderHints(lesson) {
  return lesson.hints.slice(0, hintCounts[lesson.id] || 0).map((hint, index) => `<div class="hint-box"><strong>HINT ${index + 1}</strong>${inline(hint)}</div>`).join('');
}

function playgroundView() {
  const lesson = { title: 'A place to try things.' };
  shell(`${lessonTop(lesson)}<div class="playground-layout"><aside class="playground-notes"><span class="lesson-type">${icon('terminal')}Playground</span><h2>Follow your curiosity.</h2><p class="playground-intro">A blank canvas with a real Zig compiler. Try out a concept, write a test, or build on what you just learned.</p><div class="command-note"><strong>Run code</strong><code>zig run main.zig</code><br>Compile and run your main function.</div><div class="command-note"><strong>Run tests</strong><code>zig test main.zig</code><br>Execute the test blocks you write.</div><div class="command-note"><strong>Build</strong><code>zig build-exe main.zig</code><br>Check that your program compiles. Use Save file to keep the source.</div><div class="reading-actions">${referenceLink()}<span class="subtle">No XP here. Just possibilities.</span></div></aside>${editorMarkup(true)}</div>`, 'Playground');
  bindEditor();
}

function quizView(lesson, chapter) {
  const saved = progress.quizzes[lesson.id];
  const answers = quizDrafts[lesson.id] || saved?.answers || [];
  const result = quizDrafts[lesson.id] ? null : saved;
  shell(`${lessonTop(lesson, chapter)}<div class="quiz-wrap"><span class="lesson-type">${icon('quiz')}Knowledge check</span><p class="lesson-desc">Pause. Connect the dots.</p><p class="quiz-intro">${escape(lesson.description)} Take your time. You can retry as often as you like.</p><form id="quiz-form">${lesson.questions.map((question, index) => `<section class="quiz-question"><div class="question-number">QUESTION ${index + 1} / ${lesson.questions.length}</div><h2 id="question-${index}">${inline(question.prompt)}</h2><div class="quiz-options" role="group" aria-labelledby="question-${index}">${question.options.map((option, optionIndex) => `<label class="quiz-option ${result ? result.results[index].answer === optionIndex ? 'correct' : answers[index] === optionIndex ? 'incorrect' : '' : ''}"><input type="radio" name="q${index}" value="${optionIndex}" ${answers[index] === optionIndex ? 'checked' : ''} required><span>${inline(option)}</span></label>`).join('')}</div>${result ? `<p class="quiz-explanation">${result.results[index].correct ? '✓' : '↳'} ${escape(result.results[index].explanation)}</p>` : ''}</section>`).join('')}<div class="quiz-actions"><span class="quiz-score" id="quiz-score">${result ? `${result.score}/${result.total} correct${result.passed ? ' · Checkpoint complete!' : ' · Give it another go.'}` : 'No rush. Think it through.'}</span><button class="button primary" type="submit">${icon('check')}${result ? 'Check again' : 'Check answers'}</button></div></form><div id="completion-banner">${isDone(lesson.id) ? completeBanner(lesson) : ''}</div></div>`, chapter.title);
  $('#quiz-form').addEventListener('change', () => {
    const values = new FormData($('#quiz-form'));
    quizDrafts[lesson.id] = lesson.questions.map((_, index) => values.has(`q${index}`) ? Number(values.get(`q${index}`)) : null);
    for (const label of document.querySelectorAll('.quiz-option')) label.classList.remove('correct', 'incorrect');
    for (const explanation of document.querySelectorAll('.quiz-explanation')) explanation.hidden = true;
    $('#quiz-score').textContent = 'Answers changed. Check again when you’re ready.';
  });
  $('#quiz-form').addEventListener('submit', async event => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const answers = lesson.questions.map((_, index) => Number(values.get(`q${index}`)));
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const first = !isDone(lesson.id);
      const result = await api('quiz', { lessonId: lesson.id, answers });
      progress = result.progress;
      delete quizDrafts[lesson.id];
      if (currentId === lesson.id) quizView(lesson, chapter);
      if (result.passed && first) toast('+75 XP · Checkpoint complete.');
    } catch (error) { toast(error.message); submit.disabled = false; }
  });
}

function sourceCode() { return progress.drafts[currentId] ?? (currentId === 'playground' ? course.playgroundStarter : currentLesson?.starter || ''); }
function shownCode() {
  if (editorTab === 'tests' && nonZig()) return currentLesson.tests;
  if (editorTab === 'tests') return `// Course checks. Read-only; imports your main.zig.\nconst std = @import("std");\nconst learner = @import("main.zig");\n\n${currentLesson.tests}`;
  return sourceCode();
}

function updateEditor() {
  const input = $('#code-input');
  if (!input) return;
  input.value = shownCode();
  input.readOnly = editorTab === 'tests';
  input.setAttribute('aria-label', editorTab === 'tests' ? 'Read-only course tests' : editorLabel());
  $('#code-highlight').innerHTML = highlight(input.value) + '\n';
  $('#line-numbers').textContent = Array.from({ length: input.value.split('\n').length + 1 }, (_, index) => index + 1).join('\n');
  for (const tab of document.querySelectorAll('[data-tab]')) { tab.classList.toggle('active', tab.dataset.tab === editorTab); tab.setAttribute('aria-selected', String(tab.dataset.tab === editorTab)); }
  syncScroll();
  updateCursor();
  syncVimEditor();
}

function disposeVimEditor() {
  vimGeneration++;
  vimEditor?.destroy();
  vimEditor = null;
}

async function syncVimEditor(focus = false) {
  const input = $('#code-input'), host = $('#vim-editor');
  if (!input || !host) return;
  const generation = ++vimGeneration;
  const button = $('#vim-toggle');
  button.textContent = `Vim: ${vimEnabled ? 'on' : 'off'}`;
  button.setAttribute('aria-pressed', String(vimEnabled));
  if (!vimEnabled) {
    const selection = vimEditor?.selection();
    disposeVimEditor();
    host.hidden = true;
    $('.editor-wrap').classList.remove('vim-active');
    $('#vim-mode').hidden = true;
    if (selection) input.setSelectionRange(selection.from, selection.to);
    if (focus) input.focus();
    updateCursor();
    return;
  }
  try {
    if (!vimEditor) {
      vimLoad ||= import('/vendor/vim-editor.js');
      const { createVimEditor } = await vimLoad;
      if (generation !== vimGeneration || !host.isConnected || !vimEnabled) return;
      vimEditor = createVimEditor({
        parent: host,
        onChange(code) { input.value = code; changedCode(); },
        onCursor(line, column) { $('#cursor-position').textContent = `Ln ${line}, Col ${column}`; },
        onMode(mode) { $('#vim-mode').textContent = mode; },
        onSave() { clearTimeout(saveTimer); return persistDraft(currentId, sourceCode()).then(() => toast('Code saved locally.')); },
        onRun() { execute(currentId === 'playground' ? 'run' : 'check'); },
      });
    }
    host.hidden = false;
    $('.editor-wrap').classList.add('vim-active');
    $('#vim-mode').hidden = false;
    vimEditor.show({ doc: shownCode(), readOnly: editorTab === 'tests', label: input.getAttribute('aria-label'), key: editorTab });
    if (focus) vimEditor.focus();
  } catch (error) {
    vimLoad = null;
    vimEnabled = false;
    syncVimEditor();
    toast(`Vim editor could not load: ${error.message}`);
  }
}

function syncScroll() {
  const input = $('#code-input');
  if (!input) return;
  $('#code-highlight').scrollTop = input.scrollTop;
  $('#code-highlight').scrollLeft = input.scrollLeft;
  $('#line-numbers').scrollTop = input.scrollTop;
}
function updateCursor() {
  const input = $('#code-input');
  if (!input) return;
  const before = input.value.slice(0, input.selectionStart).split('\n');
  $('#cursor-position').textContent = `Ln ${before.length}, Col ${before.at(-1).length + 1}`;
}

function persistDraft(id, code) {
  progress.drafts[id] = code;
  saveQueue = saveQueue.catch(() => {}).then(() => api('draft', { lessonId: id, code })).then(() => {
    if (currentId === id && $('#save-state') && sourceCode() === code) $('#save-state').textContent = 'Saved locally';
  }).catch(error => {
    if ($('#save-state')) $('#save-state').textContent = 'Save failed';
    toast(`Couldn’t save your code: ${error.message}`);
  });
  return saveQueue;
}

function changedCode() {
  if (editorTab !== 'code') return;
  const input = $('#code-input');
  progress.drafts[currentId] = input.value;
  $('#code-highlight').innerHTML = highlight(input.value) + '\n';
  $('#line-numbers').textContent = Array.from({ length: input.value.split('\n').length + 1 }, (_, index) => index + 1).join('\n');
  $('#save-state').textContent = 'Saving…';
  updateCursor();
  clearTimeout(saveTimer);
  const id = currentId, value = input.value;
  saveTimer = setTimeout(() => persistDraft(id, value), 350);
}

function bindEditor() {
  updateEditor();
  const input = $('#code-input');
  input.addEventListener('input', changedCode);
  input.addEventListener('scroll', syncScroll);
  for (const event of ['click', 'keyup', 'select']) input.addEventListener(event, updateCursor);
  input.addEventListener('keydown', event => {
    if (event.key === 'Tab' && !input.readOnly) {
      event.preventDefault();
      const start = input.selectionStart;
      input.setRangeText('    ', start, input.selectionEnd, 'end');
      changedCode();
    }
  });
  for (const tab of document.querySelectorAll('[data-tab]')) tab.addEventListener('click', () => { editorTab = tab.dataset.tab; updateEditor(); });
  setBusy(busy);
}

function setBusy(value) {
  for (const button of document.querySelectorAll('[data-action="check"], [data-action="run"], [data-action="test"], [data-action="format"], [data-action="build"]')) button.disabled = value;
  const button = $('#check-button');
  if (button) button.innerHTML = value ? '<span class="spinner"></span>Working…' : `${icon(currentId === 'playground' ? 'play' : 'check')}${currentId === 'playground' ? 'Run code' : 'Check solution'}`;
}

async function execute(action) {
  if (busy) return;
  const id = currentId, lesson = currentLesson, code = sourceCode();
  busy = true;
  setBusy(true);
  if ($('#terminal-status')) $('#terminal-status').textContent = nonZig() ? 'Running local lab…' : 'Compiling locally…';
  if ($('#terminal-output')) { $('#terminal-output').classList.remove('error'); $('#terminal-output').textContent = nonZig() ? currentLesson.engine === 'upstream' ? 'Building the actual upstream test with Zig 0.14.1…\nA cold build can take up to three minutes.' : 'Starting the local lab and preparing its checks…' : 'Starting your local Zig compiler…'; }
  const wasDone = isDone(id);
  try {
    await persistDraft(id, code);
    const result = await api('execute', { lessonId: id, code, action });
    // Preserve newer edits made while the compiler was running.
    const drafts = progress.drafts;
    progress = { ...result.progress, drafts: { ...result.progress.drafts, ...drafts } };
    outputById[id] = result;
    if (currentId === id && $('#terminal-output')) {
      $('#terminal-output').textContent = `$ ${result.command}\n\n${result.output}`;
      $('#terminal-output').classList.toggle('error', !result.passed);
      $('#terminal-status').textContent = `${result.passed ? action === 'build' ? 'Build complete' : 'Passed' : 'Needs a little work'} · ${result.durationMs} ms`;
      $('#terminal-status').className = `terminal-status ${result.passed ? 'pass' : 'fail'}`;
      if (result.code !== undefined && sourceCode() === code) { await persistDraft(id, result.code); editorTab = 'code'; updateEditor(); }
      if (action === 'check' && lesson && result.passed) {
        $('#completion-banner').innerHTML = completeBanner(lesson);
        $('#xp-value').textContent = `${progress.xp.toLocaleString()} XP`;
        $('#progress-count').textContent = `${doneInTrack()}/${activeLessons().length}`;
        $('#lesson-completion-chip').textContent = '✓ Complete';
        for (const chapter of course.chapters) {
          const number = document.querySelector(`[data-chapter-number="${chapter.id}"]`);
          if (number) number.textContent = completion(chapter) === chapter.lessons.length ? '✓' : chapter.icon;
        }
        document.querySelector('.lesson-link.active .unit-dot')?.classList.add('done');
        if (!wasDone) toast(`+100 XP · ${lesson.title} complete.`);
      }
    }
  } catch (error) {
    if (currentId === id && $('#terminal-output')) {
      $('#terminal-output').textContent = error.message;
      $('#terminal-output').classList.add('error');
      $('#terminal-status').textContent = 'Could not run';
    }
    toast(error.message);
  } finally { busy = false; setBusy(false); }
}

function download(name, value, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showModal(title, content, actions = '') {
  const modal = $('#modal');
  modal.innerHTML = `<div class="modal-heading"><h2 id="modal-title">${escape(title)}</h2><button class="close-button" aria-label="Close dialog">${icon('close')}</button></div>${content}${actions ? `<div class="modal-actions">${actions}</div>` : ''}`;
  modal.querySelector('.close-button').addEventListener('click', () => modal.close());
  if (!modal.open) modal.showModal();
  modal.addEventListener('click', event => { if (event.target === modal) { const box = modal.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) modal.close(); } }, { once: true });
}

async function environmentModal() {
  try { env = await api('environment'); } catch (error) { toast(error.message); }
  showModal('Your local environment', `<div class="env-row"><span>Compiler</span><span>${env.ready ? '✓' : '○'} Zig ${escape(env.version || 'not installed')}</span></div><div class="env-row"><span>Course version</span><span>${escape(env.expectedVersion)}</span></div><div class="env-row"><span>Execution</span><span>${escape(env.mode)}</span></div><div class="env-row"><span>Platform</span><span>${escape(env.platform)}</span></div><div class="env-row"><span>Connection</span><span>Localhost · no account required</span></div><p class="modal-note">${escape(env.message)} ${env.sandboxed ? 'Code runs in an isolated filesystem with networking disabled. Compiler output is limited to 64 KiB and execution to 35 seconds.' : 'Code runs with your user’s permissions. Use your own code and trusted examples. On Linux, install Bubblewrap to enable automatic filesystem and network isolation.'}</p><p class="modal-note">To install the pinned compiler, run this in the zig-tigerbeetle-course folder, then restart the app:</p><pre class="modal-code">npm run setup\nnpm start</pre><p class="modal-note">Code, quiz attempts, and progress live in .data/progress.json. After setup, lessons and compilation work offline.</p>`, '<button class="button quiet" id="export-progress">Export progress</button><button class="button primary" id="env-done">Back to learning</button>');
  const tb = env.tigerbeetle;
  const extra = document.createElement('section');
  extra.innerHTML = `<h3 class="env-section-heading">TigerBeetle project environment</h3><div class="env-row"><span>Database</span><span>${tb.ready ? '✓' : '○'} ${escape(tb.version || 'Not installed')}</span></div><div class="env-row"><span>Pinned source</span><span>${tb.sourceReady ? '✓ ' + escape(tb.sourceCommit.slice(0, 12)) : 'Not installed'}</span></div><div class="env-row"><span>Upstream compiler</span><span>Zig ${escape(tb.sourceZig || 'not installed')} (requires 0.14.1)</span></div><p class="modal-note">Live labs format a disposable database and use a private loopback network on Linux when Bubblewrap is enabled. The real upstream build runs locally in the pinned checkout. Setup downloads the binary, source, and separate compiler; the Zig foundations environment stays on 0.17.0.</p><pre class="modal-code">npm run setup:tigerbeetle</pre>`;
  $('#modal .modal-actions').before(extra);
  $('#env-done').onclick = () => $('#modal').close();
  $('#export-progress').onclick = () => download('zig-tigerbeetle-course-progress.json', JSON.stringify(progress, null, 2), 'application/json');
}

function bindGlobalActions() {
  for (const element of document.querySelectorAll('[data-action]')) element.addEventListener('click', async () => {
    const action = element.dataset.action;
    if (['check', 'run', 'test', 'build', 'format'].includes(action)) return execute(action);
    if (action === 'source') {
      try {
        const source = await api(`tigerbeetle/source?key=${encodeURIComponent(element.dataset.source)}`);
        showModal(source.title, `<p class="modal-note">${escape(source.file)} · line ${source.firstLine} · commit ${escape(source.commit.slice(0, 12))}</p><pre class="modal-code source-code">${highlight(source.content)}</pre><a class="reference-link" href="${escape(source.url)}" target="_blank" rel="noopener">Full pinned file on GitHub ${icon('external')}</a>`);
      } catch (error) { toast(error.message); }
      return;
    }
    if (action === 'toggle-vim') {
      vimEnabled = !vimEnabled;
      try { localStorage.setItem('zig-tigerbeetle-course-vim', String(vimEnabled)); } catch {}
      await syncVimEditor(true);
      return;
    }
    if (action === 'vim-help') {
      showModal('Vim keybindings', '<p class="modal-note">Turn on Vim in the editor toolbar. The mode indicator shows NORMAL, INSERT, or VISUAL. Your preference stays in this browser.</p><dl class="vim-key-help"><dt>Insert</dt><dd><code>i</code> before cursor · <code>a</code> after · <code>I</code>/<code>A</code> start/end · <code>o</code>/<code>O</code> new line · <code>Esc</code> back to Normal</dd><dt>Move</dt><dd><code>h j k l</code> · <code>w b e</code> words · <code>0 ^ $</code> line · <code>gg G</code> document · counts such as <code>3j</code></dd><dt>Select</dt><dd><code>v</code> characters · <code>V</code> lines · <code>Ctrl+v</code> block · motions extend selection · <code>Esc</code> exits</dd><dt>Edit</dt><dd><code>x</code>, <code>dd</code>, <code>dw</code>, <code>ciw</code> · <code>y</code>/<code>yy</code> yank · <code>p</code>/<code>P</code> paste · <code>u</code> undo · <code>Ctrl+r</code> redo · <code>.</code> repeat</dd><dt>Search and save</dt><dd><code>/pattern</code>, <code>n</code>/<code>N</code> · <code>:w</code> saves the local draft · <code>Ctrl/⌘+Enter</code> checks or runs</dd></dl><p class="modal-note">Tests remain read-only. These are Vim-style browser keybindings; your local Neovim plugins and configuration are not loaded. Use Tab to move focus in Normal mode, or switch Vim off for the regular editor.</p>');
      return;
    }
    if (action === 'menu') return $('.shell').classList.toggle('nav-open');
    if (action === 'environment') return environmentModal();
    if (action === 'export') return download('zig-tigerbeetle-course-progress.json', JSON.stringify(progress, null, 2), 'application/json');
    if (action === 'download') return download(nonZig() ? editorName() : `${currentId === 'playground' ? 'main' : currentId}.zig`, sourceCode());
    if (action === 'clear-output') {
      delete outputById[currentId];
      $('#terminal-output').textContent = 'Output cleared. Ready for your next idea.';
      $('#terminal-output').classList.remove('error');
      $('#terminal-status').textContent = 'Ready';
      return;
    }
    if (action === 'hint') {
      hintCounts[currentId] = Math.min((hintCounts[currentId] || 0) + 1, currentLesson.hints.length);
      $('#hints').innerHTML = renderHints(currentLesson);
      $('#hint-count').textContent = `${hintCounts[currentId]}/${currentLesson.hints.length}`;
      if (hintCounts[currentId] === currentLesson.hints.length) element.disabled = true;
      return;
    }
    if (action === 'complete-reading') {
      try {
        const first = !isDone(currentId);
        progress = (await api('complete', { lessonId: currentId })).progress;
        if (first) toast('+25 XP · Theory lesson complete.');
        location.hash = nextLesson() ? lessonLink(nextLesson()) : '#course';
      } catch (error) { toast(error.message); }
      return;
    }
    if (action === 'reset') {
      const id = currentId;
      showModal('Start this code again?', '<p class="modal-note">This replaces your current code with the starter. Your completed lessons and XP are kept.</p>', '<button class="button quiet" id="reset-cancel">Keep my code</button><button class="button primary" id="reset-confirm">Restore starter</button>');
      $('#reset-cancel').onclick = () => $('#modal').close();
      $('#reset-confirm').onclick = async () => {
        clearTimeout(saveTimer);
        await persistDraft(id, id === 'playground' ? course.playgroundStarter : allLessons.find(lesson => lesson.id === id).starter);
        if (currentId === id) { editorTab = 'code'; updateEditor(); }
        $('#modal').close(); toast('Starter code restored.');
      };
      return;
    }
    if (action === 'solution') {
      const id = currentId;
      try {
        const result = await api('solution', { lessonId: id });
        progress.solutionsViewed = result.progress.solutionsViewed;
        revealed[id] = result.code;
        showModal('One way to solve it', `<p class="modal-note">Read it, connect it to the lesson, then try writing it yourself. Studying a solution is recorded in your progress.</p><pre class="modal-code">${highlight(result.code)}</pre>`, '<button class="button quiet" id="solution-close">Back to my code</button><button class="button primary" id="solution-load">Load into editor</button>');
        $('#solution-close').onclick = () => $('#modal').close();
        $('#solution-load').onclick = async () => { clearTimeout(saveTimer); await persistDraft(id, result.code); if (currentId === id) { editorTab = 'code'; updateEditor(); } $('#modal').close(); toast('Solution loaded. Run the checks to explore how it works.'); };
      } catch (error) { toast(error.message); }
    }
  });
}

async function route() {
  clearTimeout(saveTimer);
  if ($('#code-input') && currentId) persistDraft(currentId, sourceCode());
  const hash = location.hash.slice(1);
  editorTab = 'code';
  currentLesson = null;
  currentId = null;
  if (hash.startsWith('lesson/')) {
    currentId = hash.slice(7);
    currentLesson = allLessons.find(lesson => lesson.id === currentId);
    if (!currentLesson) { location.hash = '#course'; toast('That lesson does not exist. Here is your learning path.'); return; }
    currentView = 'lesson';
    const chapter = course.chapters.find(ch => ch.id === currentLesson.chapterId);
    currentTrack = currentLesson.trackId;
    progress.lastLesson = currentId;
    progress.lastByTrack ||= {};
    progress.lastByTrack[currentTrack] = currentId;
    api('visit', { lessonId: currentId }).catch(error => toast(error.message));
    if (currentLesson.kind === 'reading') readingView(currentLesson, chapter);
    else if (currentLesson.kind === 'quiz') quizView(currentLesson, chapter);
    else exerciseView(currentLesson, chapter);
  } else if (hash === 'playground') { currentView = 'playground'; currentId = 'playground'; playgroundView(); }
  else {
    if (hash.startsWith('course/')) currentTrack = course.tracks.some(track => track.id === hash.slice(7)) ? hash.slice(7) : 'zig';
    currentView = 'course'; dashboard();
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
window.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && $('#code-input') && !$('#modal').open) { event.preventDefault(); execute(currentId === 'playground' ? 'run' : 'check'); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && $('#code-input')) { event.preventDefault(); clearTimeout(saveTimer); persistDraft(currentId, sourceCode()).then(() => toast('Code saved locally.')); }
});
window.addEventListener('pagehide', () => {
  if ($('#code-input') && currentId) fetch('/api/draft', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forge-Token': token }, body: JSON.stringify({ lessonId: currentId, code: sourceCode() }), keepalive: true }).catch(() => {});
});

try {
  const session = await api('session');
  ({ course, progress, environment: env, token } = session);
  allLessons = course.chapters.flatMap(ch => ch.lessons.map(lesson => ({ ...lesson, chapterId: ch.id, trackId: ch.trackId })));
  await route();
} catch (error) {
  app.innerHTML = `<div class="boot-message"><span class="brand-mark">ϟ</span><h1>The workshop couldn’t open.</h1><p>${escape(error.message)}</p><p>Make sure the local server is running, then reload this page.</p></div>`;
}
