/// <reference types="lodash" />
import 'reflect-metadata';
import { Subject } from '@reactivex/rxjs';
export declare class MlclCore {
    protected subjects: Map<string, Subject<any>>;
    createSubject(topic: string): Subject<any>;
}
export declare class MlclMessage {
    topic: string;
    message: any;
    source: string;
}
