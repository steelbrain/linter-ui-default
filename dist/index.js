"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumeStatusBar = exports.consumeSignal = exports.provideIntentions = exports.provideUI = exports.deactivate = exports.activate = void 0;
const main_1 = __importDefault(require("./main"));
const idleCallbacks = new Set();
const instances = new Set();
let signalRegistry;
let statusBarRegistry;
function activate() {
    if (atom.config.get('linter-ui-default.useBusySignal')) {
        atom.packages.getLoadedPackage('linter-ui-default').metadata['package-deps'].push('busy-signal');
    }
    const callbackID = window.requestIdleCallback(function installLinterUIDefaultDeps() {
        idleCallbacks.delete(callbackID);
        if (!atom.inSpecMode()) {
            require('atom-package-deps').install('linter-ui-default');
        }
    });
    idleCallbacks.add(callbackID);
}
exports.activate = activate;
function deactivate() {
    idleCallbacks.forEach(callbackID => window.cancelIdleCallback(callbackID));
    idleCallbacks.clear();
    for (const entry of instances) {
        entry.dispose();
    }
    instances.clear();
}
exports.deactivate = deactivate;
function provideUI() {
    const instance = new main_1.default();
    instances.add(instance);
    if (signalRegistry) {
        instance.signal.attach(signalRegistry);
    }
    return instance;
}
exports.provideUI = provideUI;
function provideIntentions() {
    return Array.from(instances).map(entry => entry.intentions);
}
exports.provideIntentions = provideIntentions;
function consumeSignal(signalService) {
    signalRegistry = signalService;
    instances.forEach(function (instance) {
        instance.signal.attach(signalRegistry);
    });
}
exports.consumeSignal = consumeSignal;
function consumeStatusBar(statusBarService) {
    statusBarRegistry = statusBarService;
    instances.forEach(function (instance) {
        instance.statusBar.attach(statusBarRegistry);
    });
}
exports.consumeStatusBar = consumeStatusBar;
//# sourceMappingURL=index.js.map