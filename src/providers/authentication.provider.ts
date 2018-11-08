import {Getter, Provider, inject, Constructor} from '@loopback/context';
import {Request, Response} from '@loopback/rest';
import {AuthenticateFn, AuthenticationBindings} from '../keys';
import * as jwksClient from 'jwks-rsa';
import * as jwt from 'express-jwt';
import parseToken from 'parse-bearer-token';
import {CoreBindings} from '@loopback/core';
import {getAuthenticateMetadata} from '../decorators/authenticate.decorator';

const defaultJwksClientOptions = {
  cache: true,
  rateLimit: true, // See: https://github.com/auth0/node-jwks-rsa#rate-limiting
  jwksRequestsPerMinute: 10,
};

/**
 * @description Provider of a function which authenticates
 * @example `context.bind('authentication_key')
 *   .toProvider(AuthenticateActionProvider)`
 */
export class AuthenticateActionProvider implements Provider<AuthenticateFn> {
  constructor(
    @inject.getter(AuthenticationBindings.AUTH_CONFIG)
    readonly getConfig: Getter<{
      [key: string]: any;
    }>,
    @inject.getter(CoreBindings.CONTROLLER_CLASS)
    private readonly getController: Getter<Constructor<{}>>,
    @inject.getter(CoreBindings.CONTROLLER_METHOD_NAME)
    private readonly getMethod: Getter<string>,
  ) {}

  /**
   * @returns authenticateFn
   */
  value(): AuthenticateFn {
    return (request: any, response: any) => this.action(request, response);
  }

  /**
   * The implementation of authenticate() sequence action.
   * @param request The incoming request provided by the REST layer
   * @param response The response provided by the REST layer
   */
  async action(request: Request, response: Response): Promise<any> {
    // If REST method is not decorated, we skip the authentication check
    const controller = await this.getController();
    const method = await this.getMethod();
    const metadata = getAuthenticateMetadata(controller, method);

    if (!metadata) {
      return;
    }

    const {
      authUrl,
      secretProvider,
      tenant,
      audience,
      issuer,
    } = await this.getConfig();

    if (!authUrl && !secretProvider) {
      throw new Error('`authUrl` is required');
    }

    if (!tenant && !secretProvider) {
      throw new Error('`tenant` is required');
    }

    const jwksClientOptions = {
      ...defaultJwksClientOptions,
      jwksUri: `${authUrl}/auth/${tenant}/.well-known/jwks.json`,
    };
    const secret =
      secretProvider || jwksClient.expressJwtSecret(jwksClientOptions);

    // TODO: validate scope based on decorator option

    // Validate JWT in Authorization Bearer header using RS256
    await new Promise((resolve, reject) => {
      jwt({
        getToken: parseToken,
        secret,
        audience, // Optionally validate the audience and the issuer
        issuer,
      })(request, response, (error: any) => {
        if (error) {
          reject(error);
        }

        resolve();
      });
    });
  }
}
