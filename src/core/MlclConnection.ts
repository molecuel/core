import {injectable} from '@molecuel/di';

/**
 * @description Exports a molecuel connection class which stores different kind of connections
 * like database or mail ....
 * @export
 * @class MlclConnection
 */
@injectable
export class MlclConnection {
  public name: string;
  public connection: any;
}
