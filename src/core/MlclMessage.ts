import {injectable} from '@molecuel/di';

/**
 * Message class for system internal messaging
 * 
 * @export
 * @class MlclMessage
 */
@injectable
export class MlclMessage {
  public topic: string;
  public message: any;
  public source: string;
}