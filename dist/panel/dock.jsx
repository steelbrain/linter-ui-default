"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const helpers_1 = require("../helpers");
const web_1 = require("solid-js/web");
const component_1 = require("./component");
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
        this.panelHeight = 100;
        this.alwaysTakeMinimumSpace = true;
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
        web_1.render(() => <component_1.PanelComponent delegate={delegate}/>, this.element);
    }
    doPanelResize(forConfigHeight = false) {
        const paneContainer = getPaneContainer(this);
        if (paneContainer === null) {
            return;
        }
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
        var _a;
        this.subscriptions.dispose();
        const paneContainer = getPaneContainer(this);
        if (paneContainer !== null && !this.alwaysTakeMinimumSpace && paneContainer.state.size !== this.panelHeight) {
            atom.config.set('linter-ui-default.panelHeight', paneContainer.state.size);
            (_a = paneContainer.paneForItem(this)) === null || _a === void 0 ? void 0 : _a.destroyItem(this, true);
        }
    }
}
exports.default = PanelDock;
//# sourceMappingURL=dock.jsx.map