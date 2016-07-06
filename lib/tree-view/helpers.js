'use babel'

/* @flow */

import Path from 'path'
import type { Message, MessageLegacy } from '../types'

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
  for (let i = 0, length = projectPaths.length, projectPath; i < length; ++i) {
    projectPath = projectPaths[i]
    if (filePath.indexOf(projectPath) === 0) {
      return getChunks(filePath, projectPath)
    }
  }
  return [filePath]
}

export function mergeChange(change: Object, filePath: string, severity: string): void {
  if (!change[filePath]) {
    change[filePath] = new Set()
  }
  change[filePath].add(severity)
}

export function calculateDecorations(decorateOnTreeView: 'Files and Directories' | 'Files', messages: Array<Message | MessageLegacy>): Object {
  const toReturn = {}
  const projectPaths: Array<string> = atom.project.getPaths()
  for (let i = 0, length = messages.length, message; i < length; ++i) {
    message = messages[i]
    const filePath = message.version === 1 ? message.filePath : message.location.file
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
    if (chunks.length === 4) {
      continue
    }
    for (let _i = 4, _length = chunks.length, _filePath; _i < _length; ++_i) {
      _filePath = chunks[_i]
      mergeChange(toReturn, _filePath, message.severity)
    }
  }
  for (const filePath in toReturn) {
    if (!toReturn.hasOwnProperty(filePath)) {
      continue
    }
    toReturn[filePath] = Array.from(toReturn[filePath])
  }
  return toReturn
}
