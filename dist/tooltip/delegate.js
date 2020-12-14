"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
class TooltipDelegate {
    constructor() {
        this.emitter = new atom_1.Emitter();
        this.expanded = false;
        this.subscriptions = new atom_1.CompositeDisposable();
        this.subscriptions.add(this.emitter);
        this.subscriptions.add(atom.config.observe('linter-ui-default.showProviderName', showProviderName => {
            const shouldUpdate = typeof this.showProviderName !== 'undefined';
            this.showProviderName = showProviderName;
            if (shouldUpdate) {
                this.emitter.emit('should-update');
            }
        }));
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'linter-ui-default:expand-tooltip': event => {
                var _a;
                if (this.expanded) {
                    return;
                }
                this.expanded = true;
                this.emitter.emit('should-expand');
                if ((_a = event === null || event === void 0 ? void 0 : event.originalEvent) === null || _a === void 0 ? void 0 : _a.isTrusted) {
                    document.body.addEventListener('keyup', function eventListener() {
                        document.body.removeEventListener('keyup', eventListener);
                        atom.commands.dispatch(atom.views.getView(atom.workspace), 'linter-ui-default:collapse-tooltip');
                    });
                }
            },
            'linter-ui-default:collapse-tooltip': () => {
                this.expanded = false;
                this.emitter.emit('should-collapse');
            },
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
//# sourceMappingURL=delegate.js.map