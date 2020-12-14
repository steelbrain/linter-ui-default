"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const helpers_1 = require("../helpers");
const react_1 = __importDefault(require("react"));
const react_dom_1 = __importDefault(require("react-dom"));
const component_1 = __importDefault(require("./component"));
function getPaneContainer(item) {
    const paneContainer = atom.workspace.paneContainerForItem(item);
    if (paneContainer &&
        typeof paneContainer.state === 'object' &&
        typeof paneContainer.state.size === 'number' &&
        typeof paneContainer.render === 'function') {
        return paneContainer;
    }
    return null;
}
class PanelDock {
    constructor(delegate) {
        this.element = document.createElement('div');
        this.subscriptions = new atom_1.CompositeDisposable();
        this.lastSetPaneHeight = null;
        this.subscriptions.add(atom.config.observe('linter-ui-default.panelHeight', panelHeight => {
            const changed = typeof this.panelHeight === 'number';
            this.panelHeight = panelHeight;
            if (changed) {
                this.doPanelResize(true);
            }
        }));
        this.subscriptions.add(atom.config.observe('linter-ui-default.alwaysTakeMinimumSpace', alwaysTakeMinimumSpace => {
            this.alwaysTakeMinimumSpace = alwaysTakeMinimumSpace;
        }));
        this.doPanelResize();
        react_dom_1.default.render(react_1.default.createElement(component_1.default, { delegate: delegate }), this.element);
    }
    doPanelResize(forConfigHeight = false) {
        const paneContainer = getPaneContainer(this);
        let minimumHeight = null;
        const paneContainerView = atom.views.getView(paneContainer);
        if (paneContainerView && this.alwaysTakeMinimumSpace) {
            const dockNamesElement = paneContainerView.querySelector('.list-inline.tab-bar.inset-panel');
            const dockNamesRects = dockNamesElement ? dockNamesElement.getClientRects()[0] : null;
            const tableElement = this.element.querySelector('table');
            const panelRects = tableElement ? tableElement.getClientRects()[0] : null;
            if (dockNamesRects && panelRects) {
                minimumHeight = dockNamesRects.height + panelRects.height + 1;
            }
        }
        if (paneContainer) {
            let updateConfigHeight = null;
            const heightSet = minimumHeight !== null && !forConfigHeight ? Math.min(minimumHeight, this.panelHeight) : this.panelHeight;
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
    }
    getURI() {
        return helpers_1.WORKSPACE_URI;
    }
    getTitle() {
        return 'Linter';
    }
    getDefaultLocation() {
        return helpers_1.DOCK_DEFAULT_LOCATION;
    }
    getAllowedLocations() {
        return helpers_1.DOCK_ALLOWED_LOCATIONS;
    }
    getPreferredHeight() {
        return atom.config.get('linter-ui-default.panelHeight');
    }
    dispose() {
        this.subscriptions.dispose();
        const paneContainer = getPaneContainer(this);
        if (paneContainer && !this.alwaysTakeMinimumSpace && paneContainer.state.size !== this.panelHeight) {
            atom.config.set('linter-ui-default.panelHeight', paneContainer.state.size);
            paneContainer.paneForItem(this).destroyItem(this, true);
        }
    }
}
exports.default = PanelDock;
//# sourceMappingURL=dock.js.map