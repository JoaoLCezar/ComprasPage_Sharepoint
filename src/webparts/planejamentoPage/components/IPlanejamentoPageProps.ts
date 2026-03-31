import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IPlanejamentoPageProps {
  description: string;
  linksJson: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext;
}
