'use babel'

/* @flow */
/** @jsx React.h */

import { CompositeDisposable } from 'atom'
import React from 'preact'
import MessageElement from './message'
import { sortMessages, copySelection } from '../helpers'
import type { Message } from '../types'

type Messages$State = { messages: Array<Message>, showProviderName: boolean }
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
      { sortMessages(this.state.messages).map(message =>
        <MessageElement reference="internal" message={message} key={message.key} />
      ) }
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
