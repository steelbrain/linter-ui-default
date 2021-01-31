import { CompositeDisposable, Emitter } from 'atom'
import type { Disposable } from 'atom'

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
      atom.config.observe('linter-ui-default.showProviderName', showProviderName => {
        const shouldUpdate = typeof this.showProviderName !== 'undefined'
        this.showProviderName = showProviderName
        if (shouldUpdate) {
          this.emitter.emit('should-update')
        }
      }),
      atom.commands.add('atom-workspace', {
        'linter-ui-default:expand-tooltip': event => {
          if (this.expanded) {
            return
          }
          this.expanded = true
          this.emitter.emit('should-expand')

          // If bound to a key, collapse when that key is released, just like old times
          if (event?.originalEvent?.isTrusted) {
            // $FlowIgnore: document.body is never null
            document.body.addEventListener(
              'keyup',
              function eventListener() {
                // $FlowIgnore: document.body is never null
                document.body.removeEventListener('keyup', eventListener)
                atom.commands.dispatch(atom.views.getView(atom.workspace), 'linter-ui-default:collapse-tooltip')
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
