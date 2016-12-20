import 'reflect-metadata';
import { Observable, Subject } from '@reactivex/rxjs';
export declare class MlclCore {
    protected streams: Map<string, MlclStream>;
    protected subjects: Map<string, Subject<any>>;
    createSubject(topic: string): Subject<any>;
    createStream(name: string): MlclStream;
}
export declare class MlclStream {
    name: string;
    observerFactories: Array<ObserverFactoryElement>;
    constructor(name: string);
    renderStream(inputObservable: Observable<any>): Observable<any>;
    addObserverFactory(observerFactory: (data: any) => Observable<any>, priority?: number): void;
}
export declare class ObserverFactoryElement {
    priority: number;
    factoryMethod: (data: any) => Observable<any>;
    constructor(priority: number, factoryMethod: (data: any) => Observable<any>);
}
export declare class MlclMessage {
    topic: string;
    message: any;
    source: string;
}
