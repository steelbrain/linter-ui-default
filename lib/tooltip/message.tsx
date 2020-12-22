import * as url from 'url'
import React, { useState, useEffect } from 'react'
import marked from 'marked'

import { visitMessage, openExternally, openFile, applySolution, getActiveTextEditor, sortSolutions } from '../helpers'
import type TooltipDelegate from './delegate'
import type { Message, LinterMessage } from '../types'
import FixButton from './fix-button'

function findHref(el: Element | null | undefined): string | null {
  while (el && !el.classList.contains('linter-line')) {
    if (el instanceof HTMLAnchorElement) {
      return el.href
    }
    el = el.parentElement
  }
  return null
}

type Props = {
  message: Message
  delegate: TooltipDelegate
}

export default function MessageElement(props: Props) {
  let descriptionLoading = false

  const [state, setState] = useState({
    description: '',
    descriptionShow: false,
  })

  function onFixClick(): void {
    const message = props.message
    const textEditor = getActiveTextEditor()
    if (textEditor !== null && message.version === 2 && message.solutions && message.solutions.length) {
      applySolution(textEditor, sortSolutions(message.solutions)[0])
    }
  }

  function thisOpenFile(ev: React.MouseEvent) {
    if (!(ev.target instanceof HTMLElement)) {
      return
    }
    const href = findHref(ev.target)
    if (!href) {
      return
    }
    // parse the link. e.g. atom://linter?file=<path>&row=<number>&column=<number>
    const { protocol, hostname, query } = url.parse(href, true)
    if (protocol !== 'atom:' || hostname !== 'linter') {
      return
    }
    // TODO: based on the types query is never null
    if (!query || !query.file) {
      return
    } else {
      const { file, row, column } = query
      // TODO: will these be an array?
      openFile(
        /* file */ Array.isArray(file) ? file[0] : file,
        /* position */ {
          row: row ? parseInt(Array.isArray(row) ? row[0] : row, 10) : 0,
          column: column ? parseInt(Array.isArray(column) ? column[0] : column, 10) : 0,
        },
      )
    }
  }

  function canBeFixed(message: LinterMessage): boolean {
    if (message.version === 2 && message.solutions && message.solutions.length) {
      return true
    }
    return false
  }

  function toggleDescription(result: string | null | undefined = null) {
    const newStatus = !state.descriptionShow
    const description = state.description || props.message.description

    if (!newStatus && !result) {
      setState({ ...state, descriptionShow: false })
      return
    }
    if (typeof description === 'string' || result) {
      const descriptionToUse = marked(result || (description as string))
      setState({ description: descriptionToUse, descriptionShow: true })
    } else if (typeof description === 'function') {
      setState({ ...state, descriptionShow: true })
      if (descriptionLoading) {
        return
      }
      descriptionLoading = true
      new Promise(function (resolve) {
        resolve(description())
      })
        .then(response => {
          if (typeof response !== 'string') {
            throw new Error(`Expected result to be string, got: ${typeof response}`)
          }
          toggleDescription(response)
        })
        .catch(error => {
          console.log('[Linter] Error getting descriptions', error)
          descriptionLoading = false
          if (state.descriptionShow) {
            toggleDescription()
          }
        })
    } else {
      console.error('[Linter] Invalid description detected, expected string or function but got:', typeof description)
    }
  }

  // componentDidMount
  useEffect(() => {
    props.delegate.onShouldUpdate(() => {
      setState({ description: '', descriptionShow: false })
    })
    props.delegate.onShouldExpand(() => {
      if (!state.descriptionShow) {
        toggleDescription()
      }
    })
    props.delegate.onShouldCollapse(() => {
      if (state.descriptionShow) {
        toggleDescription()
      }
    })
  }, [])

  const { message, delegate } = props

  return (
    <div className={`linter-message ${message.severity}`} onClick={thisOpenFile}>
      {message.description && (
        <a href="#" onClick={() => toggleDescription()}>
          <span className={`icon linter-icon icon-${state.descriptionShow ? 'chevron-down' : 'chevron-right'}`} />
        </a>
      )}
      <div className="linter-excerpt">
        {canBeFixed(message) && <FixButton onClick={() => onFixClick()} />}
        {delegate.showProviderName ? `${message.linterName}: ` : ''}
        {message.excerpt}
      </div>{' '}
      {message.reference && message.reference.file && (
        <a href="#" onClick={() => visitMessage(message, true)}>
          <span className="icon linter-icon icon-alignment-aligned-to" />
        </a>
      )}
      {message.url && (
        <a href="#" onClick={() => openExternally(message)}>
          <span className="icon linter-icon icon-link" />
        </a>
      )}
      {state.descriptionShow && (
        <div
          dangerouslySetInnerHTML={{
            __html: state.description || 'Loading...',
          }}
          className="linter-line"
        />
      )}
    </div>
  )
}
