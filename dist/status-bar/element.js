"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const Helpers = __importStar(require("./helpers"));
class Element {
    constructor() {
        this.item = document.createElement('div');
        this.itemErrors = Helpers.getElement('stop');
        this.itemWarnings = Helpers.getElement('alert');
        this.itemInfos = Helpers.getElement('info');
        this.emitter = new atom_1.Emitter();
        this.subscriptions = new atom_1.CompositeDisposable();
        this.item.appendChild(this.itemErrors);
        this.item.appendChild(this.itemWarnings);
        this.item.appendChild(this.itemInfos);
        this.item.classList.add('inline-block');
        this.item.classList.add('linter-status-count');
        this.subscriptions.add(this.emitter);
        this.subscriptions.add(atom.tooltips.add(this.itemErrors, { title: 'Linter Errors' }));
        this.subscriptions.add(atom.tooltips.add(this.itemWarnings, { title: 'Linter Warnings' }));
        this.subscriptions.add(atom.tooltips.add(this.itemInfos, { title: 'Linter Infos' }));
        this.itemErrors.onclick = () => this.emitter.emit('click', 'error');
        this.itemWarnings.onclick = () => this.emitter.emit('click', 'warning');
        this.itemInfos.onclick = () => this.emitter.emit('click', 'info');
        this.update(0, 0, 0);
    }
    setVisibility(prefix, visibility) {
        if (visibility) {
            this.item.classList.remove(`hide-${prefix}`);
        }
        else {
            this.item.classList.add(`hide-${prefix}`);
        }
    }
    update(countErrors, countWarnings, countInfos) {
        this.itemErrors.childNodes[0].textContent = String(countErrors);
        this.itemWarnings.childNodes[0].textContent = String(countWarnings);
        this.itemInfos.childNodes[0].textContent = String(countInfos);
        if (countErrors) {
            this.itemErrors.classList.add('text-error');
        }
        else {
            this.itemErrors.classList.remove('text-error');
        }
        if (countWarnings) {
            this.itemWarnings.classList.add('text-warning');
        }
        else {
            this.itemWarnings.classList.remove('text-warning');
        }
        if (countInfos) {
            this.itemInfos.classList.add('text-info');
        }
        else {
            this.itemInfos.classList.remove('text-info');
        }
    }
    onDidClick(callback) {
        return this.emitter.on('click', callback);
    }
    dispose() {
        this.subscriptions.dispose();
    }
}
exports.default = Element;
//# sourceMappingURL=element.js.map