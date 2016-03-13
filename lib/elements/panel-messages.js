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
  subscriptions: CompositeDisposable;
  state: Messages$State;

  constructor() {
    super()
    this.subscriptions = new CompositeDisposable()
  }
  getInitialState(): Messages$State {
    this.subscriptions.add(atom.config.observe('linter-ui-default.showProviderName', showProviderName => {
      this.setState({ showProviderName })
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
    return (<div>
      { sortMessages(this.state.messages).map(function(message) {
        return <Message message={message} key={message.key} includeLink={true} includeProvider={this.state.showProviderName} />
      }) }
    </div>)
  }
}
