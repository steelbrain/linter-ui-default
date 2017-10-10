/* @flow */

import React from 'react'

class FixButton extends React.Component {
  props: {
      cb: () => void,
  };
  handleClick(): void {
    this.props.cb()
  }
  render() {
    return <button className="fix-btn" onClick={() => this.handleClick()}>Fix</button>
  }
}

module.exports = FixButton
