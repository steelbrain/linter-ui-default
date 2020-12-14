import { CompositeDisposable, Emitter } from 'atom';
import type { Disposable } from 'atom';
export default class Element {
    item: HTMLElement;
    itemErrors: HTMLElement;
    itemWarnings: HTMLElement;
    itemInfos: HTMLElement;
    emitter: Emitter;
    subscriptions: CompositeDisposable;
    constructor();
    setVisibility(prefix: string, visibility: boolean): void;
    update(countErrors: number, countWarnings: number, countInfos: number): void;
    onDidClick(callback: (type: string) => void): Disposable;
    dispose(): void;
}
