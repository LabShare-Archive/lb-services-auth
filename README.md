# @labshare/lb-services-auth

[![LoopBack](https://github.com/strongloop/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png)](http://loopback.io/)

# Install

`npm i @labshare/lb-services-auth`

# Usage

Register the component and register the configuration for the action by injecting `AuthenticationBindings.AUTH_CONFIG`:
```
app = new Application();
app.component(LbServicesAuthComponent);
app.bind(AuthenticationBindings.AUTH_CONFIG).to({
  authUrl: 'https://a.labshare.org/_api',
  tenant: 'my-tenant'
});
```

Inject the authentication action into the application sequence:
```
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
  .build();

@api(apispec)
class MyController {
  constructor() {}

  @authenticate()
  async whoAmI(): Promise<string> {
    return 'authenticated data';
  }
}

app.controller(MyController);
```
