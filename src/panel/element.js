/* @flow */

import React from 'react'
import type Delegate from './delegate'
import type { LinterMessage } from '../types'

export default class PanelElement extends React.Component {
  props: {
    delegate: Delegate,
  };
  state: {
    messages: Array<LinterMessage>,
  } = { messages: [] };
  componentDidMount() {
    this.props.delegate.observeMessages(messages => {
      this.setState({ messages })
    })
  }
  render() {
    return <span>Finding a React Table Component that fits our needs and is not bloatware is hard</span>
  }
}
