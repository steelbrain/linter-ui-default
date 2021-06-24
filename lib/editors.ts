import { CompositeDisposable } from 'atom'
const { config, workspace, notifications } = atom
import type { TextEditor } from 'atom'
import Editor from './editor'
import { $file, getEditorsMap, filterMessages } from './helpers'
import { largeness } from 'atom-ide-base/commons-atom/editor-largeness'
import type { LinterMessage, MessagesPatch } from './types'

export type EditorsPatch = {
  added: Array<LinterMessage>
  removed: Array<LinterMessage>
  editors: Array<Editor>
}

export type EditorsMap = Map<string, EditorsPatch>

export default class Editors {
  editors: Set<Editor> = new Set()
  messages: Array<LinterMessage> = []
  firstRender: boolean = true
  subscriptions: CompositeDisposable = new CompositeDisposable()

  constructor() {
    // TODO move the config to a separate package
    const largeLineCount = config.get('linter-ui-default.largeFileLineCount') as number
    const longLineLength = config.get('linter-ui-default.longLineLength') as number

    this.subscriptions.add(
      workspace.observeTextEditors(textEditor => {
        // TODO we do this check only at the begining. Probably we should do this later too?
        if (largeness(textEditor, largeLineCount, longLineLength)) {
          const notif = notifications.addWarning('Linter: Large/Minified file detected', {
            detail:
              'Adding inline linter markers are skipped for this file for performance reasons (linter pane is still active)',
            dismissable: true,
            buttons: [
              {
                text: 'Force enable',
                onDidClick: () => {
                  this.getEditor(textEditor)
                  notif.dismiss()
                },
              },
              {
                text: 'Change threshold',
                onDidClick: async () => {
                  await workspace.open('atom://config/packages/linter-ui-default')
                  // it is the 16th setting :D
                  document.querySelectorAll('.control-group')[16].scrollIntoView()
                  notif.dismiss()
                },
              },
            ],
          })
          setTimeout(() => {
            notif.dismiss()
          }, 5000)
          return
        }
        this.getEditor(textEditor)
      }),
      workspace.getCenter().observeActivePaneItem(paneItem => {
        this.editors.forEach(editor => {
          if (editor.textEditor !== paneItem) {
            editor.removeTooltip()
          }
        })
      }),
    )
  }
  isFirstRender(): boolean {
    return this.firstRender
  }
  update({ messages, added, removed }: MessagesPatch) {
    this.messages = messages
    this.firstRender = false

    const { editorsMap, filePaths } = getEditorsMap(this)
    added.forEach(function (message) {
      if (!message || !message.location) {
        return
      }
      const filePath = $file(message)
      if (typeof filePath === 'string' && editorsMap.has(filePath)) {
        editorsMap.get(filePath)!.added.push(message)
      }
    })
    removed.forEach(function (message) {
      if (!message || !message.location) {
        return
      }
      const filePath = $file(message)
      if (typeof filePath === 'string' && editorsMap.has(filePath)) {
        editorsMap.get(filePath)!.removed.push(message)
      }
    })

    filePaths.forEach(function (filePath) {
      if (editorsMap.has(filePath)) {
        const { added, removed, editors } = editorsMap.get(filePath) as EditorsPatch
        if (added.length || removed.length) {
          editors.forEach(editor => editor.applyChanges(added, removed))
        }
      }
    })
  }
  getEditor(textEditor: TextEditor): Editor | void {
    for (const entry of this.editors) {
      if (entry.textEditor === textEditor) {
        return entry
      }
    }
    const editor = new Editor(textEditor)
    this.editors.add(editor)
    editor.onDidDestroy(() => {
      this.editors.delete(editor)
    })
    editor.subscriptions.add(
      textEditor.onDidChangePath(() => {
        editor.dispose()
        this.getEditor(textEditor)
      }),
    )
    editor.subscriptions.add(
      textEditor.onDidChangeGrammar(() => {
        editor.dispose()
        this.getEditor(textEditor)
      }),
    )
    editor.applyChanges(filterMessages(this.messages, textEditor.getPath()), [])
    return editor
  }
  dispose() {
    for (const entry of this.editors) {
      entry.dispose()
    }
    this.subscriptions.dispose()
  }
}
