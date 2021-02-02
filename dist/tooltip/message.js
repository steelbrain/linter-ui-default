"use strict";var _$template = require("solid-js/web").template;var _$delegateEvents = require("solid-js/web").delegateEvents;var _web = require("solid-js/web");const _tmpl$ = _$template(`<div class="linter-message"><div><div class="linter-text"><div class="provider-name"></div></div><div class="linter-buttons-right"></div></div></div>`, 10),_tmpl$2 = _$template(`<a href="#"><span></span></a>`, 4),_tmpl$3 = _$template(`<a href="#"><span class="icon linter-icon icon-alignment-aligned-to"></span></a>`, 4),_tmpl$4 = _$template(`<a href="#"><span class="icon linter-icon icon-link"></span></a>`, 4),_tmpl$5 = _$template(`<div class="linter-line"></div>`, 2);
var __createBinding = void 0 && (void 0).__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  Object.defineProperty(o, k2, { enumerable: true, get: function () {return m[k];} });
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault = void 0 && (void 0).__setModuleDefault || (Object.create ? function (o, v) {
  Object.defineProperty(o, "default", { enumerable: true, value: v });
} : function (o, v) {
  o["default"] = v;
});
var __importStar = void 0 && (void 0).__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
  return result;
};
var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
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
    descriptionShow: false });

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
    } else
    if (typeof description === 'function') {
      setState({ ...state, descriptionShow: true });
      if (descriptionLoading()) {
        return;
      }
      setDescriptionLoading(true);
      new Promise(function (resolve) {
        resolve(description());
      }).
      then(response => {
        if (typeof response !== 'string') {
          throw new Error(`Expected result to be string, got: ${typeof response}`);
        }
        toggleDescription(response);
      }).
      catch(error => {
        console.log('[Linter] Error getting descriptions', error);
        setDescriptionLoading(false);
        if (state.descriptionShow) {
          toggleDescription();
        }
      });
    } else
    {
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
  return (() => {const _el$ = _tmpl$.cloneNode(true),_el$2 = _el$.firstChild,_el$3 = _el$2.firstChild,_el$4 = _el$3.firstChild,_el$5 = _el$3.nextSibling;_el$.__click = thisOpenFile;(0, _web.insert)(_el$2, (() => {const _c$ = (0, _web.memo)(() => !!

      message.description, true);return () => _c$() && (() => {const _el$6 = _tmpl$2.cloneNode(true),_el$7 = _el$6.firstChild;_el$6.__click = () => toggleDescription();(0, _web.effect)(() => _el$7.className =
        `icon linter-icon icon-${state.descriptionShow ? 'chevron-down' : 'chevron-right'}`);return _el$6;})();})(), _el$3);(0, _web.insert)(_el$2, (() => {const _c$2 = (0, _web.memo)(() => !!

      canBeFixed(message), true);return () => _c$2() && (0, _web.createComponent)(fix_button_1.FixButton, { onClick: () => onFixClick() });})(), _el$3);(0, _web.insert)(_el$4, () =>


    delegate.showProviderName ? `${message.linterName}: ` : '');(0, _web.insert)(_el$3, () =>

    message.excerpt, null);(0, _web.insert)(_el$5, (() => {const _c$3 = (0, _web.memo)(() => !!(


      message.reference && message.reference.file), true);return () => _c$3() && (() => {const _el$8 = _tmpl$3.cloneNode(true);_el$8.__click = () => helpers_1.visitMessage(message, true);return _el$8;})();})(), null);(0, _web.insert)(_el$5, (() => {const _c$4 = (0, _web.memo)(() => !!


      message.url, true);return () => _c$4() && (() => {const _el$9 = _tmpl$4.cloneNode(true);_el$9.__click = () => helpers_1.openExternally(message);return _el$9;})();})(), null);(0, _web.insert)(_el$, (() => {const _c$5 = (0, _web.memo)(() => !!




      state.descriptionShow, true);return () => _c$5() && (() => {const _el$10 = _tmpl$5.cloneNode(true);(0, _web.insert)(_el$10, () => state.description || 'Loading...');return _el$10;})();})(), null);(0, _web.effect)(() => _el$2.className = `linter-excerpt ${message.severity}`);return _el$;})();

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
  } else
  {
    const { file, row, column } = query;
    helpers_1.openFile(Array.isArray(file) ? file[0] : file, {
      row: row ? parseInt(Array.isArray(row) ? row[0] : row, 10) : 0,
      column: column ? parseInt(Array.isArray(column) ? column[0] : column, 10) : 0 });

  }
}_$delegateEvents(["click"]);module.exports = exports.default;