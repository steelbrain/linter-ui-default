import { CompositeDisposable, Disposable, Emitter, Range } from 'atom'
const { config, workspace } = atom
import { filterMessages, filterMessagesByRangeOrPoint } from '../helpers'
import type { LinterMessage } from '../types'

export default class PanelDelegate {
  emitter = new Emitter<{}, { 'observe-messages': Array<LinterMessage> }>() // eslint-disable-line @typescript-eslint/ban-types
  messages: Array<LinterMessage> = []
  filteredMessages: Array<LinterMessage> = []
  subscriptions: CompositeDisposable = new CompositeDisposable()
  panelRepresents?: 'Entire Project' | 'Current File' | 'Current Line'

  constructor() {
    let changeSubscription: Disposable | null = null
    this.subscriptions.add(
      config.observe('linter-ui-default.panelRepresents', (panelRepresents: PanelDelegate['panelRepresents']) => {
        const notInitial = typeof this.panelRepresents !== 'undefined'
        this.panelRepresents = panelRepresents
        if (notInitial) {
          this.update()
        }
      }),
      workspace.getCenter().observeActivePaneItem(() => {
        if (changeSubscription) {
          changeSubscription.dispose()
          changeSubscription = null
        }
        const textEditor = workspace.getActiveTextEditor()
        if (textEditor !== undefined) {
          if (this.panelRepresents !== 'Entire Project') {
            this.update()
          }
          let oldRow = -1
          changeSubscription = textEditor.onDidChangeCursorPosition(({ newBufferPosition }) => {
            if (oldRow !== newBufferPosition.row && this.panelRepresents === 'Current Line') {
              oldRow = newBufferPosition.row
              this.update()
            }
          })
        }

        if (this.panelRepresents !== 'Entire Project' || textEditor !== undefined) {
          this.update()
        }
      }),
      new Disposable(() => {
        changeSubscription?.dispose()
      }),
    )
  }
  getFilteredMessages(): Array<LinterMessage> {
    let filteredMessages: Array<LinterMessage> = []
    if (this.panelRepresents === 'Entire Project') {
      filteredMessages = this.messages
    } else if (this.panelRepresents === 'Current File') {
      const activeEditor = workspace.getActiveTextEditor()
      if (!activeEditor) {
        return []
      }
      filteredMessages = filterMessages(this.messages, activeEditor.getPath())
    } else if (this.panelRepresents === 'Current Line') {
      const activeEditor = workspace.getActiveTextEditor()
      if (!activeEditor) {
        return []
      }
      const activeLine = activeEditor.getCursors()[0].getBufferRow()
      filteredMessages = filterMessagesByRangeOrPoint(
        this.messages,
        activeEditor.getPath(),
        Range.fromObject([
          [activeLine, 0],
          [activeLine, Infinity],
        ]),
      )
    }
    return filteredMessages
  }
  update(messages: Array<LinterMessage> | null | undefined = null): void {
    if (Array.isArray(messages)) {
      this.messages = messages
    }
    this.filteredMessages = this.getFilteredMessages()
    this.emitter.emit('observe-messages', this.filteredMessages)
  }
  onDidChangeMessages(callback: (messages: Array<LinterMessage>) => void): Disposable {
    return this.emitter.on('observe-messages', callback)
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
