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
      { key: 'line', label: 'Line', sortable: true },
    ]

    return (
      <ReactTable
        rows={this.state.messages}
        columns={columns}

        initialSort={[{ column: 'severity', type: 'desc' }, { column: 'file', type: 'asc' }]}
        sort={PanelElement.sortRows}
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
          return row.filePath ? atom.project.relativizePath(row.filePath)[1] : ''
        }
        return atom.project.relativizePath(row.location.file)[1]
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
  static sortRows(sortInfo: Array<{ column: string, type: 'asc' | 'desc' }>, rows: Array<LinterMessage>): Array<LinterMessage> {
    const sortColumns = {
      severity: null,
      linterName: null,
      file: null,
      line: null,
    }

    const severityScore = {
      error: 3,
      warning: 2,
      info: 1,
    }

    for (let i = 0, length = sortInfo.length; i < length; i++) {
      const entry = sortInfo[i]
      sortColumns[entry.column] = entry.type
    }

    return rows.slice().sort(function(a, b) {
      if (sortColumns.severity) {
        const multiplyWith = sortColumns.severity === 'asc' ? 1 : -1
        const severityA = severityScore[a.severity]
        const severityB = severityScore[b.severity]
        if (severityA !== severityB) {
          return multiplyWith * (severityA > severityB ? 1 : -1)
        }
      }
      if (sortColumns.linterName) {
        const multiplyWith = sortColumns.linterName === 'asc' ? 1 : -1
        const sortValue = a.severity.localeCompare(b.severity)
        if (sortValue !== 0) {
          return multiplyWith * sortValue
        }
      }
      if (sortColumns.file) {
        const multiplyWith = sortColumns.file === 'asc' ? 1 : -1
        const fileA = atom.project.relativizePath(a.version === 1 ? (a.filePath || '') : a.location.file)[1].length
        const fileB = atom.project.relativizePath(b.version === 1 ? (b.filePath || '') : b.location.file)[1].length
        if (fileA !== fileB) {
          return multiplyWith * (fileA > fileB ? 1 : -1)
        }
      }
      if (sortColumns.line) {
        const multiplyWith = sortColumns.line === 'asc' ? 1 : -1
        let lineA
        if (a.version === 1) {
          lineA = a.range ? a.range.start.row : 0
        } else {
          lineA = a.location.position.start.row
        }
        let lineB
        if (b.version === 1) {
          lineB = b.range ? b.range.start.row : 0
        } else {
          lineB = b.location.position.start.row
        }
        if (lineA !== lineB) {
          return multiplyWith * (lineA > lineB ? 1 : -1)
        }
      }

      return 0
    })
  }
}
