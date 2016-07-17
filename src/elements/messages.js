/* @flow */
/** @jsx React.h */

import { CompositeDisposable } from 'sb-event-kit'
import React from 'preact'
import MessageElement from './message' // eslint-disable-line no-unused-vars
import MessageElementLegacy from './message-legacy' // eslint-disable-line no-unused-vars
import { sortMessages, copySelection } from '../helpers'
import type { LinterMessage } from '../types'

type Messages$State = { messages: Array<LinterMessage>, showProviderName: boolean }
export default class Messages extends React.Component {
  state: Messages$State;
  subscriptions: CompositeDisposable;

  getInitialState(): Messages$State {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.config.onDidChange('linter-ui-default.showProviderName', ({ newValue }) => {
      this.setState({ showProviderName: newValue })
    }))

    return {
      messages: [],
      showProviderName: atom.config.get('linter-ui-default.showProviderName'),
    }
  }
  componentDidMount() {
    const { panel } = this.props
    this.subscriptions.add(panel.observeMessages(messages => {
      this.setState({ messages })
    }))
  }
  componentWillUnmount() {
    this.subscriptions.dispose()
  }

  render() {
    const messageStyle = {
      maxHeight: '95px',
    }

    return (<linter-messages style={messageStyle} tabindex="-1" onKeyDown={Messages.onKeyDown}>
      { sortMessages(this.state.messages).map(message => {
        if (message.version === 1) {
          return <MessageElementLegacy message={message} showProviderName={this.state.showProviderName} key={message.key} />
        }
        return <MessageElement message={message} showProviderName={this.state.showProviderName} key={message.key} />
      }) }
    </linter-messages>)
  }
  static onKeyDown(e: KeyboardEvent) {
    if (process.platform === 'darwin') {
      if (e.metaKey && e.which === 67) {
        copySelection()
      }
    } else {
      if (e.ctrlKey && e.which === 67) {
        copySelection()
      }
    }
  }
}
