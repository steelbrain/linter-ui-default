'use babel'

export function getEditorsMap(editors) {
  const map = {}
  editors.forEach(function(ui) {
    const path = ui.editor.getPath()
    if (typeof map[path] === 'undefined') {
      map[path] = [ui]
    } else {
      map[path].push(ui)
    }
  })
  return map
}
