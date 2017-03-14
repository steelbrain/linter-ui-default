/* @flow */

import { CompositeDisposable, Emitter } from 'sb-event-kit'
import type { Disposable } from 'sb-event-kit'

export default class Element {
  item: HTMLElement;
  itemErrors: HTMLElement;
  itemWarnings: HTMLElement;
  itemInfos: HTMLElement;

  emitter: Emitter;
  subscriptions: CompositeDisposable;

  constructor() {
    this.item = document.createElement('div')
    this.itemErrors = document.createElement('span')
    this.itemWarnings = document.createElement('span')
    this.itemInfos = document.createElement('span')

    this.emitter = new Emitter()
    this.subscriptions = new CompositeDisposable()

    this.item.appendChild(this.itemErrors)
    this.item.appendChild(this.itemWarnings)
    this.item.appendChild(this.itemInfos)
    this.item.classList.add('inline-block')
    this.item.classList.add('linter-status-count')

    this.subscriptions.add(this.emitter)
    this.subscriptions.add(atom.tooltips.add(this.itemErrors, { title: 'Linter Errors' }))
    this.subscriptions.add(atom.tooltips.add(this.itemWarnings, { title: 'Linter Warnings' }))
    this.subscriptions.add(atom.tooltips.add(this.itemInfos, { title: 'Linter Infos' }))

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
    this.itemErrors.textContent = String(countErrors)
    this.itemWarnings.textContent = String(countWarnings)
    this.itemInfos.textContent = String(countInfos)

    if (countErrors) {
      this.itemErrors.classList.remove('highlight')
      this.itemErrors.classList.add('highlight-error')
    } else {
      this.itemErrors.classList.add('highlight')
      this.itemErrors.classList.remove('highlight-error')
    }

    if (countWarnings) {
      this.itemWarnings.classList.remove('highlight')
      this.itemWarnings.classList.add('highlight-warning')
    } else {
      this.itemWarnings.classList.add('highlight')
      this.itemWarnings.classList.remove('highlight-warning')
    }

    if (countInfos) {
      this.itemInfos.classList.remove('highlight')
      this.itemInfos.classList.add('highlight-info')
    } else {
      this.itemInfos.classList.add('highlight')
      this.itemInfos.classList.remove('highlight-info')
    }
  }
  onDidClick(callback: ((type: string) => void)): Disposable {
    return this.emitter.on('click', callback)
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
