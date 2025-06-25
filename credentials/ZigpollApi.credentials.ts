import {
  IAuthenticateGeneric,
  ICredentialType,
  ICredentialTestRequest,
  INodeProperties,
} from 'n8n-workflow';

export class ZigpollApi implements ICredentialType {
  name = 'zigpollApi';
  displayName = 'Zigpoll API';
  documentationUrl = 'https://docs.n8n.io/integrations/creating-nodes/build/declarative-style-node/';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
						typeOptions: { password: true },
      default: '',
    },
  ];
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'Authentication': '{{$credentials.apiKey}}'
      }
    },
  };
  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://v1.zigpoll.com',
      url: '/me'
    },
  };
}