import { TextEditor, Point, Range, Package } from 'atom'
import type Editor from './editor/index'

export type MessageSolution =
  | {
      title?: string
      position: Range
      priority?: number
      currentText?: string
      replaceWith: string
    }
  | {
      title?: string
      priority?: number
      position: Range
      apply: () => any
    }

export type Message = {
  // Automatically added by linter
  key: string
  version: 2
  linterName: string

  // From providers
  location: {
    file: string
    position: Range
  }
  reference?: {
    file: string
    position?: Point
  }
  url?: string
  icon?: string
  excerpt: string
  severity: 'error' | 'warning' | 'info'
  solutions?: Array<MessageSolution>
  description?: string | (() => Promise<string> | string)
}

export type LinterMessage = Message

export type Linter = {
  // Automatically added
  __$sb_linter_version: number
  __$sb_linter_activated: boolean
  __$sb_linter_request_latest: number
  __$sb_linter_request_last_received: number

  // From providers
  name: string
  scope: 'file' | 'project'
  lintOnFly: boolean
  lintsOnChange?: boolean
  grammarScopes: Array<string>
  lint: (textEditor: TextEditor) => (Array<Message> | null | undefined) | Promise<Array<Message> | null | undefined>
}

export type MessagesPatch = {
  added: Array<Message>
  removed: Array<Message>
  messages: Array<Message>
}

export type EditorsPatch = {
  added: Array<Message>
  removed: Array<Message>
  editors: Array<Editor>
}

export type EditorsMap = Map<string, EditorsPatch>

export type TreeViewHighlight = {
  info: boolean
  error: boolean
  warning: boolean
}

// TODO: uses internal API
export type TextEditorExtra = TextEditor & {
  getURI?: () => string
  isAlive?: () => boolean
}

// TODO: uses internal API
interface PackageDepsList {
  [key: string]: string[]
}

export type PackageExtra = Package & {
  metadata: PackageDepsList
}

// windows requestIdleCallback types
export type RequestIdleCallbackHandle = any
type RequestIdleCallbackOptions = {
  timeout: number
}
type RequestIdleCallbackDeadline = {
  readonly didTimeout: boolean
  timeRemaining: () => number
}

declare global {
  interface Window {
    requestIdleCallback: (
      callback: (deadline: RequestIdleCallbackDeadline) => void,
      opts?: RequestIdleCallbackOptions,
    ) => RequestIdleCallbackHandle
    cancelIdleCallback: (handle: RequestIdleCallbackHandle) => void
  }
}

// from intentions package:
// https://github.com/steelbrain/intentions/blob/master/lib/types.js
export type ListItem = {
  // // Automatically added
  readonly __$sb_intentions_class?: string

  // From providers
  icon?: string
  class?: string
  title: string
  priority: number
  selected(): void
}

export type IntentionsListProvider = {
  grammarScopes: Array<string>
  getIntentions(parameters: { textEditor: TextEditor; bufferPosition: Point }): Array<ListItem> | Promise<Array<ListItem>>
}
