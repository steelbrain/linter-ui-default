import type { LinterMessage } from '../types';
import type { TreeViewHighlight } from './index';
export declare function calculateDecorations(decorateOnTreeView: 'Files and Directories' | 'Files' | undefined, messages: Array<LinterMessage>): Record<string, TreeViewHighlight | undefined>;
