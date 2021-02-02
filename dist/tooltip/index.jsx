"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web_1 = require("solid-js/web");
const atom_1 = require("atom");
const delegate_1 = __importDefault(require("./delegate"));
const message_1 = __importDefault(require("./message"));
const helpers_1 = require("../helpers");
class TooltipElement {
    constructor(messages, position, textEditor) {
        this.element = document.createElement('div');
        this.emitter = new atom_1.Emitter();
        this.subscriptions = new atom_1.CompositeDisposable();
        this.messages = messages;
        this.marker = textEditor.markBufferRange([position, position]);
        this.marker.onDidDestroy(() => this.emitter.emit('did-destroy'));
        const delegate = new delegate_1.default();
        this.element.id = 'linter-tooltip';
        textEditor.decorateMarker(this.marker, {
            type: 'overlay',
            item: this.element,
        });
        this.subscriptions.add(this.emitter, delegate);
        const children = [];
        messages.forEach(message => {
            if (message.version === 2) {
                children.push(<message_1.default key={message.key} delegate={delegate} message={message}/>);
            }
        });
        web_1.render(() => <div className="linter-messages">{children}</div>, this.element);
        setTimeout(() => {
            const hight = this.element.getBoundingClientRect().height;
            const lineHight = textEditor.getLineHeightInPixels();
            const availableHight = (position.row - textEditor.getFirstVisibleScreenRow()) * lineHight;
            if (hight < availableHight) {
                const overlay = this.element.parentElement;
                if (overlay) {
                    overlay.style.transform = `translateY(-${2 + lineHight + hight}px)`;
                }
            }
            this.element.style.visibility = 'visible';
        }, 50);
    }
    isValid(position, messages) {
        if (this.messages.length !== 1 || !messages.has(this.messages[0].key)) {
            return false;
        }
        const range = helpers_1.$range(this.messages[0]);
        return Boolean(range && range.containsPoint(position));
    }
    onDidDestroy(callback) {
        return this.emitter.on('did-destroy', callback);
    }
    dispose() {
        this.emitter.emit('did-destroy');
        this.subscriptions.dispose();
    }
}
exports.default = TooltipElement;
//# sourceMappingURL=index.jsx.map