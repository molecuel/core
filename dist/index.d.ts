import 'reflect-metadata';
import { Observable, Subject } from '@reactivex/rxjs';
export declare class MlclCore {
    protected streams: Map<string, MlclStream>;
    protected subjects: Map<string, Subject<any>>;
    createSubject(topic: string): Subject<any>;
    createStream(name: string): MlclStream;
    init(): Promise<any>;
}
export declare class MlclStream {
    name: string;
    observerFactories: Array<ObserverFactoryElement>;
    constructor(name: string);
    renderStream(inputObservable: Observable<any>): Observable<any>;
    addObserverFactory(observerFactory: (data: any) => Observable<any>, priority?: number): void;
    addObserverFactoryByName(targetName: string, propertyKey: string, priority?: number): void;
}
export declare class ObserverFactoryElement {
    priority: number;
    factoryMethod: (data: any) => Observable<any>;
    targetName: string;
    targetProperty: string;
    constructor(priority?: number, factoryMethod?: (data: any) => Observable<any>);
}
export declare class MlclConnection {
    name: string;
    connection: any;
}
export declare class MlclMessage {
    topic: string;
    message: any;
    source: string;
}
export declare function init(priority?: number): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function healthCheck(priority?: Number): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
