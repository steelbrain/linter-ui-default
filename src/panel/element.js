/* @flow */

import React from 'react'
import ReactTable from 'sb-react-table'
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
    const columns = [
      { key: 'severity', label: 'Severity', sortable: true },
      { key: 'linterName', label: 'Provider', sortable: true },
      { key: 'excerpt', label: 'Description' },
      { key: 'file', label: 'File', sortable: true },
      { key: 'line', label: 'Line', sortbale: true },
    ]

    return (
      <ReactTable
        rows={this.state.messages}
        columns={columns}

        sort={(_, i) => i}
        rowKey={i => i.key}

        renderHeaderColumn={i => i.label}
        renderBodyColumn={PanelElement.renderRowColumn}

        style={{ width: '100%' }}
        className='linter'
      />
    )
  }
  static renderRowColumn(row: LinterMessage, column: string): string | Object {
    switch (column) {
      case 'file':
        if (row.version === 1) {
          return row.filePath ? atom.project.relativizePath(row.filePath) : ''
        }
        return atom.project.relativizePath(row.location.file)
      case 'line':
        if (row.version === 1) {
          return row.range ? row.range.start.row : ''
        }
        return row.location.position.start.row
      case 'excerpt':
        if (row.version === 1) {
          if (row.html) {
            return <span dangerouslySetInnerHTML={{ ___html: row.html }} />
          }
          return row.text || ''
        }
        return row.excerpt
      default:
        return row[column]
    }
  }
}
