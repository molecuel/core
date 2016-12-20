'use strict';
import 'reflect-metadata';
import {Observable, Subject} from '@reactivex/rxjs';
import {singleton, injectable} from 'mlcl_di';

@singleton
export class MlclCore {
  protected streams: Map<string, MlclStream> = new Map();
  protected subjects: Map<string, Subject<any>> = new Map();

  /**
   * Creates a new subject which enables EventEmitter like functionality
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
   * Creates or returns a Stream
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
   * Creates an instance of MlclStream.
   * 
   * @param {string} name
   * 
   * @memberOf MlclStream
   */
  constructor(name: string) {
    this.name = name;
  }

  /**
   * Renders the stream and add flatMaps to the input observable
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
    console.log(inputObservable);
    for(let observ of observables) {
      console.log(observ.factoryMethod);
      inputObservable.flatMap(observ.factoryMethod);
    }
    console.log(inputObservable);
    return inputObservable;
  }

  /**
   * Add observable to the stream
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
}

/**
 * A ObserverFactory element which is used for queuing observers for a specific queue / observable
 * 
 * @export
 * @class ObserverFactoryElement
 */
@injectable
export class ObserverFactoryElement {
  public priority: number;
  public factoryMethod: (data: any) => Observable<any>;
  /**
   * Creates an instance of ObserverFactoryElement.
   * 
   * @param {number} [priority=50]
   * @param null [factoryMethod]
   * 
   * @memberOf ObserverFactoryElement
   */
  public constructor(priority: number = 50, factoryMethod: (data: any) => Observable<any>) {
    this.priority = priority;
    this.factoryMethod = factoryMethod;
  }
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