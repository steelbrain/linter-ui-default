import { CompositeDisposable } from 'atom';
import type { LinterMessage, TreeViewHighlight } from '../types';
export default class TreeView {
    messages: Array<LinterMessage>;
    decorations: Record<string, TreeViewHighlight>;
    subscriptions: CompositeDisposable;
    decorateOnTreeView?: 'Files and Directories' | 'Files' | 'None';
    constructor();
    update(givenMessages?: Array<LinterMessage> | null | undefined): void;
    applyDecorations(decorations: Record<string, TreeViewHighlight>): void;
    handleDecoration(element: HTMLElement, update: boolean | undefined, highlights: TreeViewHighlight): void;
    removeDecoration(element: HTMLElement): void;
    dispose(): void;
    static getElement(): HTMLElement | null;
    static getElementByPath(parent: HTMLElement, filePath: string): HTMLElement | null;
}
