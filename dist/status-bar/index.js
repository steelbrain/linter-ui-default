"use strict";
var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const element_1 = __importDefault(require("./element"));
const helpers_1 = require("../helpers");
class StatusBar {
  constructor() {
    this.element = new element_1.default();
    this.messages = [];
    this.subscriptions = new atom_1.CompositeDisposable();
    this.subscriptions.add(this.element, atom.config.observe('linter-ui-default.statusBarRepresents', statusBarRepresents => {
      const notInitial = typeof this.statusBarRepresents !== 'undefined';
      this.statusBarRepresents = statusBarRepresents;
      if (notInitial) {
        this.update();
      }
    }), atom.config.observe('linter-ui-default.statusBarClickBehavior', statusBarClickBehavior => {
      const notInitial = typeof this.statusBarClickBehavior !== 'undefined';
      this.statusBarClickBehavior = statusBarClickBehavior;
      if (notInitial) {
        this.update();
      }
    }), atom.config.observe('linter-ui-default.showStatusBar', showStatusBar => {
      this.element.setVisibility('config', showStatusBar);
    }), atom.workspace.getCenter().observeActivePaneItem(paneItem => {
      const isTextEditor = atom.workspace.isTextEditor(paneItem);
      this.element.setVisibility('pane', isTextEditor);
      if (isTextEditor && this.statusBarRepresents === 'Current File') {
        this.update();
      }
    }));
    this.element.onDidClick(type => {
      const workspaceView = atom.views.getView(atom.workspace);
      if (this.statusBarClickBehavior === 'Toggle Panel') {
        atom.commands.dispatch(workspaceView, 'linter-ui-default:toggle-panel');
      } else
      if (this.statusBarClickBehavior === 'Toggle Status Bar Scope') {
        atom.config.set('linter-ui-default.statusBarRepresents', this.statusBarRepresents === 'Entire Project' ? 'Current File' : 'Entire Project');
      } else
      {
        const postfix = this.statusBarRepresents === 'Current File' ? '-in-current-file' : '';
        atom.commands.dispatch(workspaceView, `linter-ui-default:next-${type}${postfix}`);
      }
    });
  }
  update(messages = null) {
    if (messages) {
      this.messages = messages;
    } else
    {
      messages = this.messages;
    }
    const count = { error: 0, warning: 0, info: 0 };
    const currentTextEditor = helpers_1.getActiveTextEditor();
    const currentPath = currentTextEditor && currentTextEditor.getPath() || NaN;
    messages.forEach(message => {
      if (this.statusBarRepresents === 'Entire Project' || helpers_1.$file(message) === currentPath) {
        if (message.severity === 'error') {
          count.error++;
        } else
        if (message.severity === 'warning') {
          count.warning++;
        } else
        {
          count.info++;
        }
      }
    });
    this.element.update(count.error, count.warning, count.info);
  }
  attach(statusBarRegistry) {
    let statusBar = null;
    this.subscriptions.add(atom.config.observe('linter-ui-default.statusBarPosition', statusBarPosition => {
      if (statusBar) {
        statusBar.destroy();
      }
      statusBar = statusBarRegistry[`add${statusBarPosition}Tile`]({
        item: this.element.item,
        priority: statusBarPosition === 'Left' ? 0 : 1000 });

    }));
    this.subscriptions.add(new atom_1.Disposable(function () {
      if (statusBar) {
        statusBar.destroy();
      }
    }));
  }
  dispose() {
    this.subscriptions.dispose();
  }}

exports.default = StatusBar;module.exports = exports.default;