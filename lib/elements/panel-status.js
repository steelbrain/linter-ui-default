'use babel'

export class PanelStatusElement {
  constructor() {
    this.element = <div class="heading-status"></div>
    this.elementIcon = <span class="icon icon-check"></span>
    this.elementText = document.createTextNode('No Issues')

    this.element.appendChild(this.elementIcon)
    this.element.appendChild(this.elementText)
  }
  set count(count) {
    if (count) {
      this.element.classList.remove('status-success')
      this.element.classList.add('status-error')

      this.elementIcon.classList.remove('icon-check')
      this.elementIcon.classList.add('icon-x')

      this.elementText.textContent = count === 1 ? '1 Issue' : `${count} Issues`
    } else {
      this.element.classList.remove('status-error')
      this.element.classList.add('status-success')

      this.elementIcon.classList.remove('icon-x')
      this.elementIcon.classList.add('icon-check')

      this.elementText.textContent = 'No Issues'
    }
  }

  dispose() {
    this.element = null
    this.elementIcon = null
    this.elementText = null
  }
}
