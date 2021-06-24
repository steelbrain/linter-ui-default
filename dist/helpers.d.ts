import { Range } from 'atom';
import type { Point, PointLike, RangeCompatible, TextEditor } from 'atom';
import type { default as Editors, EditorsMap } from './editors';
import type { LinterMessage, MessageSolution } from './types';
export declare const severityScore: {
    error: number;
    warning: number;
    info: number;
};
export declare const severityNames: {
    error: string;
    warning: string;
    info: string;
};
export declare const WORKSPACE_URI = "atom://linter-ui-default";
export declare const DOCK_ALLOWED_LOCATIONS: string[];
export declare const DOCK_DEFAULT_LOCATION = "bottom";
export declare function $range(message: LinterMessage): Range | null | undefined;
export declare function $file(message: LinterMessage): string | null | undefined;
export declare function copySelection(): void;
export declare function getPathOfMessage(message: LinterMessage): string;
export declare function getEditorsMap(editors: Editors): {
    editorsMap: EditorsMap;
    filePaths: Array<string>;
};
export declare function filterMessages(messages: Array<LinterMessage>, filePath: string | null | undefined, severity?: string | null | undefined): Array<LinterMessage>;
export declare function filterMessagesByRangeOrPoint(messages: Set<LinterMessage> | Array<LinterMessage> | Map<string, LinterMessage>, filePath: string | undefined, rangeOrPoint: Point | RangeCompatible): Array<LinterMessage>;
export declare function openFile(file: string, position: PointLike | null | undefined): Promise<void>;
export declare function visitMessage(message: LinterMessage, reference?: boolean): Promise<void>;
export declare function openExternally(message: LinterMessage): void;
export declare function sortMessages(rows: Array<LinterMessage>, sortDirection: [id: 'severity' | 'linterName' | 'file' | 'line', direction: 'asc' | 'desc']): Array<LinterMessage>;
export declare function sortSolutions(solutions: MessageSolution[]): MessageSolution[];
export declare function applySolution(textEditor: TextEditor, solution: MessageSolution): boolean;
/**
 * A function to get a value from the cache or calculate it if it is not available (and store it in the cache after calculation)
 *
 * @param map A reference to a Map of key to values that is used as the cache
 * @param key The current key to get calculate or get the cache for
 * @param calculate The function that is used to calculate the value if the cache is not hit
 */
export declare function get<Key, Value>(map: Map<Key, Value>, key: Key, calculate: () => Value | null): Value | null;
/** A faster vresion of lodash.debounce */
export declare function debounce<T extends (...args: any[]) => void>(func: T, wait?: number): T;
/** A faster vresion of lodash.once */
export declare function once<T extends Function>(func: T): T;
