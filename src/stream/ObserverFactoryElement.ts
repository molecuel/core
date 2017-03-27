import {injectable} from "@molecuel/di";
import {Observable} from "@reactivex/rxjs";
/**
 * @description A ObserverFactory element which is used for queuing observers for a specific queue / observable
 * @export
 * @class ObserverFactoryElement
 */
@injectable
export class ObserverFactoryElement {
  public priority: number;
  public factoryMethod: (data: any) => Observable<any>;
  public targetName: string;
  public targetProperty: string;
  /**
   * @description Creates an instance of ObserverFactoryElement.
   *
   * @param {number} [priority=50]
   * @param null [factoryMethod]
   *
   * @memberOf ObserverFactoryElement
   */
  public constructor(priority: number = 50, factoryMethod?: (data: any) => Observable<any>) {
    this.priority = priority;
    if (factoryMethod) {
      this.factoryMethod = factoryMethod;
    }
  }
}
