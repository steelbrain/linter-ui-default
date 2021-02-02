"use strict";var _$template = require("solid-js/web").template;var _$delegateEvents = require("solid-js/web").delegateEvents;const _tmpl$ = _$template(`<button class="fix-btn">Fix</button>`, 2);
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixButton = void 0;
function FixButton(props) {
  return (() => {const _el$ = _tmpl$.cloneNode(true);_el$.__click = props.onClick;return _el$;})();


}
exports.FixButton = FixButton;_$delegateEvents(["click"]);