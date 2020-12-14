"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const helpers_1 = require("../helpers");
class PanelDelegate {
    constructor() {
        this.emitter = new atom_1.Emitter();
        this.messages = [];
        this.filteredMessages = [];
        this.subscriptions = new atom_1.CompositeDisposable();
        this.subscriptions.add(atom.config.observe('linter-ui-default.panelRepresents', panelRepresents => {
            const notInitial = typeof this.panelRepresents !== 'undefined';
            this.panelRepresents = panelRepresents;
            if (notInitial) {
                this.update();
            }
        }));
        let changeSubscription;
        this.subscriptions.add(atom.workspace.getCenter().observeActivePaneItem(() => {
            if (changeSubscription) {
                changeSubscription.dispose();
                changeSubscription = null;
            }
            const textEditor = helpers_1.getActiveTextEditor();
            if (textEditor) {
                if (this.panelRepresents !== 'Entire Project') {
                    this.update();
                }
                let oldRow = -1;
                changeSubscription = textEditor.onDidChangeCursorPosition(({ newBufferPosition }) => {
                    if (oldRow !== newBufferPosition.row && this.panelRepresents === 'Current Line') {
                        oldRow = newBufferPosition.row;
                        this.update();
                    }
                });
            }
            if (this.panelRepresents !== 'Entire Project' || textEditor) {
                this.update();
            }
        }));
        this.subscriptions.add(new atom_1.Disposable(function () {
            if (changeSubscription) {
                changeSubscription.dispose();
            }
        }));
    }
    getFilteredMessages() {
        let filteredMessages = [];
        if (this.panelRepresents === 'Entire Project') {
            filteredMessages = this.messages;
        }
        else if (this.panelRepresents === 'Current File') {
            const activeEditor = helpers_1.getActiveTextEditor();
            if (!activeEditor)
                return [];
            filteredMessages = helpers_1.filterMessages(this.messages, activeEditor.getPath());
        }
        else if (this.panelRepresents === 'Current Line') {
            const activeEditor = helpers_1.getActiveTextEditor();
            if (!activeEditor)
                return [];
            const activeLine = activeEditor.getCursors()[0].getBufferRow();
            filteredMessages = helpers_1.filterMessagesByRangeOrPoint(this.messages, activeEditor.getPath(), atom_1.Range.fromObject([
                [activeLine, 0],
                [activeLine, Infinity],
            ]));
        }
        return filteredMessages;
    }
    update(messages = null) {
        if (Array.isArray(messages)) {
            this.messages = messages;
        }
        this.filteredMessages = this.getFilteredMessages();
        this.emitter.emit('observe-messages', this.filteredMessages);
    }
    onDidChangeMessages(callback) {
        return this.emitter.on('observe-messages', callback);
    }
    dispose() {
        this.subscriptions.dispose();
    }
}
exports.default = PanelDelegate;
//# sourceMappingURL=delegate.js.map