/* @flow */

import React from 'react'
import ReactTable from 'sb-react-table'
import { $range, severityNames, sortMessages, visitMessage, getFileOfMessage } from '../helpers'
import type Delegate from './delegate'
import type { LinterMessage } from '../types'

export default class PanelElement extends React.Component {
  props: {
    delegate: Delegate,
  };
  state: {
    messages: Array<LinterMessage>,
    visibility: boolean,
  } = { messages: [], visibility: false };
  componentDidMount() {
    this.props.delegate.onDidChangeMessages((messages) => {
      this.setState({ messages })
    })
    this.props.delegate.onDidChangeVisibility((visibility) => {
      this.setState({ visibility })
    })
    this.setState({ messages: this.props.delegate.filteredMessages, visibility: this.props.delegate.visibility })
  }
  render() {
    const columns = [
      { key: 'severity', label: 'Severity', sortable: true },
      { key: 'linterName', label: 'Provider', sortable: true },
      { key: 'excerpt', label: 'Description' },
      { key: 'line', label: 'Line', sortable: true, onClick: (e, row) => visitMessage(row) },
      { key: 'file', label: 'File', sortable: true, onClick: (e, row) => visitMessage(row) },
    ]
    const showPanel = this.state.visibility && this.state.messages.length

    return (
      <div id="linter-panel" style={{ display: showPanel ? 'block' : 'none', maxHeight: 150 }}>
        <ReactTable
          rows={this.state.messages}
          columns={columns}

          initialSort={[{ column: 'severity', type: 'desc' }, { column: 'file', type: 'asc' }, { column: 'line', type: 'asc' }]}
          sort={sortMessages}
          rowKey={i => i.key}

          renderHeaderColumn={i => i.label}
          renderBodyColumn={PanelElement.renderRowColumn}

          style={{ width: '100%' }}
          className='linter'
        />
      </div>
    )
  }
  static renderRowColumn(row: LinterMessage, column: string): string | Object {
    const range = $range(row)

    switch (column) {
      case 'file':
        return getFileOfMessage(row)
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
