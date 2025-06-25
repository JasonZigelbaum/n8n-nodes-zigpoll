import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class ZigpollApi implements ICredentialType {
  name = 'zigpollApi';

  displayName = 'Zigpoll API';

  documentationUrl = 'https://www.zigpoll.com/blog/n8n-integration';

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
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      method: 'GET',
      url: 'https://v1.zigpoll.com/me',
      json: true
    },
  };
}