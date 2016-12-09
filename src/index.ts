'use strict';
import 'reflect-metadata';
import {Subject} from '@reactivex/rxjs';
import {singleton, injectable} from 'mlcl_di';

@singleton
export class MlclCore {
  protected subjects: Map<string, Subject<any>> = new Map();
  public createSubject(topic: string): Subject<any> {
    if(this.subjects.get(topic)) {
      return this.subjects.get(topic);
    } else {
      let subject = new Subject();
      this.subjects.set(topic, subject);
      return subject;
    }
  }
}

@injectable
export class MlclMessage {
  public topic: string;
  public message: any;
  public source: string;
}