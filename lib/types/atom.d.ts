import { TextEditor, Package, CommandEvent } from 'atom'

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

export interface CommandEventExtra<T extends Event = Event> extends CommandEvent {
  // TODO add to @types/atom
  // TODO will it be undefined?
  originalEvent?: T
}
