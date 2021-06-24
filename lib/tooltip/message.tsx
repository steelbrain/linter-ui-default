const { workspace } = atom
import { createSignal, onMount, createEffect, Show } from 'solid-js'
import * as url from 'url'
import { debounce, once, visitMessage, openExternally, openFile, applySolution, sortSolutions } from '../helpers'
let marked: typeof import('marked') | undefined

import type TooltipDelegate from './delegate'
import type { Message, LinterMessage } from '../types'
// TODO why do we need to debounce/once these buttons? They shouldn't be called multiple times

type Props = {
  key: string
  message: Message
  delegate: TooltipDelegate
}

export default function MessageElement(props: Props) {
  const [getDescription, setDescription] = createSignal('Loading ...')
  const [getShowDescription, setShowDescription] = createSignal(false)

  createEffect(async () => {
    if (getShowDescription()) {
      const description = props.message.description
      console.log(description)
      if (typeof description === 'string') {
        setDescription(await renderMarkdown(description))
      } else if (typeof description === 'function') {
        const response = await description()
        if (typeof response !== 'string') {
          throw new Error(`Expected result to be string, got: ${typeof response}`)
        }
        setDescription(response)
      } else {
        console.error('[Linter] Invalid description detected, expected string or function but got:', typeof description)
      }
    }
  })

  onMount(() => {
    props.delegate.onShouldUpdate(() => {
      setShowDescription(false)
      setDescription('Loading ...')
    })
    props.delegate.onShouldExpand(() => {
      setShowDescription(true)
    })
    props.delegate.onShouldCollapse(() => {
      setShowDescription(false)
    })
  })

  // These props are static (non-reactive)
  const { message, delegate } = props

  return (
    <div className="linter-message" onClick={thisOpenFile}>
      <div className={`linter-excerpt ${message.severity}`}>
        {/* fold button if has message description */}
        <Show when={message.description !== undefined}>
          <a onClick={() => setShowDescription(!getShowDescription())}>
            <span className={`icon linter-icon icon-${getShowDescription() ? 'chevron-down' : 'chevron-right'}`} />
          </a>
        </Show>
        {/* fix button */}
        <Show when={canBeFixed(message)}>
          <button className="btn fix-btn" onClick={once(() => onFixClick(message))}>
            Fix
          </button>
        </Show>
        <div className="linter-text">
          <div className="provider-name">
            {/* provider name */}
            <Show when={delegate.showProviderName === true}>{`${message.linterName}: `}</Show>
          </div>
          {
            // main message text
            message.excerpt
          }
        </div>
        <div className="linter-buttons-right">
          {/* message reference */}
          <Show when={message.reference?.file !== undefined}>
            <a onClick={debounce(() => visitMessage(message, true))}>
              <span className="icon linter-icon icon-alignment-aligned-to" />
            </a>
          </Show>
          {/* message url */}
          <Show when={message.url !== undefined}>
            <a onClick={debounce(() => openExternally(message))}>
              <span className="icon linter-icon icon-link" />
            </a>
          </Show>
        </div>
      </div>
      {/* message description */}
      <Show when={getShowDescription()}>
        <div className="linter-line" innerHTML={getDescription()}></div>
      </Show>
    </div>
  )
}

function onFixClick(message: Message): void {
  const messageSolutions = message.solutions
  const textEditor = workspace.getActiveTextEditor()
  if (textEditor !== undefined) {
    if (Array.isArray(messageSolutions) && messageSolutions.length > 0) {
      applySolution(textEditor, sortSolutions(messageSolutions)[0])
    }
  }
}

function canBeFixed(message: LinterMessage): boolean {
  const messageSolutions = message.solutions
  if (Array.isArray(messageSolutions) && messageSolutions.length > 0) {
    return true
  }
  return false
}

async function thisOpenFile(ev: MouseEvent) {
  if (!(ev.target instanceof HTMLElement)) {
    return
  }
  const href = findHref(ev.target)
  if (href === null) {
    return
  }
  // parse the link. e.g. atom://linter?file=<path>&row=<number>&column=<number>
  const { protocol, hostname, query } = url.parse(href, true)
  if (protocol !== 'atom:' || hostname !== 'linter') {
    return
  }
  // TODO: based on the types query is never null
  if (query?.file === undefined) {
    return
  } else {
    const { file, row, column } = query
    // TODO: will these be an array?
    await openFile(
      /* file */ Array.isArray(file) ? file[0] : file,
      /* position */ {
        row: row !== undefined ? parseInt(Array.isArray(row) ? row[0] : row, 10) : 0,
        column: column !== undefined ? parseInt(Array.isArray(column) ? column[0] : column, 10) : 0,
      },
    )
  }
}

function findHref(elementGiven: HTMLElement): string | null {
  let el: HTMLElement | null = elementGiven
  while (el !== null && !el.classList.contains('linter-line')) {
    if (el instanceof HTMLAnchorElement) {
      return el.href
    }
    el = el.parentElement
  }
  return null
}

async function renderMarkdown(description: string) {
  if (marked === undefined) {
    // eslint-disable-next-line require-atomic-updates
    marked = (await import('marked')).default
  }
  return marked(description)
}
