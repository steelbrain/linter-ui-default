import { CompositeDisposable, Emitter } from 'atom'
const { tooltips } = atom
import type { Disposable } from 'atom'

import * as Helpers from './helpers'

export default class Element {
  item: HTMLElement = document.createElement('div')
  itemErrors: HTMLElement = Helpers.getElement('stop')
  itemWarnings: HTMLElement = Helpers.getElement('alert')
  itemInfos: HTMLElement = Helpers.getElement('info')

  emitter = new Emitter<{}, { click: 'error' | 'warning' | 'info' }>() // eslint-disable-line @typescript-eslint/ban-types
  subscriptions: CompositeDisposable = new CompositeDisposable()

  constructor() {
    this.item.appendChild(this.itemErrors)
    this.item.appendChild(this.itemWarnings)
    this.item.appendChild(this.itemInfos)
    this.item.classList.add('inline-block')
    this.item.classList.add('linter-status-count')

    this.subscriptions.add(
      this.emitter,
      tooltips.add(this.itemErrors, { title: 'Linter Errors' }),
      tooltips.add(this.itemWarnings, { title: 'Linter Warnings' }),
      tooltips.add(this.itemInfos, { title: 'Linter Infos' }),
    )

    this.itemErrors.onclick = () => this.emitter.emit('click', 'error')
    this.itemWarnings.onclick = () => this.emitter.emit('click', 'warning')
    this.itemInfos.onclick = () => this.emitter.emit('click', 'info')

    this.update(0, 0, 0)
  }
  setVisibility(prefix: string, visibility: boolean) {
    if (visibility) {
      this.item.classList.remove(`hide-${prefix}`)
    } else {
      this.item.classList.add(`hide-${prefix}`)
    }
  }
  update(countErrors: number, countWarnings: number, countInfos: number): void {
    this.itemErrors.childNodes[0].textContent = String(countErrors)
    this.itemWarnings.childNodes[0].textContent = String(countWarnings)
    this.itemInfos.childNodes[0].textContent = String(countInfos)

    if (countErrors) {
      this.itemErrors.classList.add('text-error')
    } else {
      this.itemErrors.classList.remove('text-error')
    }

    if (countWarnings) {
      this.itemWarnings.classList.add('text-warning')
    } else {
      this.itemWarnings.classList.remove('text-warning')
    }

    if (countInfos) {
      this.itemInfos.classList.add('text-info')
    } else {
      this.itemInfos.classList.remove('text-info')
    }
  }
  onDidClick(callback: (type: 'error' | 'warning' | 'info') => void): Disposable {
    return this.emitter.on('click', callback)
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
