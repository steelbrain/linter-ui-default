"use strict";
var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const panel_1 = __importDefault(require("./panel"));
const commands_1 = __importDefault(require("./commands"));
const status_bar_1 = __importDefault(require("./status-bar"));
const busy_signal_1 = __importDefault(require("./busy-signal"));
const intentions_1 = __importDefault(require("./intentions"));
const editors_1 = __importDefault(require("./editors"));
const tree_view_1 = __importDefault(require("./tree-view"));
class LinterUI {
  constructor() {
    this.name = 'Linter';
    this.signal = new busy_signal_1.default();
    this.commands = new commands_1.default();
    this.messages = [];
    this.statusBar = new status_bar_1.default();
    this.intentions = new intentions_1.default();
    this.subscriptions = new atom_1.CompositeDisposable();
    this.idleCallbacks = new Set();
    this.subscriptions.add(this.signal, this.commands, this.statusBar);
    const obsShowPanelCB = window.requestIdleCallback(() => {
      this.idleCallbacks.delete(obsShowPanelCB);
      this.panel = new panel_1.default();
      this.panel.update(this.messages);
    });
    this.idleCallbacks.add(obsShowPanelCB);
    const obsShowDecorationsCB = window.requestIdleCallback(() => {
      this.idleCallbacks.delete(obsShowDecorationsCB);
      this.subscriptions.add(atom.config.observe('linter-ui-default.showDecorations', showDecorations => {
        if (showDecorations && !this.editors) {
          this.editors = new editors_1.default();
          this.editors.update({
            added: this.messages,
            removed: [],
            messages: this.messages });

        } else
        if (!showDecorations && this.editors) {
          this.editors.dispose();
          this.editors = null;
        }
      }));
    });
    this.idleCallbacks.add(obsShowDecorationsCB);
  }
  render(difference) {
    const editors = this.editors;
    this.messages = difference.messages;
    if (editors) {
      if (editors.isFirstRender()) {
        editors.update({
          added: difference.messages,
          removed: [],
          messages: difference.messages });

      } else
      {
        editors.update(difference);
      }
    }
    if (!this.treeview) {
      this.treeview = new tree_view_1.default();
      this.subscriptions.add(this.treeview);
    }
    this.treeview.update(difference.messages);
    if (this.panel) {
      this.panel.update(difference.messages);
    }
    this.commands.update(difference.messages);
    this.intentions.update(difference.messages);
    this.statusBar.update(difference.messages);
  }
  didBeginLinting(linter, filePath) {
    this.signal.didBeginLinting(linter, filePath);
  }
  didFinishLinting(linter, filePath) {
    this.signal.didFinishLinting(linter, filePath);
  }
  dispose() {
    this.idleCallbacks.forEach(callbackID => window.cancelIdleCallback(callbackID));
    this.idleCallbacks.clear();
    this.subscriptions.dispose();
    if (this.panel) {
      this.panel.dispose();
    }
    if (this.editors) {
      this.editors.dispose();
    }
  }}

exports.default = LinterUI;module.exports = exports.default;