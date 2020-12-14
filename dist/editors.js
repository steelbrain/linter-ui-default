"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
            this.getEditor(textEditor);
        }));
        this.subscriptions.add(atom.workspace.getCenter().observeActivePaneItem(paneItem => {
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
            const value = editorsMap.get(filePath);
            if (value.added.length || value.removed.length) {
                value.editors.forEach(editor => editor.apply(value.added, value.removed));
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
    }
}
exports.default = Editors;
//# sourceMappingURL=editors.js.map