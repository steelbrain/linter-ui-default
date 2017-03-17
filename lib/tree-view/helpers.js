/* @flow */

import Path from 'path'
import { $file } from '../helpers'
import type { LinterMessage } from '../types'

export function getChunks(filePath: string, projectPath: string): Array<string> {
  const toReturn = []
  const chunks = filePath.split(Path.sep)
  while (chunks.length) {
    const currentPath = chunks.join(Path.sep)
    if (currentPath) {
      // This is required for when you open files outside of project window
      // and the last entry is '' because unix paths start with /
      toReturn.push(currentPath)
      if (currentPath === projectPath) {
        break
      }
    }
    chunks.pop()
  }
  return toReturn
}

export function getChunksByProjects(filePath: string, projectPaths: Array<string>): Array<string> {
  const matchingProjectPath = projectPaths.find(p => filePath.startsWith(p))
  if (!matchingProjectPath) {
    return [filePath]
  }
  return getChunks(filePath, matchingProjectPath)
}

export function mergeChange(change: Object, filePath: string, severity: string): void {
  if (!change[filePath]) {
    change[filePath] = {
      info: false,
      error: false,
      warning: false,
    }
  }
  change[filePath][severity] = true
}

export function calculateDecorations(decorateOnTreeView: 'Files and Directories' | 'Files', messages: Array<LinterMessage>): Object {
  const toReturn = {}
  const projectPaths: Array<string> = atom.project.getPaths()
  messages.forEach(function(message) {
    const filePath = $file(message)
    if (filePath) {
      const chunks = decorateOnTreeView === 'Files' ? [filePath] : getChunksByProjects(filePath, projectPaths)
      chunks.forEach(chunk => mergeChange(toReturn, chunk, message.severity))
    }
  })
  return toReturn
}
