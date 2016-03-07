'use babel'

/* @flow */

import type {TextBuffer, TextEditorMarker} from 'atom'

export type Atom$Point = [number, number]
export type Atom$Range = [Atom$Point, Atom$Point]
export type Linter$Linter = {
  name?: string
}
export type Linter$Message = {
  key: string;
  type: string,
  text?: string,
  html?: string,
  name?: string,
  filePath?: string,
  range?: Atom$Range,
  trace?: Array<Linter$Message>
}
export type Linter$Difference = {
  added: Array<Linter$Message>,
  removed: Array<Linter$Message>,
  messages: Array<Linter$Message>
}
export type Buffer$Difference = {
  textBuffer: TextBuffer,
  markers: Map<Linter$Message, TextEditorMarker>,
  added: Array<Linter$Message>,
  removed: Array<Linter$Message>
}
