/* @flow */

import Path from 'path'
import { $file } from '../helpers'
import type { LinterMessage } from '../types'

export function getChunks(filePath: string, projectPath: string): Array<string> {
  const toReturn = []
  const chunks = filePath.split(Path.sep)
  while (chunks.length) {
    const currentPath = chunks.join(Path.sep)
    toReturn.push(currentPath)
    if (currentPath === projectPath) {
      break
    }
    chunks.pop()
  }
  return toReturn
}

export function getChunksByProjects(filePath: string, projectPaths: Array<string>): Array<string> {
  if (projectPaths.length < 3) {
    if (filePath.indexOf(projectPaths[0]) === 0) {
      return getChunks(filePath, projectPaths[0])
    }
    if (filePath.indexOf(projectPaths[1]) === 0) {
      return getChunks(filePath, projectPaths[1])
    }
    if (filePath.indexOf(projectPaths[2]) === 0) {
      return getChunks(filePath, projectPaths[2])
    }
    return [filePath]
  }
  for (let i = 0, length = projectPaths.length; i < length; i++) {
    const projectPath = projectPaths[i]
    if (filePath.indexOf(projectPath) === 0) {
      return getChunks(filePath, projectPath)
    }
  }
  return [filePath]
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
