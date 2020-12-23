import React, { useEffect, useState } from 'react'
import ReactTable from 'sb-react-table'
import { $range, severityNames, sortMessages, visitMessage, openExternally, getPathOfMessage } from '../helpers'
import type Delegate from './delegate'
import type { LinterMessage } from '../types'

type Props = {
  delegate: Delegate
}

export default function PanelComponent(props: Props) {
  const [state, setState] = useState({
    messages: props.delegate.filteredMessages,
  })

  function renderRowColumn(row: LinterMessage, column: string) {
    const range = $range(row)

    switch (column) {
      case 'file':
        return getPathOfMessage(row)
      case 'line':
        return range ? `${range.start.row + 1}:${range.start.column + 1}` : ''
      case 'excerpt':
        return row.excerpt
      case 'severity':
        return severityNames[row.severity]
      default:
        return row[column]
    }
  }

  // componentDidMount
  useEffect(() => {
    props.delegate.onDidChangeMessages(messages => {
      setState({ messages })
    })
  }, [])

  function onClick(e: React.MouseEvent, row: LinterMessage) {
    if (e.target.tagName === 'A') {
      return
    }
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

  const { delegate } = props
  const columns = [
    { key: 'severity', label: 'Severity', sortable: true },
    { key: 'linterName', label: 'Provider', sortable: true },
    { key: 'excerpt', label: 'Description', onClick: onClick },
    { key: 'line', label: 'Line', sortable: true, onClick: onClick },
  ]
  if (delegate.panelRepresents === 'Entire Project') {
    columns.push({
      key: 'file',
      label: 'File',
      sortable: true,
      onClick: onClick,
    })
  }

  const customStyle: React.CSSProperties = { overflowY: 'scroll', height: '100%' }

  return (
    <div id="linter-panel" tabIndex={-1} style={customStyle}>
      <ReactTable
        rows={state.messages}
        columns={columns}
        initialSort={[
          { column: 'severity', type: 'desc' },
          { column: 'file', type: 'asc' },
          { column: 'line', type: 'asc' },
        ]}
        sort={sortMessages}
        rowKey={i => i.key}
        renderHeaderColumn={i => i.label}
        renderBodyColumn={renderRowColumn}
        style={{ width: '100%' }}
        className="linter"
      />
    </div>
  )
}
