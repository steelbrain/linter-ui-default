'use babel'
/** @jsx vanilla.jsx */
import vanilla from 'vanilla-jsx'

export function createTooltip(parentNode, messages) {
  const el = <div class='tooltip top' style="opacity: 1">
    <div class='tooltip-inner'>This is a message</div>
  </div>
  parentNode.appendChild(el)
}
