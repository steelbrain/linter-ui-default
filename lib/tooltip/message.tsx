import { createState, createSignal, onMount, Show } from 'solid-js'
import once from 'lodash/once'
import debounce from 'lodash/debounce'
let marked: typeof import('marked') | undefined

import { visitMessage, openExternally, applySolution, getActiveTextEditor, sortSolutions } from '../helpers'
import type TooltipDelegate from './delegate'
import type { Message, LinterMessage } from '../types'
// TODO why do we need to debounce/once these buttons? They shouldn't be called multiple times

type Props = {
  key: string
  message: Message
  delegate: TooltipDelegate
}

export default function MessageElement(props: Props) {
  const [state, setState] = createState({
    description: '',
    descriptionShow: false,
  })

  const [descriptionLoading, setDescriptionLoading] = createSignal(false, false)

  async function toggleDescription(result?: string) {
    const newStatus = !state.descriptionShow
    const description = state.description || props.message.description

    if (!newStatus && result === undefined) {
      setState({ ...state, descriptionShow: false })
      return
    }
    if (result !== undefined || typeof description === 'string') {
      const descriptionToUse = await renderStringDescription(result ?? (description as string))
      setState({ description: descriptionToUse, descriptionShow: true })
    } else if (typeof description === 'function') {
      // TODO simplify
      setState({ ...state, descriptionShow: true })
      if (descriptionLoading()) {
        return
      }
      setDescriptionLoading(true)
      const response = await description()
      if (typeof response !== 'string') {
        throw new Error(`Expected result to be string, got: ${typeof response}`)
      }
      try {
        await toggleDescription(response)
      } catch (error) {
        console.log('[Linter] Error getting descriptions', error)
        setDescriptionLoading(false)
        if (state.descriptionShow) {
          await toggleDescription()
        }
      }
    } else {
      console.error('[Linter] Invalid description detected, expected string or function but got:', typeof description)
    }
  }

  onMount(() => {
    props.delegate.onShouldUpdate(() => {
      setState({ description: '', descriptionShow: false })
    })
    props.delegate.onShouldExpand(async () => {
      if (!state.descriptionShow) {
        await toggleDescription()
      }
    })
    props.delegate.onShouldCollapse(async () => {
      if (state.descriptionShow) {
        await toggleDescription()
      }
    })
  })

  // These props are static (non-reactive)
  const { message, delegate } = props

  return (
    <div className="linter-message">
      <div className={`linter-excerpt ${message.severity}`}>
        {/* fold button if has message description */}
        <Show when={message.description !== undefined}>
          <a onClick={() => toggleDescription()}>
            <span className={`icon linter-icon icon-${state.descriptionShow ? 'chevron-down' : 'chevron-right'}`} />
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
      <Show when={state.descriptionShow}>
        <div className="linter-line" innerHTML={state.description || 'Loading...'}></div>
      </Show>
    </div>
  )
}

function onFixClick(message: Message): void {
  const messageSolutions = message.solutions
  const textEditor = getActiveTextEditor()
  if (textEditor !== null && message.version === 2) {
    if (Array.isArray(messageSolutions) && messageSolutions.length > 0) {
      applySolution(textEditor, sortSolutions(messageSolutions)[0])
    }
  }
}

function canBeFixed(message: LinterMessage): boolean {
  const messageSolutions = message.solutions
  if (message.version === 2 && Array.isArray(messageSolutions) && messageSolutions.length > 0) {
    return true
  }
  return false
}

async function renderStringDescription(description: string) {
  if (marked === undefined) {
    // eslint-disable-next-line require-atomic-updates
    marked = (await import('marked')).default
  }
  return marked(description)
}
