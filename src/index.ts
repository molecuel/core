'use strict';
import 'reflect-metadata';
import {Observable, Subject} from '@reactivex/rxjs';
import {di, singleton, injectable} from '@molecuel/di';

@singleton
export class MlclCore {
  protected streams: Map<string, MlclStream> = new Map();
  protected subjects: Map<string, Subject<any>> = new Map();

  /**
   * @description Creates a new subject which enables EventEmitter like functionality
   * 
   * @param {string} topic
   * @returns {Subject<any>}
   * 
   * @memberOf MlclCore
   */
  public createSubject(topic: string): Subject<any> {
    if(this.subjects.get(topic)) {
      return this.subjects.get(topic);
    } else {
      let subject = new Subject();
      this.subjects.set(topic, subject);
      return subject;
    }
  }

  /**
   * @description Creates or returns a Stream
   * 
   * @param {string} name
   * @returns {MlclStream}
   * 
   * @memberOf MlclCore
   */
  public createStream(name: string): MlclStream {
    let currentStream = this.streams.get(name);
    if(!currentStream) {
      currentStream = new MlclStream(name);
      this.streams.set(name, currentStream);
    }
    return currentStream;
  }

  public init(): Promise<any> {
    let initObs = Observable.from([{}]);
    let initStream: MlclStream = this.createStream('init');
    initObs = initStream.renderStream(initObs);
    return initObs.toPromise();
  }
}

/**
 * @export
 * @class MlclStream
 */
@injectable
export class MlclStream {
  // name of the current stream
  public name: string;
  // observer factory methods registered
  public observerFactories: Array<ObserverFactoryElement> = new Array();

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
    let observables: Array<ObserverFactoryElement> = this.observerFactories.sort(function(a: ObserverFactoryElement, b: ObserverFactoryElement) {
      return a.priority - b.priority;
    });
    for(let observ of observables) {
      if(!observ.factoryMethod && observ.targetName && observ.targetProperty) {
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
    if(factoryMethod) {
      this.factoryMethod = factoryMethod;
    }
  }
}


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


/**
 * @description Init decorator adds function as needed during init phase
 * @decorator
 * @export
 * @param {Number} [priority=50]
 * @returns
 */
export function init(priority: number = 50) {
  return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
    let core: MlclCore;
    core = di.getInstance('MlclCore');
    let stream: MlclStream = core.createStream('init');
    stream.addObserverFactoryByName(target.constructor.name, propertyKey, priority);
  };
};

/**
 * @description Health decorator adds function to check a components health
 * @decorator
 * @export
 * @param {Number} [priority=50]
 * @returns
 */
export function healthCheck(priority: Number = 50) {
  console.log(priority);
  return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
    console.log(target);
    console.log(propertyKey);
    console.log('g(): called');
  };
};
