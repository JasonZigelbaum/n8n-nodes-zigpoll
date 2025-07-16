import {
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  INodePropertyOptions,
  ILoadOptionsFunctions,
  IHookFunctions,
  IWebhookResponseData,
  ICredentialTestFunctions,
  ICredentialsDecrypted,
  INodeCredentialTestResult,
  NodeConnectionType
} from 'n8n-workflow';

export class ZigpollTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Zigpoll Trigger',
    icon: { light: 'file:zigpoll.svg', dark: 'file:zigpoll.dark.svg' },
    name: 'zigpollTrigger',
    group: ['trigger'],
    version: 1,
    description: 'Triggers when a specific Zigpoll survey is completed',
    defaults: {
      name: 'Zigpoll',
    },
    inputs: [],
    outputs: [NodeConnectionType.Main],
    credentials: [
      {
        name: 'zigpollApi',
        required: true,
        testedBy: 'testZigpollTokenAuth',
      },
    ],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'zigpoll-survey',
      },
    ],
    properties: [
      {
        displayName: 'Survey Name or ID',
        name: 'surveyId',
        type: 'options',
        default: '',
        required: true,
        description: 'Select the survey to listen for. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
        typeOptions: {
          loadOptionsMethod: 'getSurveys',
        },
      },
    ]
  };

  methods = {
    loadOptions: {
      async getSurveys(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('zigpollApi');
        const response = this.helpers.httpRequestWithAuthentication.call(this, 'zigpollApi', {
          method: 'GET',
          url: 'https://v1.zigpoll.com/polls',
          json: true
        });

        return response.map((poll: any) => ({
          name: poll.title || poll._id,
          value: poll._id,
        }));
      },
    },
    credentialTest: {
      async testZigpollTokenAuth(
        this: ICredentialTestFunctions,
        credential: ICredentialsDecrypted,
      ): Promise<INodeCredentialTestResult> {
        const credentials = credential.data;
        const options = {
          uri: 'https://v1.zigpoll.com/me',
          json: true,
        };
        try {
          const response = await this.helpers.httpRequestWithAuthentication.call(this, 'zigpollApi', options);
          if (!response._id) {
            return {
              status: 'Error',
              message: 'Token is not valid.',
            };
          }
        } catch (err) {
          return {
            status: 'Error',
            message: `Token is not valid; ${err.message}`,
          };
        }

        return {
          status: 'OK',
          message: 'Authentication successful!',
        };
      },
    },
  };

  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        // Optional: return true if webhook already exists
        return false;
      },
      async create(this: IHookFunctions): Promise<boolean> {
        const credentials = await this.getCredentials('zigpollApi');
        let targetUrl = this.getNodeWebhookUrl('default');
        const pollId = this.getNodeParameter('surveyId') as string;

        if (process.env.WEBHOOK_TUNNEL_URL) {
          targetUrl = targetUrl?.replace('http://localhost:5678', process.env.WEBHOOK_TUNNEL_URL);
        }

        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'zigpollApi', {
          method: 'POST',
          url: 'https://v1.zigpoll.com/n8n/hooks',
          body: {
            targetUrl,
            pollId
          },
          json: true,
        });

        const webhookId = response.data.externalHookId;
        this.getWorkflowStaticData('node').webhookId = webhookId;

        return true;
      },
      async delete(this: IHookFunctions): Promise<boolean> {
        const credentials = await this.getCredentials('zigpollApi');
        const staticData = this.getWorkflowStaticData('node');
        const pollId = this.getNodeParameter('surveyId') as string;

        const webhookId = staticData.webhookId;

        if (!webhookId) return true;

        const url = `https://v1.zigpoll.com/n8n/hooks`;

        await this.helpers.httpRequestWithAuthentication.call(this, 'zigpollApi', {
          method: 'DELETE',
          url,
          body: {
            pollId,
            targetUrl: webhookId
          },
          json: true
        });

        return true;
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const body = this.getBodyData();

    const expectedSurveyId = this.getNodeParameter('surveyId') as string;

    if (body.pollId !== expectedSurveyId) {
      return {
        workflowData: [],
      };
    }

    body.receivedAt = Date.now()

    return {
      workflowData: [[{ json: body }]],
    };
  }
}
