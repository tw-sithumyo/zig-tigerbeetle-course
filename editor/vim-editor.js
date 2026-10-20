import { basicSetup } from 'codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import { StreamLanguage, HighlightStyle, syntaxHighlighting, indentUnit } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { vim, Vim, getCM } from '@replit/codemirror-vim';

const actions = new WeakMap();
Vim.defineEx('write', 'w', cm => actions.get(cm)?.save());

const language = StreamLanguage.define({
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match('//')) { stream.skipToEnd(); return 'comment'; }
    if (stream.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/)) return 'string';
    if (stream.match(/@[A-Za-z_][A-Za-z_0-9]*/)) return 'variableName.special';
    if (stream.match(/\b(?:pub|fn|const|var|return|if|else|for|while|switch|break|continue|try|catch|defer|errdefer|comptime|struct|enum|union|test|true|false|null|undefined|and|or|orelse|error)\b/)) return 'keyword';
    if (stream.match(/\b(?:u\d+|i\d+|f\d+|usize|isize|void|bool|type|anytype)\b/)) return 'typeName';
    if (stream.match(/\b(?:0x[\da-fA-F]+|\d+(?:\.\d+)?)\b/)) return 'number';
    stream.next();
    return null;
  },
});
const colors = HighlightStyle.define([
  { tag: tags.keyword, color: '#d4ad83' },
  { tag: tags.string, color: '#a8bf83' },
  { tag: tags.comment, color: '#7f8a73' },
  { tag: tags.number, color: '#c4ad7c' },
  { tag: tags.typeName, color: '#9eb9a9' },
  { tag: tags.special(tags.variableName), color: '#b3a6cc' },
]);
const theme = EditorView.theme({
  '&': { height: '100%', backgroundColor: '#171b15', color: '#d9dfcf', fontSize: 'var(--editor-font-size)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '1.6', overflow: 'auto' },
  '.cm-content': { padding: '15px 0', caretColor: '#d6b887' },
  '.cm-line': { padding: '0 14px' },
  '.cm-gutters': { backgroundColor: '#171b15', color: '#6f7c63', borderRight: '1px solid #2a3224' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#242c20' },
  '.cm-cursor': { borderLeftColor: '#d6b887' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: '#4a5939' },
  '.cm-panels': { backgroundColor: '#20291c', color: '#d9dfcf', flex: '0 0 auto', maxHeight: '3em', overflow: 'auto' },
  '.cm-textfield': { backgroundColor: '#171b15', color: '#d9dfcf', border: '1px solid #667357' },
  '.cm-vim-panel': { padding: '2px 10px', fontFamily: 'var(--mono)', fontSize: '0.75rem', lineHeight: '1.5', minHeight: '1.5em', maxHeight: '2.5em', overflow: 'auto' },
  '.cm-vim-panel input': { font: 'inherit', height: '1.5em', minWidth: '0', maxWidth: '100%', padding: '0' },
  '.cm-tooltip': { backgroundColor: '#20291c', border: '1px solid #667357' },
}, { dark: true });

export function createVimEditor({ parent, onChange, onCursor, onMode, onSave, onRun }) {
  const buffers = new Map();
  let activeKey, view, cm;
  const modeChanged = event => onMode(`${event.mode}${event.subMode ? ` ${event.subMode === 'linewise' ? 'line' : 'block'}` : ''}`.toUpperCase());
  const cursorChanged = () => {
    const position = view.state.selection.main.head;
    const line = view.state.doc.lineAt(position);
    onCursor(line.number, position - line.from + 1);
  };
  const createState = ({ doc, readOnly, label }) => EditorState.create({
    doc,
    extensions: [
      vim({ status: false }),
      basicSetup,
      keymap.of([indentWithTab]),
      EditorState.tabSize.of(4), indentUnit.of('    '),
      EditorState.readOnly.of(readOnly),
      // Includes Ex commands, undo, paste, and normal-mode operators on Tests.
      EditorState.transactionFilter.of(tr => readOnly && tr.docChanged ? [] : tr),
      EditorView.contentAttributes.of({ 'aria-label': label, 'aria-readonly': String(readOnly), spellcheck: 'false' }),
      language, syntaxHighlighting(colors), theme,
      EditorView.updateListener.of(update => {
        if (update.view !== view) return;
        if (update.docChanged && !readOnly) onChange(update.state.doc.toString());
        if (update.selectionSet || update.docChanged) cursorChanged();
      }),
    ],
  });
  const modeLabel = () => {
    const state = cm.state.vim;
    if (state?.insertMode) return 'INSERT';
    if (state?.visualMode) return `VISUAL${state.visualLine ? ' LINE' : state.visualBlock ? ' BLOCK' : ''}`;
    return 'NORMAL';
  };
  return {
    show({ doc, readOnly, label, key }) {
      if (activeKey !== key) {
        if (activeKey !== undefined) buffers.get(activeKey).host.hidden = true;
        activeKey = key;
        let buffer = buffers.get(key);
        if (!buffer) {
          const host = document.createElement('div');
          host.className = 'vim-buffer';
          parent.append(host);
          view = new EditorView({ state: createState({ doc, readOnly, label }), parent: host });
          cm = getCM(view);
          cm.on('vim-mode-change', modeChanged);
          actions.set(cm, { save: () => onSave() });
          const bufferView = view;
          view.dom.addEventListener('keydown', event => {
            if (event.key === 'Tab' && !getCM(bufferView)?.state.vim?.insertMode) { event.stopPropagation(); return; }
            if (!(event.ctrlKey || event.metaKey)) return;
            if (event.key === 'Enter' || event.key.toLowerCase() === 's') {
              event.preventDefault(); event.stopPropagation();
              if (event.key === 'Enter') onRun(); else onSave();
            }
          }, true);
          buffer = { view, cm, host };
          buffers.set(key, buffer);
        }
        ({ view, cm } = buffer);
        buffer.host.hidden = false;
        onMode(modeLabel());
        cursorChanged();
        view.requestMeasure();
      }
      if (view.state.doc.toString() !== doc) {
        // Formatting and loading a solution remain undoable in the source buffer.
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: doc } });
      }
    },
    focus() { view?.focus(); },
    measure() { for (const buffer of buffers.values()) buffer.view.requestMeasure(); },
    selection() { return view?.state.selection.main; },
    select(anchor, head = anchor) {
      const end = view.state.doc.length;
      view.dispatch({ selection: { anchor: Math.min(anchor, end), head: Math.min(head, end) } });
    },
    destroy() {
      for (const buffer of buffers.values()) {
        buffer.cm.off('vim-mode-change', modeChanged);
        actions.delete(buffer.cm);
        buffer.view.destroy();
        buffer.host.remove();
      }
      buffers.clear();
    },
  };
}
