/* @flow */

import * as url from 'url'
import React from 'react'
import marked from 'marked'

import { visitMessage, openExternally, openFile, applySolution, getActiveTextEditor, sortSolutions } from '../helpers'
import type TooltipDelegate from './delegate'
import type { Message, LinterMessage } from '../types'
import FixButton from './fix-button'

function findHref(el: ?Element): ?string {
  while (el && !el.classList.contains('linter-line')) {
    if (el instanceof HTMLAnchorElement) {
      return el.href
    }
    el = el.parentElement
  }
  return null
}

type Props = {
  message: Message,
  delegate: TooltipDelegate,
}

type State = {
  description?: string,
  descriptionShow?: boolean,
}

class MessageElement extends React.Component<Props, State> {
  state: State = {
    description: '',
    descriptionShow: false,
  }

  componentDidMount() {
    this.props.delegate.onShouldUpdate(() => {
      this.setState({})
    })
    this.props.delegate.onShouldExpand(() => {
      if (!this.state.descriptionShow) {
        this.toggleDescription()
      }
    })
    this.props.delegate.onShouldCollapse(() => {
      if (this.state.descriptionShow) {
        this.toggleDescription()
      }
    })
  }

  // NOTE: Only handling messages v2 because v1 would be handled by message-legacy component
  onFixClick(): void {
    const message = this.props.message
    const textEditor = getActiveTextEditor()
    if (message.version === 2 && message.solutions && message.solutions.length) {
      applySolution(textEditor, message.version, sortSolutions(message.solutions)[0])
    }
  }

  openFile = (ev: Event) => {
    if (!(ev.target instanceof HTMLElement)) {
      return
    }
    const href = findHref(ev.target)
    if (!href) {
      return
    }
    // parse the link. e.g. atom://linter?file=<path>&row=<number>&column=<number>
    const { protocol, hostname, query } = url.parse(href, true)
    const file = query && query.file
    if (protocol !== 'atom:' || hostname !== 'linter' || !file) {
      return
    }
    const row = query && query.row ? parseInt(query.row, 10) : 0
    const column = query && query.column ? parseInt(query.column, 10) : 0
    openFile(file, { row, column })
  }

  canBeFixed(message: LinterMessage): boolean {
    if (message.version === 1 && message.fix) {
      return true
    } else if (message.version === 2 && message.solutions && message.solutions.length) {
      return true
    }
    return false
  }

  toggleDescription(result: ?string = null) {
    const newStatus = !this.state.descriptionShow
    const description = this.state.description || this.props.message.description

    if (!newStatus && !result) {
      this.setState({ descriptionShow: false })
      return
    }
    if (typeof description === 'string' || result) {
      const descriptionToUse = marked(result || description)
      this.setState({ descriptionShow: true, description: descriptionToUse })
    } else if (typeof description === 'function') {
      this.setState({ descriptionShow: true })
      if (this.descriptionLoading) {
        return
      }
      this.descriptionLoading = true
      new Promise(function(resolve) {
        resolve(description())
      })
        .then(response => {
          if (typeof response !== 'string') {
            throw new Error(`Expected result to be string, got: ${typeof response}`)
          }
          this.toggleDescription(response)
        })
        .catch(error => {
          console.log('[Linter] Error getting descriptions', error)
          this.descriptionLoading = false
          if (this.state.descriptionShow) {
            this.toggleDescription()
          }
        })
    } else {
      console.error('[Linter] Invalid description detected, expected string or function but got:', typeof description)
    }
  }

  props: Props
  descriptionLoading: boolean = false

  render() {
    const { message, delegate } = this.props

    return (
      <linter-message class={message.severity} onClick={this.openFile}>
        {message.description && (
          <a href="#" onClick={() => this.toggleDescription()}>
            <span className={`icon linter-icon icon-${this.state.descriptionShow ? 'chevron-down' : 'chevron-right'}`} />
          </a>
        )}
        <linter-excerpt>
          {this.canBeFixed(message) && <FixButton onClick={() => this.onFixClick()} />}
          {delegate.showProviderName ? `${message.linterName}: ` : ''}
          {message.excerpt}
        </linter-excerpt>{' '}
        {message.reference &&
          message.reference.file && (
            <a href="#" onClick={() => visitMessage(message, true)}>
              <span className="icon linter-icon icon-alignment-aligned-to" />
            </a>
          )}
        {message.url && (
          <a href="#" onClick={() => openExternally(message)}>
            <span className="icon linter-icon icon-link" />
          </a>
        )}
        {this.state.descriptionShow && (
          <div
            dangerouslySetInnerHTML={{
              __html: this.state.description || 'Loading...',
            }}
            className="linter-line"
          />
        )}
      </linter-message>
    )
  }
}

module.exports = MessageElement
