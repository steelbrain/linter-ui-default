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
const solid_js_1 = require("solid-js");
const url = __importStar(require("url"));
const marked_1 = __importDefault(require("marked"));
const helpers_1 = require("../helpers");
const fix_button_1 = require("./fix-button");
function findHref(el) {
    while (el && !el.classList.contains('linter-line')) {
        if (el instanceof HTMLAnchorElement) {
            return el.href;
        }
        el = el.parentElement;
    }
    return null;
}
function MessageElement(props) {
    const [state, setState] = solid_js_1.createState({
        description: '',
        descriptionShow: false,
    });
    const [descriptionLoading, setDescriptionLoading] = solid_js_1.createSignal(false);
    function onFixClick() {
        const message = props.message;
        const textEditor = helpers_1.getActiveTextEditor();
        if (textEditor !== null && message.version === 2 && message.solutions && message.solutions.length) {
            helpers_1.applySolution(textEditor, helpers_1.sortSolutions(message.solutions)[0]);
        }
    }
    function toggleDescription(result = null) {
        const newStatus = !state.descriptionShow;
        const description = state.description || props.message.description;
        if (!newStatus && !result) {
            setState({ ...state, descriptionShow: false });
            return;
        }
        if (typeof description === 'string' || result) {
            const descriptionToUse = marked_1.default(result || description);
            setState({ description: descriptionToUse, descriptionShow: true });
        }
        else if (typeof description === 'function') {
            setState({ ...state, descriptionShow: true });
            if (descriptionLoading()) {
                return;
            }
            setDescriptionLoading(true);
            new Promise(function (resolve) {
                resolve(description());
            })
                .then(response => {
                if (typeof response !== 'string') {
                    throw new Error(`Expected result to be string, got: ${typeof response}`);
                }
                toggleDescription(response);
            })
                .catch(error => {
                console.log('[Linter] Error getting descriptions', error);
                setDescriptionLoading(false);
                if (state.descriptionShow) {
                    toggleDescription();
                }
            });
        }
        else {
            console.error('[Linter] Invalid description detected, expected string or function but got:', typeof description);
        }
    }
    solid_js_1.onMount(() => {
        props.delegate.onShouldUpdate(() => {
            setState({ description: '', descriptionShow: false });
        });
        props.delegate.onShouldExpand(() => {
            if (!state.descriptionShow) {
                toggleDescription();
            }
        });
        props.delegate.onShouldCollapse(() => {
            if (state.descriptionShow) {
                toggleDescription();
            }
        });
    });
    const { message, delegate } = props;
    return (<div className="linter-message" onClick={thisOpenFile}>
      <div className={`linter-excerpt ${message.severity}`}>
        {message.description && (<a href="#" onClick={() => toggleDescription()}>
              <span className={`icon linter-icon icon-${state.descriptionShow ? 'chevron-down' : 'chevron-right'}`}/>
            </a>)}
        {canBeFixed(message) && <fix_button_1.FixButton onClick={() => onFixClick()}/>}
        <div className="linter-text">
          <div className="provider-name">
            {delegate.showProviderName ? `${message.linterName}: ` : ''}
          </div>
          {message.excerpt}
        </div>
        <div className="linter-buttons-right">
          {message.reference && message.reference.file && (<a href="#" onClick={() => helpers_1.visitMessage(message, true)}>
                <span className="icon linter-icon icon-alignment-aligned-to"/>
              </a>)}
          {message.url && (<a href="#" onClick={() => helpers_1.openExternally(message)}>
                <span className="icon linter-icon icon-link"/>
              </a>)}
        </div>
      </div>
      {state.descriptionShow && <div className="linter-line">{state.description || 'Loading...'}</div>}
    </div>);
}
exports.default = MessageElement;
function canBeFixed(message) {
    if (message.version === 2 && message.solutions && message.solutions.length) {
        return true;
    }
    return false;
}
function thisOpenFile(ev) {
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
            row: row ? parseInt(Array.isArray(row) ? row[0] : row, 10) : 0,
            column: column ? parseInt(Array.isArray(column) ? column[0] : column, 10) : 0,
        });
    }
}
//# sourceMappingURL=message.jsx.map