import { CompositeDisposable, Emitter } from 'atom'
const { config, workspace, views, commands } = atom
import type { Disposable } from 'atom'
import { CommandEventExtra } from '../types'

export default class TooltipDelegate {
  emitter: Emitter = new Emitter<{
    'should-update': never
    'should-expand': never
    'should-collapse': never
  }>()
  expanded: boolean = false
  subscriptions: CompositeDisposable = new CompositeDisposable()
  showProviderName?: boolean

  constructor() {
    this.subscriptions.add(
      this.emitter,
      config.observe('linter-ui-default.showProviderName', (showProviderName: boolean) => {
        const shouldUpdate = typeof this.showProviderName !== 'undefined'
        this.showProviderName = showProviderName
        if (shouldUpdate) {
          this.emitter.emit('should-update')
        }
      }),
      commands.add('atom-workspace', {
        'linter-ui-default:expand-tooltip': (event: CommandEventExtra) => {
          if (this.expanded) {
            return
          }
          this.expanded = true
          this.emitter.emit('should-expand')

          // If bound to a key, collapse when that key is released, just like old times
          if (event.originalEvent?.isTrusted === true) {
            // $FlowIgnore: document.body is never null
            document.body.addEventListener(
              'keyup',
              async function eventListener() {
                // $FlowIgnore: document.body is never null
                document.body.removeEventListener('keyup', eventListener)
                await commands.dispatch(views.getView(workspace), 'linter-ui-default:collapse-tooltip')
              },
              { passive: true },
            )
          }
        },
        'linter-ui-default:collapse-tooltip': () => {
          this.expanded = false
          this.emitter.emit('should-collapse')
        },
      }),
    )
  }
  onShouldUpdate(callback: () => void): Disposable {
    return this.emitter.on('should-update', callback)
  }
  onShouldExpand(callback: () => void): Disposable {
    return this.emitter.on('should-expand', callback)
  }
  onShouldCollapse(callback: () => void): Disposable {
    return this.emitter.on('should-collapse', callback)
  }
  dispose() {
    this.emitter.dispose()
  }
}
