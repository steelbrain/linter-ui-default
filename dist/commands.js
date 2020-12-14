"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const atom_1 = require("atom");
const helpers_1 = require("./helpers");
class Commands {
    constructor() {
        this.messages = [];
        this.subscriptions = new atom_1.CompositeDisposable();
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'linter-ui-default:next': () => this.move(true, true),
            'linter-ui-default:previous': () => this.move(false, true),
            'linter-ui-default:next-error': () => this.move(true, true, 'error'),
            'linter-ui-default:previous-error': () => this.move(false, true, 'error'),
            'linter-ui-default:next-warning': () => this.move(true, true, 'warning'),
            'linter-ui-default:previous-warning': () => this.move(false, true, 'warning'),
            'linter-ui-default:next-info': () => this.move(true, true, 'info'),
            'linter-ui-default:previous-info': () => this.move(false, true, 'info'),
            'linter-ui-default:next-in-current-file': () => this.move(true, false),
            'linter-ui-default:previous-in-current-file': () => this.move(false, false),
            'linter-ui-default:next-error-in-current-file': () => this.move(true, false, 'error'),
            'linter-ui-default:previous-error-in-current-file': () => this.move(false, false, 'error'),
            'linter-ui-default:next-warning-in-current-file': () => this.move(true, false, 'warning'),
            'linter-ui-default:previous-warning-in-current-file': () => this.move(false, false, 'warning'),
            'linter-ui-default:next-info-in-current-file': () => this.move(true, false, 'info'),
            'linter-ui-default:previous-info-in-current-file': () => this.move(false, false, 'info'),
            'linter-ui-default:toggle-panel': () => this.togglePanel(),
            'linter-ui-default:expand-tooltip': function () { },
            'linter-ui-default:collapse-tooltip': function () { },
        }));
        this.subscriptions.add(atom.commands.add('atom-text-editor:not([mini])', {
            'linter-ui-default:apply-all-solutions': () => this.applyAllSolutions(),
        }));
        this.subscriptions.add(atom.commands.add('#linter-panel', {
            'core:copy': () => {
                const selection = document.getSelection();
                if (selection) {
                    atom.clipboard.write(selection.toString());
                }
            },
        }));
    }
    togglePanel() {
        atom.config.set('linter-ui-default.showPanel', !atom.config.get('linter-ui-default.showPanel'));
    }
    applyAllSolutions() {
        const textEditor = helpers_1.getActiveTextEditor();
        assert_1.default(textEditor, 'textEditor was null on a command supposed to run on text-editors only');
        const messages = helpers_1.sortMessages([{ column: 'line', type: 'desc' }], helpers_1.filterMessages(this.messages, textEditor.getPath()));
        messages.forEach(function (message) {
            if (message.version === 2 && message.solutions && message.solutions.length) {
                helpers_1.applySolution(textEditor, helpers_1.sortSolutions(message.solutions)[0]);
            }
        });
    }
    move(forward, globally, severity = null) {
        const currentEditor = helpers_1.getActiveTextEditor();
        const currentFile = (currentEditor && currentEditor.getPath()) || NaN;
        const messages = helpers_1.sortMessages([
            { column: 'file', type: 'asc' },
            { column: 'line', type: 'asc' },
        ], helpers_1.filterMessages(this.messages, globally ? null : currentFile, severity));
        const expectedValue = forward ? -1 : 1;
        if (!currentEditor) {
            const message = forward ? messages[0] : messages[messages.length - 1];
            if (message) {
                helpers_1.visitMessage(message);
            }
            return;
        }
        const currentPosition = currentEditor.getCursorBufferPosition();
        if (!forward) {
            messages.reverse();
        }
        let found;
        let currentFileEncountered = false;
        for (let i = 0, length = messages.length; i < length; i++) {
            const message = messages[i];
            const messageFile = helpers_1.$file(message);
            const messageRange = helpers_1.$range(message);
            if (!currentFileEncountered && messageFile === currentFile) {
                currentFileEncountered = true;
            }
            if (messageFile && messageRange) {
                if (currentFileEncountered && messageFile !== currentFile) {
                    found = message;
                    break;
                }
                else if (messageFile === currentFile && currentPosition.compare(messageRange.start) === expectedValue) {
                    found = message;
                    break;
                }
            }
        }
        if (!found && messages.length) {
            found = messages[0];
        }
        if (found) {
            helpers_1.visitMessage(found);
        }
    }
    update(messages) {
        this.messages = messages;
    }
    dispose() {
        this.subscriptions.dispose();
    }
}
exports.default = Commands;
//# sourceMappingURL=commands.js.map