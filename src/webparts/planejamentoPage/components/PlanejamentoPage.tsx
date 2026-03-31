import * as React from 'react';
import type { IPlanejamentoPageProps } from './IPlanejamentoPageProps';
import IntranetApp from './IntranetApp';

export default class PlanejamentoPage extends React.Component<IPlanejamentoPageProps> {
  public render(): React.ReactElement<IPlanejamentoPageProps> {
    const {
      userDisplayName,
      context,
      linksJson
    } = this.props;

    return (
      <IntranetApp 
        userDisplayName={userDisplayName} 
        context={context}
        linksJson={linksJson}
      />
    );
  }
}
