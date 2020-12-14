"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const sb_react_table_1 = __importDefault(require("sb-react-table"));
const helpers_1 = require("../helpers");
class PanelComponent extends react_1.default.Component {
    constructor(props, context) {
        super(props, context);
        this.onClick = (e, row) => {
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
        };
        this.state = {
            messages: this.props.delegate.filteredMessages,
        };
    }
    static renderRowColumn(row, column) {
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
    componentDidMount() {
        this.props.delegate.onDidChangeMessages(messages => {
            this.setState({ messages });
        });
    }
    render() {
        const { delegate } = this.props;
        const columns = [
            { key: 'severity', label: 'Severity', sortable: true },
            { key: 'linterName', label: 'Provider', sortable: true },
            { key: 'excerpt', label: 'Description', onClick: this.onClick },
            { key: 'line', label: 'Line', sortable: true, onClick: this.onClick },
        ];
        if (delegate.panelRepresents === 'Entire Project') {
            columns.push({
                key: 'file',
                label: 'File',
                sortable: true,
                onClick: this.onClick,
            });
        }
        const customStyle = { overflowY: 'scroll', height: '100%' };
        return (react_1.default.createElement("div", { id: "linter-panel", tabIndex: -1, style: customStyle },
            react_1.default.createElement(sb_react_table_1.default, { rows: this.state.messages, columns: columns, initialSort: [
                    { column: 'severity', type: 'desc' },
                    { column: 'file', type: 'asc' },
                    { column: 'line', type: 'asc' },
                ], sort: helpers_1.sortMessages, rowKey: i => i.key, renderHeaderColumn: i => i.label, renderBodyColumn: PanelComponent.renderRowColumn, style: { width: '100%' }, className: "linter" })));
    }
}
exports.default = PanelComponent;
//# sourceMappingURL=component.js.map