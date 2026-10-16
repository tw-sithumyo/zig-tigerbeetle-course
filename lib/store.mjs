import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './config.mjs';
import { lessonById } from './course.mjs';

export function createStore(directory = DATA_DIR) {
  mkdirSync(directory, { recursive: true });
  const file = path.join(directory, 'progress.json');
  const empty = () => ({ schema: 1, completed: {}, drafts: {}, quizzes: {}, solutionsViewed: {}, lastLesson: 'welcome', lastByTrack: {} });
  let state = empty();
  if (existsSync(file)) {
    try {
      const saved = JSON.parse(readFileSync(file, 'utf8'));
      if (saved.schema !== 1 || !saved.completed || !saved.drafts || !saved.quizzes) throw new Error('Unknown progress format');
      state = { ...state, ...saved };
    } catch (error) {
      throw new Error(`Could not read ${file}. Your saved progress was preserved. ${error.message}`);
    }
  }
  const persist = () => {
    writeFileSync(`${file}.tmp`, JSON.stringify(state, null, 2), { mode: 0o600 });
    renameSync(`${file}.tmp`, file);
  };
  return {
    snapshot() {
      const xp = Object.keys(state.completed).reduce((sum, id) => {
        const lesson = lessonById.get(id);
        return sum + (lesson?.kind === 'exercise' ? 100 : lesson?.kind === 'quiz' ? 75 : lesson ? 25 : 0);
      }, 0);
      return structuredClone({ ...state, xp });
    },
    saveDraft(id, code) { state.drafts[id] = code; persist(); },
    visit(id) { state.lastLesson = id; const trackId = lessonById.get(id)?.trackId; if (trackId) state.lastByTrack[trackId] = id; persist(); },
    complete(id) {
      if (!state.completed[id]) { state.completed[id] = new Date().toISOString(); persist(); }
    },
    saveQuiz(id, answers, result) {
      state.quizzes[id] = { answers, ...result };
      if (result.passed && !state.completed[id]) state.completed[id] = new Date().toISOString();
      persist();
    },
    reveal(id) { state.solutionsViewed[id] = true; persist(); },
  };
}
