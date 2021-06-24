const { project } = atom
import Path from 'path'
import { $file } from '../helpers'
import type { LinterMessage } from '../types'
import type { TreeViewHighlight } from './index'

function getChunks(filePath: string, projectPath: string): Array<string> {
  const toReturn: Array<string> = []
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

function getChunksByProjects(filePath: string, projectPaths: Array<string>): Array<string> {
  const matchingProjectPath = projectPaths.find(p => filePath.startsWith(p))
  if (matchingProjectPath === undefined) {
    return [filePath]
  }
  return getChunks(filePath, matchingProjectPath)
}

function mergeChange(change: Record<string, TreeViewHighlight | undefined>, filePath: string, severity: string): void {
  if (change[filePath] === undefined) {
    change[filePath] = {
      info: false,
      error: false,
      warning: false,
    }
  }
  change[filePath]![severity] = true
}

export function calculateDecorations(
  decorateOnTreeView: 'Files and Directories' | 'Files' | undefined,
  messages: Array<LinterMessage>,
): Record<string, TreeViewHighlight | undefined> {
  const toReturn: Record<string, TreeViewHighlight | undefined> = {}
  const projectPaths: Array<string> = project.getPaths()
  messages.forEach(function (message) {
    const filePath = $file(message)
    if (typeof filePath === 'string') {
      const chunks = decorateOnTreeView === 'Files' ? [filePath] : getChunksByProjects(filePath, projectPaths)
      chunks.forEach(chunk => mergeChange(toReturn, chunk, message.severity))
    }
  })
  return toReturn
}
