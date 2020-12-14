import React from 'react';
import type TooltipDelegate from './delegate';
import type { Message, LinterMessage } from '../types';
declare type Props = {
    message: Message;
    delegate: TooltipDelegate;
};
declare type State = {
    description?: string;
    descriptionShow?: boolean;
};
export default class MessageElement extends React.Component<Props, State> {
    state: State;
    componentDidMount(): void;
    onFixClick(): void;
    openFile(ev: Event): void;
    canBeFixed(message: LinterMessage): boolean;
    toggleDescription(result?: string | null | undefined): void;
    descriptionLoading: boolean;
    render(): JSX.Element;
}
export {};
