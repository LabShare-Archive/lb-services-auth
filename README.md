# @labshare/lb-services-auth

[![Build Status](https://travis-ci.com/LabShare/lb-services-auth.svg?branch=master)](https://travis-ci.com/LabShare/lb-services-auth)

# Install

`npm i @labshare/lb-services-auth`

# Usage

Register the component and register the configuration for the action by injecting `AuthenticationBindings.AUTH_CONFIG`:
```
import { LbServicesAuthComponent } from '@labshare/lb-services-auth';

app = new Application();
app.component(LbServicesAuthComponent);
app.bind(AuthenticationBindings.AUTH_CONFIG).to({
  authUrl: 'https://a.labshare.org/_api',
  tenant: 'my-tenant'
});
```

Inject the authentication action into the application sequence:
```
import {
  AuthenticationBindings,
  AuthenticateFn
} from "@labshare/lb-services-auth";

class MySequence implements SequenceHandler {
  constructor(
    @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
    @inject(SequenceActions.PARSE_PARAMS)
    protected parseParams: ParseParams,
    @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
    @inject(SequenceActions.SEND) protected send: Send,
    @inject(SequenceActions.REJECT) protected reject: Reject,

    // Inject the new authentication action
    @inject(AuthenticationBindings.AUTH_ACTION)
    protected authenticateRequest: AuthenticateFn,
  ) {}

  async handle(context: RequestContext) {
    try {
      const {request, response} = context;
      const route = this.findRoute(request);

      // Authenticate the request
      await this.authenticateRequest(request as any, response as any);

      const args = await this.parseParams(request, route);
      const result = await this.invoke(route, args);
      this.send(response, result);
    } catch (error) {
      this.reject(context, error);
      return;
    }
}
```

Use the `@authenticate` decorator for REST methods requiring authentication:
```
import { authenticate } from "@labshare/lb-services-auth";

const apispec = anOpenApiSpec()
  .withOperation('get', '/whoAmI', {
    'x-operation-name': 'whoAmI',
    responses: {
      '200': {
        description: '',
        schema: {
          type: 'string',
        },
      },
    },
  })
  .withOperation('get', '/users', {
      'x-operation-name': 'users',
      responses: {
        '200': {
          description: '',
          schema: {
            type: 'string',
          },
        },
      },
    })
  .build();

@api(apispec)
class MyController {
  constructor() {}

  @authenticate()
  async whoAmI(): Promise<string> {
    return 'authenticated data';
  }

  // This route has an additional Resource Scope requirement. The user's bearer token will need to contain
  // 'read:users' in the `scope` claim. Otherwise, they will receive a 403 in the response.
  @authenticate({
    scope: ['read:users']
  })
    async users(): Promise<string> {
      return 'users';
    }
}

app.controller(MyController);
```
