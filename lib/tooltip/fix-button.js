/* @flow */

import React from 'react'

class FixButton extends React.Component {
  handleClick() {
    this.props.cb()
  }
  render() {
    return <button className="fix-btn" onClick={() => this.handleClick()}>Fix</button>
  }
}

module.exports = FixButton
