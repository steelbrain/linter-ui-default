import type { LinterMessage } from '../types';
export declare function getChunks(filePath: string, projectPath: string): Array<string>;
export declare function getChunksByProjects(filePath: string, projectPaths: Array<string>): Array<string>;
export declare function mergeChange(change: Object, filePath: string, severity: string): void;
export declare function calculateDecorations(decorateOnTreeView: 'Files and Directories' | 'Files', messages: Array<LinterMessage>): Object;
