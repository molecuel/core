import {injectable} from "@molecuel/di";

/**
 * @description Data provider function for services like http
 *
 * @export
 * @class MlclDataFactory
 */
@injectable
export class MlclDataFactory {
  public priority: number;
  public factoryMethod: () => any;
  public targetName: string;
  public targetProperty: string;
  public name: string;
  public operation: string;
  public resultType: string;
}
