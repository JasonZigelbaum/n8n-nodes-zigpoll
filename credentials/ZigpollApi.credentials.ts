import {
  IAuthenticateGeneric,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class ZigpollApi implements ICredentialType {
  name = 'ZigpollApi';
  displayName = 'Zigpoll API';
  documentationUrl = 'https://docs.n8n.io/integrations/creating-nodes/build/declarative-style-node/';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      default: '',
    },
  ];
  authenticate = {
    type: 'generic',
    properties: {
      headers: {
        'Authentication': '{{$credentials.apiKey}}'
      }
    },
  } as IAuthenticateGeneric;
}