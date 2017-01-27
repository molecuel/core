import {injectable} from '@molecuel/di';

/**
 * @description Exports a molecuel server class which is able to store server instances like http
 *
 * @export
 * @class MlclServer
 */
@injectable
export class MlclServer {
  public name: string;
  public server: any;
}
