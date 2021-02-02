"use strict";
var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const editor_1 = __importDefault(require("./editor"));
const helpers_1 = require("./helpers");
class Editors {
  constructor() {
    this.editors = new Set();
    this.messages = [];
    this.firstRender = true;
    this.subscriptions = new atom_1.CompositeDisposable();
    this.subscriptions.add(atom.workspace.observeTextEditors(textEditor => {
      if (helpers_1.isLargeFile(textEditor)) {
        const notif = atom.notifications.addWarning('Linter: Large/Minified file detected', {
          detail: 'Adding inline linter markers are skipped for this file for performance reasons (linter pane is still active)',
          dismissable: true,
          buttons: [
          {
            text: 'Force enable',
            onDidClick: () => {
              this.getEditor(textEditor);
              notif.dismiss();
            } },

          {
            text: 'Change threshold',
            onDidClick: async () => {
              var _a;
              await atom.workspace.open('atom://config/packages/linter-ui-default');
              (_a = document.querySelectorAll('.control-group')[16]) === null || _a === void 0 ? void 0 : _a.scrollIntoView();
              notif.dismiss();
            } }] });



        setTimeout(() => {
          notif.dismiss();
        }, 5000);
        return;
      }
      this.getEditor(textEditor);
    }), atom.workspace.getCenter().observeActivePaneItem(paneItem => {
      this.editors.forEach(editor => {
        if (editor.textEditor !== paneItem) {
          editor.removeTooltip();
        }
      });
    }));
  }
  isFirstRender() {
    return this.firstRender;
  }
  update({ messages, added, removed }) {
    this.messages = messages;
    this.firstRender = false;
    const { editorsMap, filePaths } = helpers_1.getEditorsMap(this);
    added.forEach(function (message) {
      if (!message || !message.location) {
        return;
      }
      const filePath = helpers_1.$file(message);
      if (filePath && editorsMap.has(filePath)) {
        editorsMap.get(filePath).added.push(message);
      }
    });
    removed.forEach(function (message) {
      if (!message || !message.location) {
        return;
      }
      const filePath = helpers_1.$file(message);
      if (filePath && editorsMap.has(filePath)) {
        editorsMap.get(filePath).removed.push(message);
      }
    });
    filePaths.forEach(function (filePath) {
      if (editorsMap.has(filePath)) {
        const { added, removed, editors } = editorsMap.get(filePath);
        if (added.length || removed.length) {
          editors.forEach(editor => editor.apply(added, removed));
        }
      }
    });
  }
  getEditor(textEditor) {
    for (const entry of this.editors) {
      if (entry.textEditor === textEditor) {
        return entry;
      }
    }
    const editor = new editor_1.default(textEditor);
    this.editors.add(editor);
    editor.onDidDestroy(() => {
      this.editors.delete(editor);
    });
    editor.subscriptions.add(textEditor.onDidChangePath(() => {
      editor.dispose();
      this.getEditor(textEditor);
    }));
    editor.subscriptions.add(textEditor.onDidChangeGrammar(() => {
      editor.dispose();
      this.getEditor(textEditor);
    }));
    editor.apply(helpers_1.filterMessages(this.messages, textEditor.getPath()), []);
    return editor;
  }
  dispose() {
    for (const entry of this.editors) {
      entry.dispose();
    }
    this.subscriptions.dispose();
  }}

exports.default = Editors;module.exports = exports.default;