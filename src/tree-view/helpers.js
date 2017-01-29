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
  for (const projectPath of (projectPaths: Array<string>)) {
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
  for (const message of (messages: Array<LinterMessage>)) {
    const filePath = $file(message)
    if (!filePath) {
      // For compatibility purpose only
      continue
    }
    const chunks = decorateOnTreeView === 'Files' ? [filePath] : getChunksByProjects(filePath, projectPaths)
    if (chunks.length > 0) {
      mergeChange(toReturn, chunks[0], message.severity)
    }
    if (chunks.length > 1) {
      mergeChange(toReturn, chunks[1], message.severity)
    }
    if (chunks.length > 2) {
      mergeChange(toReturn, chunks[2], message.severity)
    }
    if (chunks.length > 3) {
      mergeChange(toReturn, chunks[3], message.severity)
    }
    if (chunks.length < 5) {
      continue
    }
    for (const chunk of (chunks: Array<string>)) {
      mergeChange(toReturn, chunk, message.severity)
    }
  }
  return toReturn
}
