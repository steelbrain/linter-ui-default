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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url = __importStar(require("url"));
const react_1 = __importDefault(require("react"));
const marked_1 = __importDefault(require("marked"));
const helpers_1 = require("../helpers");
const fix_button_1 = __importDefault(require("./fix-button"));
function findHref(el) {
    while (el && !el.classList.contains('linter-line')) {
        if (el instanceof HTMLAnchorElement) {
            return el.href;
        }
        el = el.parentElement;
    }
    return null;
}
class MessageElement extends react_1.default.Component {
    constructor() {
        super(...arguments);
        this.state = {
            description: '',
            descriptionShow: false,
        };
        this.descriptionLoading = false;
    }
    componentDidMount() {
        this.props.delegate.onShouldUpdate(() => {
            this.setState({});
        });
        this.props.delegate.onShouldExpand(() => {
            if (!this.state.descriptionShow) {
                this.toggleDescription();
            }
        });
        this.props.delegate.onShouldCollapse(() => {
            if (this.state.descriptionShow) {
                this.toggleDescription();
            }
        });
    }
    onFixClick() {
        const message = this.props.message;
        const textEditor = helpers_1.getActiveTextEditor();
        if (message.version === 2 && message.solutions && message.solutions.length) {
            helpers_1.applySolution(textEditor, helpers_1.sortSolutions(message.solutions)[0]);
        }
    }
    openFile(ev) {
        if (!(ev.target instanceof HTMLElement)) {
            return;
        }
        const href = findHref(ev.target);
        if (!href) {
            return;
        }
        const { protocol, hostname, query } = url.parse(href, true);
        if (protocol !== 'atom:' || hostname !== 'linter') {
            return;
        }
        if (!query || !query.file) {
            return;
        }
        else {
            const { file, row, column } = query;
            helpers_1.openFile(Array.isArray(file) ? file[0] : file, {
                row: parseInt(Array.isArray(row) ? row[0] : row, 10) || 0,
                column: parseInt(Array.isArray(column) ? column[0] : column, 10) || 0,
            });
        }
    }
    canBeFixed(message) {
        if (message.version === 2 && message.solutions && message.solutions.length) {
            return true;
        }
        return false;
    }
    toggleDescription(result = null) {
        const newStatus = !this.state.descriptionShow;
        const description = this.state.description || this.props.message.description;
        if (!newStatus && !result) {
            this.setState({ descriptionShow: false });
            return;
        }
        if (typeof description === 'string' || result) {
            const descriptionToUse = marked_1.default(result || description);
            this.setState({ descriptionShow: true, description: descriptionToUse });
        }
        else if (typeof description === 'function') {
            this.setState({ descriptionShow: true });
            if (this.descriptionLoading) {
                return;
            }
            this.descriptionLoading = true;
            new Promise(function (resolve) {
                resolve(description());
            })
                .then(response => {
                if (typeof response !== 'string') {
                    throw new Error(`Expected result to be string, got: ${typeof response}`);
                }
                this.toggleDescription(response);
            })
                .catch(error => {
                console.log('[Linter] Error getting descriptions', error);
                this.descriptionLoading = false;
                if (this.state.descriptionShow) {
                    this.toggleDescription();
                }
            });
        }
        else {
            console.error('[Linter] Invalid description detected, expected string or function but got:', typeof description);
        }
    }
    render() {
        const { message, delegate } = this.props;
        return (react_1.default.createElement("linter-message", { class: message.severity, onClick: this.openFile },
            message.description && (react_1.default.createElement("a", { href: "#", onClick: () => this.toggleDescription() },
                react_1.default.createElement("span", { className: `icon linter-icon icon-${this.state.descriptionShow ? 'chevron-down' : 'chevron-right'}` }))),
            react_1.default.createElement("linter-excerpt", null,
                this.canBeFixed(message) && react_1.default.createElement(fix_button_1.default, { onClick: () => this.onFixClick() }),
                delegate.showProviderName ? `${message.linterName}: ` : '',
                message.excerpt),
            ' ',
            message.reference && message.reference.file && (react_1.default.createElement("a", { href: "#", onClick: () => helpers_1.visitMessage(message, true) },
                react_1.default.createElement("span", { className: "icon linter-icon icon-alignment-aligned-to" }))),
            message.url && (react_1.default.createElement("a", { href: "#", onClick: () => helpers_1.openExternally(message) },
                react_1.default.createElement("span", { className: "icon linter-icon icon-link" }))),
            this.state.descriptionShow && (react_1.default.createElement("div", { dangerouslySetInnerHTML: {
                    __html: this.state.description || 'Loading...',
                }, className: "linter-line" }))));
    }
}
exports.default = MessageElement;
//# sourceMappingURL=message.js.map