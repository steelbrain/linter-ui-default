/* @flow */

import React from 'react'
import ReactTable from 'sb-react-table'
import { $range, severityNames, sortMessages, visitMessage, openExternally, getPathOfMessage } from '../helpers'
import type Delegate from './delegate'
import type { LinterMessage } from '../types'

class PanelComponent extends React.Component {
  props: {
    delegate: Delegate,
  };
  state: {
    messages: Array<LinterMessage>,
    visibility: boolean,
    tempHeight: ?number,
  };
  constructor(props: Object, context: ?Object) {
    super(props, context)
    this.state = {
      messages: this.props.delegate.filteredMessages,
      visibility: this.props.delegate.visibility,
      tempHeight: null,
    }
  }
  componentDidMount() {
    this.props.delegate.onDidChangeMessages((messages) => {
      this.setState({ messages })
    })
    this.props.delegate.onDidChangeVisibility((visibility) => {
      this.setState({ visibility })
    })
    this.props.delegate.onDidChangePanelConfig(() => {
      this.setState({ tempHeight: null })
    })
  }
  onClick = (e: MouseEvent, row: LinterMessage) => {
    if (process.platform === 'darwin' ? e.metaKey : e.ctrlKey) {
      if (e.shiftKey) {
        openExternally(row)
      } else {
        visitMessage(row, true)
      }
    } else {
      visitMessage(row)
    }
  }
  onResize = (direction: 'top', size: { width: number, height: number }) => {
    this.setState({ tempHeight: size.height })
  }
  onResizeStop = (direction: 'top', size: { width: number, height: number }) => {
    this.props.delegate.updatePanelHeight(size.height)
  }
  render() {
    const { delegate } = this.props
    const columns = [
      { key: 'severity', label: 'Severity', sortable: true },
      { key: 'linterName', label: 'Provider', sortable: true },
      { key: 'excerpt', label: 'Description', onClick: this.onClick },
      { key: 'line', label: 'Line', sortable: true, onClick: this.onClick },
    ]
    if (delegate.panelRepresents === 'Entire Project') {
      columns.push({ key: 'file', label: 'File', sortable: true, onClick: this.onClick })
    }

    const customStyle: Object = { overflowY: 'scroll', height: '100%' }
    // TODO: Panel hides when no messages config?

    return (
      <div id="linter-panel" tabIndex="-1" style={customStyle}>
        <ReactTable
          rows={this.state.messages}
          columns={columns}

          initialSort={[{ column: 'severity', type: 'desc' }, { column: 'file', type: 'asc' }, { column: 'line', type: 'asc' }]}
          sort={sortMessages}
          rowKey={i => i.key}

          renderHeaderColumn={i => i.label}
          renderBodyColumn={PanelComponent.renderRowColumn}

          style={{ width: '100%' }}
          className="linter"
        />
      </div>
    )
  }
  static renderRowColumn(row: LinterMessage, column: string): string | Object {
    const range = $range(row)

    switch (column) {
      case 'file':
        return getPathOfMessage(row)
      case 'line':
        return range ? `${range.start.row + 1}:${range.start.column + 1}` : ''
      case 'excerpt':
        if (row.version === 1) {
          if (row.html) {
            return <span dangerouslySetInnerHTML={{ __html: row.html }} />
          }
          return row.text || ''
        }
        return row.excerpt
      case 'severity':
        return severityNames[row.severity]
      default:
        return row[column]
    }
  }
}

module.exports = PanelComponent
