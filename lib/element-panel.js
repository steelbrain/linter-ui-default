'use babel'
/** @jsx vanilla.jsx */
import vanilla from 'vanilla-jsx'
import Clipboard from 'clipboard'
// TODO: ^- when atom updates to a never version of Electron, change this to `require('electron').Clipboard`

export function createPanel() {
  const icons = {
    MIN: '🗕',
    MAX: '🗖'
  }
  let el

  const toggleContent = function() {
    if (el.refs.content.classList.contains('hidden')) {
      this.textContent = icons.MIN
      el.refs.content.classList.remove('hidden')
    } else {
      this.textContent = icons.MAX
      el.refs.content.classList.add('hidden')
    }
  }
  const setCount = function(count) {
    if (count) {
      this.classList.remove('status-success')
      this.classList.add('status-error')
      this.childNodes[0].classList.remove('icon-check')
      this.childNodes[0].classList.add('icon-x')

      this.childNodes[1].textContent = count === 1 ? '1 Issue' : `${count} Issues`
    } else {
      this.classList.remove('status-error')
      this.classList.add('status-success')
      this.childNodes[0].classList.remove('icon-x')
      this.childNodes[0].classList.add('icon-check')

      this.childNodes[1].textContent = 'No Issues'
    }
  }

  el = <linter-new-panel tabindex="-1">
    <div class="inset-panel">
      <div class="panel-heading">
        <div class="heading-title">
          Linter
        </div>
        <div class="heading-status">
          <linter-bottom-status class="status-success">
            <span class="icon icon-check"></span> No Issues
          </linter-bottom-status>
        </div>
        <div class="heading-icons">
          <span onclick={toggleContent}>{icons.MIN}</span>
          <span class="panel-button-hide">✖</span>
        </div>
      </div>
      <div class="panel-body hide"></div>
    </div>
  </linter-new-panel>

  el.refs = {}
  el.refs.content = el.querySelector('.panel-body')
  el.refs.counts = el.querySelector('.heading-status')
  el.refs.status = el.querySelector('linter-bottom-status')
  el.refs.hide = el.querySelector('.panel-button-hide')

  el.addEventListener('keydown', function(e) {
    if (e.which === 67 && e.ctrlKey) {
      Clipboard.writeText(getSelection().toString())
    }
  })
  el.refs.status.setCount = setCount

  return el
}
