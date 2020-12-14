"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const lodash_1 = require("lodash");
const disposable_event_1 = __importDefault(require("disposable-event"));
const helpers_1 = require("./helpers");
class TreeView {
    constructor() {
        this.emitter = new atom_1.Emitter();
        this.messages = [];
        this.decorations = {};
        this.subscriptions = new atom_1.CompositeDisposable();
        this.subscriptions.add(this.emitter);
        this.subscriptions.add(atom.config.observe('linter-ui-default.decorateOnTreeView', decorateOnTreeView => {
            if (typeof this.decorateOnTreeView === 'undefined') {
                this.decorateOnTreeView = decorateOnTreeView;
            }
            else if (decorateOnTreeView === 'None') {
                this.update([]);
                this.decorateOnTreeView = decorateOnTreeView;
            }
            else {
                const messages = this.messages;
                this.decorateOnTreeView = decorateOnTreeView;
                this.update(messages);
            }
        }));
        setTimeout(() => {
            const element = TreeView.getElement();
            if (!element) {
                return;
            }
            this.subscriptions.add(disposable_event_1.default(element, 'click', lodash_1.debounce(() => {
                this.update();
            })));
        }, 100);
    }
    update(givenMessages = null) {
        if (Array.isArray(givenMessages)) {
            this.messages = givenMessages;
        }
        const messages = this.messages;
        const element = TreeView.getElement();
        const decorateOnTreeView = this.decorateOnTreeView;
        if (!element || decorateOnTreeView === 'None') {
            return;
        }
        this.applyDecorations(helpers_1.calculateDecorations(decorateOnTreeView, messages));
    }
    applyDecorations(decorations) {
        const treeViewElement = TreeView.getElement();
        if (!treeViewElement) {
            return;
        }
        const elementCache = {};
        const appliedDecorations = {};
        Object.keys(this.decorations).forEach(filePath => {
            if (!{}.hasOwnProperty.call(this.decorations, filePath)) {
                return;
            }
            if (!decorations[filePath]) {
                const element = elementCache[filePath] || (elementCache[filePath] = TreeView.getElementByPath(treeViewElement, filePath));
                if (element) {
                    this.removeDecoration(element);
                }
            }
        });
        Object.keys(decorations).forEach(filePath => {
            if (!{}.hasOwnProperty.call(decorations, filePath)) {
                return;
            }
            const element = elementCache[filePath] || (elementCache[filePath] = TreeView.getElementByPath(treeViewElement, filePath));
            if (element) {
                this.handleDecoration(element, !!this.decorations[filePath], decorations[filePath]);
                appliedDecorations[filePath] = decorations[filePath];
            }
        });
        this.decorations = appliedDecorations;
    }
    handleDecoration(element, update = false, highlights) {
        let decoration;
        if (update) {
            decoration = element.querySelector('linter-decoration');
        }
        if (decoration) {
            decoration.className = '';
        }
        else {
            decoration = document.createElement('linter-decoration');
            element.appendChild(decoration);
        }
        if (highlights.error) {
            decoration.classList.add('linter-error');
        }
        else if (highlights.warning) {
            decoration.classList.add('linter-warning');
        }
        else if (highlights.info) {
            decoration.classList.add('linter-info');
        }
    }
    removeDecoration(element) {
        const decoration = element.querySelector('linter-decoration');
        if (decoration) {
            decoration.remove();
        }
    }
    dispose() {
        this.subscriptions.dispose();
    }
    static getElement() {
        return document.querySelector('.tree-view');
    }
    static getElementByPath(parent, filePath) {
        return parent.querySelector(`[data-path=${CSS.escape(filePath)}]`);
    }
}
exports.default = TreeView;
//# sourceMappingURL=index.js.map