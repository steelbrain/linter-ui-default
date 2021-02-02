// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function(modules, cache, entry, mainEntry, parcelRequireName, globalName) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        this
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x) {
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function(id, exports) {
    modules[id] = [
      function(require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  Object.defineProperty(newRequire, 'root', {
    get: function() {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function() {
        return mainExports;
      });

      // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }
})({"23LYH":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.activate = activate;
exports.deactivate = deactivate;
exports.provideUI = provideUI;
exports.provideIntentions = provideIntentions;
exports.consumeSignal = consumeSignal;
exports.consumeStatusBar = consumeStatusBar;

var _main = _interopRequireDefault(require("./main"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const idleCallbacks = new Set();
const instances = new Set();
let signalRegistry;
let statusBarRegistry;

function activate() {
  if (atom.config.get('linter-ui-default.useBusySignal')) {
    // This is a necessary evil, see steelbrain/linter#1355
    ;
    atom.packages.getLoadedPackage('linter-ui-default').metadata['package-deps'].push('busy-signal');
  }

  const callbackID = window.requestIdleCallback(function installLinterUIDefaultDeps() {
    idleCallbacks.delete(callbackID);

    if (!atom.inSpecMode()) {
      const {
        install
      } = require('atom-package-deps');

      install('linter-ui-default');
    }
  });
  idleCallbacks.add(callbackID);
}

function deactivate() {
  idleCallbacks.forEach(callbackID => window.cancelIdleCallback(callbackID));
  idleCallbacks.clear();

  for (const entry of instances) {
    entry.dispose();
  }

  instances.clear();
}

function provideUI() {
  const instance = new _main.default();
  instances.add(instance);

  if (signalRegistry) {
    instance.signal.attach(signalRegistry);
  }

  return instance;
} // TODO: use IntentionsListProvider as the return type


function provideIntentions() {
  return Array.from(instances).map(entry => entry.intentions);
}

function consumeSignal(signalService) {
  signalRegistry = signalService;
  instances.forEach(function (instance) {
    instance.signal.attach(signalRegistry);
  });
}

function consumeStatusBar(statusBarService) {
  statusBarRegistry = statusBarService;
  instances.forEach(function (instance) {
    instance.statusBar.attach(statusBarRegistry);
  });
}
},{"./main":"3ceS8"}],"3ceS8":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _atom = require("atom");

var _panel = _interopRequireDefault(require("./panel"));

var _commands = _interopRequireDefault(require("./commands"));

var _statusBar = _interopRequireDefault(require("./status-bar"));

var _busySignal = _interopRequireDefault(require("./busy-signal"));

var _intentions = _interopRequireDefault(require("./intentions"));

var _editors = _interopRequireDefault(require("./editors"));

var _treeView = _interopRequireDefault(require("./tree-view"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class LinterUI {
  constructor() {
    this.name = 'Linter';
    this.panel = void 0;
    this.signal = new _busySignal.default();
    this.editors = void 0;
    this.treeview = void 0;
    this.commands = new _commands.default();
    this.messages = [];
    this.statusBar = new _statusBar.default();
    this.intentions = new _intentions.default();
    this.subscriptions = new _atom.CompositeDisposable();
    this.idleCallbacks = new Set();
    this.subscriptions.add(this.signal, this.commands, this.statusBar);
    const obsShowPanelCB = window.requestIdleCallback(
    /* observeShowPanel */
    () => {
      this.idleCallbacks.delete(obsShowPanelCB);
      this.panel = new _panel.default();
      this.panel.update(this.messages);
    });
    this.idleCallbacks.add(obsShowPanelCB);
    const obsShowDecorationsCB = window.requestIdleCallback(
    /* observeShowDecorations */
    () => {
      this.idleCallbacks.delete(obsShowDecorationsCB);
      this.subscriptions.add(atom.config.observe('linter-ui-default.showDecorations', showDecorations => {
        if (showDecorations && !this.editors) {
          this.editors = new _editors.default();
          this.editors.update({
            added: this.messages,
            removed: [],
            messages: this.messages
          });
        } else if (!showDecorations && this.editors) {
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
          messages: difference.messages
        });
      } else {
        editors.update(difference);
      }
    } // Initialize the TreeView subscription if necessary


    if (!this.treeview) {
      this.treeview = new _treeView.default();
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
  }

}

exports.default = LinterUI;
module.exports = exports.default;
},{"./panel":"TLgdN","./commands":"AxazM","./status-bar":"78R5k","./busy-signal":"2vz1J","./intentions":"7LGDv","./editors":"4PoT2","./tree-view":"4M0qv"}],"TLgdN":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _atom = require("atom");

var _delegate = _interopRequireDefault(require("./delegate"));

var _dock = _interopRequireDefault(require("./dock"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Panel {
  constructor() {
    this.panel = null;
    this.element = document.createElement('div');
    this.delegate = new _delegate.default();
    this.messages = [];
    this.deactivating = false;
    this.subscriptions = new _atom.CompositeDisposable();
    this.showPanelConfig = true;
    this.hidePanelWhenEmpty = true;
    this.showPanelStateMessages = false;
    this.activationTimer = void 0;
    this.subscriptions.add(this.delegate, atom.config.observe('linter-ui-default.hidePanelWhenEmpty', hidePanelWhenEmpty => {
      this.hidePanelWhenEmpty = hidePanelWhenEmpty;
      this.refresh();
    }), atom.workspace.onDidDestroyPane(({
      pane: destroyedPane
    }) => {
      const isPaneItemDestroyed = this.panel !== null ? destroyedPane.getItems().includes(this.panel) : true;

      if (isPaneItemDestroyed && !this.deactivating) {
        this.panel = null;
        atom.config.set('linter-ui-default.showPanel', false);
      }
    }), atom.workspace.onDidDestroyPaneItem(({
      item: paneItem
    }) => {
      if (paneItem instanceof _dock.default && !this.deactivating) {
        this.panel = null;
        atom.config.set('linter-ui-default.showPanel', false);
      }
    }), atom.config.observe('linter-ui-default.showPanel', showPanel => {
      this.showPanelConfig = showPanel;
      this.refresh();
    }), atom.workspace.getCenter().observeActivePaneItem(() => {
      this.showPanelStateMessages = !!this.delegate.filteredMessages.length;
      this.refresh();
    }));
    this.activationTimer = window.requestIdleCallback(() => {
      let firstTime = true;
      const dock = atom.workspace.getBottomDock();
      this.subscriptions.add(dock.onDidChangeActivePaneItem(paneItem => {
        if (!this.panel || this.getPanelLocation() !== 'bottom') {
          return;
        }

        if (firstTime) {
          firstTime = false;
          return;
        }

        const isFocusIn = paneItem === this.panel;
        const externallyToggled = isFocusIn !== this.showPanelConfig;

        if (externallyToggled) {
          atom.config.set('linter-ui-default.showPanel', !this.showPanelConfig);
        }
      }), dock.onDidChangeVisible(visible => {
        if (!this.panel || this.getPanelLocation() !== 'bottom') {
          return;
        }

        if (!visible) {
          // ^ When it's time to tell config to hide
          if (this.showPanelConfig && this.hidePanelWhenEmpty && !this.showPanelStateMessages) {
            // Ignore because we just don't have any messages to show, everything else is fine
            return;
          }
        }

        if (dock.getActivePaneItem() !== this.panel) {
          // Ignore since the visibility of this panel is not changing
          return;
        }

        const externallyToggled = visible !== this.showPanelConfig;

        if (externallyToggled) {
          atom.config.set('linter-ui-default.showPanel', !this.showPanelConfig);
        }
      }));
      this.activate();
    });
  }

  getPanelLocation() {
    if (!this.panel) {
      return null;
    } // @ts-ignore internal API


    const paneContainer = atom.workspace.paneContainerForItem(this.panel);
    return paneContainer && paneContainer.location || null;
  }

  async activate() {
    if (this.panel) {
      return;
    }

    this.panel = new _dock.default(this.delegate);
    await atom.workspace.open(this.panel, {
      activatePane: false,
      activateItem: false,
      searchAllPanes: true
    });
    this.update();
    this.refresh();
  }

  update(newMessages = null) {
    if (newMessages) {
      this.messages = newMessages;
    }

    this.delegate.update(this.messages);
    this.showPanelStateMessages = !!this.delegate.filteredMessages.length;
    this.refresh();
  }

  async refresh() {
    const panel = this.panel;

    if (panel === null) {
      if (this.showPanelConfig) {
        await this.activate();
      }

      return;
    } // @ts-ignore internal API


    const paneContainer = atom.workspace.paneContainerForItem(panel);

    if (!paneContainer || paneContainer.location !== 'bottom') {
      return;
    }

    const isActivePanel = paneContainer.getActivePaneItem() === panel;
    const visibilityAllowed1 = this.showPanelConfig;
    const visibilityAllowed2 = this.hidePanelWhenEmpty ? this.showPanelStateMessages : true;

    if (visibilityAllowed1 && visibilityAllowed2) {
      if (!isActivePanel) {
        var _paneContainer$paneFo;

        (_paneContainer$paneFo = paneContainer.paneForItem(panel)) === null || _paneContainer$paneFo === void 0 ? void 0 : _paneContainer$paneFo.activateItem(panel);
      }

      paneContainer.show();
      panel.doPanelResize();
    } else if (isActivePanel) {
      paneContainer.hide();
    }
  }

  dispose() {
    this.deactivating = true;

    if (this.panel) {
      this.panel.dispose();
    }

    this.subscriptions.dispose();
    window.cancelIdleCallback(this.activationTimer);
  }

}

exports.default = Panel;
module.exports = exports.default;
},{"./delegate":"6BqHM","./dock":"4YXmy"}],"6BqHM":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _atom = require("atom");

var _helpers = require("../helpers");

class PanelDelegate {
  // eslint-disable-line @typescript-eslint/ban-types
  constructor() {
    this.emitter = new _atom.Emitter();
    this.messages = [];
    this.filteredMessages = [];
    this.subscriptions = new _atom.CompositeDisposable();
    this.panelRepresents = void 0;
    let changeSubscription = null;
    this.subscriptions.add(atom.config.observe('linter-ui-default.panelRepresents', panelRepresents => {
      const notInitial = typeof this.panelRepresents !== 'undefined';
      this.panelRepresents = panelRepresents;

      if (notInitial) {
        this.update();
      }
    }), atom.workspace.getCenter().observeActivePaneItem(() => {
      if (changeSubscription) {
        changeSubscription.dispose();
        changeSubscription = null;
      }

      const textEditor = (0, _helpers.getActiveTextEditor)();

      if (textEditor) {
        if (this.panelRepresents !== 'Entire Project') {
          this.update();
        }

        let oldRow = -1;
        changeSubscription = textEditor.onDidChangeCursorPosition(({
          newBufferPosition
        }) => {
          if (oldRow !== newBufferPosition.row && this.panelRepresents === 'Current Line') {
            oldRow = newBufferPosition.row;
            this.update();
          }
        });
      }

      if (this.panelRepresents !== 'Entire Project' || textEditor) {
        this.update();
      }
    }), new _atom.Disposable(function () {
      if (changeSubscription) {
        changeSubscription.dispose();
      }
    }));
  }

  getFilteredMessages() {
    let filteredMessages = [];

    if (this.panelRepresents === 'Entire Project') {
      filteredMessages = this.messages;
    } else if (this.panelRepresents === 'Current File') {
      const activeEditor = (0, _helpers.getActiveTextEditor)();
      if (!activeEditor) return [];
      filteredMessages = (0, _helpers.filterMessages)(this.messages, activeEditor.getPath());
    } else if (this.panelRepresents === 'Current Line') {
      const activeEditor = (0, _helpers.getActiveTextEditor)();
      if (!activeEditor) return [];
      const activeLine = activeEditor.getCursors()[0].getBufferRow();
      filteredMessages = (0, _helpers.filterMessagesByRangeOrPoint)(this.messages, activeEditor.getPath(), _atom.Range.fromObject([[activeLine, 0], [activeLine, Infinity]]));
    }

    return filteredMessages;
  }

  update(messages = null) {
    if (Array.isArray(messages)) {
      this.messages = messages;
    }

    this.filteredMessages = this.getFilteredMessages();
    this.emitter.emit('observe-messages', this.filteredMessages);
  }

  onDidChangeMessages(callback) {
    return this.emitter.on('observe-messages', callback);
  }

  dispose() {
    this.subscriptions.dispose();
  }

}

exports.default = PanelDelegate;
module.exports = exports.default;
},{"../helpers":"1gbPg"}],"1gbPg":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.$range = $range;
exports.$file = $file;
exports.copySelection = copySelection;
exports.getPathOfMessage = getPathOfMessage;
exports.getActiveTextEditor = getActiveTextEditor;
exports.getEditorsMap = getEditorsMap;
exports.filterMessages = filterMessages;
exports.filterMessagesByRangeOrPoint = filterMessagesByRangeOrPoint;
exports.openFile = openFile;
exports.visitMessage = visitMessage;
exports.openExternally = openExternally;
exports.sortMessages = sortMessages;
exports.sortSolutions = sortSolutions;
exports.applySolution = applySolution;
exports.isLargeFile = isLargeFile;
exports.DOCK_DEFAULT_LOCATION = exports.DOCK_ALLOWED_LOCATIONS = exports.WORKSPACE_URI = exports.severityNames = exports.severityScore = void 0;

var _atom = require("atom");

var _electron = require("electron");

let lastPaneItem = null;
const severityScore = {
  error: 3,
  warning: 2,
  info: 1
};
exports.severityScore = severityScore;
const severityNames = {
  error: 'Error',
  warning: 'Warning',
  info: 'Info'
};
exports.severityNames = severityNames;
const WORKSPACE_URI = 'atom://linter-ui-default';
exports.WORKSPACE_URI = WORKSPACE_URI;
const DOCK_ALLOWED_LOCATIONS = ['center', 'bottom'];
exports.DOCK_ALLOWED_LOCATIONS = DOCK_ALLOWED_LOCATIONS;
const DOCK_DEFAULT_LOCATION = 'bottom';
exports.DOCK_DEFAULT_LOCATION = DOCK_DEFAULT_LOCATION;

function $range(message) {
  return message.location.position;
}

function $file(message) {
  return message.location.file;
}

function copySelection() {
  const selection = getSelection();

  if (selection) {
    atom.clipboard.write(selection.toString());
  }
}

function getPathOfMessage(message) {
  return atom.project.relativizePath($file(message) || '')[1];
}

function getActiveTextEditor() {
  let paneItem = atom.workspace.getCenter().getActivePaneItem();
  const paneIsTextEditor = paneItem !== null ? atom.workspace.isTextEditor(paneItem) : false;

  if (!paneIsTextEditor && paneItem && lastPaneItem && paneItem.getURI && paneItem.getURI() === WORKSPACE_URI && (!lastPaneItem.isAlive || lastPaneItem.isAlive())) {
    paneItem = lastPaneItem;
  } else {
    lastPaneItem = paneItem;
  }

  return paneIsTextEditor ? paneItem : null;
}

function getEditorsMap(editors) {
  // TODO types
  const editorsMap = new Map();
  const filePaths = [];

  for (const entry of editors.editors) {
    var _entry$textEditor$get;

    const filePath = (_entry$textEditor$get = entry.textEditor.getPath()) !== null && _entry$textEditor$get !== void 0 ? _entry$textEditor$get : ''; // if undefined save it as ""

    if (editorsMap.has(filePath)) {
      editorsMap.get(filePath).editors.push(entry);
    } else {
      editorsMap.set(filePath, {
        added: [],
        removed: [],
        editors: [entry]
      });
      filePaths.push(filePath);
    }
  }

  return {
    editorsMap,
    filePaths
  };
}

function filterMessages(messages, filePath, severity = null) {
  const filtered = [];
  messages.forEach(function (message) {
    if (!message || !message.location) {
      return;
    }

    if ((filePath === null || $file(message) === filePath) && (!severity || message.severity === severity)) {
      filtered.push(message);
    }
  });
  return filtered;
}

function filterMessagesByRangeOrPoint(messages, filePath, rangeOrPoint) {
  const filtered = [];
  const expectedRange = rangeOrPoint.constructor.name === 'Point' ? new _atom.Range(rangeOrPoint, rangeOrPoint) : _atom.Range.fromObject(rangeOrPoint);
  messages.forEach(function (message) {
    const file = $file(message);
    const range = $range(message);

    if (file && range && file === filePath && typeof range.intersectsWith === 'function' && range.intersectsWith(expectedRange)) {
      filtered.push(message);
    }
  });
  return filtered;
}

function openFile(file, position) {
  const options = {
    searchAllPanes: true
  };

  if (position) {
    options.initialLine = position.row;
    options.initialColumn = position.column;
  }

  atom.workspace.open(file, options);
}

function visitMessage(message, reference = false) {
  let messageFile;
  let messagePosition;

  if (reference) {
    if (!message.reference || !message.reference.file) {
      console.warn('[Linter-UI-Default] Message does not have a valid reference. Ignoring');
      return;
    }

    messageFile = message.reference.file;
    messagePosition = message.reference.position;
  } else {
    const messageRange = $range(message);
    messageFile = $file(message);

    if (messageRange) {
      messagePosition = messageRange.start;
    }
  }

  if (messageFile) {
    openFile(messageFile, messagePosition);
  }
}

function openExternally(message) {
  if (message.version === 2 && message.url) {
    _electron.shell.openExternal(message.url);
  }
}

function sortMessages(rows, sortDirection) {
  const sortDirectionID = sortDirection[0];
  const sortDirectionDirection = sortDirection[1];
  const multiplyWith = sortDirectionDirection === 'asc' ? 1 : -1;
  return rows.sort(function (a, b) {
    if (sortDirectionID === 'severity') {
      const severityA = severityScore[a.severity];
      const severityB = severityScore[b.severity];

      if (severityA !== severityB) {
        return multiplyWith * (severityA > severityB ? 1 : -1);
      }
    }

    if (sortDirectionID === 'linterName') {
      const sortValue = a.severity.localeCompare(b.severity);

      if (sortValue !== 0) {
        return multiplyWith * sortValue;
      }
    }

    if (sortDirectionID === 'file') {
      const fileA = getPathOfMessage(a);
      const fileALength = fileA.length;
      const fileB = getPathOfMessage(b);
      const fileBLength = fileB.length;

      if (fileALength !== fileBLength) {
        return multiplyWith * (fileALength > fileBLength ? 1 : -1);
      } else if (fileA !== fileB) {
        return multiplyWith * fileA.localeCompare(fileB);
      }
    }

    if (sortDirectionID === 'line') {
      const rangeA = $range(a);
      const rangeB = $range(b);

      if (rangeA && !rangeB) {
        return 1;
      } else if (rangeB && !rangeA) {
        return -1;
      } else if (rangeA && rangeB) {
        if (rangeA.start.row !== rangeB.start.row) {
          return multiplyWith * (rangeA.start.row > rangeB.start.row ? 1 : -1);
        }

        if (rangeA.start.column !== rangeB.start.column) {
          return multiplyWith * (rangeA.start.column > rangeB.start.column ? 1 : -1);
        }
      }
    }

    return 0;
  });
}

function sortSolutions(solutions) {
  return solutions.sort(function (a, b) {
    if (a.priority === undefined || b.priority === undefined) {
      return 0;
    }

    return b.priority - a.priority;
  });
}

function applySolution(textEditor, solution) {
  if ('apply' in solution) {
    solution.apply();
    return true;
  }

  const range = solution.position;
  const replaceWith = solution.replaceWith;

  if ('currentText' in solution) {
    const currentText = solution.currentText;
    const textInRange = textEditor.getTextInBufferRange(range);

    if (currentText !== textInRange) {
      console.warn('[linter-ui-default] Not applying fix because text did not match the expected one', 'expected', currentText, 'but got', textInRange);
      return false;
    }
  }

  textEditor.setTextInBufferRange(range, replaceWith);
  return true;
}

const largeFileLineCount = atom.config.get('linter-ui-default.largeFileLineCount');
const longLineLength = atom.config.get('linter-ui-default.longLineLength');

function isLargeFile(editor) {
  const lineCount = editor.getLineCount(); // @ts-ignore

  if (editor.largeFileMode || lineCount >= largeFileLineCount) {
    return true;
  }

  const buffer = editor.getBuffer();

  for (let i = 0, len = lineCount; i < len; i++) {
    if (buffer.lineLengthForRow(i) > longLineLength) {
      return true;
    }
  }

  return false;
}
},{}],"4YXmy":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _web = require("solid-js/web");

var _atom = require("atom");

var _helpers = require("../helpers");

var _component = require("./component");

// NOTE: these were lazy
// eslint-disable-next-line no-use-before-define
function getPaneContainer(item) {
  const paneContainer = atom.workspace.paneContainerForItem(item); // NOTE: This is an internal API access
  // It's necessary because there's no Public API for it yet

  if (paneContainer && // @ts-ignore internal API
  typeof paneContainer.state === 'object' && // @ts-ignore internal API
  typeof paneContainer.state.size === 'number' && // @ts-ignore internal API
  typeof paneContainer.render === 'function') {
    // @ts-ignore internal API
    return paneContainer;
  }

  return null;
}

class PanelDock {
  constructor(delegate) {
    this.element = document.createElement('div');
    this.subscriptions = new _atom.CompositeDisposable();
    this.panelHeight = 100;
    this.alwaysTakeMinimumSpace = true;
    this.lastSetPaneHeight = void 0;
    this.subscriptions.add(atom.config.observe('linter-ui-default.panelHeight', panelHeight => {
      const changed = typeof this.panelHeight === 'number';
      this.panelHeight = panelHeight;

      if (changed) {
        this.doPanelResize(true);
      }
    }), atom.config.observe('linter-ui-default.alwaysTakeMinimumSpace', alwaysTakeMinimumSpace => {
      this.alwaysTakeMinimumSpace = alwaysTakeMinimumSpace;
    }));
    this.doPanelResize();
    (0, _web.render)(() => (0, _web.createComponent)(_component.PanelComponent, {
      delegate: delegate
    }), this.element);
  } // NOTE: Chose a name that won't conflict with Dock APIs


  doPanelResize(forConfigHeight = false) {
    const paneContainer = getPaneContainer(this);

    if (paneContainer === null) {
      return;
    }

    let minimumHeight = null;
    const paneContainerView = atom.views.getView(paneContainer);

    if (paneContainerView && this.alwaysTakeMinimumSpace) {
      // NOTE: Super horrible hack but the only possible way I could find :((
      const dockNamesElement = paneContainerView.querySelector('.list-inline.tab-bar.inset-panel');
      const dockNamesRects = dockNamesElement ? dockNamesElement.getClientRects()[0] : null;
      const tableElement = this.element.querySelector('table');
      const panelRects = tableElement ? tableElement.getClientRects()[0] : null;

      if (dockNamesRects && panelRects) {
        minimumHeight = dockNamesRects.height + panelRects.height + 1;
      }
    }

    let updateConfigHeight = null;
    const heightSet = minimumHeight !== null && !forConfigHeight ? Math.min(minimumHeight, this.panelHeight) : this.panelHeight; // Person resized the panel, save new resized value to config

    if (this.lastSetPaneHeight !== null && paneContainer.state.size !== this.lastSetPaneHeight && !forConfigHeight) {
      updateConfigHeight = paneContainer.state.size;
    }

    this.lastSetPaneHeight = heightSet;
    paneContainer.state.size = heightSet;
    paneContainer.render(paneContainer.state);

    if (updateConfigHeight !== null) {
      atom.config.set('linter-ui-default.panelHeight', updateConfigHeight);
    }
  }

  getURI() {
    return _helpers.WORKSPACE_URI;
  }

  getTitle() {
    return 'Linter';
  }

  getDefaultLocation() {
    return _helpers.DOCK_DEFAULT_LOCATION;
  }

  getAllowedLocations() {
    return _helpers.DOCK_ALLOWED_LOCATIONS;
  }

  getPreferredHeight() {
    return atom.config.get('linter-ui-default.panelHeight');
  }

  dispose() {
    this.subscriptions.dispose();
    const paneContainer = getPaneContainer(this);

    if (paneContainer !== null && !this.alwaysTakeMinimumSpace && paneContainer.state.size !== this.panelHeight) {
      var _paneContainer$paneFo;

      atom.config.set('linter-ui-default.panelHeight', paneContainer.state.size);
      (_paneContainer$paneFo = paneContainer.paneForItem(this)) === null || _paneContainer$paneFo === void 0 ? void 0 : _paneContainer$paneFo.destroyItem(this, true);
    }
  }

}

exports.default = PanelDock;
module.exports = exports.default;
},{"solid-js/web":"5Vgkw","../helpers":"1gbPg","./component":"6pBJm"}],"5Vgkw":[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var solidJs = require('solid-js');

const booleans = ["allowfullscreen", "allowpaymentrequest", "async", "autofocus", "autoplay", "checked", "controls", "default", "disabled", "formnovalidate", "hidden", "ismap", "itemscope", "loop", "multiple", "muted", "nomodule", "novalidate", "open", "playsinline", "readonly", "required", "reversed", "seamless", "selected", "truespeed"];
const Properties = new Set(["className", "indeterminate", "value", ...booleans]);
const ChildProperties = new Set(["innerHTML", "textContent", "innerText", "children"]);
const Aliases = {
  className: "class",
  htmlFor: "for"
};
const NonComposedEvents = new Set(["abort", "animationstart", "animationend", "animationiteration", "blur", "change", "copy", "cut", "error", "focus", "gotpointercapture", "load", "loadend", "loadstart", "lostpointercapture", "mouseenter", "mouseleave", "paste", "pointerenter", "pointerleave", "progress", "reset", "scroll", "select", "submit", "toggle", "transitionstart", "transitioncancel", "transitionend", "transitionrun"]);
const SVGElements = new Set([
"altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateColor", "animateMotion", "animateTransform", "circle", "clipPath", "color-profile", "cursor", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "font", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignObject", "g", "glyph", "glyphRef", "hkern", "image", "line", "linearGradient", "marker", "mask", "metadata", "missing-glyph", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect",
"set", "stop",
"svg", "switch", "symbol", "text", "textPath",
"tref", "tspan", "use", "view", "vkern"]);
const SVGNamespace = {
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace"
};

function memo(fn, equal) {
  return solidJs.createMemo(fn, undefined, equal);
}

function dynamicProperty(props, key) {
  const src = props[key];
  Object.defineProperty(props, key, {
    get() {
      return src();
    },
    enumerable: true
  });
  return props;
}
function getHydrationKey() {
  return globalThis._$HYDRATION.context.id;
}

function reconcileArrays(parentNode, a, b) {
  let bLength = b.length,
      aEnd = a.length,
      bEnd = bLength,
      aStart = 0,
      bStart = 0,
      after = a[aEnd - 1].nextSibling,
      map = null;
  while (aStart < aEnd || bStart < bEnd) {
    if (aEnd === aStart) {
      const node = bEnd < bLength ? bStart ? b[bStart - 1].nextSibling : b[bEnd - bStart] : after;
      while (bStart < bEnd) parentNode.insertBefore(b[bStart++], node);
    } else if (bEnd === bStart) {
      while (aStart < aEnd) {
        if (!map || !map.has(a[aStart])) parentNode.removeChild(a[aStart]);
        aStart++;
      }
    } else if (a[aStart] === b[bStart]) {
      aStart++;
      bStart++;
    } else if (a[aEnd - 1] === b[bEnd - 1]) {
      aEnd--;
      bEnd--;
    } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
      const node = a[--aEnd].nextSibling;
      parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
      parentNode.insertBefore(b[--bEnd], node);
      a[aEnd] = b[bEnd];
    } else {
      if (!map) {
        map = new Map();
        let i = bStart;
        while (i < bEnd) map.set(b[i], i++);
      }
      const index = map.get(a[aStart]);
      if (index != null) {
        if (bStart < index && index < bEnd) {
          let i = aStart,
              sequence = 1,
              t;
          while (++i < aEnd && i < bEnd) {
            if ((t = map.get(a[i])) == null || t !== index + sequence) break;
            sequence++;
          }
          if (sequence > index - bStart) {
            const node = a[aStart];
            while (bStart < index) parentNode.insertBefore(b[bStart++], node);
          } else parentNode.replaceChild(b[bStart++], a[aStart++]);
        } else aStart++;
      } else parentNode.removeChild(a[aStart++]);
    }
  }
}

const eventRegistry = new Set();
let hydration = null;
function render(code, element, init) {
  let disposer;
  solidJs.createRoot(dispose => {
    disposer = dispose;
    insert(element, code(), element.firstChild ? null : undefined, init);
  });
  return () => {
    disposer();
    element.textContent = "";
  };
}
function template(html, check, isSVG) {
  const t = document.createElement("template");
  t.innerHTML = html;
  if (check && t.innerHTML.split("<").length - 1 !== check) throw `Template html does not match input:\n${t.innerHTML}\n\n${html}`;
  let node = t.content.firstChild;
  if (isSVG) node = node.firstChild;
  return node;
}
function delegateEvents(eventNames) {
  for (let i = 0, l = eventNames.length; i < l; i++) {
    const name = eventNames[i];
    if (!eventRegistry.has(name)) {
      eventRegistry.add(name);
      document.addEventListener(name, eventHandler);
    }
  }
}
function clearDelegatedEvents() {
  for (let name of eventRegistry.keys()) document.removeEventListener(name, eventHandler);
  eventRegistry.clear();
}
function setAttribute(node, name, value) {
  if (value === false || value == null) node.removeAttribute(name);else node.setAttribute(name, value);
}
function setAttributeNS(node, namespace, name, value) {
  if (value === false || value == null) node.removeAttributeNS(namespace, name);else node.setAttributeNS(namespace, name, value);
}
function classList(node, value, prev) {
  const classKeys = Object.keys(value);
  for (let i = 0, len = classKeys.length; i < len; i++) {
    const key = classKeys[i],
          classValue = !!value[key],
          classNames = key.split(/\s+/);
    if (!key || prev && prev[key] === classValue) continue;
    for (let j = 0, nameLen = classNames.length; j < nameLen; j++) node.classList.toggle(classNames[j], classValue);
  }
  return value;
}
function style(node, value, prev) {
  const nodeStyle = node.style;
  if (typeof value === "string") return nodeStyle.cssText = value;
  let v, s;
  if (prev != null && typeof prev !== "string") {
    for (s in value) {
      v = value[s];
      v !== prev[s] && nodeStyle.setProperty(s, v);
    }
    for (s in prev) {
      value[s] == null && nodeStyle.removeProperty(s);
    }
  } else {
    for (s in value) nodeStyle.setProperty(s, value[s]);
  }
  return value;
}
function spread(node, accessor, isSVG, skipChildren) {
  if (typeof accessor === "function") {
    solidJs.createRenderEffect(current => spreadExpression(node, accessor(), current, isSVG, skipChildren));
  } else spreadExpression(node, accessor, undefined, isSVG, skipChildren);
}
function insert(parent, accessor, marker, initial) {
  if (marker !== undefined && !initial) initial = [];
  if (typeof accessor !== "function") return insertExpression(parent, accessor, initial, marker);
  solidJs.createRenderEffect(current => insertExpression(parent, accessor(), current, marker), initial);
}
function assign(node, props, isSVG, skipChildren, prevProps = {}) {
  let isCE, isProp, isChildProp;
  for (const prop in props) {
    if (prop === "children") {
      if (!skipChildren) insertExpression(node, props.children);
      continue;
    }
    const value = props[prop];
    if (value === prevProps[prop]) continue;
    if (prop === "style") {
      style(node, value, prevProps[prop]);
    } else if (prop === "class" && !isSVG) {
      node.className = value;
    } else if (prop === "classList") {
      classList(node, value, prevProps[prop]);
    } else if (prop === "ref") {
      value(node);
    } else if (prop === "on") {
      for (const eventName in value) node.addEventListener(eventName, value[eventName]);
    } else if (prop === "onCapture") {
      for (const eventName in value) node.addEventListener(eventName, value[eventName], true);
    } else if (prop.slice(0, 2) === "on") {
      const lc = prop.toLowerCase();
      if (!NonComposedEvents.has(lc.slice(2))) {
        const name = lc.slice(2);
        if (Array.isArray(value)) {
          node[`__${name}`] = value[0];
          node[`__${name}Data`] = value[1];
        } else node[`__${name}`] = value;
        delegateEvents([name]);
      } else if (Array.isArray(value)) {
        node[lc] = e => value[0](value[1], e);
      } else node[lc] = value;
    } else if ((isChildProp = ChildProperties.has(prop)) || !isSVG && (isProp = Properties.has(prop)) || (isCE = node.nodeName.includes("-"))) {
      if (isCE && !isProp && !isChildProp) node[toPropertyName(prop)] = value;else node[prop] = value;
    } else {
      const ns = isSVG && prop.indexOf(":") > -1 && SVGNamespace[prop.split(":")[0]];
      if (ns) setAttributeNS(node, ns, prop, value);else setAttribute(node, Aliases[prop] || prop, value);
    }
    prevProps[prop] = value;
  }
}
function hydrate(code, element) {
  hydration = globalThis._$HYDRATION || (globalThis._$HYDRATION = {});
  hydration.context = {
    id: "0",
    count: 0,
    registry: {}
  };
  const templates = element.querySelectorAll(`*[data-hk]`);
  Array.prototype.reduce.call(templates, (memo, node) => {
    const id = node.getAttribute("data-hk"),
          list = memo[id] || (memo[id] = []);
    list.push(node);
    return memo;
  }, hydration.context.registry);
  const dispose = render(code, element, [...element.childNodes]);
  delete hydration.context;
  return dispose;
}
function getNextElement(template, isSSR) {
  const hydrate = hydration && hydration.context;
  let node, key;
  if (!hydrate || !hydrate.registry || !((key = getHydrationKey()) && hydrate.registry[key] && (node = hydrate.registry[key].shift()))) {
    const el = template.cloneNode(true);
    if (isSSR && hydrate) el.setAttribute("data-hk", getHydrationKey());
    return el;
  }
  if (hydration && hydration.completed) hydration.completed.add(node);
  return node;
}
function getNextMarker(start) {
  let end = start,
      count = 0,
      current = [];
  if (hydration && hydration.context && hydration.context.registry) {
    while (end) {
      if (end.nodeType === 8) {
        const v = end.nodeValue;
        if (v === "#") count++;else if (v === "/") {
          if (count === 0) return [end, current];
          count--;
        }
      }
      current.push(end);
      end = end.nextSibling;
    }
  }
  return [end, current];
}
function runHydrationEvents() {
  if (hydration.events) {
    const {
      completed,
      events
    } = hydration;
    while (events.length) {
      const [el, e] = events[0];
      if (!completed.has(el)) return;
      eventHandler(e);
      events.shift();
    }
  }
}
function toPropertyName(name) {
  return name.toLowerCase().replace(/-([a-z])/g, (_, w) => w.toUpperCase());
}
function eventHandler(e) {
  const key = `__${e.type}`;
  let node = e.composedPath && e.composedPath()[0] || e.target;
  if (e.target !== node) {
    Object.defineProperty(e, "target", {
      configurable: true,
      value: node
    });
  }
  Object.defineProperty(e, "currentTarget", {
    configurable: true,
    get() {
      return node;
    }
  });
  while (node !== null) {
    const handler = node[key];
    if (handler) {
      const data = node[`${key}Data`];
      data !== undefined ? handler(data, e) : handler(e);
      if (e.cancelBubble) return;
    }
    node = node.host && node.host !== node && node.host instanceof Node ? node.host : node.parentNode;
  }
}
function spreadExpression(node, props, prevProps = {}, isSVG, skipChildren) {
  if (!skipChildren && "children" in props) {
    solidJs.createRenderEffect(() => prevProps.children = insertExpression(node, props.children, prevProps.children));
  }
  solidJs.createRenderEffect(() => assign(node, props, isSVG, true, prevProps));
  return prevProps;
}
function insertExpression(parent, value, current, marker, unwrapArray) {
  while (typeof current === "function") current = current();
  if (value === current) return current;
  const t = typeof value,
        multi = marker !== undefined;
  parent = multi && current[0] && current[0].parentNode || parent;
  if (t === "string" || t === "number") {
    if (t === "number") value = value.toString();
    if (multi) {
      let node = current[0];
      if (node && node.nodeType === 3) {
        node.data = value;
      } else node = document.createTextNode(value);
      current = cleanChildren(parent, current, marker, node);
    } else {
      if (current !== "" && typeof current === "string") {
        current = parent.firstChild.data = value;
      } else current = parent.textContent = value;
    }
  } else if (value == null || t === "boolean") {
    if (hydration && hydration.context && hydration.context.registry) return current;
    current = cleanChildren(parent, current, marker);
  } else if (t === "function") {
    solidJs.createRenderEffect(() => {
      let v = value();
      while (typeof v === "function") v = v();
      current = insertExpression(parent, v, current, marker);
    });
    return () => current;
  } else if (Array.isArray(value)) {
    const array = [];
    if (normalizeIncomingArray(array, value, unwrapArray)) {
      solidJs.createRenderEffect(() => current = insertExpression(parent, array, current, marker, true));
      return () => current;
    }
    if (hydration && hydration.context && hydration.context.registry && current.length) return current;
    if (array.length === 0) {
      current = cleanChildren(parent, current, marker);
      if (multi) return current;
    } else {
      if (Array.isArray(current)) {
        if (current.length === 0) {
          appendNodes(parent, array, marker);
        } else reconcileArrays(parent, current, array);
      } else if (current == null || current === "") {
        appendNodes(parent, array);
      } else {
        reconcileArrays(parent, multi && current || [parent.firstChild], array);
      }
    }
    current = array;
  } else if (value instanceof Node) {
    if (Array.isArray(current)) {
      if (multi) return current = cleanChildren(parent, current, marker, value);
      cleanChildren(parent, current, null, value);
    } else if (current == null || current === "" || !parent.firstChild) {
      parent.appendChild(value);
    } else parent.replaceChild(value, parent.firstChild);
    current = value;
  } else console.warn(`Skipped inserting`, value);
  return current;
}
function normalizeIncomingArray(normalized, array, unwrap) {
  let dynamic = false;
  for (let i = 0, len = array.length; i < len; i++) {
    let item = array[i],
        t;
    if (item instanceof Node) {
      normalized.push(item);
    } else if (item == null || item === true || item === false) ; else if (Array.isArray(item)) {
      dynamic = normalizeIncomingArray(normalized, item) || dynamic;
    } else if ((t = typeof item) === "string") {
      normalized.push(document.createTextNode(item));
    } else if (t === "function") {
      if (unwrap) {
        while (typeof item === "function") item = item();
        dynamic = normalizeIncomingArray(normalized, Array.isArray(item) ? item : [item]) || dynamic;
      } else {
        normalized.push(item);
        dynamic = true;
      }
    } else normalized.push(document.createTextNode(item.toString()));
  }
  return dynamic;
}
function appendNodes(parent, array, marker) {
  for (let i = 0, len = array.length; i < len; i++) parent.insertBefore(array[i], marker);
}
function cleanChildren(parent, current, marker, replacement) {
  if (marker === undefined) return parent.textContent = "";
  const node = replacement || document.createTextNode("");
  if (current.length) {
    let inserted = false;
    for (let i = current.length - 1; i >= 0; i--) {
      const el = current[i];
      if (node !== el) {
        const isParent = el.parentNode === parent;
        if (!inserted && !i) isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);else isParent && parent.removeChild(el);
      } else inserted = true;
    }
  } else parent.insertBefore(node, marker);
  return [node];
}

function renderToString(fn, options) {}
function renderToNodeStream(fn) {}
function renderToWebStream(fn) {}
function ssr(template, ...nodes) {}
function resolveSSRNode(node) {}
function ssrClassList(value) {}
function ssrStyle(value) {}
function ssrSpread(accessor) {}
function ssrBoolean(key, value) {}
function escape(html) {}
function generateHydrationScript(options) {}

const isServer = false;
function Portal(props) {
  const hydration = globalThis._$HYDRATION;
  const {
    useShadow
  } = props,
        marker = document.createTextNode(""),
        mount = props.mount || document.body;
  function renderPortal() {
    if (hydration && hydration.context) {
      const [s, set] = solidJs.createSignal(false);
      queueMicrotask(() => set(true));
      return () => s() && props.children;
    } else return () => props.children;
  }
  if (mount instanceof HTMLHeadElement) {
    const [clean, setClean] = solidJs.createSignal(false);
    const cleanup = () => setClean(true);
    solidJs.createRoot(dispose => insert(mount, () => !clean() ? renderPortal()() : dispose(), null));
    solidJs.onCleanup(() => {
      if (hydration && hydration.context) queueMicrotask(cleanup);else cleanup();
    });
  } else {
    const container = props.isSVG ? document.createElementNS("http://www.w3.org/2000/svg", "g") : document.createElement("div"),
          renderRoot = useShadow && container.attachShadow ? container.attachShadow({
      mode: "open"
    }) : container;
    Object.defineProperty(container, "host", {
      get() {
        return marker.parentNode;
      }
    });
    insert(renderRoot, renderPortal());
    mount.appendChild(container);
    props.ref && props.ref(container);
    solidJs.onCleanup(() => mount.removeChild(container));
  }
  return marker;
}
function Dynamic(props) {
  const [p, others] = solidJs.splitProps(props, ["component"]);
  return solidJs.createMemo(() => {
    const comp = p.component,
          t = typeof comp;
    if (comp) {
      if (t === "function") return solidJs.untrack(() => comp(others));else if (t === "string") {
        const el = document.createElement(comp);
        spread(el, others);
        return el;
      }
    }
  });
}

Object.defineProperty(exports, 'ErrorBoundary', {
  enumerable: true,
  get: function () {
    return solidJs.ErrorBoundary;
  }
});
Object.defineProperty(exports, 'For', {
  enumerable: true,
  get: function () {
    return solidJs.For;
  }
});
Object.defineProperty(exports, 'Index', {
  enumerable: true,
  get: function () {
    return solidJs.Index;
  }
});
Object.defineProperty(exports, 'Match', {
  enumerable: true,
  get: function () {
    return solidJs.Match;
  }
});
Object.defineProperty(exports, 'Show', {
  enumerable: true,
  get: function () {
    return solidJs.Show;
  }
});
Object.defineProperty(exports, 'Suspense', {
  enumerable: true,
  get: function () {
    return solidJs.Suspense;
  }
});
Object.defineProperty(exports, 'SuspenseList', {
  enumerable: true,
  get: function () {
    return solidJs.SuspenseList;
  }
});
Object.defineProperty(exports, 'Switch', {
  enumerable: true,
  get: function () {
    return solidJs.Switch;
  }
});
Object.defineProperty(exports, 'assignProps', {
  enumerable: true,
  get: function () {
    return solidJs.assignProps;
  }
});
Object.defineProperty(exports, 'createComponent', {
  enumerable: true,
  get: function () {
    return solidJs.createComponent;
  }
});
Object.defineProperty(exports, 'currentContext', {
  enumerable: true,
  get: function () {
    return solidJs.getContextOwner;
  }
});
Object.defineProperty(exports, 'effect', {
  enumerable: true,
  get: function () {
    return solidJs.createRenderEffect;
  }
});
exports.Aliases = Aliases;
exports.ChildProperties = ChildProperties;
exports.Dynamic = Dynamic;
exports.NonComposedEvents = NonComposedEvents;
exports.Portal = Portal;
exports.Properties = Properties;
exports.SVGElements = SVGElements;
exports.SVGNamespace = SVGNamespace;
exports.assign = assign;
exports.classList = classList;
exports.clearDelegatedEvents = clearDelegatedEvents;
exports.delegateEvents = delegateEvents;
exports.dynamicProperty = dynamicProperty;
exports.escape = escape;
exports.generateHydrationScript = generateHydrationScript;
exports.getNextElement = getNextElement;
exports.getNextMarker = getNextMarker;
exports.hydrate = hydrate;
exports.insert = insert;
exports.isServer = isServer;
exports.memo = memo;
exports.render = render;
exports.renderToNodeStream = renderToNodeStream;
exports.renderToString = renderToString;
exports.renderToWebStream = renderToWebStream;
exports.resolveSSRNode = resolveSSRNode;
exports.runHydrationEvents = runHydrationEvents;
exports.setAttribute = setAttribute;
exports.setAttributeNS = setAttributeNS;
exports.spread = spread;
exports.ssr = ssr;
exports.ssrBoolean = ssrBoolean;
exports.ssrClassList = ssrClassList;
exports.ssrSpread = ssrSpread;
exports.ssrStyle = ssrStyle;
exports.style = style;
exports.template = template;

},{"solid-js":"4z8gN"}],"4z8gN":[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

let taskIdCounter = 1,
    isCallbackScheduled = false,
    isPerformingWork = false,
    taskQueue = [],
    currentTask = null,
    shouldYieldToHost = null,
    yieldInterval = 5,
    deadline = 0,
    maxYieldInterval = 300,
    scheduleCallback = null,
    scheduledCallback = null;
const maxSigned31BitInt = 1073741823;
function setupScheduler() {
  if (window && window.MessageChannel) {
    const channel = new MessageChannel(),
          port = channel.port2;
    scheduleCallback = () => port.postMessage(null);
    channel.port1.onmessage = () => {
      if (scheduledCallback !== null) {
        const currentTime = performance.now();
        deadline = currentTime + yieldInterval;
        const hasTimeRemaining = true;
        try {
          const hasMoreWork = scheduledCallback(hasTimeRemaining, currentTime);
          if (!hasMoreWork) {
            scheduledCallback = null;
          } else port.postMessage(null);
        } catch (error) {
          port.postMessage(null);
          throw error;
        }
      }
    };
  } else {
    let _callback;
    scheduleCallback = () => {
      if (!_callback) {
        _callback = scheduledCallback;
        setTimeout(() => {
          const currentTime = performance.now();
          deadline = currentTime + yieldInterval;
          const hasMoreWork = _callback(true, currentTime);
          _callback = null;
          if (hasMoreWork) scheduleCallback();
        }, 0);
      }
    };
  }
  if (navigator && navigator.scheduling && navigator.scheduling.isInputPending) {
    const scheduling = navigator.scheduling;
    shouldYieldToHost = () => {
      const currentTime = performance.now();
      if (currentTime >= deadline) {
        if (scheduling.isInputPending()) {
          return true;
        }
        return currentTime >= maxYieldInterval;
      } else {
        return false;
      }
    };
  } else {
    shouldYieldToHost = () => performance.now() >= deadline;
  }
}
function enqueue(taskQueue, task) {
  function findIndex() {
    let m = 0;
    let n = taskQueue.length - 1;
    while (m <= n) {
      let k = n + m >> 1;
      let cmp = task.expirationTime - taskQueue[k].expirationTime;
      if (cmp > 0) m = k + 1;else if (cmp < 0) n = k - 1;else return k;
    }
    return m;
  }
  taskQueue.splice(findIndex(), 0, task);
}
function requestCallback(fn, options) {
  if (!scheduleCallback) setupScheduler();
  let startTime = performance.now(),
      timeout = maxSigned31BitInt;
  if (options && options.timeout) timeout = options.timeout;
  const newTask = {
    id: taskIdCounter++,
    fn,
    startTime,
    expirationTime: startTime + timeout
  };
  enqueue(taskQueue, newTask);
  if (!isCallbackScheduled && !isPerformingWork) {
    isCallbackScheduled = true;
    scheduledCallback = flushWork;
    scheduleCallback();
  }
  return newTask;
}
function cancelCallback(task) {
  task.fn = null;
}
function flushWork(hasTimeRemaining, initialTime) {
  isCallbackScheduled = false;
  isPerformingWork = true;
  try {
    return workLoop(hasTimeRemaining, initialTime);
  } finally {
    currentTask = null;
    isPerformingWork = false;
  }
}
function workLoop(hasTimeRemaining, initialTime) {
  let currentTime = initialTime;
  currentTask = taskQueue[0] || null;
  while (currentTask !== null) {
    if (currentTask.expirationTime > currentTime && (!hasTimeRemaining || shouldYieldToHost())) {
      break;
    }
    const callback = currentTask.fn;
    if (callback !== null) {
      currentTask.fn = null;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      callback(didUserCallbackTimeout);
      currentTime = performance.now();
      if (currentTask === taskQueue[0]) {
        taskQueue.shift();
      }
    } else taskQueue.shift();
    currentTask = taskQueue[0] || null;
  }
  return currentTask !== null;
}

const equalFn = (a, b) => a === b;
let ERROR = null;
let runEffects = runQueue;
const NOTPENDING = {};
const STALE = 1;
const PENDING = 2;
const UNOWNED = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
const [transPending, setTransPending] = createSignal(false, true);
var Owner = null;
var Listener = null;
let Pending = null;
let Updates = null;
let Effects = null;
let Transition = null;
let ExecCount = 0;
function createRoot(fn, detachedOwner) {
  detachedOwner && (Owner = detachedOwner);
  const listener = Listener,
        owner = Owner,
        root = fn.length === 0 && !false ? UNOWNED : {
    owned: null,
    cleanups: null,
    context: null,
    owner,
    attached: !!detachedOwner
  };
  Owner = root;
  Listener = null;
  let result;
  try {
    runUpdates(() => result = fn(() => cleanNode(root)), true);
  } finally {
    Listener = listener;
    Owner = owner;
  }
  return result;
}
function createSignal(value, areEqual, options) {
  const s = {
    value,
    observers: null,
    observerSlots: null,
    pending: NOTPENDING,
    comparator: areEqual ? typeof areEqual === "function" ? areEqual : equalFn : undefined
  };
  return [readSignal.bind(s), writeSignal.bind(s)];
}
function createComputed(fn, value) {
  updateComputation(createComputation(fn, value, true));
}
function createRenderEffect(fn, value) {
  updateComputation(createComputation(fn, value, false));
}
function createEffect(fn, value) {
  if (globalThis._$HYDRATION && globalThis._$HYDRATION.asyncSSR) return;
  runEffects = runUserEffects;
  const c = createComputation(fn, value, false),
        s = SuspenseContext && lookup(Owner, SuspenseContext.id);
  if (s) c.suspense = s;
  c.user = true;
  Effects && Effects.push(c);
}
function resumeEffects(e) {
  Transition && (Transition.running = true);
  Effects.push.apply(Effects, e);
  e.length = 0;
}
function createMemo(fn, value, areEqual) {
  const c = createComputation(fn, value, true);
  c.pending = NOTPENDING;
  c.observers = null;
  c.observerSlots = null;
  c.state = 0;
  c.comparator = areEqual ? typeof areEqual === "function" ? areEqual : equalFn : undefined;
  updateComputation(c);
  return readSignal.bind(c);
}
function createDeferred(source, options) {
  let t,
      timeout = options ? options.timeoutMs : undefined;
  const [deferred, setDeferred] = createSignal();
  const node = createComputation(() => {
    if (!t || !t.fn) t = requestCallback(() => setDeferred(node.value), timeout !== undefined ? {
      timeout
    } : undefined);
    return source();
  }, undefined, true);
  updateComputation(node);
  setDeferred(node.value);
  return deferred;
}
function createSelector(source, fn = equalFn) {
  let subs = new Map();
  const node = createComputation(p => {
    const v = source();
    for (const key of subs.keys()) if (fn(key, v) || p && fn(key, p)) {
      const c = subs.get(key);
      c.state = STALE;
      if (c.pure) Updates.push(c);else Effects.push(c);
    }
    return v;
  }, undefined, true);
  updateComputation(node);
  return key => {
    if (Listener) {
      subs.set(key, Listener);
      onCleanup(() => subs.delete(key));
    }
    return fn(key, node.value);
  };
}
function batch(fn) {
  if (Pending) return fn();
  const q = Pending = [],
        result = fn();
  Pending = null;
  runUpdates(() => {
    for (let i = 0; i < q.length; i += 1) {
      const data = q[i];
      if (data.pending !== NOTPENDING) {
        const pending = data.pending;
        data.pending = NOTPENDING;
        writeSignal.call(data, pending);
      }
    }
  }, false);
  return result;
}
function useTransition() {
  return [transPending, fn => {
    if (SuspenseContext) {
      Transition || (Transition = {
        sources: new Set(),
        effects: [],
        promises: new Set(),
        disposed: new Set(),
        running: true
      });
      Transition.running = true;
    }
    batch(fn);
  }];
}
function untrack(fn) {
  let result,
      listener = Listener;
  Listener = null;
  result = fn();
  Listener = listener;
  return result;
}
function on(...args) {
  const fn = args.pop();
  let deps;
  let isArray = true;
  let prev;
  if (args.length < 2) {
    deps = args[0];
    isArray = false;
  } else deps = args;
  return prevResult => {
    let value;
    if (isArray) {
      value = [];
      if (!prev) prev = [];
      for (let i = 0; i < deps.length; i++) value.push(deps[i]());
    } else value = deps();
    const result = untrack(() => fn(value, prev, prevResult));
    prev = value;
    return result;
  };
}
function onMount(fn) {
  createEffect(() => untrack(fn));
}
function onCleanup(fn) {
  if (Owner === null) ;else if (Owner.cleanups === null) Owner.cleanups = [fn];else Owner.cleanups.push(fn);
  return fn;
}
function onError(fn) {
  ERROR || (ERROR = Symbol("error"));
  if (Owner === null) ;else if (Owner.context === null) Owner.context = {
    [ERROR]: [fn]
  };else if (!Owner.context[ERROR]) Owner.context[ERROR] = [fn];else Owner.context[ERROR].push(fn);
}
function getListener() {
  return Listener;
}
function getContextOwner() {
  return Owner;
}
function serializeGraph(owner) {
  return {};
}
function createContext(defaultValue) {
  const id = Symbol("context");
  return {
    id,
    Provider: createProvider(id),
    defaultValue
  };
}
function useContext(context) {
  return lookup(Owner, context.id) || context.defaultValue;
}
let SuspenseContext;
function getSuspenseContext() {
  return SuspenseContext || (SuspenseContext = createContext({}));
}
function createResource(init, options = {}) {
  const contexts = new Set(),
        h = globalThis._$HYDRATION || {},
        [s, set] = createSignal(init, true),
        [track, trigger] = createSignal(),
        [loading, setLoading] = createSignal(false, true);
  let err = null,
      pr = null,
      ctx;
  function loadEnd(p, v, e) {
    if (pr === p) {
      err = e;
      pr = null;
      if (Transition && p && Transition.promises.has(p)) {
        Transition.promises.delete(p);
        runUpdates(() => {
          Transition.running = true;
          if (!Transition.promises.size) {
            Effects.push.apply(Effects, Transition.effects);
            Transition.effects = [];
          }
          completeLoad(v);
        }, false);
      } else completeLoad(v);
    }
    return v;
  }
  function completeLoad(v) {
    batch(() => {
      if (ctx) h.context = ctx;
      if (h.asyncSSR && options.name) h.resources[options.name] = v;
      set(v);
      setLoading(false);
      for (let c of contexts.keys()) c.decrement();
      contexts.clear();
    });
    if (ctx) h.context = ctx = undefined;
  }
  function read() {
    const c = SuspenseContext && lookup(Owner, SuspenseContext.id),
          v = s();
    if (err) throw err;
    if (Listener && !Listener.user && c) {
      createComputed(() => {
        track();
        if (pr) {
          if (c.resolved && Transition) Transition.promises.add(pr);else if (!contexts.has(c)) {
            c.increment();
            contexts.add(c);
          }
        }
      });
    }
    return v;
  }
  function load(fn) {
    err = null;
    let p;
    const hydrating = h.context && !!h.context.registry;
    if (hydrating) {
      if (h.loadResource && !options.notStreamed) {
        fn = h.loadResource;
      } else if (options.name && h.resources && options.name in h.resources) {
        fn = () => {
          const data = h.resources[options.name];
          delete h.resources[options.name];
          return data;
        };
      }
    } else if (h.asyncSSR && h.context) ctx = h.context;
    p = fn();
    if (typeof p !== "object" || !("then" in p)) {
      loadEnd(pr, p);
      return Promise.resolve(p);
    }
    pr = p;
    batch(() => {
      setLoading(true);
      trigger();
    });
    return p.then(v => loadEnd(p, v), e => loadEnd(p, undefined, e));
  }
  Object.defineProperty(read, "loading", {
    get() {
      return loading();
    }
  });
  return [read, load];
}
function readSignal() {
  if (this.state && this.sources) {
    const updates = Updates;
    Updates = null;
    this.state === STALE ? updateComputation(this) : lookDownstream(this);
    Updates = updates;
  }
  if (Listener) {
    const sSlot = this.observers ? this.observers.length : 0;
    if (!Listener.sources) {
      Listener.sources = [this];
      Listener.sourceSlots = [sSlot];
    } else {
      Listener.sources.push(this);
      Listener.sourceSlots.push(sSlot);
    }
    if (!this.observers) {
      this.observers = [Listener];
      this.observerSlots = [Listener.sources.length - 1];
    } else {
      this.observers.push(Listener);
      this.observerSlots.push(Listener.sources.length - 1);
    }
  }
  if (Transition && Transition.running && Transition.sources.has(this)) return this.tValue;
  return this.value;
}
function writeSignal(value, isComp) {
  if (this.comparator) {
    if (Transition && Transition.running && Transition.sources.has(this)) {
      if (this.comparator(this.tValue, value)) return value;
    } else if (this.comparator(this.value, value)) return value;
  }
  if (Pending) {
    if (this.pending === NOTPENDING) Pending.push(this);
    this.pending = value;
    return value;
  }
  if (Transition) {
    if (Transition.running || !isComp && Transition.sources.has(this)) {
      Transition.sources.add(this);
      this.tValue = value;
    }
    if (!Transition.running) this.value = value;
  } else this.value = value;
  if (this.observers && (!Updates || this.observers.length)) {
    runUpdates(() => {
      for (let i = 0; i < this.observers.length; i += 1) {
        const o = this.observers[i];
        if (Transition && Transition.running && Transition.disposed.has(o)) continue;
        if (o.observers && o.state !== PENDING) markUpstream(o);
        o.state = STALE;
        if (o.pure) Updates.push(o);else Effects.push(o);
      }
      if (Updates.length > 10e5) {
        Updates = [];
        throw new Error("Potential Infinite Loop Detected.");
      }
    }, false);
  }
  return value;
}
function updateComputation(node) {
  if (!node.fn) return;
  cleanNode(node);
  const owner = Owner,
        listener = Listener,
        time = ExecCount;
  Listener = Owner = node;
  runComputation(node, node.value, time);
  if (Transition && !Transition.running && Transition.sources.has(node)) {
    Transition.running = true;
    runComputation(node, node.tValue, time);
    Transition.running = false;
  }
  Listener = listener;
  Owner = owner;
}
function runComputation(node, value, time) {
  let nextValue;
  try {
    nextValue = node.fn(value);
  } catch (err) {
    handleError(err);
  }
  if (!node.updatedAt || node.updatedAt <= time) {
    if (node.observers && node.observers.length) {
      writeSignal.call(node, nextValue, true);
    } else if (Transition && Transition.running && node.pure) {
      Transition.sources.add(node);
      node.tValue = nextValue;
    } else node.value = nextValue;
    node.updatedAt = time;
  }
}
function createComputation(fn, init, pure) {
  const c = {
    fn,
    state: STALE,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: init,
    owner: Owner,
    context: null,
    pure
  };
  if (Owner === null) ;else if (Owner !== UNOWNED) {
    if (Transition && Transition.running && Owner.pure) {
      if (!Owner.tOwned) Owner.tOwned = [c];else Owner.tOwned.push(c);
    } else {
      if (!Owner.owned) Owner.owned = [c];else Owner.owned.push(c);
    }
  }
  return c;
}
function runTop(node) {
  let top = node.state === STALE && node,
      pending;
  if (node.suspense && untrack(node.suspense.inFallback)) return node.suspense.effects.push(node);
  const runningTransition = Transition && Transition.running;
  while ((node.fn || runningTransition && node.attached) && (node = node.owner)) {
    if (runningTransition && Transition.disposed.has(node)) return;
    if (node.state === PENDING) pending = node;else if (node.state === STALE) {
      top = node;
      pending = undefined;
    }
  }
  if (pending) {
    const updates = Updates;
    Updates = null;
    lookDownstream(pending);
    Updates = updates;
    if (!top || top.state !== STALE) return;
    if (runningTransition) {
      node = top;
      while ((node.fn || node.attached) && (node = node.owner)) {
        if (Transition.disposed.has(node)) return;
      }
    }
  }
  top && updateComputation(top);
}
function runUpdates(fn, init) {
  if (Updates) return fn();
  let wait = false;
  if (!init) Updates = [];
  if (Effects) wait = true;else Effects = [];
  ExecCount++;
  try {
    fn();
  } catch (err) {
    handleError(err);
  } finally {
    if (Updates) {
      runQueue(Updates);
      Updates = null;
    }
    if (wait) return;
    if (Transition && Transition.running) {
      if (Transition.promises.size) {
        Transition.running = false;
        Transition.effects.push.apply(Transition.effects, Effects);
        Effects = null;
        setTransPending(true);
        return;
      }
      const sources = Transition.sources;
      Transition = null;
      batch(() => {
        sources.forEach(v => {
          v.value = v.tValue;
          if (v.owned) {
            for (let i = 0, len = v.owned.length; i < len; i++) cleanNode(v.owned[i]);
          }
          if (v.tOwned) v.owned = v.tOwned;
          delete v.tValue;
          delete v.tOwned;
        });
        setTransPending(false);
      });
    }
    if (Effects.length) batch(() => {
      runEffects(Effects);
      Effects = null;
    });else {
      Effects = null;
    }
  }
}
function runQueue(queue) {
  for (let i = 0; i < queue.length; i++) runTop(queue[i]);
}
function runUserEffects(queue) {
  let i,
      userLength = 0;
  for (i = 0; i < queue.length; i++) {
    const e = queue[i];
    if (!e.user) runTop(e);else queue[userLength++] = e;
  }
  const resume = queue.length;
  for (i = 0; i < userLength; i++) runTop(queue[i]);
  for (i = resume; i < queue.length; i++) runTop(queue[i]);
}
function lookDownstream(node) {
  node.state = 0;
  for (let i = 0; i < node.sources.length; i += 1) {
    const source = node.sources[i];
    if (source.sources) {
      if (source.state === STALE) runTop(source);else if (source.state === PENDING) lookDownstream(source);
    }
  }
}
function markUpstream(node) {
  for (let i = 0; i < node.observers.length; i += 1) {
    const o = node.observers[i];
    if (!o.state) {
      o.state = PENDING;
      o.observers && markUpstream(o);
    }
  }
}
function cleanNode(node) {
  let i;
  if (node.sources) {
    while (node.sources.length) {
      const source = node.sources.pop(),
            index = node.sourceSlots.pop(),
            obs = source.observers;
      if (obs && obs.length) {
        const n = obs.pop(),
              s = source.observerSlots.pop();
        if (index < obs.length) {
          n.sourceSlots[s] = index;
          obs[index] = n;
          source.observerSlots[index] = s;
        }
      }
    }
  }
  if (Transition && Transition.running && node.pure) {
    if (node.tOwned) {
      for (i = 0; i < node.tOwned.length; i++) cleanNode(node.tOwned[i]);
      delete node.tOwned;
    }
    reset(node, true);
  } else if (node.owned) {
    for (i = 0; i < node.owned.length; i++) cleanNode(node.owned[i]);
    node.owned = null;
  }
  if (node.cleanups) {
    for (i = 0; i < node.cleanups.length; i++) node.cleanups[i]();
    node.cleanups = null;
  }
  node.state = 0;
  node.context = null;
}
function reset(node, top) {
  if (!top) {
    node.state = 0;
    Transition.disposed.add(node);
  }
  if (node.owned) {
    for (let i = 0; i < node.owned.length; i++) reset(node.owned[i]);
  }
}
function handleError(err) {
  const fns = ERROR && lookup(Owner, ERROR);
  if (!fns) throw err;
  fns.forEach(f => f(err));
}
function lookup(owner, key) {
  return owner && (owner.context && owner.context[key] || owner.owner && lookup(owner.owner, key));
}
function resolveChildren(children) {
  if (typeof children === "function") return resolveChildren(children());
  if (Array.isArray(children)) {
    const results = [];
    for (let i = 0; i < children.length; i++) {
      let result = resolveChildren(children[i]);
      Array.isArray(result) ? results.push.apply(results, result) : results.push(result);
    }
    return results;
  }
  return children;
}
function createProvider(id) {
  return function provider(props) {
    return createMemo(() => {
      Owner.context = {
        [id]: props.value
      };
      const children = createMemo(() => props.children);
      return createMemo(() => resolveChildren(children()));
    });
  };
}

const $RAW = Symbol("state-raw"),
      $NODE = Symbol("state-node"),
      $PROXY = Symbol("state-proxy"),
      $NAME = Symbol("state-name");
function wrap(value, name, processProps, traps) {
  let p = value[$PROXY];
  if (!p) {
    Object.defineProperty(value, $PROXY, {
      value: p = new Proxy(value, traps || proxyTraps)
    });
    if (processProps) {
      let keys = Object.keys(value),
          desc = Object.getOwnPropertyDescriptors(value);
      for (let i = 0, l = keys.length; i < l; i++) {
        const prop = keys[i];
        if (desc[prop].get) {
          const get = createMemo(desc[prop].get.bind(p), undefined, true);
          Object.defineProperty(value, prop, {
            get
          });
        }
        if (desc[prop].set) {
          const og = desc[prop].set,
                set = v => batch(() => og.call(p, v));
          Object.defineProperty(value, prop, {
            set
          });
        }
      }
    }
  }
  return p;
}
function isWrappable(obj) {
  return obj != null && typeof obj === "object" && (!obj.__proto__ || obj.__proto__ === Object.prototype || Array.isArray(obj));
}
function unwrap(item, skipGetters) {
  let result, unwrapped, v, prop;
  if (result = item != null && item[$RAW]) return result;
  if (!isWrappable(item)) return item;
  if (Array.isArray(item)) {
    if (Object.isFrozen(item)) item = item.slice(0);
    for (let i = 0, l = item.length; i < l; i++) {
      v = item[i];
      if ((unwrapped = unwrap(v, skipGetters)) !== v) item[i] = unwrapped;
    }
  } else {
    if (Object.isFrozen(item)) item = Object.assign({}, item);
    let keys = Object.keys(item),
        desc = skipGetters && Object.getOwnPropertyDescriptors(item);
    for (let i = 0, l = keys.length; i < l; i++) {
      prop = keys[i];
      if (skipGetters && desc[prop].get) continue;
      v = item[prop];
      if ((unwrapped = unwrap(v, skipGetters)) !== v) item[prop] = unwrapped;
    }
  }
  return item;
}
function getDataNodes(target) {
  let nodes = target[$NODE];
  if (!nodes) Object.defineProperty(target, $NODE, {
    value: nodes = {}
  });
  return nodes;
}
function proxyDescriptor(target, property) {
  const desc = Reflect.getOwnPropertyDescriptor(target, property);
  if (!desc || desc.get || property === $PROXY || property === $NODE || property === $NAME) return desc;
  delete desc.value;
  delete desc.writable;
  desc.get = () => target[property];
  return desc;
}
const proxyTraps = {
  get(target, property, receiver) {
    if (property === $RAW) return target;
    if (property === $PROXY) return receiver;
    const value = target[property];
    if (property === $NODE || property === "__proto__") return value;
    const wrappable = isWrappable(value);
    if (Listener && (typeof value !== "function" || target.hasOwnProperty(property))) {
      let nodes, node;
      if (wrappable && (nodes = getDataNodes(value))) {
        node = nodes._ || (nodes._ =  createSignal());
        node[0]();
      }
      nodes = getDataNodes(target);
      node = nodes[property] || (nodes[property] =  createSignal());
      node[0]();
    }
    return wrappable ? wrap(value) : value;
  },
  set() {
    return true;
  },
  deleteProperty() {
    return true;
  },
  getOwnPropertyDescriptor: proxyDescriptor
};
function setProperty(state, property, value) {
  if (state[property] === value) return;
  const notify = Array.isArray(state) || !(property in state);
  if (value === undefined) {
    delete state[property];
  } else state[property] = value;
  let nodes = getDataNodes(state),
      node;
  (node = nodes[property]) && node[1](value);
  notify && (node = nodes._) && node[1]();
}
function mergeState(state, value) {
  const keys = Object.keys(value);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    setProperty(state, key, value[key]);
  }
}
function updatePath(current, path, traversed = []) {
  let part,
      prev = current;
  if (path.length > 1) {
    part = path.shift();
    const partType = typeof part,
          isArray = Array.isArray(current);
    if (Array.isArray(part)) {
      for (let i = 0; i < part.length; i++) {
        updatePath(current, [part[i]].concat(path), [part[i]].concat(traversed));
      }
      return;
    } else if (isArray && partType === "function") {
      for (let i = 0; i < current.length; i++) {
        if (part(current[i], i)) updatePath(current, [i].concat(path), [i].concat(traversed));
      }
      return;
    } else if (isArray && partType === "object") {
      const {
        from = 0,
        to = current.length - 1,
        by = 1
      } = part;
      for (let i = from; i <= to; i += by) {
        updatePath(current, [i].concat(path), [i].concat(traversed));
      }
      return;
    } else if (path.length > 1) {
      updatePath(current[part], path, [part].concat(traversed));
      return;
    }
    prev = current[part];
    traversed = [part].concat(traversed);
  }
  let value = path[0];
  if (typeof value === "function") {
    value = value(prev, traversed);
    if (value === prev) return;
  }
  if (part === undefined && value == undefined) return;
  value = unwrap(value);
  if (part === undefined || isWrappable(prev) && isWrappable(value) && !Array.isArray(value)) {
    mergeState(prev, value);
  } else setProperty(current, part, value);
}
function createState(state, options) {
  const unwrappedState = unwrap(state || {}, true);
  const wrappedState = wrap(unwrappedState, false , true);
  function setState(...args) {
    batch(() => updatePath(unwrappedState, args));
  }
  return [wrappedState, setState];
}

function createResourceNode(v, name) {
  const [r, load] = createResource(v, {
    name
  });
  return [() => r(), v => load(() => v), load, () => r.loading];
}
function createResourceState(state, options = {}) {
  const loadingTraps = {
    get(nodes, property) {
      const node = nodes[property] || (nodes[property] = createResourceNode(undefined, options.name && `${options.name}:${property}`));
      return node[3]();
    },
    set() {
      return true;
    },
    deleteProperty() {
      return true;
    }
  };
  const resourceTraps = {
    get(target, property, receiver) {
      if (property === $RAW) return target;
      if (property === $PROXY) return receiver;
      if (property === "loading") return new Proxy(getDataNodes(target), loadingTraps);
      const value = target[property];
      if (property === $NODE || property === "__proto__") return value;
      const wrappable = isWrappable(value);
      if (Listener && (typeof value !== "function" || target.hasOwnProperty(property))) {
        let nodes, node;
        if (wrappable && (nodes = getDataNodes(value))) {
          node = nodes._ || (nodes._ =  createSignal());
          node[0]();
        }
        nodes = getDataNodes(target);
        node = nodes[property] || (nodes[property] = createResourceNode(value, `${options.name}:${property}`));
        node[0]();
      }
      return wrappable ? wrap(value) : value;
    },
    set() {
      return true;
    },
    deleteProperty() {
      return true;
    },
    getOwnPropertyDescriptor: proxyDescriptor
  };
  const unwrappedState = unwrap(state || {}, true),
        wrappedState = wrap(unwrappedState, false , true, resourceTraps);
  function setState(...args) {
    batch(() => updatePath(unwrappedState, args));
  }
  function loadState(v, r) {
    const nodes = getDataNodes(unwrappedState),
          keys = Object.keys(v);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i],
            node = nodes[k] || (nodes[k] = createResourceNode(unwrappedState[k], `${options.name}:${k}`)),
            resolver = v => (r ? setState(k, r(v)) : setProperty(unwrappedState, k, v), unwrappedState[k]);
      node[2](() => {
        const p = v[k]();
        return typeof p === "object" && "then" in p ? p.then(resolver) : resolver(p);
      });
    }
  }
  return [wrappedState, loadState, setState];
}

const proxyTraps$1 = {
  get(target, property, receiver) {
    if (property === $RAW) return target;
    if (property === $PROXY) return receiver;
    const value = target[property];
    if (property === $NODE || property === "__proto__") return value;
    const wrappable = isWrappable(value);
    if (Listener && (typeof value !== "function" || target.hasOwnProperty(property))) {
      let nodes, node;
      if (wrappable && (nodes = getDataNodes(value))) {
        node = nodes._ || (nodes._ =  createSignal());
        node[0]();
      }
      nodes = getDataNodes(target);
      node = nodes[property] || (nodes[property] =  createSignal());
      node[0]();
    }
    return wrappable ? wrap(value, false  , false, proxyTraps$1) : value;
  },
  set(target, property, value) {
    setProperty(target, property, unwrap(value));
    return true;
  },
  deleteProperty(target, property) {
    setProperty(target, property, undefined);
    return true;
  },
  getOwnPropertyDescriptor: proxyDescriptor
};
function createMutable(state, options) {
  const unwrappedState = unwrap(state || {}, true);
  const wrappedState = wrap(unwrappedState, false , true, proxyTraps$1);
  return wrappedState;
}

function applyState(target, parent, property, merge, key) {
  let previous = parent[property];
  if (target === previous) return;
  if (!isWrappable(target) || !isWrappable(previous) || key && target[key] !== previous[key]) {
    target !== previous && setProperty(parent, property, target);
    return;
  }
  if (Array.isArray(target)) {
    if (target.length && previous.length && (!merge || key && target[0][key] != null)) {
      let i, j, start, end, newEnd, item, newIndicesNext, keyVal;
      for (start = 0, end = Math.min(previous.length, target.length); start < end && (previous[start] === target[start] || key && previous[start][key] === target[start][key]); start++) {
        applyState(target[start], previous, start, merge, key);
      }
      const temp = new Array(target.length),
            newIndices = new Map();
      for (end = previous.length - 1, newEnd = target.length - 1; end >= start && newEnd >= start && (previous[end] === target[newEnd] || key && previous[end][key] === target[newEnd][key]); end--, newEnd--) {
        temp[newEnd] = previous[end];
      }
      if (start > newEnd || start > end) {
        for (j = start; j <= newEnd; j++) setProperty(previous, j, target[j]);
        for (; j < target.length; j++) {
          setProperty(previous, j, temp[j]);
          applyState(target[j], previous, j, merge, key);
        }
        if (previous.length > target.length) setProperty(previous, "length", target.length);
        return;
      }
      newIndicesNext = new Array(newEnd + 1);
      for (j = newEnd; j >= start; j--) {
        item = target[j];
        keyVal = key ? item[key] : item;
        i = newIndices.get(keyVal);
        newIndicesNext[j] = i === undefined ? -1 : i;
        newIndices.set(keyVal, j);
      }
      for (i = start; i <= end; i++) {
        item = previous[i];
        keyVal = key ? item[key] : item;
        j = newIndices.get(keyVal);
        if (j !== undefined && j !== -1) {
          temp[j] = previous[i];
          j = newIndicesNext[j];
          newIndices.set(keyVal, j);
        }
      }
      for (j = start; j < target.length; j++) {
        if (j in temp) {
          setProperty(previous, j, temp[j]);
          applyState(target[j], previous, j, merge, key);
        } else setProperty(previous, j, target[j]);
      }
    } else {
      for (let i = 0, len = target.length; i < len; i++) {
        applyState(target[i], previous, i, merge, key);
      }
    }
    if (previous.length > target.length) setProperty(previous, "length", target.length);
    return;
  }
  const targetKeys = Object.keys(target);
  for (let i = 0, len = targetKeys.length; i < len; i++) {
    applyState(target[targetKeys[i]], previous, targetKeys[i], merge, key);
  }
  const previousKeys = Object.keys(previous);
  for (let i = 0, len = previousKeys.length; i < len; i++) {
    if (target[previousKeys[i]] === undefined) setProperty(previous, previousKeys[i], undefined);
  }
}
function reconcile(value, options = {}) {
  const {
    merge,
    key = "id"
  } = options,
        v = unwrap(value);
  return state => {
    if (!isWrappable(state)) return v;
    applyState(v, {
      state
    }, "state", merge, key);
    return state;
  };
}
const setterTraps = {
  get(target, property) {
    if (property === $RAW) return target;
    const value = target[property];
    return isWrappable(value) ? new Proxy(value, setterTraps) : value;
  },
  set(target, property, value) {
    setProperty(target, property, unwrap(value));
    return true;
  },
  deleteProperty(target, property) {
    setProperty(target, property, undefined);
    return true;
  }
};
function produce(fn) {
  return state => {
    if (isWrappable(state)) fn(new Proxy(state, setterTraps));
    return state;
  };
}

const FALLBACK = Symbol("fallback");
function mapArray(list, mapFn, options = {}) {
  let items = [],
      mapped = [],
      disposers = [],
      len = 0,
      indexes = mapFn.length > 1 ? [] : null,
      ctx = Owner;
  onCleanup(() => {
    for (let i = 0, length = disposers.length; i < length; i++) disposers[i]();
  });
  return () => {
    let newItems = list() || [],
        i,
        j;
    return untrack(() => {
      let newLen = newItems.length,
          newIndices,
          newIndicesNext,
          temp,
          tempdisposers,
          tempIndexes,
          start,
          end,
          newEnd,
          item;
      if (newLen === 0) {
        if (len !== 0) {
          for (i = 0; i < len; i++) disposers[i]();
          disposers = [];
          items = [];
          mapped = [];
          len = 0;
          indexes && (indexes = []);
        }
        if (options.fallback) {
          items = [FALLBACK];
          mapped[0] = createRoot(disposer => {
            disposers[0] = disposer;
            return options.fallback();
          }, ctx);
          len = 1;
        }
      }
      else if (len === 0) {
          for (j = 0; j < newLen; j++) {
            items[j] = newItems[j];
            mapped[j] = createRoot(mapper, ctx);
          }
          len = newLen;
        } else {
          temp = new Array(newLen);
          tempdisposers = new Array(newLen);
          indexes && (tempIndexes = new Array(newLen));
          for (start = 0, end = Math.min(len, newLen); start < end && items[start] === newItems[start]; start++);
          for (end = len - 1, newEnd = newLen - 1; end >= start && newEnd >= start && items[end] === newItems[newEnd]; end--, newEnd--) {
            temp[newEnd] = mapped[end];
            tempdisposers[newEnd] = disposers[end];
            indexes && (tempIndexes[newEnd] = indexes[end]);
          }
          newIndices = new Map();
          newIndicesNext = new Array(newEnd + 1);
          for (j = newEnd; j >= start; j--) {
            item = newItems[j];
            i = newIndices.get(item);
            newIndicesNext[j] = i === undefined ? -1 : i;
            newIndices.set(item, j);
          }
          for (i = start; i <= end; i++) {
            item = items[i];
            j = newIndices.get(item);
            if (j !== undefined && j !== -1) {
              temp[j] = mapped[i];
              tempdisposers[j] = disposers[i];
              indexes && (tempIndexes[j] = indexes[i]);
              j = newIndicesNext[j];
              newIndices.set(item, j);
            } else disposers[i]();
          }
          for (j = start; j < newLen; j++) {
            if (j in temp) {
              mapped[j] = temp[j];
              disposers[j] = tempdisposers[j];
              if (indexes) {
                indexes[j] = tempIndexes[j];
                indexes[j](j);
              }
            } else mapped[j] = createRoot(mapper, ctx);
          }
          len = mapped.length = newLen;
          items = newItems.slice(0);
        }
      return mapped;
    });
    function mapper(disposer) {
      disposers[j] = disposer;
      if (indexes) {
        const [s, set] = createSignal(j, true);
        indexes[j] = set;
        return mapFn(newItems[j], s);
      }
      return mapFn(newItems[j]);
    }
  };
}
function indexArray(list, mapFn, options = {}) {
  let items = [],
      mapped = [],
      disposers = [],
      signals = [],
      len = 0,
      i,
      ctx = Owner;
  onCleanup(() => {
    for (let i = 0, length = disposers.length; i < length; i++) disposers[i]();
  });
  return () => {
    const newItems = list() || [];
    return untrack(() => {
      if (newItems.length === 0) {
        if (len !== 0) {
          for (i = 0; i < len; i++) disposers[i]();
          disposers = [];
          items = [];
          mapped = [];
          len = 0;
          signals = [];
        }
        if (options.fallback) {
          items = [FALLBACK];
          mapped[0] = createRoot(disposer => {
            disposers[0] = disposer;
            return options.fallback();
          }, ctx);
          len = 1;
        }
        return mapped;
      }
      if (items[0] === FALLBACK) {
        disposers[0]();
        disposers = [];
        items = [];
        mapped = [];
        len = 0;
      }
      for (i = 0; i < newItems.length; i++) {
        if (i < items.length && items[i] !== newItems[i]) {
          signals[i](newItems[i]);
        } else if (i >= items.length) {
          mapped[i] = createRoot(mapper, ctx);
        }
      }
      for (; i < items.length; i++) {
        disposers[i]();
      }
      len = mapped.length = signals.length = disposers.length = newItems.length;
      items = newItems.slice(0);
      return mapped;
    });
    function mapper(disposer) {
      disposers[i] = disposer;
      const [s, set] = createSignal(newItems[i]);
      signals[i] = set;
      return mapFn(s, i);
    }
  };
}

function createComponent(Comp, props) {
  return untrack(() => Comp(props));
}
function assignProps(target, ...sources) {
  for (let i = 0; i < sources.length; i++) {
    const descriptors = Object.getOwnPropertyDescriptors(sources[i]);
    Object.defineProperties(target, descriptors);
  }
  return target;
}
function splitProps(props, ...keys) {
  const descriptors = Object.getOwnPropertyDescriptors(props),
        split = k => {
    const clone = {};
    for (let i = 0; i < k.length; i++) {
      const key = k[i];
      if (descriptors[key]) {
        Object.defineProperty(clone, key, descriptors[key]);
        delete descriptors[key];
      }
    }
    return clone;
  };
  return keys.map(split).concat(split(Object.keys(descriptors)));
}
function lazy(fn) {
  let p;
  return props => {
    const h = globalThis._$HYDRATION || {},
          hydrating = h.context && h.context.registry,
          ctx = nextHydrateContext(),
          [s, l] = createResource(undefined, {
      notStreamed: true
    });
    if (hydrating && h.resources) {
      (p || (p = fn())).then(mod => {
        setHydrateContext(ctx);
        l(() => mod.default);
        setHydrateContext(undefined);
      });
    } else l(() => (p || (p = fn())).then(mod => mod.default));
    let Comp;
    return createMemo(() => (Comp = s()) && untrack(() => {
      if (!ctx) return Comp(props);
      const c = h.context;
      setHydrateContext(ctx);
      const r = Comp(props);
      setHydrateContext(c);
      return r;
    }));
  };
}
function setHydrateContext(context) {
  globalThis._$HYDRATION.context = context;
}
function nextHydrateContext() {
  const hydration = globalThis._$HYDRATION;
  return hydration && hydration.context ? {
    id: `${hydration.context.id}.${hydration.context.count++}`,
    count: 0,
    registry: hydration.context.registry
  } : undefined;
}

function For(props) {
  const fallback = "fallback" in props && {
    fallback: () => props.fallback
  };
  return createMemo(mapArray(() => props.each, props.children, fallback ? fallback : undefined));
}
function Index(props) {
  const fallback = "fallback" in props && {
    fallback: () => props.fallback
  };
  return createMemo(indexArray(() => props.each, props.children, fallback ? fallback : undefined));
}
function Show(props) {
  const childDesc = Object.getOwnPropertyDescriptor(props, "children").value,
        callFn = typeof childDesc === "function" && childDesc.length,
        condition = createMemo(callFn ? () => props.when : () => !!props.when, undefined, true);
  return createMemo(() => {
    const c = condition();
    return c ? callFn ? untrack(() => props.children(c)) : props.children : props.fallback;
  });
}
function Switch(props) {
  let conditions = props.children;
  Array.isArray(conditions) || (conditions = [conditions]);
  const evalConditions = createMemo(() => {
    for (let i = 0; i < conditions.length; i++) {
      const c = conditions[i].when;
      if (c) return [i, conditions[i].keyed ? c : !!c];
    }
    return [-1];
  }, undefined, (a, b) => a && a[0] === b[0] && a[1] === b[1]);
  return createMemo(() => {
    const [index, when] = evalConditions();
    if (index < 0) return props.fallback;
    const c = conditions[index].children;
    return typeof c === "function" && c.length ? untrack(() => c(when)) : c;
  });
}
function Match(props) {
  const childDesc = Object.getOwnPropertyDescriptor(props, "children").value;
  props.keyed = typeof childDesc === "function" && !!childDesc.length;
  return props;
}
function ErrorBoundary(props) {
  const [errored, setErrored] = createSignal(),
        fallbackDesc = Object.getOwnPropertyDescriptor(props, "fallback").value,
        callFn = typeof fallbackDesc === "function" && !!fallbackDesc.length;
  onError(setErrored);
  let e;
  return createMemo(() => (e = errored()) != null ? callFn ? untrack(() => props.fallback(e)) : props.fallback : props.children);
}

const SuspenseListContext = createContext();
let trackSuspense = false;
function awaitSuspense(fn) {
  const SuspenseContext = getSuspenseContext();
  if (!trackSuspense) {
    let count = 0;
    const [active, trigger] = createSignal(false);
    SuspenseContext.active = active;
    SuspenseContext.increment = () => count++ === 0 && trigger(true);
    SuspenseContext.decrement = () => --count <= 0 && trigger(false);
    trackSuspense = true;
  }
  return () => new Promise(resolve => {
    const res = fn();
    createRenderEffect(() => !SuspenseContext.active() && resolve(res));
  });
}
function SuspenseList(props) {
  let index = 0,
      suspenseSetter,
      showContent,
      showFallback;
  const listContext = useContext(SuspenseListContext);
  if (listContext) {
    const [inFallback, setFallback] = createSignal(false, true);
    suspenseSetter = setFallback;
    [showContent, showFallback] = listContext.register(inFallback);
  }
  const registry = [],
        comp = createComponent(SuspenseListContext.Provider, {
    value: {
      register: inFallback => {
        const [showingContent, showContent] = createSignal(false, true),
              [showingFallback, showFallback] = createSignal(false, true);
        registry[index++] = {
          inFallback,
          showContent,
          showFallback
        };
        return [showingContent, showingFallback];
      }
    },
    get children() {
      return props.children;
    }
  });
  createComputed(() => {
    const reveal = props.revealOrder,
          tail = props.tail,
          visibleContent = showContent ? showContent() : true,
          visibleFallback = showFallback ? showFallback() : true,
          reverse = reveal === "backwards";
    if (reveal === "together") {
      const all = registry.every(i => !i.inFallback());
      suspenseSetter && suspenseSetter(!all);
      registry.forEach(i => {
        i.showContent(all && visibleContent);
        i.showFallback(visibleFallback);
      });
      return;
    }
    let stop = false;
    for (let i = 0, len = registry.length; i < len; i++) {
      const n = reverse ? len - i - 1 : i,
            s = registry[n].inFallback();
      if (!stop && !s) {
        registry[n].showContent(visibleContent);
        registry[n].showFallback(visibleFallback);
      } else {
        const next = !stop;
        if (next && suspenseSetter) suspenseSetter(true);
        if (!tail || next && tail === "collapsed") {
          registry[n].showFallback(visibleFallback);
        } else registry[n].showFallback(false);
        stop = true;
        registry[n].showContent(next);
      }
    }
    if (!stop && suspenseSetter) suspenseSetter(false);
  });
  return comp;
}
function Suspense(props) {
  let counter = 0,
      showContent,
      showFallback;
  const [inFallback, setFallback] = createSignal(false),
        SuspenseContext = getSuspenseContext(),
        store = {
    increment: () => {
      if (++counter === 1) {
        setFallback(true);
        trackSuspense && SuspenseContext.increment();
      }
    },
    decrement: () => {
      if (--counter === 0) {
        setFallback(false);
        trackSuspense && setTimeout(SuspenseContext.decrement);
      }
    },
    inFallback,
    effects: [],
    resolved: false
  };
  const listContext = useContext(SuspenseListContext);
  if (listContext) [showContent, showFallback] = listContext.register(store.inFallback);
  return createComponent(SuspenseContext.Provider, {
    value: store,
    get children() {
      const rendered = untrack(() => props.children);
      return createMemo(() => {
        const inFallback = store.inFallback(),
              visibleContent = showContent ? showContent() : true,
              visibleFallback = showFallback ? showFallback() : true;
        if (!inFallback && visibleContent) {
          store.resolved = true;
          resumeEffects(store.effects);
          return rendered;
        }
        if (!visibleFallback) return;
        return props.fallback;
      });
    }
  });
}

exports.$RAW = $RAW;
exports.ErrorBoundary = ErrorBoundary;
exports.For = For;
exports.Index = Index;
exports.Match = Match;
exports.Show = Show;
exports.Suspense = Suspense;
exports.SuspenseList = SuspenseList;
exports.Switch = Switch;
exports.assignProps = assignProps;
exports.awaitSuspense = awaitSuspense;
exports.batch = batch;
exports.cancelCallback = cancelCallback;
exports.createComponent = createComponent;
exports.createComputed = createComputed;
exports.createContext = createContext;
exports.createDeferred = createDeferred;
exports.createEffect = createEffect;
exports.createMemo = createMemo;
exports.createMutable = createMutable;
exports.createRenderEffect = createRenderEffect;
exports.createResource = createResource;
exports.createResourceState = createResourceState;
exports.createRoot = createRoot;
exports.createSelector = createSelector;
exports.createSignal = createSignal;
exports.createState = createState;
exports.equalFn = equalFn;
exports.getContextOwner = getContextOwner;
exports.getListener = getListener;
exports.indexArray = indexArray;
exports.lazy = lazy;
exports.mapArray = mapArray;
exports.on = on;
exports.onCleanup = onCleanup;
exports.onError = onError;
exports.onMount = onMount;
exports.produce = produce;
exports.reconcile = reconcile;
exports.requestCallback = requestCallback;
exports.serializeGraph = serializeGraph;
exports.splitProps = splitProps;
exports.untrack = untrack;
exports.unwrap = unwrap;
exports.useContext = useContext;
exports.useTransition = useTransition;

},{}],"6pBJm":[function(require,module,exports) {
"use strict";

var _$template = require("solid-js/web").template;

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PanelComponent = PanelComponent;

var _web = require("solid-js/web");

var _solidJs = require("solid-js");

var _solidSimpleTable = require("solid-simple-table");

var _helpers = require("../helpers");

const _tmpl$ = _$template(`<div id="linter-panel"></div>`, 2);

function PanelComponent(props) {
  const [getMessages, setMessages] = (0, _solidJs.createSignal)(props.delegate.filteredMessages);
  (0, _solidJs.onMount)(() => {
    props.delegate.onDidChangeMessages(messages => {
      setMessages(messages);
    });
  });
  const columns = [{
    id: 'severity',
    label: 'Severity'
  }, {
    id: 'linterName',
    label: 'Provider'
  }, {
    id: 'excerpt',
    label: 'Description',
    onClick: onClick,
    sortable: false
  }, {
    id: 'line',
    label: 'Line',
    onClick: onClick
  }];

  if (props.delegate.panelRepresents === 'Entire Project') {
    columns.push({
      id: 'file',
      label: 'File',
      onClick: onClick
    });
  }

  return (() => {
    const _el$ = _tmpl$.cloneNode(true);

    (0, _web.setAttribute)(_el$, "tabindex", -1);

    _el$.style.setProperty("overflowY", 'scroll');

    _el$.style.setProperty("height", '100%');

    (0, _web.insert)(_el$, (0, _web.createComponent)(_solidSimpleTable.SimpleTable, {
      get rows() {
        return getMessages();
      },

      columns: columns,
      defaultSortDirection: ['line', 'asc'],
      rowSorter: _helpers.sortMessages,
      accessors: true,
      getRowID: i => i.key,
      bodyRenderer: renderRowColumn,
      style: {
        width: '100%'
      },
      className: "linter dark"
    }));
    return _el$;
  })();
}

function renderRowColumn(row, column) {
  const range = (0, _helpers.$range)(row);

  switch (column) {
    case 'file':
      return (0, _helpers.getPathOfMessage)(row);

    case 'line':
      return range ? `${range.start.row + 1}:${range.start.column + 1}` : '';

    case 'excerpt':
      return row.excerpt;

    case 'severity':
      return _helpers.severityNames[row.severity];

    default:
      return row[column];
  }
}

function onClick(e, row) {
  if (e.target.tagName === 'A') {
    return;
  }

  if (process.platform === 'darwin' ? e.metaKey : e.ctrlKey) {
    if (e.shiftKey) {
      (0, _helpers.openExternally)(row);
    } else {
      (0, _helpers.visitMessage)(row, true);
    }
  } else {
    (0, _helpers.visitMessage)(row);
  }
}
},{"solid-js/web":"5Vgkw","solid-js":"4z8gN","solid-simple-table":"21p3T","../helpers":"1gbPg"}],"21p3T":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SimpleTable = m;
exports.default = void 0;

var _solidJs = require("solid-js");

var _web = require("solid-js/web");

var _default = {};
exports.default = _default;
const a = (0, _web.template)("<table><thead><tr></tr></thead><tbody></tbody></table>", 8),
      v = (0, _web.template)("<th></th>", 2),
      f = (0, _web.template)("<tr></tr>", 2),
      b = (0, _web.template)("<td></td>", 2),
      h = (0, _web.template)('<span class="sort-icon"></span>', 2);

function m(o) {
  var r;
  const [c, m] = (0, _solidJs.createSignal)(),
        [N, k] = (0, _solidJs.createSignal)(o.rows);

  function j() {
    const t = c();
    return void 0 !== t ? t : void 0 !== o.defaultSortDirection ? o.defaultSortDirection : [null, null];
  }

  (0, _solidJs.createComputed)(() => {
    k(o.rows);
  });
  const D = null !== (r = o.rowSorter) && void 0 !== r ? r : w;

  function C() {
    const t = j();
    null === t[0] && void 0 !== o.defaultSortDirection ? k(D(N(), o.defaultSortDirection)) : null !== t[0] && k(D(N(), t));
  }

  const {
    headerRenderer: R = _,
    bodyRenderer: x = S,
    getRowID: O = $,
    accessors: A
  } = o;
  return void 0 === o.columns && (o.columns = function (t, n = 0) {
    const e = t[n],
          o = Object.keys(e),
          r = o.length,
          i = new Array(r);

    for (let t = 0; t < r; t++) i[t] = {
      id: o[t]
    };

    return i;
  }(o.rows, o.representitiveRowNumber)), C(), (() => {
    const t = a.cloneNode(!0),
          n = t.firstChild,
          r = n.firstChild,
          c = n.nextSibling;
    return (0, _web.insert)(r, (0, _web.createComponent)(_solidJs.For, {
      get each() {
        return o.columns;
      },

      children: t => {
        const n = !1 !== t.sortable;
        return (() => {
          const e = v.cloneNode(!0);
          var o;
          return e.__click = n ? (o = t.id, t => {
            m(function (t, n, e) {
              const o = t[0],
                    r = t[1];
              return e ? t = [null, null] : o === n ? t[1] = "asc" === r ? "desc" : "asc" : t = [n, "asc"], t;
            }(j(), o, t.shiftKey)), C();
          }) : void 0, e.className = n ? "sortable" : void 0, (0, _web.insert)(e, () => R(t), null), (0, _web.insert)(e, () => n ? function (t, n) {
            let e;
            e = null === t[0] || t[0] !== n ? g : "asc" === t[1] ? y : p;
            return (() => {
              const t = h.cloneNode(!0);
              return (0, _web.insert)(t, e), t;
            })();
          }(j(), t.id) : void 0, null), (0, _web.effect)(() => (0, _web.setAttribute)(e, "id", A ? String(t.id) : void 0)), e;
        })();
      }
    })), (0, _web.insert)(c, (0, _web.createComponent)(_solidJs.For, {
      get each() {
        return N();
      },

      children: t => {
        const n = function (t) {
          return A ? O(t) : void 0;
        }(t);

        return (() => {
          const r = f.cloneNode(!0);
          return (0, _web.setAttribute)(r, "id", n), (0, _web.insert)(r, (0, _web.createComponent)(_solidJs.For, {
            get each() {
              return o.columns;
            },

            children: e => (() => {
              const o = b.cloneNode(!0);
              return o.__click = void 0 !== e.onClick ? n => e.onClick(n, t) : void 0, (0, _web.insert)(o, () => x(t, e.id)), (0, _web.effect)(() => (0, _web.setAttribute)(o, "id", n ? `${n}.${e.id}` : void 0)), o;
            })()
          })), r;
        })();
      }
    })), (0, _web.effect)(n => {
      var e;
      const r = `solid-simple-table ${null !== (e = o.className) && void 0 !== e ? e : ""}`,
            i = o.style;
      return r !== n._v$ && (t.className = n._v$ = r), n._v$2 = (0, _web.style)(t, i, n._v$2), n;
    }, {
      _v$: void 0,
      _v$2: void 0
    }), t;
  })();
}

const p = "↑",
      y = "↓",
      g = "⇅";

function N(t) {
  return "string" == typeof t ? t : JSON.stringify(t);
}

function _(t) {
  var n;
  return null !== (n = t.label) && void 0 !== n ? n : t.id;
}

function S(t, n) {
  return N("object" == typeof t ? t[n] : t);
}

function $(t) {
  return N(t);
}

function w(t, n) {
  if (!t.length) return t;
  const e = n[0];
  return t = "object" == typeof t[0] ? t.sort((t, n) => {
    const o = t[e],
          r = n[e];
    return o == r ? 0 : o < r ? -1 : 1;
  }) : t.sort(), "desc" === n[1] ? t.reverse() : t;
}

(0, _web.delegateEvents)(["click"]);
},{"solid-js":"4z8gN","solid-js/web":"5Vgkw"}],"AxazM":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _atom = require("atom");

var _helpers = require("./helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Commands {
  constructor() {
    this.messages = [];
    this.subscriptions = new _atom.CompositeDisposable();
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
      // NOTE: Add no-ops here so they are recognized by commands registry
      // Real commands are registered when tooltip is shown inside tooltip's delegate
      'linter-ui-default:expand-tooltip': function () {},
      'linter-ui-default:collapse-tooltip': function () {}
    }), atom.commands.add('atom-text-editor:not([mini])', {
      'linter-ui-default:apply-all-solutions': () => this.applyAllSolutions()
    }), atom.commands.add('#linter-panel', {
      'core:copy': () => {
        const selection = document.getSelection();

        if (selection) {
          atom.clipboard.write(selection.toString());
        }
      }
    }));
  }

  togglePanel() {
    atom.config.set('linter-ui-default.showPanel', !atom.config.get('linter-ui-default.showPanel'));
  } // NOTE: Apply solutions from bottom to top, so they don't invalidate each other


  applyAllSolutions() {
    const textEditor = (0, _helpers.getActiveTextEditor)();
    (0, _assert.default)(textEditor, 'textEditor was null on a command supposed to run on text-editors only');
    const messages = (0, _helpers.sortMessages)((0, _helpers.filterMessages)(this.messages, textEditor.getPath()), ['line', 'desc']);
    messages.forEach(function (message) {
      if (message.version === 2 && message.solutions && message.solutions.length) {
        (0, _helpers.applySolution)(textEditor, (0, _helpers.sortSolutions)(message.solutions)[0]);
      }
    });
  }

  move(forward, globally, severity = null) {
    const currentEditor = (0, _helpers.getActiveTextEditor)();
    const currentFile = currentEditor && currentEditor.getPath() || NaN; // NOTE: ^ Setting default to NaN so it won't match empty file paths in messages

    const messages = (0, _helpers.sortMessages)((0, _helpers.filterMessages)(this.messages, globally ? null : currentFile, severity), ['file', 'asc']);
    const expectedValue = forward ? -1 : 1;

    if (!currentEditor) {
      const message = forward ? messages[0] : messages[messages.length - 1];

      if (message) {
        (0, _helpers.visitMessage)(message);
      }

      return;
    }

    const currentPosition = currentEditor.getCursorBufferPosition(); // NOTE: Iterate bottom to top to find the previous message
    // Because if we search top to bottom when sorted, first item will always
    // be the smallest

    if (!forward) {
      messages.reverse();
    }

    let found = null;
    let currentFileEncountered = false;

    for (let i = 0, length = messages.length; i < length; i++) {
      const message = messages[i];
      const messageFile = (0, _helpers.$file)(message);
      const messageRange = (0, _helpers.$range)(message);

      if (!currentFileEncountered && messageFile === currentFile) {
        currentFileEncountered = true;
      }

      if (messageFile && messageRange) {
        if (currentFileEncountered && messageFile !== currentFile) {
          found = message;
          break;
        } else if (messageFile === currentFile && currentPosition.compare(messageRange.start) === expectedValue) {
          found = message;
          break;
        }
      }
    }

    if (!found && messages.length) {
      // Reset back to first or last depending on direction
      found = messages[0];
    }

    if (found) {
      (0, _helpers.visitMessage)(found);
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
module.exports = exports.default;
},{"./helpers":"1gbPg"}],"78R5k":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _atom = require("atom");

var _element = _interopRequireDefault(require("./element"));

var _helpers = require("../helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class StatusBar {
  constructor() {
    this.element = new _element.default();
    this.messages = [];
    this.subscriptions = new _atom.CompositeDisposable();
    this.statusBarRepresents = void 0;
    this.statusBarClickBehavior = void 0;
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
      } else if (this.statusBarClickBehavior === 'Toggle Status Bar Scope') {
        atom.config.set('linter-ui-default.statusBarRepresents', this.statusBarRepresents === 'Entire Project' ? 'Current File' : 'Entire Project');
      } else {
        const postfix = this.statusBarRepresents === 'Current File' ? '-in-current-file' : '';
        atom.commands.dispatch(workspaceView, `linter-ui-default:next-${type}${postfix}`);
      }
    });
  }

  update(messages = null) {
    if (messages) {
      this.messages = messages;
    } else {
      messages = this.messages;
    }

    const count = {
      error: 0,
      warning: 0,
      info: 0
    };
    const currentTextEditor = (0, _helpers.getActiveTextEditor)();
    const currentPath = currentTextEditor && currentTextEditor.getPath() || NaN; // NOTE: ^ Setting default to NaN so it won't match empty file paths in messages

    messages.forEach(message => {
      if (this.statusBarRepresents === 'Entire Project' || (0, _helpers.$file)(message) === currentPath) {
        if (message.severity === 'error') {
          count.error++;
        } else if (message.severity === 'warning') {
          count.warning++;
        } else {
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
        priority: statusBarPosition === 'Left' ? 0 : 1000
      });
    }));
    this.subscriptions.add(new _atom.Disposable(function () {
      if (statusBar) {
        statusBar.destroy();
      }
    }));
  }

  dispose() {
    this.subscriptions.dispose();
  }

}

exports.default = StatusBar;
module.exports = exports.default;
},{"./element":"1Q2PK","../helpers":"1gbPg"}],"1Q2PK":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _atom = require("atom");

var Helpers = _interopRequireWildcard(require("./helpers"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

class Element {
  // eslint-disable-line @typescript-eslint/ban-types
  constructor() {
    this.item = document.createElement('div');
    this.itemErrors = Helpers.getElement('stop');
    this.itemWarnings = Helpers.getElement('alert');
    this.itemInfos = Helpers.getElement('info');
    this.emitter = new _atom.Emitter();
    this.subscriptions = new _atom.CompositeDisposable();
    this.item.appendChild(this.itemErrors);
    this.item.appendChild(this.itemWarnings);
    this.item.appendChild(this.itemInfos);
    this.item.classList.add('inline-block');
    this.item.classList.add('linter-status-count');
    this.subscriptions.add(this.emitter, atom.tooltips.add(this.itemErrors, {
      title: 'Linter Errors'
    }), atom.tooltips.add(this.itemWarnings, {
      title: 'Linter Warnings'
    }), atom.tooltips.add(this.itemInfos, {
      title: 'Linter Infos'
    }));

    this.itemErrors.onclick = () => this.emitter.emit('click', 'error');

    this.itemWarnings.onclick = () => this.emitter.emit('click', 'warning');

    this.itemInfos.onclick = () => this.emitter.emit('click', 'info');

    this.update(0, 0, 0);
  }

  setVisibility(prefix, visibility) {
    if (visibility) {
      this.item.classList.remove(`hide-${prefix}`);
    } else {
      this.item.classList.add(`hide-${prefix}`);
    }
  }

  update(countErrors, countWarnings, countInfos) {
    this.itemErrors.childNodes[0].textContent = String(countErrors);
    this.itemWarnings.childNodes[0].textContent = String(countWarnings);
    this.itemInfos.childNodes[0].textContent = String(countInfos);

    if (countErrors) {
      this.itemErrors.classList.add('text-error');
    } else {
      this.itemErrors.classList.remove('text-error');
    }

    if (countWarnings) {
      this.itemWarnings.classList.add('text-warning');
    } else {
      this.itemWarnings.classList.remove('text-warning');
    }

    if (countInfos) {
      this.itemInfos.classList.add('text-info');
    } else {
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
module.exports = exports.default;
},{"./helpers":"xI6Gl"}],"xI6Gl":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getElement = getElement;

function getElement(icon) {
  const element = document.createElement('a');
  element.classList.add(`icon-${icon}`);
  element.appendChild(document.createTextNode(''));
  return element;
}
},{}],"2vz1J":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _atom = require("atom");

class BusySignal {
  constructor() {
    this.provider = void 0;
    this.executing = new Set();
    this.providerTitles = new Set();
    this.useBusySignal = true;
    this.subscriptions = new _atom.CompositeDisposable();
    this.subscriptions.add(atom.config.observe('linter-ui-default.useBusySignal', useBusySignal => {
      this.useBusySignal = useBusySignal;
    }));
  }

  attach(registry) {
    this.provider = registry.create();
    this.update();
  }

  update() {
    const provider = this.provider;
    if (!provider) return;
    if (!this.useBusySignal) return;
    const fileMap = new Map();
    const currentTitles = new Set();

    for (const {
      filePath,
      linter
    } of this.executing) {
      let names = fileMap.get(filePath);

      if (!names) {
        fileMap.set(filePath, names = []);
      }

      names.push(linter.name);
    }

    for (const [filePath, names] of fileMap) {
      const path = filePath ? ` on ${atom.project.relativizePath(filePath)[1]}` : '';
      names.forEach(name => {
        const title = `${name}${path}`;
        currentTitles.add(title);

        if (!this.providerTitles.has(title)) {
          // Add the title since it hasn't been seen before
          this.providerTitles.add(title);
          provider.add(title);
        }
      });
    } // Remove any titles no longer active


    this.providerTitles.forEach(title => {
      if (!currentTitles.has(title)) {
        provider.remove(title);
        this.providerTitles.delete(title);
      }
    });
    fileMap.clear();
  }

  getExecuting(linter, filePath) {
    for (const entry of this.executing) {
      if (entry.linter === linter && entry.filePath === filePath) {
        return entry;
      }
    }

    return null;
  }

  didBeginLinting(linter, filePath) {
    if (this.getExecuting(linter, filePath)) {
      return;
    }

    this.executing.add({
      linter,
      filePath
    });
    this.update();
  }

  didFinishLinting(linter, filePath) {
    const entry = this.getExecuting(linter, filePath);

    if (entry) {
      this.executing.delete(entry);
      this.update();
    }
  }

  dispose() {
    if (this.provider) {
      this.provider.clear();
    }

    this.providerTitles.clear();
    this.executing.clear();
    this.subscriptions.dispose();
  }

}

exports.default = BusySignal;
module.exports = exports.default;
},{}],"7LGDv":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _helpers = require("./helpers");

class Intentions {
  constructor() {
    this.messages = [];
    this.grammarScopes = ['*'];
  }

  getIntentions({
    textEditor,
    bufferPosition
  }) {
    let intentions = [];
    const messages = (0, _helpers.filterMessages)(this.messages, textEditor.getPath());

    for (const message of messages) {
      const hasFixes = message.solutions && message.solutions.length;

      if (!hasFixes) {
        continue;
      }

      const range = (0, _helpers.$range)(message);
      const inRange = range && range.containsPoint(bufferPosition);

      if (!inRange) {
        continue;
      }

      let solutions = [];

      if (message.version === 2 && message.solutions && message.solutions.length) {
        solutions = message.solutions;
      }

      const linterName = message.linterName || 'Linter';
      intentions = intentions.concat(solutions.map(solution => ({
        priority: solution.priority ? solution.priority + 200 : 200,
        icon: 'tools',
        title: solution.title || `Fix ${linterName} issue`,

        selected() {
          (0, _helpers.applySolution)(textEditor, solution);
        }

      })));
    }

    return intentions;
  }

  update(messages) {
    this.messages = messages;
  }

}

exports.default = Intentions;
module.exports = exports.default;
},{"./helpers":"1gbPg"}],"4PoT2":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _atom = require("atom");

var _editor = _interopRequireDefault(require("./editor"));

var _helpers = require("./helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Editors {
  constructor() {
    this.editors = new Set();
    this.messages = [];
    this.firstRender = true;
    this.subscriptions = new _atom.CompositeDisposable();
    this.subscriptions.add(atom.workspace.observeTextEditors(textEditor => {
      // TODO we do this check only at the begining. Probably we should do this later too?
      if ((0, _helpers.isLargeFile)(textEditor)) {
        const notif = atom.notifications.addWarning('Linter: Large/Minified file detected', {
          detail: 'Adding inline linter markers are skipped for this file for performance reasons (linter pane is still active)',
          dismissable: true,
          buttons: [{
            text: 'Force enable',
            onDidClick: () => {
              this.getEditor(textEditor);
              notif.dismiss();
            }
          }, {
            text: 'Change threshold',
            onDidClick: async () => {
              var _document$querySelect;

              await atom.workspace.open('atom://config/packages/linter-ui-default'); // it is the 16th setting :D

              (_document$querySelect = document.querySelectorAll('.control-group')[16]) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.scrollIntoView();
              notif.dismiss();
            }
          }]
        });
        setTimeout(() => {
          notif.dismiss();
        }, 5000);
        return;
      }

      this.getEditor(textEditor);
    }), atom.workspace.getCenter().observeActivePaneItem(paneItem => {
      this.editors.forEach(editor => {
        if (editor.textEditor !== paneItem) {
          editor.removeTooltip();
        }
      });
    }));
  }

  isFirstRender() {
    return this.firstRender;
  }

  update({
    messages,
    added,
    removed
  }) {
    this.messages = messages;
    this.firstRender = false;
    const {
      editorsMap,
      filePaths
    } = (0, _helpers.getEditorsMap)(this);
    added.forEach(function (message) {
      if (!message || !message.location) {
        return;
      }

      const filePath = (0, _helpers.$file)(message);

      if (filePath && editorsMap.has(filePath)) {
        editorsMap.get(filePath).added.push(message);
      }
    });
    removed.forEach(function (message) {
      if (!message || !message.location) {
        return;
      }

      const filePath = (0, _helpers.$file)(message);

      if (filePath && editorsMap.has(filePath)) {
        editorsMap.get(filePath).removed.push(message);
      }
    });
    filePaths.forEach(function (filePath) {
      if (editorsMap.has(filePath)) {
        const {
          added,
          removed,
          editors
        } = editorsMap.get(filePath);

        if (added.length || removed.length) {
          editors.forEach(editor => editor.apply(added, removed));
        }
      }
    });
  }

  getEditor(textEditor) {
    for (const entry of this.editors) {
      if (entry.textEditor === textEditor) {
        return entry;
      }
    }

    const editor = new _editor.default(textEditor);
    this.editors.add(editor);
    editor.onDidDestroy(() => {
      this.editors.delete(editor);
    });
    editor.subscriptions.add(textEditor.onDidChangePath(() => {
      editor.dispose();
      this.getEditor(textEditor);
    }));
    editor.subscriptions.add(textEditor.onDidChangeGrammar(() => {
      editor.dispose();
      this.getEditor(textEditor);
    }));
    editor.apply((0, _helpers.filterMessages)(this.messages, textEditor.getPath()), []);
    return editor;
  }

  dispose() {
    for (const entry of this.editors) {
      entry.dispose();
    }

    this.subscriptions.dispose();
  }

}

exports.default = Editors;
module.exports = exports.default;
},{"./editor":"6JSQD","./helpers":"1gbPg"}],"6JSQD":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _debounce = _interopRequireDefault(require("lodash/debounce"));

var _disposableEvent = _interopRequireDefault(require("disposable-event"));

var _atom = require("atom");

var _tooltip = _interopRequireDefault(require("../tooltip"));

var _helpers = require("../helpers");

var _helpers2 = require("./helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Editor {
  constructor(textEditor) {
    this.textEditor = void 0;
    this.gutter = null;
    this.tooltip = null;
    this.emitter = new _atom.Emitter();
    this.markers = new Map();
    this.messages = new Map();
    this.showTooltip = true;
    this.subscriptions = new _atom.CompositeDisposable();
    this.cursorPosition = null;
    this.gutterPosition = void 0;
    this.tooltipFollows = 'Both';
    this.showDecorations = void 0;
    this.showProviderName = true;
    this.ignoreTooltipInvocation = false;
    this.currentLineMarker = null;
    this.lastRange = void 0;
    this.lastIsEmpty = void 0;
    this.lastCursorPositions = new WeakMap();
    this.textEditor = textEditor;
    let tooltipSubscription = null;
    this.subscriptions.add(this.emitter, textEditor.onDidDestroy(() => {
      this.dispose();
    }), new _atom.Disposable(function () {
      var _tooltipSubscription;

      (_tooltipSubscription = tooltipSubscription) === null || _tooltipSubscription === void 0 ? void 0 : _tooltipSubscription.dispose();
    }), // configs
    atom.config.observe('linter-ui-default.showProviderName', showProviderName => {
      this.showProviderName = showProviderName;
    }), atom.config.observe('linter-ui-default.showDecorations', showDecorations => {
      const notInitial = typeof this.showDecorations !== 'undefined';
      this.showDecorations = showDecorations;

      if (notInitial) {
        this.updateGutter();
      }
    }), // gutter config
    atom.config.observe('linter-ui-default.gutterPosition', gutterPosition => {
      const notInitial = typeof this.gutterPosition !== 'undefined';
      this.gutterPosition = gutterPosition;

      if (notInitial) {
        this.updateGutter();
      }
    }), // tooltip config
    atom.config.observe('linter-ui-default.showTooltip', showTooltip => {
      this.showTooltip = showTooltip;

      if (!this.showTooltip && this.tooltip) {
        this.removeTooltip();
      }
    }), atom.config.observe('linter-ui-default.tooltipFollows', tooltipFollows => {
      this.tooltipFollows = tooltipFollows;

      if (tooltipSubscription) {
        tooltipSubscription.dispose();
      }

      tooltipSubscription = new _atom.CompositeDisposable();

      if (tooltipFollows === 'Mouse' || tooltipFollows === 'Both') {
        tooltipSubscription.add(this.listenForMouseMovement());
      }

      if (tooltipFollows === 'Keyboard' || tooltipFollows === 'Both') {
        tooltipSubscription.add(this.listenForKeyboardMovement());
      }

      this.removeTooltip();
    }), // cursor position change
    textEditor.onDidChangeCursorPosition(({
      cursor,
      newBufferPosition
    }) => {
      const lastBufferPosition = this.lastCursorPositions.get(cursor);

      if (!lastBufferPosition || !lastBufferPosition.isEqual(newBufferPosition)) {
        this.lastCursorPositions.set(cursor, newBufferPosition);
        this.ignoreTooltipInvocation = false;
      }

      if (this.tooltipFollows === 'Mouse') {
        this.removeTooltip();
      }
    }), // text change
    textEditor.getBuffer().onDidChangeText(() => {
      const cursors = textEditor.getCursors();
      cursors.forEach(cursor => {
        this.lastCursorPositions.set(cursor, cursor.getBufferPosition());
      });

      if (this.tooltipFollows !== 'Mouse') {
        this.ignoreTooltipInvocation = true;
        this.removeTooltip();
      }
    }));
    this.updateGutter();
    this.listenForCurrentLine();
  }

  listenForCurrentLine() {
    this.subscriptions.add(this.textEditor.observeCursors(cursor => {
      const handlePositionChange = ({
        start,
        end
      }) => {
        const gutter = this.gutter;
        if (!gutter || this.subscriptions.disposed) return; // We need that Range.fromObject hack below because when we focus index 0 on multi-line selection
        // end.column is the column of the last line but making a range out of two and then accesing
        // the end seems to fix it (black magic?)

        const currentRange = _atom.Range.fromObject([start, end]);

        const linesRange = _atom.Range.fromObject([[start.row, 0], [end.row, Infinity]]);

        const currentIsEmpty = currentRange.isEmpty(); // NOTE: Atom does not paint gutter if multi-line and last line has zero index

        if (start.row !== end.row && currentRange.end.column === 0) {
          linesRange.end.row--;
        }

        if (this.lastRange && this.lastRange.isEqual(linesRange) && currentIsEmpty === this.lastIsEmpty) return;

        if (this.currentLineMarker) {
          this.currentLineMarker.destroy();
          this.currentLineMarker = null;
        }

        this.lastRange = linesRange;
        this.lastIsEmpty = currentIsEmpty;
        this.currentLineMarker = this.textEditor.markScreenRange(linesRange, {
          invalidate: 'never'
        });
        const item = document.createElement('span');
        item.className = `line-number cursor-line linter-cursor-line ${currentIsEmpty ? 'cursor-line-no-selection' : ''}`;
        gutter.decorateMarker(this.currentLineMarker, {
          item,
          class: 'linter-row'
        });
      };

      const cursorMarker = cursor.getMarker();
      const subscriptions = new _atom.CompositeDisposable();
      subscriptions.add(cursorMarker.onDidChange(({
        newHeadScreenPosition,
        newTailScreenPosition
      }) => {
        handlePositionChange({
          start: newHeadScreenPosition,
          end: newTailScreenPosition
        });
      }));
      subscriptions.add(cursor.onDidDestroy(() => {
        this.subscriptions.remove(subscriptions);
        subscriptions.dispose();
      }));
      subscriptions.add(new _atom.Disposable(() => {
        if (this.currentLineMarker) {
          this.currentLineMarker.destroy();
          this.currentLineMarker = null;
        }
      }));
      this.subscriptions.add(subscriptions);
      handlePositionChange(cursorMarker.getScreenRange());
    }));
  }

  listenForMouseMovement() {
    const editorElement = atom.views.getView(this.textEditor);
    return (0, _disposableEvent.default)(editorElement, 'mousemove', (0, _debounce.default)(event => {
      if (!editorElement.getComponent() || this.subscriptions.disposed || !(0, _helpers2.hasParent)(event.target, 'div.scroll-view')) {
        return;
      }

      const tooltip = this.tooltip;

      if (tooltip && (0, _helpers2.mouseEventNearPosition)({
        event,
        editor: this.textEditor,
        editorElement,
        tooltipElement: tooltip.element,
        screenPosition: tooltip.marker.getStartScreenPosition()
      })) {
        return;
      }

      this.cursorPosition = (0, _helpers2.getBufferPositionFromMouseEvent)(event, this.textEditor, editorElement);
      this.ignoreTooltipInvocation = false;

      if (this.cursorPosition) {
        this.updateTooltip(this.cursorPosition);
      } else {
        this.removeTooltip();
      }
    }, 100), {
      passive: true
    });
  }

  listenForKeyboardMovement() {
    return this.textEditor.onDidChangeCursorPosition((0, _debounce.default)(({
      newBufferPosition
    }) => {
      this.cursorPosition = newBufferPosition;
      this.updateTooltip(newBufferPosition);
    }, 16));
  }

  updateGutter() {
    this.removeGutter();

    if (!this.showDecorations) {
      this.gutter = null;
      return;
    }

    const priority = this.gutterPosition === 'Left' ? -100 : 100;
    this.gutter = this.textEditor.addGutter({
      name: 'linter-ui-default',
      priority
    });
    this.markers.forEach((markers, key) => {
      const message = this.messages.get(key);

      if (message) {
        for (const marker of markers) {
          this.decorateMarker(message, marker, 'gutter');
        }
      }
    });
  }

  removeGutter() {
    if (this.gutter) {
      try {
        this.gutter.destroy();
      } catch (_) {
        /* This throws when the text editor is disposed */
      }
    }
  }

  updateTooltip(position) {
    if (!position || this.tooltip && this.tooltip.isValid(position, this.messages)) {
      return;
    }

    this.removeTooltip();

    if (!this.showTooltip) {
      return;
    }

    if (this.ignoreTooltipInvocation) {
      return;
    }

    const messages = (0, _helpers.filterMessagesByRangeOrPoint)(this.messages, this.textEditor.getPath(), position);

    if (!messages.length) {
      return;
    }

    this.tooltip = new _tooltip.default(messages, position, this.textEditor);
    const tooltipMarker = this.tooltip.marker; // save markers of the tooltip (for destorying them in this.apply)

    messages.forEach(message => {
      this.saveMarker(message.key, tooltipMarker);
    }); // $FlowIgnore: this.tooltip is not null

    this.tooltip.onDidDestroy(() => {
      this.tooltip = null;
    });
  }

  removeTooltip() {
    if (this.tooltip) {
      this.tooltip.marker.destroy();
    }
  }

  apply(added, removed) {
    const textBuffer = this.textEditor.getBuffer();

    for (let i = 0, length = removed.length; i < length; i++) {
      const message = removed[i];
      this.destroyMarker(message.key);
    }

    for (let i = 0, length = added.length; i < length; i++) {
      const message = added[i];
      const markerRange = (0, _helpers.$range)(message);

      if (!markerRange) {
        // Only for backward compatibility
        continue;
      } // TODO this marker is Marker no DisplayMarker!!


      const marker = textBuffer.markRange(markerRange, {
        invalidate: 'never'
      });
      this.decorateMarker(message, marker);
      marker.onDidChange(({
        oldHeadPosition,
        newHeadPosition,
        isValid
      }) => {
        if (!isValid || newHeadPosition.row === 0 && oldHeadPosition.row !== 0) {
          return;
        }

        if (message.version === 2) {
          message.location.position = marker.previousEventState.range;
        }
      });
    }

    this.updateTooltip(this.cursorPosition);
  }

  decorateMarker(message, marker, paint = 'both') {
    this.saveMarker(message.key, marker);
    this.messages.set(message.key, message);

    if (paint === 'both' || paint === 'editor') {
      this.textEditor.decorateMarker(marker, {
        type: 'text',
        class: `linter-highlight linter-${message.severity}`
      });
    }

    const gutter = this.gutter;

    if (gutter && (paint === 'both' || paint === 'gutter')) {
      const element = document.createElement('span');
      element.className = `linter-gutter linter-gutter-${message.severity} icon icon-${message.icon || 'primitive-dot'}`;
      gutter.decorateMarker(marker, {
        class: 'linter-row',
        item: element
      });
    }
  } // add marker to the message => marker map


  saveMarker(key, marker) {
    const allMarkers = this.markers.get(key) || [];
    allMarkers.push(marker);
    this.markers.set(key, allMarkers);
  } // destroy markers of a key


  destroyMarker(key) {
    const markers = this.markers.get(key);

    if (markers) {
      markers.forEach(marker => {
        if (marker) {
          marker.destroy();
        }
      });
    }

    this.markers.delete(key);
    this.messages.delete(key);
  }

  onDidDestroy(callback) {
    return this.emitter.on('did-destroy', callback);
  }

  dispose() {
    this.emitter.emit('did-destroy');
    this.subscriptions.dispose();
    this.removeGutter();
    this.removeTooltip();
  }

}

exports.default = Editor;
module.exports = exports.default;
},{"lodash/debounce":"19Jv3","../tooltip":"1D4A8","../helpers":"1gbPg","./helpers":"d6BGW"}],"19Jv3":[function(require,module,exports) {
var isObject = require('./isObject'),
    now = require('./now'),
    toNumber = require('./toNumber');

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        timeWaiting = wait - timeSinceLastCall;

    return maxing
      ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        clearTimeout(timerId);
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

module.exports = debounce;

},{"./isObject":"5gxJa","./now":"7B7Vg","./toNumber":"2se76"}],"5gxJa":[function(require,module,exports) {
/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],"7B7Vg":[function(require,module,exports) {
var root = require('./_root');

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function() {
  return root.Date.now();
};

module.exports = now;

},{"./_root":"4IR1E"}],"4IR1E":[function(require,module,exports) {
var freeGlobal = require('./_freeGlobal');

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

module.exports = root;

},{"./_freeGlobal":"7rmSS"}],"7rmSS":[function(require,module,exports) {
/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

module.exports = freeGlobal;

},{}],"2se76":[function(require,module,exports) {
var isObject = require('./isObject'),
    isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = toNumber;

},{"./isObject":"5gxJa","./isSymbol":"3ZQsP"}],"3ZQsP":[function(require,module,exports) {
var baseGetTag = require('./_baseGetTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && baseGetTag(value) == symbolTag);
}

module.exports = isSymbol;

},{"./_baseGetTag":"379hP","./isObjectLike":"6hAsI"}],"379hP":[function(require,module,exports) {
var Symbol = require('./_Symbol'),
    getRawTag = require('./_getRawTag'),
    objectToString = require('./_objectToString');

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

module.exports = baseGetTag;

},{"./_Symbol":"2uguN","./_getRawTag":"5wGKU","./_objectToString":"1PoK4"}],"2uguN":[function(require,module,exports) {
var root = require('./_root');

/** Built-in value references. */
var Symbol = root.Symbol;

module.exports = Symbol;

},{"./_root":"4IR1E"}],"5wGKU":[function(require,module,exports) {
var Symbol = require('./_Symbol');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

module.exports = getRawTag;

},{"./_Symbol":"2uguN"}],"1PoK4":[function(require,module,exports) {
/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

module.exports = objectToString;

},{}],"6hAsI":[function(require,module,exports) {
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],"1D4A8":[function(require,module,exports) {
"use strict";

var _$template = require("solid-js/web").template;

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _web = require("solid-js/web");

var _atom = require("atom");

var _delegate = _interopRequireDefault(require("./delegate"));

var _message = _interopRequireDefault(require("./message"));

var _helpers = require("../helpers");

const _tmpl$ = _$template(`<div class="linter-messages"></div>`, 2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class TooltipElement {
  constructor(messages, position, textEditor) {
    this.marker = void 0;
    this.element = document.createElement('div');
    this.emitter = new _atom.Emitter();
    this.messages = void 0;
    this.subscriptions = new _atom.CompositeDisposable();
    this.messages = messages;
    this.marker = textEditor.markBufferRange([position, position]);
    this.marker.onDidDestroy(() => this.emitter.emit('did-destroy'));
    const delegate = new _delegate.default();
    this.element.id = 'linter-tooltip';
    textEditor.decorateMarker(this.marker, {
      type: 'overlay',
      item: this.element
    });
    this.subscriptions.add(this.emitter, delegate);
    const children = [];
    messages.forEach(message => {
      if (message.version === 2) {
        children.push((0, _web.createComponent)(_message.default, {
          get key() {
            return message.key;
          },

          delegate: delegate,
          message: message
        }));
      }
    });
    (0, _web.render)(() => (() => {
      const _el$ = _tmpl$.cloneNode(true);

      (0, _web.insert)(_el$, children);
      return _el$;
    })(), this.element); // move box above the current editing line
    // HACK: patch the decoration's style so it is shown above the current line

    setTimeout(() => {
      const hight = this.element.getBoundingClientRect().height;
      const lineHight = textEditor.getLineHeightInPixels(); // @ts-ignore: internal API

      const availableHight = (position.row - textEditor.getFirstVisibleScreenRow()) * lineHight;

      if (hight < availableHight) {
        const overlay = this.element.parentElement;

        if (overlay) {
          overlay.style.transform = `translateY(-${2 + lineHight + hight}px)`;
        } // TODO:
        // } else {
        // // // move right so it does not overlap with datatip-overlay"
        // const dataTip = textEditor.getElement().querySelector(".datatip-overlay")
        // if (dataTip) {
        //   this.element.style.left = dataTip.clientWidth + "px"
        // }

      }

      this.element.style.visibility = 'visible';
    }, 50);
  }

  isValid(position, messages) {
    if (this.messages.length !== 1 || !messages.has(this.messages[0].key)) {
      return false;
    }

    const range = (0, _helpers.$range)(this.messages[0]);
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
module.exports = exports.default;
},{"solid-js/web":"5Vgkw","./delegate":"4XeSA","./message":"4UzSJ","../helpers":"1gbPg"}],"4XeSA":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _atom = require("atom");

class TooltipDelegate {
  constructor() {
    this.emitter = new _atom.Emitter();
    this.expanded = false;
    this.subscriptions = new _atom.CompositeDisposable();
    this.showProviderName = void 0;
    this.subscriptions.add(this.emitter, atom.config.observe('linter-ui-default.showProviderName', showProviderName => {
      const shouldUpdate = typeof this.showProviderName !== 'undefined';
      this.showProviderName = showProviderName;

      if (shouldUpdate) {
        this.emitter.emit('should-update');
      }
    }), atom.commands.add('atom-workspace', {
      'linter-ui-default:expand-tooltip': event => {
        var _event$originalEvent;

        if (this.expanded) {
          return;
        }

        this.expanded = true;
        this.emitter.emit('should-expand'); // If bound to a key, collapse when that key is released, just like old times

        if (event !== null && event !== void 0 && (_event$originalEvent = event.originalEvent) !== null && _event$originalEvent !== void 0 && _event$originalEvent.isTrusted) {
          // $FlowIgnore: document.body is never null
          document.body.addEventListener('keyup', function eventListener() {
            // $FlowIgnore: document.body is never null
            document.body.removeEventListener('keyup', eventListener);
            atom.commands.dispatch(atom.views.getView(atom.workspace), 'linter-ui-default:collapse-tooltip');
          }, {
            passive: true
          });
        }
      },
      'linter-ui-default:collapse-tooltip': () => {
        this.expanded = false;
        this.emitter.emit('should-collapse');
      }
    }));
  }

  onShouldUpdate(callback) {
    return this.emitter.on('should-update', callback);
  }

  onShouldExpand(callback) {
    return this.emitter.on('should-expand', callback);
  }

  onShouldCollapse(callback) {
    return this.emitter.on('should-collapse', callback);
  }

  dispose() {
    this.emitter.dispose();
  }

}

exports.default = TooltipDelegate;
module.exports = exports.default;
},{}],"4UzSJ":[function(require,module,exports) {
"use strict";

var _$template = require("solid-js/web").template;

var _$delegateEvents = require("solid-js/web").delegateEvents;

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = MessageElement;

var _web = require("solid-js/web");

var _solidJs = require("solid-js");

var url = _interopRequireWildcard(require("url"));

var _marked = _interopRequireDefault(require("marked"));

var _helpers = require("../helpers");

var _fixButton = require("./fix-button");

const _tmpl$ = _$template(`<div class="linter-message"><div><div class="linter-text"><div class="provider-name"></div></div><div class="linter-buttons-right"></div></div></div>`, 10),
      _tmpl$2 = _$template(`<a href="#"><span></span></a>`, 4),
      _tmpl$3 = _$template(`<a href="#"><span class="icon linter-icon icon-alignment-aligned-to"></span></a>`, 4),
      _tmpl$4 = _$template(`<a href="#"><span class="icon linter-icon icon-link"></span></a>`, 4),
      _tmpl$5 = _$template(`<div class="linter-line"></div>`, 2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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
  const [state, setState] = (0, _solidJs.createState)({
    description: '',
    descriptionShow: false
  });
  const [descriptionLoading, setDescriptionLoading] = (0, _solidJs.createSignal)(false);

  function onFixClick() {
    const message = props.message;
    const textEditor = (0, _helpers.getActiveTextEditor)();

    if (textEditor !== null && message.version === 2 && message.solutions && message.solutions.length) {
      (0, _helpers.applySolution)(textEditor, (0, _helpers.sortSolutions)(message.solutions)[0]);
    }
  }

  function toggleDescription(result = null) {
    const newStatus = !state.descriptionShow;
    const description = state.description || props.message.description;

    if (!newStatus && !result) {
      setState({ ...state,
        descriptionShow: false
      });
      return;
    }

    if (typeof description === 'string' || result) {
      const descriptionToUse = (0, _marked.default)(result || description);
      setState({
        description: descriptionToUse,
        descriptionShow: true
      });
    } else if (typeof description === 'function') {
      setState({ ...state,
        descriptionShow: true
      });

      if (descriptionLoading()) {
        return;
      }

      setDescriptionLoading(true);
      new Promise(function (resolve) {
        resolve(description());
      }).then(response => {
        if (typeof response !== 'string') {
          throw new Error(`Expected result to be string, got: ${typeof response}`);
        }

        toggleDescription(response);
      }).catch(error => {
        console.log('[Linter] Error getting descriptions', error);
        setDescriptionLoading(false);

        if (state.descriptionShow) {
          toggleDescription();
        }
      });
    } else {
      console.error('[Linter] Invalid description detected, expected string or function but got:', typeof description);
    }
  }

  (0, _solidJs.onMount)(() => {
    props.delegate.onShouldUpdate(() => {
      setState({
        description: '',
        descriptionShow: false
      });
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
  const {
    message,
    delegate
  } = props;
  return (() => {
    const _el$ = _tmpl$.cloneNode(true),
          _el$2 = _el$.firstChild,
          _el$3 = _el$2.firstChild,
          _el$4 = _el$3.firstChild,
          _el$5 = _el$3.nextSibling;

    _el$.__click = thisOpenFile;
    (0, _web.insert)(_el$2, (() => {
      const _c$ = (0, _web.memo)(() => !!message.description, true);

      return () => // fold butotn if has message description
      _c$() && (() => {
        const _el$6 = _tmpl$2.cloneNode(true),
              _el$7 = _el$6.firstChild;

        _el$6.__click = () => toggleDescription();

        (0, _web.effect)(() => _el$7.className = `icon linter-icon icon-${state.descriptionShow ? 'chevron-down' : 'chevron-right'}`);
        return _el$6;
      })();
    })(), _el$3);
    (0, _web.insert)(_el$2, (() => {
      const _c$2 = (0, _web.memo)(() => !!canBeFixed(message), true);

      return () => // fix button
      _c$2() && (0, _web.createComponent)(_fixButton.FixButton, {
        onClick: () => onFixClick()
      });
    })(), _el$3);
    (0, _web.insert)(_el$4, () => // provider name
    delegate.showProviderName ? `${message.linterName}: ` : '');
    (0, _web.insert)(_el$3, () => // main message text
    message.excerpt, null);
    (0, _web.insert)(_el$5, (() => {
      const _c$3 = (0, _web.memo)(() => !!(message.reference && message.reference.file), true);

      return () => // message reference
      _c$3() && (() => {
        const _el$8 = _tmpl$3.cloneNode(true);

        _el$8.__click = () => (0, _helpers.visitMessage)(message, true);

        return _el$8;
      })();
    })(), null);
    (0, _web.insert)(_el$5, (() => {
      const _c$4 = (0, _web.memo)(() => !!message.url, true);

      return () => // message url
      _c$4() && (() => {
        const _el$9 = _tmpl$4.cloneNode(true);

        _el$9.__click = () => (0, _helpers.openExternally)(message);

        return _el$9;
      })();
    })(), null);
    (0, _web.insert)(_el$, (() => {
      const _c$5 = (0, _web.memo)(() => !!state.descriptionShow, true);

      return () => // message description
      _c$5() && (() => {
        const _el$10 = _tmpl$5.cloneNode(true);

        (0, _web.insert)(_el$10, () => state.description || 'Loading...');
        return _el$10;
      })();
    })(), null);
    (0, _web.effect)(() => _el$2.className = `linter-excerpt ${message.severity}`);
    return _el$;
  })();
}

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
  } // parse the link. e.g. atom://linter?file=<path>&row=<number>&column=<number>


  const {
    protocol,
    hostname,
    query
  } = url.parse(href, true);

  if (protocol !== 'atom:' || hostname !== 'linter') {
    return;
  } // TODO: based on the types query is never null


  if (!query || !query.file) {
    return;
  } else {
    const {
      file,
      row,
      column
    } = query; // TODO: will these be an array?

    (0, _helpers.openFile)(
    /* file */
    Array.isArray(file) ? file[0] : file,
    /* position */
    {
      row: row ? parseInt(Array.isArray(row) ? row[0] : row, 10) : 0,
      column: column ? parseInt(Array.isArray(column) ? column[0] : column, 10) : 0
    });
  }
}

_$delegateEvents(["click"]);

module.exports = exports.default;
},{"solid-js/web":"5Vgkw","solid-js":"4z8gN","marked":"74mqy","../helpers":"1gbPg","./fix-button":"3eyFW"}],"74mqy":[function(require,module,exports) {
const Lexer = require('./Lexer.js');

const Parser = require('./Parser.js');

const Tokenizer = require('./Tokenizer.js');

const Renderer = require('./Renderer.js');

const TextRenderer = require('./TextRenderer.js');

const Slugger = require('./Slugger.js');

const {
  merge,
  checkSanitizeDeprecation,
  escape
} = require('./helpers.js');

const {
  getDefaults,
  changeDefaults,
  defaults
} = require('./defaults.js');
/**
 * Marked
 */


function marked(src, opt, callback) {
  // throw error in case of non string input
  if (typeof src === 'undefined' || src === null) {
    throw new Error('marked(): input parameter is undefined or null');
  }

  if (typeof src !== 'string') {
    throw new Error('marked(): input parameter is of type ' + Object.prototype.toString.call(src) + ', string expected');
  }

  if (typeof opt === 'function') {
    callback = opt;
    opt = null;
  }

  opt = merge({}, marked.defaults, opt || {});
  checkSanitizeDeprecation(opt);

  if (callback) {
    const highlight = opt.highlight;
    let tokens;

    try {
      tokens = Lexer.lex(src, opt);
    } catch (e) {
      return callback(e);
    }

    const done = function (err) {
      let out;

      if (!err) {
        try {
          out = Parser.parse(tokens, opt);
        } catch (e) {
          err = e;
        }
      }

      opt.highlight = highlight;
      return err ? callback(err) : callback(null, out);
    };

    if (!highlight || highlight.length < 3) {
      return done();
    }

    delete opt.highlight;
    if (!tokens.length) return done();
    let pending = 0;
    marked.walkTokens(tokens, function (token) {
      if (token.type === 'code') {
        pending++;
        setTimeout(() => {
          highlight(token.text, token.lang, function (err, code) {
            if (err) {
              return done(err);
            }

            if (code != null && code !== token.text) {
              token.text = code;
              token.escaped = true;
            }

            pending--;

            if (pending === 0) {
              done();
            }
          });
        }, 0);
      }
    });

    if (pending === 0) {
      done();
    }

    return;
  }

  try {
    const tokens = Lexer.lex(src, opt);

    if (opt.walkTokens) {
      marked.walkTokens(tokens, opt.walkTokens);
    }

    return Parser.parse(tokens, opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/markedjs/marked.';

    if (opt.silent) {
      return '<p>An error occurred:</p><pre>' + escape(e.message + '', true) + '</pre>';
    }

    throw e;
  }
}
/**
 * Options
 */


marked.options = marked.setOptions = function (opt) {
  merge(marked.defaults, opt);
  changeDefaults(marked.defaults);
  return marked;
};

marked.getDefaults = getDefaults;
marked.defaults = defaults;
/**
 * Use Extension
 */

marked.use = function (extension) {
  const opts = merge({}, extension);

  if (extension.renderer) {
    const renderer = marked.defaults.renderer || new Renderer();

    for (const prop in extension.renderer) {
      const prevRenderer = renderer[prop];

      renderer[prop] = (...args) => {
        let ret = extension.renderer[prop].apply(renderer, args);

        if (ret === false) {
          ret = prevRenderer.apply(renderer, args);
        }

        return ret;
      };
    }

    opts.renderer = renderer;
  }

  if (extension.tokenizer) {
    const tokenizer = marked.defaults.tokenizer || new Tokenizer();

    for (const prop in extension.tokenizer) {
      const prevTokenizer = tokenizer[prop];

      tokenizer[prop] = (...args) => {
        let ret = extension.tokenizer[prop].apply(tokenizer, args);

        if (ret === false) {
          ret = prevTokenizer.apply(tokenizer, args);
        }

        return ret;
      };
    }

    opts.tokenizer = tokenizer;
  }

  if (extension.walkTokens) {
    const walkTokens = marked.defaults.walkTokens;

    opts.walkTokens = token => {
      extension.walkTokens(token);

      if (walkTokens) {
        walkTokens(token);
      }
    };
  }

  marked.setOptions(opts);
};
/**
 * Run callback for every token
 */


marked.walkTokens = function (tokens, callback) {
  for (const token of tokens) {
    callback(token);

    switch (token.type) {
      case 'table':
        {
          for (const cell of token.tokens.header) {
            marked.walkTokens(cell, callback);
          }

          for (const row of token.tokens.cells) {
            for (const cell of row) {
              marked.walkTokens(cell, callback);
            }
          }

          break;
        }

      case 'list':
        {
          marked.walkTokens(token.items, callback);
          break;
        }

      default:
        {
          if (token.tokens) {
            marked.walkTokens(token.tokens, callback);
          }
        }
    }
  }
};
/**
 * Parse Inline
 */


marked.parseInline = function (src, opt) {
  // throw error in case of non string input
  if (typeof src === 'undefined' || src === null) {
    throw new Error('marked.parseInline(): input parameter is undefined or null');
  }

  if (typeof src !== 'string') {
    throw new Error('marked.parseInline(): input parameter is of type ' + Object.prototype.toString.call(src) + ', string expected');
  }

  opt = merge({}, marked.defaults, opt || {});
  checkSanitizeDeprecation(opt);

  try {
    const tokens = Lexer.lexInline(src, opt);

    if (opt.walkTokens) {
      marked.walkTokens(tokens, opt.walkTokens);
    }

    return Parser.parseInline(tokens, opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/markedjs/marked.';

    if (opt.silent) {
      return '<p>An error occurred:</p><pre>' + escape(e.message + '', true) + '</pre>';
    }

    throw e;
  }
};
/**
 * Expose
 */


marked.Parser = Parser;
marked.parser = Parser.parse;
marked.Renderer = Renderer;
marked.TextRenderer = TextRenderer;
marked.Lexer = Lexer;
marked.lexer = Lexer.lex;
marked.Tokenizer = Tokenizer;
marked.Slugger = Slugger;
marked.parse = marked;
module.exports = marked;
},{"./Lexer.js":"3Gql1","./Parser.js":"56Kyu","./Tokenizer.js":"2VsrB","./Renderer.js":"5SFiR","./TextRenderer.js":"6BRG4","./Slugger.js":"7crj2","./helpers.js":"60iAW","./defaults.js":"4MMD1"}],"3Gql1":[function(require,module,exports) {
const Tokenizer = require('./Tokenizer.js');

const {
  defaults
} = require('./defaults.js');

const {
  block,
  inline
} = require('./rules.js');

const {
  repeatString
} = require('./helpers.js');
/**
 * smartypants text replacement
 */


function smartypants(text) {
  return text // em-dashes
  .replace(/---/g, '\u2014') // en-dashes
  .replace(/--/g, '\u2013') // opening singles
  .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018') // closing singles & apostrophes
  .replace(/'/g, '\u2019') // opening doubles
  .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c') // closing doubles
  .replace(/"/g, '\u201d') // ellipses
  .replace(/\.{3}/g, '\u2026');
}
/**
 * mangle email addresses
 */


function mangle(text) {
  let out = '',
      i,
      ch;
  const l = text.length;

  for (i = 0; i < l; i++) {
    ch = text.charCodeAt(i);

    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }

    out += '&#' + ch + ';';
  }

  return out;
}
/**
 * Block Lexer
 */


module.exports = class Lexer {
  constructor(options) {
    this.tokens = [];
    this.tokens.links = Object.create(null);
    this.options = options || defaults;
    this.options.tokenizer = this.options.tokenizer || new Tokenizer();
    this.tokenizer = this.options.tokenizer;
    this.tokenizer.options = this.options;
    const rules = {
      block: block.normal,
      inline: inline.normal
    };

    if (this.options.pedantic) {
      rules.block = block.pedantic;
      rules.inline = inline.pedantic;
    } else if (this.options.gfm) {
      rules.block = block.gfm;

      if (this.options.breaks) {
        rules.inline = inline.breaks;
      } else {
        rules.inline = inline.gfm;
      }
    }

    this.tokenizer.rules = rules;
  }
  /**
   * Expose Rules
   */


  static get rules() {
    return {
      block,
      inline
    };
  }
  /**
   * Static Lex Method
   */


  static lex(src, options) {
    const lexer = new Lexer(options);
    return lexer.lex(src);
  }
  /**
   * Static Lex Inline Method
   */


  static lexInline(src, options) {
    const lexer = new Lexer(options);
    return lexer.inlineTokens(src);
  }
  /**
   * Preprocessing
   */


  lex(src) {
    src = src.replace(/\r\n|\r/g, '\n').replace(/\t/g, '    ');
    this.blockTokens(src, this.tokens, true);
    this.inline(this.tokens);
    return this.tokens;
  }
  /**
   * Lexing
   */


  blockTokens(src, tokens = [], top = true) {
    if (this.options.pedantic) {
      src = src.replace(/^ +$/gm, '');
    }

    let token, i, l, lastToken;

    while (src) {
      // newline
      if (token = this.tokenizer.space(src)) {
        src = src.substring(token.raw.length);

        if (token.type) {
          tokens.push(token);
        }

        continue;
      } // code


      if (token = this.tokenizer.code(src, tokens)) {
        src = src.substring(token.raw.length);

        if (token.type) {
          tokens.push(token);
        } else {
          lastToken = tokens[tokens.length - 1];
          lastToken.raw += '\n' + token.raw;
          lastToken.text += '\n' + token.text;
        }

        continue;
      } // fences


      if (token = this.tokenizer.fences(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      } // heading


      if (token = this.tokenizer.heading(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      } // table no leading pipe (gfm)


      if (token = this.tokenizer.nptable(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      } // hr


      if (token = this.tokenizer.hr(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      } // blockquote


      if (token = this.tokenizer.blockquote(src)) {
        src = src.substring(token.raw.length);
        token.tokens = this.blockTokens(token.text, [], top);
        tokens.push(token);
        continue;
      } // list


      if (token = this.tokenizer.list(src)) {
        src = src.substring(token.raw.length);
        l = token.items.length;

        for (i = 0; i < l; i++) {
          token.items[i].tokens = this.blockTokens(token.items[i].text, [], false);
        }

        tokens.push(token);
        continue;
      } // html


      if (token = this.tokenizer.html(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      } // def


      if (top && (token = this.tokenizer.def(src))) {
        src = src.substring(token.raw.length);

        if (!this.tokens.links[token.tag]) {
          this.tokens.links[token.tag] = {
            href: token.href,
            title: token.title
          };
        }

        continue;
      } // table (gfm)


      if (token = this.tokenizer.table(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      } // lheading


      if (token = this.tokenizer.lheading(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      } // top-level paragraph


      if (top && (token = this.tokenizer.paragraph(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      } // text


      if (token = this.tokenizer.text(src, tokens)) {
        src = src.substring(token.raw.length);

        if (token.type) {
          tokens.push(token);
        } else {
          lastToken = tokens[tokens.length - 1];
          lastToken.raw += '\n' + token.raw;
          lastToken.text += '\n' + token.text;
        }

        continue;
      }

      if (src) {
        const errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);

        if (this.options.silent) {
          console.error(errMsg);
          break;
        } else {
          throw new Error(errMsg);
        }
      }
    }

    return tokens;
  }

  inline(tokens) {
    let i, j, k, l2, row, token;
    const l = tokens.length;

    for (i = 0; i < l; i++) {
      token = tokens[i];

      switch (token.type) {
        case 'paragraph':
        case 'text':
        case 'heading':
          {
            token.tokens = [];
            this.inlineTokens(token.text, token.tokens);
            break;
          }

        case 'table':
          {
            token.tokens = {
              header: [],
              cells: []
            }; // header

            l2 = token.header.length;

            for (j = 0; j < l2; j++) {
              token.tokens.header[j] = [];
              this.inlineTokens(token.header[j], token.tokens.header[j]);
            } // cells


            l2 = token.cells.length;

            for (j = 0; j < l2; j++) {
              row = token.cells[j];
              token.tokens.cells[j] = [];

              for (k = 0; k < row.length; k++) {
                token.tokens.cells[j][k] = [];
                this.inlineTokens(row[k], token.tokens.cells[j][k]);
              }
            }

            break;
          }

        case 'blockquote':
          {
            this.inline(token.tokens);
            break;
          }

        case 'list':
          {
            l2 = token.items.length;

            for (j = 0; j < l2; j++) {
              this.inline(token.items[j].tokens);
            }

            break;
          }

        default:
          {// do nothing
          }
      }
    }

    return tokens;
  }
  /**
   * Lexing/Compiling
   */


  inlineTokens(src, tokens = [], inLink = false, inRawBlock = false) {
    let token; // String with links masked to avoid interference with em and strong

    let maskedSrc = src;
    let match;
    let keepPrevChar, prevChar; // Mask out reflinks

    if (this.tokens.links) {
      const links = Object.keys(this.tokens.links);

      if (links.length > 0) {
        while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
          if (links.includes(match[0].slice(match[0].lastIndexOf('[') + 1, -1))) {
            maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
          }
        }
      }
    } // Mask out other blocks


    while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
      maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    }

    while (src) {
      if (!keepPrevChar) {
        prevChar = '';
      }

      keepPrevChar = false; // escape

      if (token = this.tokenizer.escape(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      } // tag


      if (token = this.tokenizer.tag(src, inLink, inRawBlock)) {
        src = src.substring(token.raw.length);
        inLink = token.inLink;
        inRawBlock = token.inRawBlock;
        tokens.push(token);
        continue;
      } // link


      if (token = this.tokenizer.link(src)) {
        src = src.substring(token.raw.length);

        if (token.type === 'link') {
          token.tokens = this.inlineTokens(token.text, [], true, inRawBlock);
        }

        tokens.push(token);
        continue;
      } // reflink, nolink


      if (token = this.tokenizer.reflink(src, this.tokens.links)) {
        src = src.substring(token.raw.length);

        if (token.type === 'link') {
          token.tokens = this.inlineTokens(token.text, [], true, inRawBlock);
        }

        tokens.push(token);
        continue;
      } // strong


      if (token = this.tokenizer.strong(src, maskedSrc, prevChar)) {
        src = src.substring(token.raw.length);
        token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
        tokens.push(token);
        continue;
      } // em


      if (token = this.tokenizer.em(src, maskedSrc, prevChar)) {
        src = src.substring(token.raw.length);
        token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
        tokens.push(token);
        continue;
      } // code


      if (token = this.tokenizer.codespan(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      } // br


      if (token = this.tokenizer.br(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      } // del (gfm)


      if (token = this.tokenizer.del(src)) {
        src = src.substring(token.raw.length);
        token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
        tokens.push(token);
        continue;
      } // autolink


      if (token = this.tokenizer.autolink(src, mangle)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      } // url (gfm)


      if (!inLink && (token = this.tokenizer.url(src, mangle))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      } // text


      if (token = this.tokenizer.inlineText(src, inRawBlock, smartypants)) {
        src = src.substring(token.raw.length);
        prevChar = token.raw.slice(-1);
        keepPrevChar = true;
        tokens.push(token);
        continue;
      }

      if (src) {
        const errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);

        if (this.options.silent) {
          console.error(errMsg);
          break;
        } else {
          throw new Error(errMsg);
        }
      }
    }

    return tokens;
  }

};
},{"./Tokenizer.js":"2VsrB","./defaults.js":"4MMD1","./rules.js":"wDQui","./helpers.js":"60iAW"}],"2VsrB":[function(require,module,exports) {
const {
  defaults
} = require('./defaults.js');

const {
  rtrim,
  splitCells,
  escape,
  findClosingBracket
} = require('./helpers.js');

function outputLink(cap, link, raw) {
  const href = link.href;
  const title = link.title ? escape(link.title) : null;
  const text = cap[1].replace(/\\([\[\]])/g, '$1');

  if (cap[0].charAt(0) !== '!') {
    return {
      type: 'link',
      raw,
      href,
      title,
      text
    };
  } else {
    return {
      type: 'image',
      raw,
      href,
      title,
      text: escape(text)
    };
  }
}

function indentCodeCompensation(raw, text) {
  const matchIndentToCode = raw.match(/^(\s+)(?:```)/);

  if (matchIndentToCode === null) {
    return text;
  }

  const indentToCode = matchIndentToCode[1];
  return text.split('\n').map(node => {
    const matchIndentInNode = node.match(/^\s+/);

    if (matchIndentInNode === null) {
      return node;
    }

    const [indentInNode] = matchIndentInNode;

    if (indentInNode.length >= indentToCode.length) {
      return node.slice(indentToCode.length);
    }

    return node;
  }).join('\n');
}
/**
 * Tokenizer
 */


module.exports = class Tokenizer {
  constructor(options) {
    this.options = options || defaults;
  }

  space(src) {
    const cap = this.rules.block.newline.exec(src);

    if (cap) {
      if (cap[0].length > 1) {
        return {
          type: 'space',
          raw: cap[0]
        };
      }

      return {
        raw: '\n'
      };
    }
  }

  code(src, tokens) {
    const cap = this.rules.block.code.exec(src);

    if (cap) {
      const lastToken = tokens[tokens.length - 1]; // An indented code block cannot interrupt a paragraph.

      if (lastToken && lastToken.type === 'paragraph') {
        return {
          raw: cap[0],
          text: cap[0].trimRight()
        };
      }

      const text = cap[0].replace(/^ {1,4}/gm, '');
      return {
        type: 'code',
        raw: cap[0],
        codeBlockStyle: 'indented',
        text: !this.options.pedantic ? rtrim(text, '\n') : text
      };
    }
  }

  fences(src) {
    const cap = this.rules.block.fences.exec(src);

    if (cap) {
      const raw = cap[0];
      const text = indentCodeCompensation(raw, cap[3] || '');
      return {
        type: 'code',
        raw,
        lang: cap[2] ? cap[2].trim() : cap[2],
        text
      };
    }
  }

  heading(src) {
    const cap = this.rules.block.heading.exec(src);

    if (cap) {
      let text = cap[2].trim(); // remove trailing #s

      if (/#$/.test(text)) {
        const trimmed = rtrim(text, '#');

        if (this.options.pedantic) {
          text = trimmed.trim();
        } else if (!trimmed || / $/.test(trimmed)) {
          // CommonMark requires space before trailing #s
          text = trimmed.trim();
        }
      }

      return {
        type: 'heading',
        raw: cap[0],
        depth: cap[1].length,
        text: text
      };
    }
  }

  nptable(src) {
    const cap = this.rules.block.nptable.exec(src);

    if (cap) {
      const item = {
        type: 'table',
        header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : [],
        raw: cap[0]
      };

      if (item.header.length === item.align.length) {
        let l = item.align.length;
        let i;

        for (i = 0; i < l; i++) {
          if (/^ *-+: *$/.test(item.align[i])) {
            item.align[i] = 'right';
          } else if (/^ *:-+: *$/.test(item.align[i])) {
            item.align[i] = 'center';
          } else if (/^ *:-+ *$/.test(item.align[i])) {
            item.align[i] = 'left';
          } else {
            item.align[i] = null;
          }
        }

        l = item.cells.length;

        for (i = 0; i < l; i++) {
          item.cells[i] = splitCells(item.cells[i], item.header.length);
        }

        return item;
      }
    }
  }

  hr(src) {
    const cap = this.rules.block.hr.exec(src);

    if (cap) {
      return {
        type: 'hr',
        raw: cap[0]
      };
    }
  }

  blockquote(src) {
    const cap = this.rules.block.blockquote.exec(src);

    if (cap) {
      const text = cap[0].replace(/^ *> ?/gm, '');
      return {
        type: 'blockquote',
        raw: cap[0],
        text
      };
    }
  }

  list(src) {
    const cap = this.rules.block.list.exec(src);

    if (cap) {
      let raw = cap[0];
      const bull = cap[2];
      const isordered = bull.length > 1;
      const list = {
        type: 'list',
        raw,
        ordered: isordered,
        start: isordered ? +bull.slice(0, -1) : '',
        loose: false,
        items: []
      }; // Get each top-level item.

      const itemMatch = cap[0].match(this.rules.block.item);
      let next = false,
          item,
          space,
          bcurr,
          bnext,
          addBack,
          loose,
          istask,
          ischecked;
      let l = itemMatch.length;
      bcurr = this.rules.block.listItemStart.exec(itemMatch[0]);

      for (let i = 0; i < l; i++) {
        item = itemMatch[i];
        raw = item; // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.

        if (i !== l - 1) {
          bnext = this.rules.block.listItemStart.exec(itemMatch[i + 1]);

          if (bnext[1].length > bcurr[0].length || bnext[1].length > 3) {
            // nested list
            itemMatch.splice(i, 2, itemMatch[i] + '\n' + itemMatch[i + 1]);
            i--;
            l--;
            continue;
          } else {
            if ( // different bullet style
            !this.options.pedantic || this.options.smartLists ? bnext[2][bnext[2].length - 1] !== bull[bull.length - 1] : isordered === (bnext[2].length === 1)) {
              addBack = itemMatch.slice(i + 1).join('\n');
              list.raw = list.raw.substring(0, list.raw.length - addBack.length);
              i = l - 1;
            }
          }

          bcurr = bnext;
        } // Remove the list item's bullet
        // so it is seen as the next token.


        space = item.length;
        item = item.replace(/^ *([*+-]|\d+[.)]) ?/, ''); // Outdent whatever the
        // list item contains. Hacky.

        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '') : item.replace(/^ {1,4}/gm, '');
        } // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.


        loose = next || /\n\n(?!\s*$)/.test(item);

        if (i !== l - 1) {
          next = item.charAt(item.length - 1) === '\n';
          if (!loose) loose = next;
        }

        if (loose) {
          list.loose = true;
        } // Check for task list items


        if (this.options.gfm) {
          istask = /^\[[ xX]\] /.test(item);
          ischecked = undefined;

          if (istask) {
            ischecked = item[1] !== ' ';
            item = item.replace(/^\[[ xX]\] +/, '');
          }
        }

        list.items.push({
          type: 'list_item',
          raw,
          task: istask,
          checked: ischecked,
          loose: loose,
          text: item
        });
      }

      return list;
    }
  }

  html(src) {
    const cap = this.rules.block.html.exec(src);

    if (cap) {
      return {
        type: this.options.sanitize ? 'paragraph' : 'html',
        raw: cap[0],
        pre: !this.options.sanitizer && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
        text: this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0]) : cap[0]
      };
    }
  }

  def(src) {
    const cap = this.rules.block.def.exec(src);

    if (cap) {
      if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1);
      const tag = cap[1].toLowerCase().replace(/\s+/g, ' ');
      return {
        tag,
        raw: cap[0],
        href: cap[2],
        title: cap[3]
      };
    }
  }

  table(src) {
    const cap = this.rules.block.table.exec(src);

    if (cap) {
      const item = {
        type: 'table',
        header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
      };

      if (item.header.length === item.align.length) {
        item.raw = cap[0];
        let l = item.align.length;
        let i;

        for (i = 0; i < l; i++) {
          if (/^ *-+: *$/.test(item.align[i])) {
            item.align[i] = 'right';
          } else if (/^ *:-+: *$/.test(item.align[i])) {
            item.align[i] = 'center';
          } else if (/^ *:-+ *$/.test(item.align[i])) {
            item.align[i] = 'left';
          } else {
            item.align[i] = null;
          }
        }

        l = item.cells.length;

        for (i = 0; i < l; i++) {
          item.cells[i] = splitCells(item.cells[i].replace(/^ *\| *| *\| *$/g, ''), item.header.length);
        }

        return item;
      }
    }
  }

  lheading(src) {
    const cap = this.rules.block.lheading.exec(src);

    if (cap) {
      return {
        type: 'heading',
        raw: cap[0],
        depth: cap[2].charAt(0) === '=' ? 1 : 2,
        text: cap[1]
      };
    }
  }

  paragraph(src) {
    const cap = this.rules.block.paragraph.exec(src);

    if (cap) {
      return {
        type: 'paragraph',
        raw: cap[0],
        text: cap[1].charAt(cap[1].length - 1) === '\n' ? cap[1].slice(0, -1) : cap[1]
      };
    }
  }

  text(src, tokens) {
    const cap = this.rules.block.text.exec(src);

    if (cap) {
      const lastToken = tokens[tokens.length - 1];

      if (lastToken && lastToken.type === 'text') {
        return {
          raw: cap[0],
          text: cap[0]
        };
      }

      return {
        type: 'text',
        raw: cap[0],
        text: cap[0]
      };
    }
  }

  escape(src) {
    const cap = this.rules.inline.escape.exec(src);

    if (cap) {
      return {
        type: 'escape',
        raw: cap[0],
        text: escape(cap[1])
      };
    }
  }

  tag(src, inLink, inRawBlock) {
    const cap = this.rules.inline.tag.exec(src);

    if (cap) {
      if (!inLink && /^<a /i.test(cap[0])) {
        inLink = true;
      } else if (inLink && /^<\/a>/i.test(cap[0])) {
        inLink = false;
      }

      if (!inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
        inRawBlock = true;
      } else if (inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
        inRawBlock = false;
      }

      return {
        type: this.options.sanitize ? 'text' : 'html',
        raw: cap[0],
        inLink,
        inRawBlock,
        text: this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0]) : cap[0]
      };
    }
  }

  link(src) {
    const cap = this.rules.inline.link.exec(src);

    if (cap) {
      const trimmedUrl = cap[2].trim();

      if (!this.options.pedantic && /^</.test(trimmedUrl)) {
        // commonmark requires matching angle brackets
        if (!/>$/.test(trimmedUrl)) {
          return;
        } // ending angle bracket cannot be escaped


        const rtrimSlash = rtrim(trimmedUrl.slice(0, -1), '\\');

        if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
          return;
        }
      } else {
        // find closing parenthesis
        const lastParenIndex = findClosingBracket(cap[2], '()');

        if (lastParenIndex > -1) {
          const start = cap[0].indexOf('!') === 0 ? 5 : 4;
          const linkLen = start + cap[1].length + lastParenIndex;
          cap[2] = cap[2].substring(0, lastParenIndex);
          cap[0] = cap[0].substring(0, linkLen).trim();
          cap[3] = '';
        }
      }

      let href = cap[2];
      let title = '';

      if (this.options.pedantic) {
        // split pedantic href and title
        const link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);

        if (link) {
          href = link[1];
          title = link[3];
        }
      } else {
        title = cap[3] ? cap[3].slice(1, -1) : '';
      }

      href = href.trim();

      if (/^</.test(href)) {
        if (this.options.pedantic && !/>$/.test(trimmedUrl)) {
          // pedantic allows starting angle bracket without ending angle bracket
          href = href.slice(1);
        } else {
          href = href.slice(1, -1);
        }
      }

      return outputLink(cap, {
        href: href ? href.replace(this.rules.inline._escapes, '$1') : href,
        title: title ? title.replace(this.rules.inline._escapes, '$1') : title
      }, cap[0]);
    }
  }

  reflink(src, links) {
    let cap;

    if ((cap = this.rules.inline.reflink.exec(src)) || (cap = this.rules.inline.nolink.exec(src))) {
      let link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = links[link.toLowerCase()];

      if (!link || !link.href) {
        const text = cap[0].charAt(0);
        return {
          type: 'text',
          raw: text,
          text
        };
      }

      return outputLink(cap, link, cap[0]);
    }
  }

  strong(src, maskedSrc, prevChar = '') {
    let match = this.rules.inline.strong.start.exec(src);

    if (match && (!match[1] || match[1] && (prevChar === '' || this.rules.inline.punctuation.exec(prevChar)))) {
      maskedSrc = maskedSrc.slice(-1 * src.length);
      const endReg = match[0] === '**' ? this.rules.inline.strong.endAst : this.rules.inline.strong.endUnd;
      endReg.lastIndex = 0;
      let cap;

      while ((match = endReg.exec(maskedSrc)) != null) {
        cap = this.rules.inline.strong.middle.exec(maskedSrc.slice(0, match.index + 3));

        if (cap) {
          return {
            type: 'strong',
            raw: src.slice(0, cap[0].length),
            text: src.slice(2, cap[0].length - 2)
          };
        }
      }
    }
  }

  em(src, maskedSrc, prevChar = '') {
    let match = this.rules.inline.em.start.exec(src);

    if (match && (!match[1] || match[1] && (prevChar === '' || this.rules.inline.punctuation.exec(prevChar)))) {
      maskedSrc = maskedSrc.slice(-1 * src.length);
      const endReg = match[0] === '*' ? this.rules.inline.em.endAst : this.rules.inline.em.endUnd;
      endReg.lastIndex = 0;
      let cap;

      while ((match = endReg.exec(maskedSrc)) != null) {
        cap = this.rules.inline.em.middle.exec(maskedSrc.slice(0, match.index + 2));

        if (cap) {
          return {
            type: 'em',
            raw: src.slice(0, cap[0].length),
            text: src.slice(1, cap[0].length - 1)
          };
        }
      }
    }
  }

  codespan(src) {
    const cap = this.rules.inline.code.exec(src);

    if (cap) {
      let text = cap[2].replace(/\n/g, ' ');
      const hasNonSpaceChars = /[^ ]/.test(text);
      const hasSpaceCharsOnBothEnds = /^ /.test(text) && / $/.test(text);

      if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
        text = text.substring(1, text.length - 1);
      }

      text = escape(text, true);
      return {
        type: 'codespan',
        raw: cap[0],
        text
      };
    }
  }

  br(src) {
    const cap = this.rules.inline.br.exec(src);

    if (cap) {
      return {
        type: 'br',
        raw: cap[0]
      };
    }
  }

  del(src) {
    const cap = this.rules.inline.del.exec(src);

    if (cap) {
      return {
        type: 'del',
        raw: cap[0],
        text: cap[2]
      };
    }
  }

  autolink(src, mangle) {
    const cap = this.rules.inline.autolink.exec(src);

    if (cap) {
      let text, href;

      if (cap[2] === '@') {
        text = escape(this.options.mangle ? mangle(cap[1]) : cap[1]);
        href = 'mailto:' + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }

      return {
        type: 'link',
        raw: cap[0],
        text,
        href,
        tokens: [{
          type: 'text',
          raw: text,
          text
        }]
      };
    }
  }

  url(src, mangle) {
    let cap;

    if (cap = this.rules.inline.url.exec(src)) {
      let text, href;

      if (cap[2] === '@') {
        text = escape(this.options.mangle ? mangle(cap[0]) : cap[0]);
        href = 'mailto:' + text;
      } else {
        // do extended autolink path validation
        let prevCapZero;

        do {
          prevCapZero = cap[0];
          cap[0] = this.rules.inline._backpedal.exec(cap[0])[0];
        } while (prevCapZero !== cap[0]);

        text = escape(cap[0]);

        if (cap[1] === 'www.') {
          href = 'http://' + text;
        } else {
          href = text;
        }
      }

      return {
        type: 'link',
        raw: cap[0],
        text,
        href,
        tokens: [{
          type: 'text',
          raw: text,
          text
        }]
      };
    }
  }

  inlineText(src, inRawBlock, smartypants) {
    const cap = this.rules.inline.text.exec(src);

    if (cap) {
      let text;

      if (inRawBlock) {
        text = this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0]) : cap[0];
      } else {
        text = escape(this.options.smartypants ? smartypants(cap[0]) : cap[0]);
      }

      return {
        type: 'text',
        raw: cap[0],
        text
      };
    }
  }

};
},{"./defaults.js":"4MMD1","./helpers.js":"60iAW"}],"4MMD1":[function(require,module,exports) {
function getDefaults() {
  return {
    baseUrl: null,
    breaks: false,
    gfm: true,
    headerIds: true,
    headerPrefix: '',
    highlight: null,
    langPrefix: 'language-',
    mangle: true,
    pedantic: false,
    renderer: null,
    sanitize: false,
    sanitizer: null,
    silent: false,
    smartLists: false,
    smartypants: false,
    tokenizer: null,
    walkTokens: null,
    xhtml: false
  };
}

function changeDefaults(newDefaults) {
  module.exports.defaults = newDefaults;
}

module.exports = {
  defaults: getDefaults(),
  getDefaults,
  changeDefaults
};
},{}],"60iAW":[function(require,module,exports) {
/**
 * Helpers
 */
const escapeTest = /[&<>"']/;
const escapeReplace = /[&<>"']/g;
const escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
const escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;
const escapeReplacements = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

const getEscapeReplacement = ch => escapeReplacements[ch];

function escape(html, encode) {
  if (encode) {
    if (escapeTest.test(html)) {
      return html.replace(escapeReplace, getEscapeReplacement);
    }
  } else {
    if (escapeTestNoEncode.test(html)) {
      return html.replace(escapeReplaceNoEncode, getEscapeReplacement);
    }
  }

  return html;
}

const unescapeTest = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;

function unescape(html) {
  // explicitly match decimal, hex, and named HTML entities
  return html.replace(unescapeTest, (_, n) => {
    n = n.toLowerCase();
    if (n === 'colon') return ':';

    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x' ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1));
    }

    return '';
  });
}

const caret = /(^|[^\[])\^/g;

function edit(regex, opt) {
  regex = regex.source || regex;
  opt = opt || '';
  const obj = {
    replace: (name, val) => {
      val = val.source || val;
      val = val.replace(caret, '$1');
      regex = regex.replace(name, val);
      return obj;
    },
    getRegex: () => {
      return new RegExp(regex, opt);
    }
  };
  return obj;
}

const nonWordAndColonTest = /[^\w:]/g;
const originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;

function cleanUrl(sanitize, base, href) {
  if (sanitize) {
    let prot;

    try {
      prot = decodeURIComponent(unescape(href)).replace(nonWordAndColonTest, '').toLowerCase();
    } catch (e) {
      return null;
    }

    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
      return null;
    }
  }

  if (base && !originIndependentUrl.test(href)) {
    href = resolveUrl(base, href);
  }

  try {
    href = encodeURI(href).replace(/%25/g, '%');
  } catch (e) {
    return null;
  }

  return href;
}

const baseUrls = {};
const justDomain = /^[^:]+:\/*[^/]*$/;
const protocol = /^([^:]+:)[\s\S]*$/;
const domain = /^([^:]+:\/*[^/]*)[\s\S]*$/;

function resolveUrl(base, href) {
  if (!baseUrls[' ' + base]) {
    // we can ignore everything in base after the last slash of its path component,
    // but we might need to add _that_
    // https://tools.ietf.org/html/rfc3986#section-3
    if (justDomain.test(base)) {
      baseUrls[' ' + base] = base + '/';
    } else {
      baseUrls[' ' + base] = rtrim(base, '/', true);
    }
  }

  base = baseUrls[' ' + base];
  const relativeBase = base.indexOf(':') === -1;

  if (href.substring(0, 2) === '//') {
    if (relativeBase) {
      return href;
    }

    return base.replace(protocol, '$1') + href;
  } else if (href.charAt(0) === '/') {
    if (relativeBase) {
      return href;
    }

    return base.replace(domain, '$1') + href;
  } else {
    return base + href;
  }
}

const noopTest = {
  exec: function noopTest() {}
};

function merge(obj) {
  let i = 1,
      target,
      key;

  for (; i < arguments.length; i++) {
    target = arguments[i];

    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}

function splitCells(tableRow, count) {
  // ensure that every cell-delimiting pipe has a space
  // before it to distinguish it from an escaped pipe
  const row = tableRow.replace(/\|/g, (match, offset, str) => {
    let escaped = false,
        curr = offset;

    while (--curr >= 0 && str[curr] === '\\') escaped = !escaped;

    if (escaped) {
      // odd number of slashes means | is escaped
      // so we leave it alone
      return '|';
    } else {
      // add space before unescaped |
      return ' |';
    }
  }),
        cells = row.split(/ \|/);
  let i = 0;

  if (cells.length > count) {
    cells.splice(count);
  } else {
    while (cells.length < count) cells.push('');
  }

  for (; i < cells.length; i++) {
    // leading or trailing whitespace is ignored per the gfm spec
    cells[i] = cells[i].trim().replace(/\\\|/g, '|');
  }

  return cells;
} // Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
// /c*$/ is vulnerable to REDOS.
// invert: Remove suffix of non-c chars instead. Default falsey.


function rtrim(str, c, invert) {
  const l = str.length;

  if (l === 0) {
    return '';
  } // Length of suffix matching the invert condition.


  let suffLen = 0; // Step left until we fail to match the invert condition.

  while (suffLen < l) {
    const currChar = str.charAt(l - suffLen - 1);

    if (currChar === c && !invert) {
      suffLen++;
    } else if (currChar !== c && invert) {
      suffLen++;
    } else {
      break;
    }
  }

  return str.substr(0, l - suffLen);
}

function findClosingBracket(str, b) {
  if (str.indexOf(b[1]) === -1) {
    return -1;
  }

  const l = str.length;
  let level = 0,
      i = 0;

  for (; i < l; i++) {
    if (str[i] === '\\') {
      i++;
    } else if (str[i] === b[0]) {
      level++;
    } else if (str[i] === b[1]) {
      level--;

      if (level < 0) {
        return i;
      }
    }
  }

  return -1;
}

function checkSanitizeDeprecation(opt) {
  if (opt && opt.sanitize && !opt.silent) {
    console.warn('marked(): sanitize and sanitizer parameters are deprecated since version 0.7.0, should not be used and will be removed in the future. Read more here: https://marked.js.org/#/USING_ADVANCED.md#options');
  }
} // copied from https://stackoverflow.com/a/5450113/806777


function repeatString(pattern, count) {
  if (count < 1) {
    return '';
  }

  let result = '';

  while (count > 1) {
    if (count & 1) {
      result += pattern;
    }

    count >>= 1;
    pattern += pattern;
  }

  return result + pattern;
}

module.exports = {
  escape,
  unescape,
  edit,
  cleanUrl,
  resolveUrl,
  noopTest,
  merge,
  splitCells,
  rtrim,
  findClosingBracket,
  checkSanitizeDeprecation,
  repeatString
};
},{}],"wDQui":[function(require,module,exports) {
const {
  noopTest,
  edit,
  merge
} = require('./helpers.js');
/**
 * Block-Level Grammar
 */


const block = {
  newline: /^(?: *(?:\n|$))+/,
  code: /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/,
  fences: /^ {0,3}(`{3,}(?=[^`\n]*\n)|~{3,})([^\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?:\n+|$)|$)/,
  hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
  heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
  blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
  list: /^( {0,3})(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?! {0,3}bull )\n*|\s*$)/,
  html: '^ {0,3}(?:' // optional indentation
  + '<(script|pre|style)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' // (1)
  + '|comment[^\\n]*(\\n+|$)' // (2)
  + '|<\\?[\\s\\S]*?(?:\\?>\\n*|$)' // (3)
  + '|<![A-Z][\\s\\S]*?(?:>\\n*|$)' // (4)
  + '|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)' // (5)
  + '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:\\n{2,}|$)' // (6)
  + '|<(?!script|pre|style)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' // (7) open tag
  + '|</(?!script|pre|style)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' // (7) closing tag
  + ')',
  def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
  nptable: noopTest,
  table: noopTest,
  lheading: /^([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,
  // regex template, placeholders will be replaced according to different paragraph
  // interruption rules of commonmark and the original markdown spec:
  _paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html| +\n)[^\n]+)*)/,
  text: /^[^\n]+/
};
block._label = /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/;
block._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
block.def = edit(block.def).replace('label', block._label).replace('title', block._title).getRegex();
block.bullet = /(?:[*+-]|\d{1,9}[.)])/;
block.item = /^( *)(bull) ?[^\n]*(?:\n(?! *bull ?)[^\n]*)*/;
block.item = edit(block.item, 'gm').replace(/bull/g, block.bullet).getRegex();
block.listItemStart = edit(/^( *)(bull)/).replace('bull', block.bullet).getRegex();
block.list = edit(block.list).replace(/bull/g, block.bullet).replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))').replace('def', '\\n+(?=' + block.def.source + ')').getRegex();
block._tag = 'address|article|aside|base|basefont|blockquote|body|caption' + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption' + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe' + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option' + '|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr' + '|track|ul';
block._comment = /<!--(?!-?>)[\s\S]*?(?:-->|$)/;
block.html = edit(block.html, 'i').replace('comment', block._comment).replace('tag', block._tag).replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
block.paragraph = edit(block._paragraph).replace('hr', block.hr).replace('heading', ' {0,3}#{1,6} ').replace('|lheading', '') // setex headings don't interrupt commonmark paragraphs
.replace('blockquote', ' {0,3}>').replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n').replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
.replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)').replace('tag', block._tag) // pars can be interrupted by type (6) html blocks
.getRegex();
block.blockquote = edit(block.blockquote).replace('paragraph', block.paragraph).getRegex();
/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);
/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  nptable: '^ *([^|\\n ].*\\|.*)\\n' // Header
  + ' {0,3}([-:]+ *\\|[-| :]*)' // Align
  + '(?:\\n((?:(?!\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)',
  // Cells
  table: '^ *\\|(.+)\\n' // Header
  + ' {0,3}\\|?( *[-:]+[-| :]*)' // Align
  + '(?:\\n *((?:(?!\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)' // Cells

});
block.gfm.nptable = edit(block.gfm.nptable).replace('hr', block.hr).replace('heading', ' {0,3}#{1,6} ').replace('blockquote', ' {0,3}>').replace('code', ' {4}[^\\n]').replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n').replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
.replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)').replace('tag', block._tag) // tables can be interrupted by type (6) html blocks
.getRegex();
block.gfm.table = edit(block.gfm.table).replace('hr', block.hr).replace('heading', ' {0,3}#{1,6} ').replace('blockquote', ' {0,3}>').replace('code', ' {4}[^\\n]').replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n').replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
.replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)').replace('tag', block._tag) // tables can be interrupted by type (6) html blocks
.getRegex();
/**
 * Pedantic grammar (original John Gruber's loose markdown specification)
 */

block.pedantic = merge({}, block.normal, {
  html: edit('^ *(?:comment *(?:\\n|\\s*$)' + '|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)' // closed tag
  + '|<tag(?:"[^"]*"|\'[^\']*\'|\\s[^\'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))').replace('comment', block._comment).replace(/tag/g, '(?!(?:' + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub' + '|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)' + '\\b)\\w+(?!:|[^\\w\\s@]*@)\\b').getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: noopTest,
  // fences not supported
  paragraph: edit(block.normal._paragraph).replace('hr', block.hr).replace('heading', ' *#{1,6} *[^\n]').replace('lheading', block.lheading).replace('blockquote', ' {0,3}>').replace('|fences', '').replace('|list', '').replace('|html', '').getRegex()
});
/**
 * Inline-Level Grammar
 */

const inline = {
  escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
  autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
  url: noopTest,
  tag: '^comment' + '|^</[a-zA-Z][\\w:-]*\\s*>' // self-closing tag
  + '|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>' // open tag
  + '|^<\\?[\\s\\S]*?\\?>' // processing instruction, e.g. <?php ?>
  + '|^<![a-zA-Z]+\\s[\\s\\S]*?>' // declaration, e.g. <!DOCTYPE html>
  + '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>',
  // CDATA section
  link: /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/,
  reflink: /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
  nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
  reflinkSearch: 'reflink|nolink(?!\\()',
  strong: {
    start: /^(?:(\*\*(?=[*punctuation]))|\*\*)(?![\s])|__/,
    // (1) returns if starts w/ punctuation
    middle: /^\*\*(?:(?:(?!overlapSkip)(?:[^*]|\\\*)|overlapSkip)|\*(?:(?!overlapSkip)(?:[^*]|\\\*)|overlapSkip)*?\*)+?\*\*$|^__(?![\s])((?:(?:(?!overlapSkip)(?:[^_]|\\_)|overlapSkip)|_(?:(?!overlapSkip)(?:[^_]|\\_)|overlapSkip)*?_)+?)__$/,
    endAst: /[^punctuation\s]\*\*(?!\*)|[punctuation]\*\*(?!\*)(?:(?=[punctuation_\s]|$))/,
    // last char can't be punct, or final * must also be followed by punct (or endline)
    endUnd: /[^\s]__(?!_)(?:(?=[punctuation*\s])|$)/ // last char can't be a space, and final _ must preceed punct or \s (or endline)

  },
  em: {
    start: /^(?:(\*(?=[punctuation]))|\*)(?![*\s])|_/,
    // (1) returns if starts w/ punctuation
    middle: /^\*(?:(?:(?!overlapSkip)(?:[^*]|\\\*)|overlapSkip)|\*(?:(?!overlapSkip)(?:[^*]|\\\*)|overlapSkip)*?\*)+?\*$|^_(?![_\s])(?:(?:(?!overlapSkip)(?:[^_]|\\_)|overlapSkip)|_(?:(?!overlapSkip)(?:[^_]|\\_)|overlapSkip)*?_)+?_$/,
    endAst: /[^punctuation\s]\*(?!\*)|[punctuation]\*(?!\*)(?:(?=[punctuation_\s]|$))/,
    // last char can't be punct, or final * must also be followed by punct (or endline)
    endUnd: /[^\s]_(?!_)(?:(?=[punctuation*\s])|$)/ // last char can't be a space, and final _ must preceed punct or \s (or endline)

  },
  code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
  br: /^( {2,}|\\)\n(?!\s*$)/,
  del: noopTest,
  text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*]|\b_|$)|[^ ](?= {2,}\n)))/,
  punctuation: /^([\s*punctuation])/
}; // list of punctuation marks from common mark spec
// without * and _ to workaround cases with double emphasis

inline._punctuation = '!"#$%&\'()+\\-.,/:;<=>?@\\[\\]`^{|}~';
inline.punctuation = edit(inline.punctuation).replace(/punctuation/g, inline._punctuation).getRegex(); // sequences em should skip over [title](link), `code`, <html>

inline._blockSkip = '\\[[^\\]]*?\\]\\([^\\)]*?\\)|`[^`]*?`|<[^>]*?>';
inline._overlapSkip = '__[^_]*?__|\\*\\*\\[^\\*\\]*?\\*\\*';
inline._comment = edit(block._comment).replace('(?:-->|$)', '-->').getRegex();
inline.em.start = edit(inline.em.start).replace(/punctuation/g, inline._punctuation).getRegex();
inline.em.middle = edit(inline.em.middle).replace(/punctuation/g, inline._punctuation).replace(/overlapSkip/g, inline._overlapSkip).getRegex();
inline.em.endAst = edit(inline.em.endAst, 'g').replace(/punctuation/g, inline._punctuation).getRegex();
inline.em.endUnd = edit(inline.em.endUnd, 'g').replace(/punctuation/g, inline._punctuation).getRegex();
inline.strong.start = edit(inline.strong.start).replace(/punctuation/g, inline._punctuation).getRegex();
inline.strong.middle = edit(inline.strong.middle).replace(/punctuation/g, inline._punctuation).replace(/overlapSkip/g, inline._overlapSkip).getRegex();
inline.strong.endAst = edit(inline.strong.endAst, 'g').replace(/punctuation/g, inline._punctuation).getRegex();
inline.strong.endUnd = edit(inline.strong.endUnd, 'g').replace(/punctuation/g, inline._punctuation).getRegex();
inline.blockSkip = edit(inline._blockSkip, 'g').getRegex();
inline.overlapSkip = edit(inline._overlapSkip, 'g').getRegex();
inline._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;
inline._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
inline._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
inline.autolink = edit(inline.autolink).replace('scheme', inline._scheme).replace('email', inline._email).getRegex();
inline._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;
inline.tag = edit(inline.tag).replace('comment', inline._comment).replace('attribute', inline._attribute).getRegex();
inline._label = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
inline._href = /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/;
inline._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;
inline.link = edit(inline.link).replace('label', inline._label).replace('href', inline._href).replace('title', inline._title).getRegex();
inline.reflink = edit(inline.reflink).replace('label', inline._label).getRegex();
inline.reflinkSearch = edit(inline.reflinkSearch, 'g').replace('reflink', inline.reflink).replace('nolink', inline.nolink).getRegex();
/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);
/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: {
    start: /^__|\*\*/,
    middle: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
    endAst: /\*\*(?!\*)/g,
    endUnd: /__(?!_)/g
  },
  em: {
    start: /^_|\*/,
    middle: /^()\*(?=\S)([\s\S]*?\S)\*(?!\*)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
    endAst: /\*(?!\*)/g,
    endUnd: /_(?!_)/g
  },
  link: edit(/^!?\[(label)\]\((.*?)\)/).replace('label', inline._label).getRegex(),
  reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace('label', inline._label).getRegex()
});
/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: edit(inline.escape).replace('])', '~|])').getRegex(),
  _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
  url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
  _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*~]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))/
});
inline.gfm.url = edit(inline.gfm.url, 'i').replace('email', inline.gfm._extended_email).getRegex();
/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: edit(inline.br).replace('{2,}', '*').getRegex(),
  text: edit(inline.gfm.text).replace('\\b_', '\\b_| {2,}\\n').replace(/\{2,\}/g, '*').getRegex()
});
module.exports = {
  block,
  inline
};
},{"./helpers.js":"60iAW"}],"56Kyu":[function(require,module,exports) {
const Renderer = require('./Renderer.js');

const TextRenderer = require('./TextRenderer.js');

const Slugger = require('./Slugger.js');

const {
  defaults
} = require('./defaults.js');

const {
  unescape
} = require('./helpers.js');
/**
 * Parsing & Compiling
 */


module.exports = class Parser {
  constructor(options) {
    this.options = options || defaults;
    this.options.renderer = this.options.renderer || new Renderer();
    this.renderer = this.options.renderer;
    this.renderer.options = this.options;
    this.textRenderer = new TextRenderer();
    this.slugger = new Slugger();
  }
  /**
   * Static Parse Method
   */


  static parse(tokens, options) {
    const parser = new Parser(options);
    return parser.parse(tokens);
  }
  /**
   * Static Parse Inline Method
   */


  static parseInline(tokens, options) {
    const parser = new Parser(options);
    return parser.parseInline(tokens);
  }
  /**
   * Parse Loop
   */


  parse(tokens, top = true) {
    let out = '',
        i,
        j,
        k,
        l2,
        l3,
        row,
        cell,
        header,
        body,
        token,
        ordered,
        start,
        loose,
        itemBody,
        item,
        checked,
        task,
        checkbox;
    const l = tokens.length;

    for (i = 0; i < l; i++) {
      token = tokens[i];

      switch (token.type) {
        case 'space':
          {
            continue;
          }

        case 'hr':
          {
            out += this.renderer.hr();
            continue;
          }

        case 'heading':
          {
            out += this.renderer.heading(this.parseInline(token.tokens), token.depth, unescape(this.parseInline(token.tokens, this.textRenderer)), this.slugger);
            continue;
          }

        case 'code':
          {
            out += this.renderer.code(token.text, token.lang, token.escaped);
            continue;
          }

        case 'table':
          {
            header = ''; // header

            cell = '';
            l2 = token.header.length;

            for (j = 0; j < l2; j++) {
              cell += this.renderer.tablecell(this.parseInline(token.tokens.header[j]), {
                header: true,
                align: token.align[j]
              });
            }

            header += this.renderer.tablerow(cell);
            body = '';
            l2 = token.cells.length;

            for (j = 0; j < l2; j++) {
              row = token.tokens.cells[j];
              cell = '';
              l3 = row.length;

              for (k = 0; k < l3; k++) {
                cell += this.renderer.tablecell(this.parseInline(row[k]), {
                  header: false,
                  align: token.align[k]
                });
              }

              body += this.renderer.tablerow(cell);
            }

            out += this.renderer.table(header, body);
            continue;
          }

        case 'blockquote':
          {
            body = this.parse(token.tokens);
            out += this.renderer.blockquote(body);
            continue;
          }

        case 'list':
          {
            ordered = token.ordered;
            start = token.start;
            loose = token.loose;
            l2 = token.items.length;
            body = '';

            for (j = 0; j < l2; j++) {
              item = token.items[j];
              checked = item.checked;
              task = item.task;
              itemBody = '';

              if (item.task) {
                checkbox = this.renderer.checkbox(checked);

                if (loose) {
                  if (item.tokens.length > 0 && item.tokens[0].type === 'text') {
                    item.tokens[0].text = checkbox + ' ' + item.tokens[0].text;

                    if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === 'text') {
                      item.tokens[0].tokens[0].text = checkbox + ' ' + item.tokens[0].tokens[0].text;
                    }
                  } else {
                    item.tokens.unshift({
                      type: 'text',
                      text: checkbox
                    });
                  }
                } else {
                  itemBody += checkbox;
                }
              }

              itemBody += this.parse(item.tokens, loose);
              body += this.renderer.listitem(itemBody, task, checked);
            }

            out += this.renderer.list(body, ordered, start);
            continue;
          }

        case 'html':
          {
            // TODO parse inline content if parameter markdown=1
            out += this.renderer.html(token.text);
            continue;
          }

        case 'paragraph':
          {
            out += this.renderer.paragraph(this.parseInline(token.tokens));
            continue;
          }

        case 'text':
          {
            body = token.tokens ? this.parseInline(token.tokens) : token.text;

            while (i + 1 < l && tokens[i + 1].type === 'text') {
              token = tokens[++i];
              body += '\n' + (token.tokens ? this.parseInline(token.tokens) : token.text);
            }

            out += top ? this.renderer.paragraph(body) : body;
            continue;
          }

        default:
          {
            const errMsg = 'Token with "' + token.type + '" type was not found.';

            if (this.options.silent) {
              console.error(errMsg);
              return;
            } else {
              throw new Error(errMsg);
            }
          }
      }
    }

    return out;
  }
  /**
   * Parse Inline Tokens
   */


  parseInline(tokens, renderer) {
    renderer = renderer || this.renderer;
    let out = '',
        i,
        token;
    const l = tokens.length;

    for (i = 0; i < l; i++) {
      token = tokens[i];

      switch (token.type) {
        case 'escape':
          {
            out += renderer.text(token.text);
            break;
          }

        case 'html':
          {
            out += renderer.html(token.text);
            break;
          }

        case 'link':
          {
            out += renderer.link(token.href, token.title, this.parseInline(token.tokens, renderer));
            break;
          }

        case 'image':
          {
            out += renderer.image(token.href, token.title, token.text);
            break;
          }

        case 'strong':
          {
            out += renderer.strong(this.parseInline(token.tokens, renderer));
            break;
          }

        case 'em':
          {
            out += renderer.em(this.parseInline(token.tokens, renderer));
            break;
          }

        case 'codespan':
          {
            out += renderer.codespan(token.text);
            break;
          }

        case 'br':
          {
            out += renderer.br();
            break;
          }

        case 'del':
          {
            out += renderer.del(this.parseInline(token.tokens, renderer));
            break;
          }

        case 'text':
          {
            out += renderer.text(token.text);
            break;
          }

        default:
          {
            const errMsg = 'Token with "' + token.type + '" type was not found.';

            if (this.options.silent) {
              console.error(errMsg);
              return;
            } else {
              throw new Error(errMsg);
            }
          }
      }
    }

    return out;
  }

};
},{"./Renderer.js":"5SFiR","./TextRenderer.js":"6BRG4","./Slugger.js":"7crj2","./defaults.js":"4MMD1","./helpers.js":"60iAW"}],"5SFiR":[function(require,module,exports) {
const {
  defaults
} = require('./defaults.js');

const {
  cleanUrl,
  escape
} = require('./helpers.js');
/**
 * Renderer
 */


module.exports = class Renderer {
  constructor(options) {
    this.options = options || defaults;
  }

  code(code, infostring, escaped) {
    const lang = (infostring || '').match(/\S*/)[0];

    if (this.options.highlight) {
      const out = this.options.highlight(code, lang);

      if (out != null && out !== code) {
        escaped = true;
        code = out;
      }
    }

    code = code.replace(/\n$/, '') + '\n';

    if (!lang) {
      return '<pre><code>' + (escaped ? code : escape(code, true)) + '</code></pre>\n';
    }

    return '<pre><code class="' + this.options.langPrefix + escape(lang, true) + '">' + (escaped ? code : escape(code, true)) + '</code></pre>\n';
  }

  blockquote(quote) {
    return '<blockquote>\n' + quote + '</blockquote>\n';
  }

  html(html) {
    return html;
  }

  heading(text, level, raw, slugger) {
    if (this.options.headerIds) {
      return '<h' + level + ' id="' + this.options.headerPrefix + slugger.slug(raw) + '">' + text + '</h' + level + '>\n';
    } // ignore IDs


    return '<h' + level + '>' + text + '</h' + level + '>\n';
  }

  hr() {
    return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
  }

  list(body, ordered, start) {
    const type = ordered ? 'ol' : 'ul',
          startatt = ordered && start !== 1 ? ' start="' + start + '"' : '';
    return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
  }

  listitem(text) {
    return '<li>' + text + '</li>\n';
  }

  checkbox(checked) {
    return '<input ' + (checked ? 'checked="" ' : '') + 'disabled="" type="checkbox"' + (this.options.xhtml ? ' /' : '') + '> ';
  }

  paragraph(text) {
    return '<p>' + text + '</p>\n';
  }

  table(header, body) {
    if (body) body = '<tbody>' + body + '</tbody>';
    return '<table>\n' + '<thead>\n' + header + '</thead>\n' + body + '</table>\n';
  }

  tablerow(content) {
    return '<tr>\n' + content + '</tr>\n';
  }

  tablecell(content, flags) {
    const type = flags.header ? 'th' : 'td';
    const tag = flags.align ? '<' + type + ' align="' + flags.align + '">' : '<' + type + '>';
    return tag + content + '</' + type + '>\n';
  } // span level renderer


  strong(text) {
    return '<strong>' + text + '</strong>';
  }

  em(text) {
    return '<em>' + text + '</em>';
  }

  codespan(text) {
    return '<code>' + text + '</code>';
  }

  br() {
    return this.options.xhtml ? '<br/>' : '<br>';
  }

  del(text) {
    return '<del>' + text + '</del>';
  }

  link(href, title, text) {
    href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);

    if (href === null) {
      return text;
    }

    let out = '<a href="' + escape(href) + '"';

    if (title) {
      out += ' title="' + title + '"';
    }

    out += '>' + text + '</a>';
    return out;
  }

  image(href, title, text) {
    href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);

    if (href === null) {
      return text;
    }

    let out = '<img src="' + href + '" alt="' + text + '"';

    if (title) {
      out += ' title="' + title + '"';
    }

    out += this.options.xhtml ? '/>' : '>';
    return out;
  }

  text(text) {
    return text;
  }

};
},{"./defaults.js":"4MMD1","./helpers.js":"60iAW"}],"6BRG4":[function(require,module,exports) {
/**
 * TextRenderer
 * returns only the textual part of the token
 */
module.exports = class TextRenderer {
  // no need for block level renderers
  strong(text) {
    return text;
  }

  em(text) {
    return text;
  }

  codespan(text) {
    return text;
  }

  del(text) {
    return text;
  }

  html(text) {
    return text;
  }

  text(text) {
    return text;
  }

  link(href, title, text) {
    return '' + text;
  }

  image(href, title, text) {
    return '' + text;
  }

  br() {
    return '';
  }

};
},{}],"7crj2":[function(require,module,exports) {
/**
 * Slugger generates header id
 */
module.exports = class Slugger {
  constructor() {
    this.seen = {};
  }

  serialize(value) {
    return value.toLowerCase().trim() // remove html tags
    .replace(/<[!\/a-z].*?>/ig, '') // remove unwanted chars
    .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '').replace(/\s/g, '-');
  }
  /**
   * Finds the next safe (unique) slug to use
   */


  getNextSafeSlug(originalSlug, isDryRun) {
    let slug = originalSlug;
    let occurenceAccumulator = 0;

    if (this.seen.hasOwnProperty(slug)) {
      occurenceAccumulator = this.seen[originalSlug];

      do {
        occurenceAccumulator++;
        slug = originalSlug + '-' + occurenceAccumulator;
      } while (this.seen.hasOwnProperty(slug));
    }

    if (!isDryRun) {
      this.seen[originalSlug] = occurenceAccumulator;
      this.seen[slug] = 0;
    }

    return slug;
  }
  /**
   * Convert string to unique id
   * @param {object} options
   * @param {boolean} options.dryrun Generates the next unique slug without updating the internal accumulator.
   */


  slug(value, options = {}) {
    const slug = this.serialize(value);
    return this.getNextSafeSlug(slug, options.dryrun);
  }

};
},{}],"3eyFW":[function(require,module,exports) {
"use strict";

var _$template = require("solid-js/web").template;

var _$delegateEvents = require("solid-js/web").delegateEvents;

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FixButton = FixButton;

const _tmpl$ = _$template(`<button class="btn fix-btn">Fix</button>`, 2);

function FixButton(props) {
  return (() => {
    const _el$ = _tmpl$.cloneNode(true);

    _el$.__click = props.onClick;
    return _el$;
  })();
}

_$delegateEvents(["click"]);
},{"solid-js/web":"5Vgkw"}],"d6BGW":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBufferPositionFromMouseEvent = getBufferPositionFromMouseEvent;
exports.mouseEventNearPosition = mouseEventNearPosition;
exports.hasParent = hasParent;
const TOOLTIP_WIDTH_HIDE_OFFSET = 30;

function getBufferPositionFromMouseEvent(event, editor, editorElement) {
  const pixelPosition = editorElement.getComponent().pixelPositionForMouseEvent(event);
  const screenPosition = editorElement.getComponent().screenPositionForPixelPosition(pixelPosition);
  if (Number.isNaN(screenPosition.row) || Number.isNaN(screenPosition.column)) return null; // ^ Workaround for NaN bug steelbrain/linter-ui-default#191

  const expectedPixelPosition = editorElement.pixelPositionForScreenPosition(screenPosition);
  const differenceTop = pixelPosition.top - expectedPixelPosition.top;
  const differenceLeft = pixelPosition.left - expectedPixelPosition.left; // Only allow offset of 20px - Fixes steelbrain/linter-ui-default#63

  if ((differenceTop === 0 || differenceTop > 0 && differenceTop < 20 || differenceTop < 0 && differenceTop > -20) && (differenceLeft === 0 || differenceLeft > 0 && differenceLeft < 20 || differenceLeft < 0 && differenceLeft > -20)) {
    return editor.bufferPositionForScreenPosition(screenPosition);
  }

  return null;
}

function mouseEventNearPosition({
  event,
  editor,
  editorElement,
  tooltipElement,
  screenPosition
}) {
  const pixelPosition = editorElement.getComponent().pixelPositionForMouseEvent(event);
  const expectedPixelPosition = editorElement.pixelPositionForScreenPosition(screenPosition);
  const differenceTop = pixelPosition.top - expectedPixelPosition.top;
  const differenceLeft = pixelPosition.left - expectedPixelPosition.left;
  const editorLineHeight = editor.getLineHeightInPixels();
  const elementHeight = tooltipElement.offsetHeight + editorLineHeight;
  const elementWidth = tooltipElement.offsetWidth;

  if (differenceTop > 0) {
    // Cursor is below the line
    if (differenceTop > elementHeight + 1.5 * editorLineHeight) {
      return false;
    }
  } else if (differenceTop < 0) {
    // Cursor is above the line
    if (differenceTop < -1.5 * editorLineHeight) {
      return false;
    }
  }

  if (differenceLeft > 0) {
    // Right of the start of highlight
    if (differenceLeft > elementWidth + TOOLTIP_WIDTH_HIDE_OFFSET) {
      return false;
    }
  } else if (differenceLeft < 0) {
    // Left of start of highlight
    if (differenceLeft < -1 * TOOLTIP_WIDTH_HIDE_OFFSET) {
      return false;
    }
  }

  return true;
}

function hasParent(givenElement, selector) {
  let element = givenElement;

  do {
    if (element.matches(selector)) {
      return true;
    }

    element = element.parentElement;
  } while (element && element.nodeName !== 'HTML');

  return false;
}
},{}],"4M0qv":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _atom = require("atom");

var _debounce = _interopRequireDefault(require("lodash/debounce"));

var _disposableEvent = _interopRequireDefault(require("disposable-event"));

var _helpers = require("./helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class TreeView {
  constructor() {
    this.messages = [];
    this.decorations = {};
    this.subscriptions = new _atom.CompositeDisposable();
    this.decorateOnTreeView = void 0;
    this.subscriptions.add(atom.config.observe('linter-ui-default.decorateOnTreeView', decorateOnTreeView => {
      if (typeof this.decorateOnTreeView === 'undefined') {
        this.decorateOnTreeView = decorateOnTreeView;
      } else if (decorateOnTreeView === 'None') {
        this.update([]);
        this.decorateOnTreeView = decorateOnTreeView;
      } else {
        const messages = this.messages;
        this.decorateOnTreeView = decorateOnTreeView;
        this.update(messages);
      }
    }));
    setTimeout(() => {
      const element = TreeView.getElement();

      if (!element) {
        return;
      } // Subscription is only added if the CompositeDisposable hasn't been disposed


      this.subscriptions.add((0, _disposableEvent.default)(element, 'click', (0, _debounce.default)(() => {
        this.update();
      }), {
        passive: true
      }));
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

    this.applyDecorations((0, _helpers.calculateDecorations)(decorateOnTreeView, messages));
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
        // Removed
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
    let decoration = null;

    if (update) {
      decoration = element.querySelector('linter-decoration');
    }

    if (decoration !== null) {
      decoration.className = '';
    } else {
      decoration = document.createElement('linter-decoration');
      element.appendChild(decoration);
    }

    if (highlights.error) {
      decoration.classList.add('linter-error');
    } else if (highlights.warning) {
      decoration.classList.add('linter-warning');
    } else if (highlights.info) {
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
module.exports = exports.default;
},{"lodash/debounce":"19Jv3","./helpers":"1lHd9"}],"1lHd9":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getChunks = getChunks;
exports.getChunksByProjects = getChunksByProjects;
exports.mergeChange = mergeChange;
exports.calculateDecorations = calculateDecorations;

var _path = _interopRequireDefault(require("path"));

var _helpers = require("../helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getChunks(filePath, projectPath) {
  const toReturn = [];
  const chunks = filePath.split(_path.default.sep);

  while (chunks.length) {
    const currentPath = chunks.join(_path.default.sep);

    if (currentPath) {
      // This is required for when you open files outside of project window
      // and the last entry is '' because unix paths start with /
      toReturn.push(currentPath);

      if (currentPath === projectPath) {
        break;
      }
    }

    chunks.pop();
  }

  return toReturn;
}

function getChunksByProjects(filePath, projectPaths) {
  const matchingProjectPath = projectPaths.find(p => filePath.startsWith(p));

  if (!matchingProjectPath) {
    return [filePath];
  }

  return getChunks(filePath, matchingProjectPath);
}

function mergeChange(change, filePath, severity) {
  if (!change[filePath]) {
    change[filePath] = {
      info: false,
      error: false,
      warning: false
    };
  }

  change[filePath][severity] = true;
}

function calculateDecorations(decorateOnTreeView, messages) {
  const toReturn = {};
  const projectPaths = atom.project.getPaths();
  messages.forEach(function (message) {
    const filePath = (0, _helpers.$file)(message);

    if (filePath) {
      const chunks = decorateOnTreeView === 'Files' ? [filePath] : getChunksByProjects(filePath, projectPaths);
      chunks.forEach(chunk => mergeChange(toReturn, chunk, message.severity));
    }
  });
  return toReturn;
}
},{"../helpers":"1gbPg"}]},{},["23LYH"], "23LYH", "parcelRequire8785")

//# sourceMappingURL=index.js.map
