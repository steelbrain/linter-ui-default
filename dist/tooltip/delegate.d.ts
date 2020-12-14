import { CompositeDisposable, Emitter } from 'atom';
import type { Disposable } from 'atom';
export default class TooltipDelegate {
    emitter: Emitter;
    expanded: boolean;
    subscriptions: CompositeDisposable;
    showProviderName: boolean;
    constructor();
    onShouldUpdate(callback: () => any): Disposable;
    onShouldExpand(callback: () => any): Disposable;
    onShouldCollapse(callback: () => any): Disposable;
    dispose(): void;
}
