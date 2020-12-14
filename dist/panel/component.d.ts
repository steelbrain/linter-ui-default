import React from 'react';
import type Delegate from './delegate';
import type { LinterMessage } from '../types';
declare type Props = {
    delegate: Delegate;
};
declare type State = {
    messages: Array<LinterMessage>;
};
export default class PanelComponent extends React.Component<Props, State> {
    static renderRowColumn(row: LinterMessage, column: string): any;
    constructor(props: Props, context: Object | null | undefined);
    state: State;
    componentDidMount(): void;
    onClick: (e: React.MouseEvent, row: LinterMessage) => void;
    render(): JSX.Element;
}
export {};
