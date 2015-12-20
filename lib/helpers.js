'use babel'

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
