'use babel'

export const CURRENT_FILE = 'Current File'
export const CURRENT_LINE = 'Current Line'
export const ENTIRE_PROJECT = 'Entire Project'

export function getEditorsMap(editorUI) {
  const editors = {}
  const diff = {}
  const activePaths = new Set()
  editorUI.forEach(function(ui) {
    const path = ui.editor.getPath()
    if (path) {
      if (typeof editors[path] === 'undefined') {
        editors[path] = [ui]
        diff[path] = {added: [], removed: []}
        activePaths.add(path)
      } else {
        editors[path].push(ui)
      }
    }
  })
  return {editors, diff, activePaths}
}
