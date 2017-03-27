import {di, injectable} from "@molecuel/di";
import {Observable} from "@reactivex/rxjs";
import {ObserverFactoryElement} from "./ObserverFactoryElement" ;

/**
 * @export
 * @class MlclStream
 */
@injectable
export class MlclStream {
  // name of the current stream
  public name: string;
  // observer factory methods registered
  public observerFactories: ObserverFactoryElement[] = new Array();

  /**
   * @description Creates an instance of MlclStream.
   *
   * @param {string} name
   *
   * @memberOf MlclStream
   */
  constructor(name: string) {
    this.name = name;
  }

  /**
   * @description Renders the stream and add flatMaps to the input observable
   *
   * @param {Observable} inputObservable
   * @returns
   *
   * @memberOf MlclStream
   */
  public renderStream(inputObservable: Observable<any>) {
    let observables: ObserverFactoryElement[] = this.observerFactories.sort(
      (a: ObserverFactoryElement, b: ObserverFactoryElement) => {
        return a.priority - b.priority;
    });
    for (let observ of observables) {
      if (!observ.factoryMethod && observ.targetName && observ.targetProperty) {
        let obsInstance = di.getInstance(observ.targetName);
        observ.factoryMethod = obsInstance[observ.targetProperty];
      }
      inputObservable = inputObservable.flatMap(observ.factoryMethod);
    }
    return inputObservable;
  }

  /**
   * @description Add observable to the stream
   *
   * @param {string} stream
   * @param {Observable} observable
   * @param {int} [priority=50]
   *
   * @memberOf MlclStream
   */
  public addObserverFactory(observerFactory: (data: any) => Observable<any>, priority: number = 50) {
    let factoryElement = new ObserverFactoryElement(priority, observerFactory);
    this.observerFactories.push(factoryElement);
  }

  /**
   * @description Adds a ObserverFactory by name - e.g. needed for @init decorator
   *
   * @param {string} targetName
   * @param {string} propertyKey
   * @param {number} [priority=50]
   *
   * @memberOf MlclStream
   */
  public addObserverFactoryByName(targetName: string, propertyKey: string, priority: number = 50) {
    let factoryElement = new ObserverFactoryElement(priority);
    factoryElement.targetName = targetName;
    factoryElement.targetProperty = propertyKey;
    this.observerFactories.push(factoryElement);
  }
}
