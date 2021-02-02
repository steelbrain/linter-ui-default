"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelComponent = void 0;
const solid_js_1 = require("solid-js");
const solid_simple_table_1 = require("solid-simple-table");
const helpers_1 = require("../helpers");
function PanelComponent(props) {
    const [getMessages, setMessages] = solid_js_1.createSignal(props.delegate.filteredMessages);
    solid_js_1.onMount(() => {
        props.delegate.onDidChangeMessages(messages => {
            setMessages(messages);
        });
    });
    const columns = [
        { id: 'severity', label: 'Severity' },
        { id: 'linterName', label: 'Provider' },
        { id: 'excerpt', label: 'Description', onClick: onClick, sortable: false },
        { id: 'line', label: 'Line', onClick: onClick },
    ];
    if (props.delegate.panelRepresents === 'Entire Project') {
        columns.push({
            id: 'file',
            label: 'File',
            onClick: onClick,
        });
    }
    return (<div id="linter-panel" tabIndex={-1} style={{ overflowY: 'scroll', height: '100%' }}>
      <solid_simple_table_1.SimpleTable rows={getMessages()} columns={columns} defaultSortDirection={['line', 'asc']} rowSorter={helpers_1.sortMessages} accessors={true} getRowID={(i) => i.key} bodyRenderer={renderRowColumn} style={{ width: '100%' }} className="linter dark"/>
    </div>);
}
exports.PanelComponent = PanelComponent;
function renderRowColumn(row, column) {
    const range = helpers_1.$range(row);
    switch (column) {
        case 'file':
            return helpers_1.getPathOfMessage(row);
        case 'line':
            return range ? `${range.start.row + 1}:${range.start.column + 1}` : '';
        case 'excerpt':
            return row.excerpt;
        case 'severity':
            return helpers_1.severityNames[row.severity];
        default:
            return row[column];
    }
}
function onClick(e, row) {
    if (e.target.tagName === 'A') {
        return;
    }
    if (process.platform === 'darwin' ? e.metaKey : e.ctrlKey) {
        if (e.shiftKey) {
            helpers_1.openExternally(row);
        }
        else {
            helpers_1.visitMessage(row, true);
        }
    }
    else {
        helpers_1.visitMessage(row);
    }
}
//# sourceMappingURL=component.jsx.map