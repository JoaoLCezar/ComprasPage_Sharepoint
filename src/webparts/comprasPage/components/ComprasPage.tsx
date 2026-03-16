import * as React from 'react';
import type { IComprasPageProps } from './IComprasPageProps';
import IntranetApp from './IntranetApp';

export default class ComprasPage extends React.Component<IComprasPageProps> {
  public render(): React.ReactElement<IComprasPageProps> {
    const {
      userDisplayName,
      context
    } = this.props;

    return (
      <IntranetApp 
        userDisplayName={userDisplayName} 
        context={context}
      />
    );
  }
}
