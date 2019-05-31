/**
 * Binding keys used by this component.
 */
import {BindingKey} from '@loopback/context';
import {AuthenticationMetadata} from './decorators/authenticate.decorator';
import {MetadataAccessor} from '@loopback/metadata';
import {Request, Response} from 'express';

/**
 * interface definition of a function which accepts a request
 * and returns an authenticated user
 */
export interface AuthenticateFn {
  (request: Request, response: Response): Promise<any>;
}

export namespace AuthenticationBindings {
  /**
   * Key used to inject the authentication function into the sequence.
   *
   * ```ts
   * class MySequence implements SequenceHandler {
   *   constructor(
   *     @inject(AuthenticationBindings.AUTH_ACTION)
   *     protected authenticateRequest: AuthenticateFn,
   *     // ... other sequence action injections
   *   ) {}
   *
   *   async handle(context: RequestContext) {
   *     try {
   *       const {request, response} = context;
   *       const route = this.findRoute(request);
   *
   *      // Authenticate
   *       await this.authenticateRequest(request);
   *
   *       // Authentication successful, proceed to invoke controller
   *       const args = await this.parseParams(request, route);
   *       const result = await this.invoke(route, args);
   *       this.send(response, result);
   *     } catch (err) {
   *       this.reject(context, err);
   *     }
   *   }
   * }
   * ```
   */
  export const AUTH_ACTION = BindingKey.create<AuthenticateFn>(
    'authentication.actions.authenticate',
  );

  /**
   * Key used to inject authentication metadata, which is used to determine
   * whether a request requires authentication or not.
   *
   * ```ts
   * class MyPassportStrategyProvider implements Provider<Strategy | undefined> {
   *   constructor(
   *     @inject(AuthenticationBindings.METADATA)
   *     private metadata: AuthenticationMetadata,
   *   ) {}
   *   value(): ValueOrPromise<Strategy | undefined> {
   *     if (this.metadata) {
   *       const name = this.metadata.strategy;
   *       // logic to determine which authentication strategy to return
   *     }
   *   }
   * }
   * ```
   */
  export const METADATA = BindingKey.create<any>(
    'authentication.operationMetadata',
  );

  /**
   * Key used to set configuration for the authentication action
   * @type {BindingKey<any>}
   */
  export const AUTH_CONFIG = BindingKey.create<any>('authentication.config');
}

/**
 * The key used to store log-related via @loopback/metadata and reflection.
 */
export const AUTHENTICATION_METADATA_KEY = MetadataAccessor.create<
  AuthenticationMetadata,
  MethodDecorator
>('authentication.operationsMetadata');
