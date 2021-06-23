import { createSignal, onMount } from 'solid-js'
import { SimpleTable } from 'solid-simple-table'
import { $range, severityNames, sortMessages, visitMessage, openExternally, getPathOfMessage } from '../helpers'
import type Delegate from './delegate'
import type { LinterMessage } from '../types'

type Props = {
  delegate: Delegate
}

export function PanelComponent(props: Props) {
  const [getMessages, setMessages] = createSignal(props.delegate.filteredMessages, false)

  onMount(() => {
    props.delegate.onDidChangeMessages(messages => {
      setMessages(messages)
    })
  })

  const columns = [
    { id: 'severity', label: 'Severity' },
    { id: 'linterName', label: 'Provider' },
    { id: 'excerpt', label: 'Description', onClick, sortable: false },
    { id: 'line', label: 'Line', onClick },
  ]
  if (props.delegate.panelRepresents === 'Entire Project') {
    columns.push({
      id: 'file',
      label: 'File',
      onClick,
    })
  }

  return (
    <div id="linter-panel" tabIndex={-1} style={{ overflowY: 'scroll', height: '100%' }}>
      <SimpleTable
        rows={getMessages()}
        columns={columns}
        defaultSortDirection={['severity', 'asc']}
        rowSorter={sortMessages}
        accessors={true}
        getRowID={(i: LinterMessage) => i.key}
        bodyRenderer={bodyRenderer}
        style={{ width: '100%' }}
        className="linter dark"
      />
    </div>
  )
}

function bodyRenderer(row: LinterMessage, column: string): string | HTMLElement {
  const range = $range(row)

  switch (column) {
    case 'file':
      return getPathOfMessage(row)
    case 'line':
      return range ? `${range.start.row + 1}:${range.start.column + 1}` : ''
    case 'excerpt':
      return row.excerpt
    case 'severity':
      return (
        <div className={`solid-simple-table linter ${row.severity}`}>{severityNames[row.severity]}</div>
      ) as HTMLElement

    default:
      return row[column]
  }
}

async function onClick(e: MouseEvent, row: LinterMessage) {
  if ((e.target as HTMLElement).tagName === 'A') {
    return
  }
  if (process.platform === 'darwin' ? e.metaKey : e.ctrlKey) {
    if (e.shiftKey) {
      openExternally(row)
    } else {
      await visitMessage(row, true)
    }
  } else {
    await visitMessage(row)
  }
}
