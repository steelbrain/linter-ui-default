'use babel'

/* @flow */

export type Atom$Point = [number, number]
export type Atom$Range = [Atom$Point, Atom$Point]
export type Linter$Linter = {
  name?: string
}
export type Linter$Message = {
  type: string,
  text?: string,
  html?: string,
  name?: string,
  filePath?: string,
  range?: Atom$Range,
  trace?: Array<Linter$Message>
}
