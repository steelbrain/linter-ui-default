import { CompositeDisposable, Emitter } from 'atom';
import type { LinterMessage, TreeViewHighlight } from '../types';
export default class TreeView {
    emitter: Emitter;
    messages: Array<LinterMessage>;
    decorations: Object;
    subscriptions: CompositeDisposable;
    decorateOnTreeView: 'Files and Directories' | 'Files' | 'None';
    constructor();
    update(givenMessages?: Array<LinterMessage> | null | undefined): void;
    applyDecorations(decorations: Object): void;
    handleDecoration(element: HTMLElement, update: boolean, highlights: TreeViewHighlight): void;
    removeDecoration(element: HTMLElement): void;
    dispose(): void;
    static getElement(): HTMLElement;
    static getElementByPath(parent: HTMLElement, filePath: string): HTMLElement | null | undefined;
}
