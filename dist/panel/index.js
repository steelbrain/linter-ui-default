"use strict";
var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const delegate_1 = __importDefault(require("./delegate"));
const dock_1 = __importDefault(require("./dock"));
class Panel {
  constructor() {
    this.panel = null;
    this.element = document.createElement('div');
    this.delegate = new delegate_1.default();
    this.messages = [];
    this.deactivating = false;
    this.subscriptions = new atom_1.CompositeDisposable();
    this.showPanelConfig = true;
    this.hidePanelWhenEmpty = true;
    this.showPanelStateMessages = false;
    this.subscriptions.add(this.delegate, atom.config.observe('linter-ui-default.hidePanelWhenEmpty', hidePanelWhenEmpty => {
      this.hidePanelWhenEmpty = hidePanelWhenEmpty;
      this.refresh();
    }), atom.workspace.onDidDestroyPane(({ pane: destroyedPane }) => {
      const isPaneItemDestroyed = this.panel !== null ? destroyedPane.getItems().includes(this.panel) : true;
      if (isPaneItemDestroyed && !this.deactivating) {
        this.panel = null;
        atom.config.set('linter-ui-default.showPanel', false);
      }
    }), atom.workspace.onDidDestroyPaneItem(({ item: paneItem }) => {
      if (paneItem instanceof dock_1.default && !this.deactivating) {
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
          if (this.showPanelConfig && this.hidePanelWhenEmpty && !this.showPanelStateMessages) {
            return;
          }
        }
        if (dock.getActivePaneItem() !== this.panel) {
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
    }
    const paneContainer = atom.workspace.paneContainerForItem(this.panel);
    return paneContainer && paneContainer.location || null;
  }
  async activate() {
    if (this.panel) {
      return;
    }
    this.panel = new dock_1.default(this.delegate);
    await atom.workspace.open(this.panel, {
      activatePane: false,
      activateItem: false,
      searchAllPanes: true });

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
    var _a;
    const panel = this.panel;
    if (panel === null) {
      if (this.showPanelConfig) {
        await this.activate();
      }
      return;
    }
    const paneContainer = atom.workspace.paneContainerForItem(panel);
    if (!paneContainer || paneContainer.location !== 'bottom') {
      return;
    }
    const isActivePanel = paneContainer.getActivePaneItem() === panel;
    const visibilityAllowed1 = this.showPanelConfig;
    const visibilityAllowed2 = this.hidePanelWhenEmpty ? this.showPanelStateMessages : true;
    if (visibilityAllowed1 && visibilityAllowed2) {
      if (!isActivePanel) {
        (_a = paneContainer.paneForItem(panel)) === null || _a === void 0 ? void 0 : _a.activateItem(panel);
      }
      paneContainer.show();
      panel.doPanelResize();
    } else
    if (isActivePanel) {
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
  }}

exports.default = Panel;module.exports = exports.default;