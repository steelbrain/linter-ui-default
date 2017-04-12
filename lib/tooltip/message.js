/* @flow */

import React from 'react'
import marked from 'marked'

import { visitMessage, openExternally } from '../helpers'
import type TooltipDelegate from './delegate'
import type { Message } from '../types'

class MessageElement extends React.Component {
  props: {
    message: Message,
    delegate: TooltipDelegate,
  };
  state: {
    description: string,
    descriptionShow: boolean,
  } = {
    description: '',
    descriptionShow: false,
  };
  descriptionLoading: boolean = false;

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
      new Promise(function(resolve) { resolve(description()) })
        .then((response) => {
          if (typeof response !== 'string') {
            throw new Error(`Expected result to be string, got: ${typeof response}`)
          }
          this.toggleDescription(response)
        })
        .catch((error) => {
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
  render() {
    const { message, delegate } = this.props

    return (<linter-message class={message.severity}>
      { message.description && (
        <a href="#" onClick={() => this.toggleDescription()}>
          <span className={`icon linter-icon icon-${this.state.descriptionShow ? 'chevron-down' : 'chevron-right'}`} />
        </a>
      )}
      <linter-excerpt>
        { delegate.showProviderName ? `${message.linterName}: ` : '' }
        { message.excerpt }
      </linter-excerpt>{' '}
      { message.reference && message.reference.file && (
        <a href="#" onClick={() => visitMessage(message, true)}>
          <span className="icon linter-icon icon-alignment-aligned-to" />
        </a>
      )}
      { message.url && <a href="#" onClick={() => openExternally(message)}>
        <span className="icon linter-icon icon-link" />
      </a>}
      { this.state.descriptionShow && (
        <div dangerouslySetInnerHTML={{ __html: this.state.description || 'Loading...' }} className="linter-line" />
      ) }
    </linter-message>)
  }
}

module.exports = MessageElement
