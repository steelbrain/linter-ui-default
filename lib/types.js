'use babel'

/* @flow */

export type Atom$Point = [number, number]
export type Atom$Range = [Atom$Point, Atom$Point]
export type Linter$Linter = {
  name?: string
}
export type Linter$Fix = {
  range: Range,
  newText: string,
  oldText?: string
}
export type Linter$Message = {
  key: string;
  type: string,
  text?: string,
  html?: string,
  name?: string,
  filePath?: string,
  range?: Atom$Range,
  trace?: Array<Linter$Message>,
  fix: ?Linter$Fix
}
export type Linter$Difference = {
  added: Array<Linter$Message>,
  removed: Array<Linter$Message>,
  messages: Array<Linter$Message>
}
export type Config$ShowIssues = 'All Files' | 'Current File' | 'Current Line';
