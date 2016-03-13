'use babel'

/* @flow */
/** @jsx React.h */

import { CompositeDisposable } from 'atom'
import React from 'preact'
import Message from './message'
import { sortMessages } from '../helpers'
import type { Linter$Message } from '../types'

type Messages$State = { messages: Array<Linter$Message>, showProviderName: boolean }
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
      showProviderName: atom.config.get('linter-ui-default.showProviderName')
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
      maxHeight: '95px'
    }

    return (<linter-panel-messages style={messageStyle}>
      { sortMessages(this.state.messages).map(message =>
        <Message message={message} key={message.key} includeLink={true} includeProvider={this.state.showProviderName} />
      ) }
    </linter-panel-messages>)
  }
}
