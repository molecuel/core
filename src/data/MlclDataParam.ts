import {injectable} from "@molecuel/di";
/**
 * Parameter class for input output functions
 *
 * @export
 * @class DataParam
 */
@injectable
export class MlclDataParam {
  public inputParam: string;
  public targetParam: string;
  public type: string;
  public size: number;
  constructor(inputParam: string, targetParam: string, type: string, size?: number) {
    this.inputParam = inputParam;
    this.targetParam = targetParam;
    this.type = type;
    if (size) {
      this.size = size;
    }
  }
}
