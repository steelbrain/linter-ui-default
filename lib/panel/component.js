/* @flow */

import React from 'react'
import ReactTable from 'sb-react-table'
import ResizableBox from 'react-resizable-box'
import { $range, severityNames, sortMessages, visitMessage, openExternally, getPathOfMessage } from '../helpers'
import type Delegate from './delegate'
import type { LinterMessage } from '../types'

export default class PanelComponent extends React.Component {
  props: {
    delegate: Delegate,
  };
  state: {
    messages: Array<LinterMessage>,
    visibility: boolean,
    tempHeight: ?number,
  } = {
    messages: [],
    visibility: false,
    tempHeight: null,
  };
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
    this.setState({ messages: this.props.delegate.filteredMessages, visibility: this.props.delegate.visibility })
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
      { key: 'excerpt', label: 'Description' },
      { key: 'line', label: 'Line', sortable: true, onClick: this.onClick },
    ]
    if (delegate.panelRepresents === 'Entire Project') {
      columns.push({ key: 'file', label: 'File', sortable: true, onClick: this.onClick })
    }

    let height
    const customStyle: Object = { overflowY: 'scroll' }
    if (this.state.tempHeight) {
      height = this.state.tempHeight
    } else if (delegate.panelTakesMinimumHeight) {
      height = 'auto'
      customStyle.maxHeight = delegate.panelHeight
    } else {
      height = delegate.panelHeight
    }
    delegate.setPanelVisibility(this.state.visibility && (!delegate.panelTakesMinimumHeight || !!this.state.messages.length))

    return (
      <ResizableBox isResizable={{ top: true }} onResize={this.onResize} onResizeStop={this.onResizeStop} height={height} width="auto" customStyle={customStyle}>
        <div id="linter-panel" tabIndex="-1">
          <ReactTable
            rows={this.state.messages}
            columns={columns}

            initialSort={[{ column: 'severity', type: 'desc' }, { column: 'file', type: 'asc' }, { column: 'line', type: 'asc' }]}
            sort={sortMessages}
            rowKey={i => i.key}

            renderHeaderColumn={i => i.label}
            renderBodyColumn={PanelComponent.renderRowColumn}

            style={{ width: '100%' }}
            className='linter'
          />
        </div>
      </ResizableBox>
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
