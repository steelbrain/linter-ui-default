'use babel'

/* @flow */

export function projectPathByFile(projectPaths: Array<string>, filePath: string): ?string {
  if (projectPaths.length < 3) {
    if (filePath.indexOf(projectPaths[0]) === 0) {
      return projectPaths[0]
    }
    if (filePath.indexOf(projectPaths[1]) === 0) {
      return projectPaths[1]
    }
    if (filePath.indexOf(projectPaths[2]) === 0) {
      return projectPaths[2]
    }
    return null
  }
  for (let i = 0, length = projectPaths.length, projectPath; i < length; ++i) {
    projectPath = projectPaths[i]
    if (filePath.indexOf(projectPath) === 0) {
      return projectPath
    }
  }
  return null
}
