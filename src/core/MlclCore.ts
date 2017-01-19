import {singleton} from '@molecuel/di';
import {MlclStream} from '../stream/MlclStream';
import {Observable, Subject} from '@reactivex/rxjs';
import {MlclDataFactory} from '../data/MlclDataFactory';
import {MlclDataParam} from '../data/MlclDataParam';

@singleton
export class MlclCore {
  // stream are stored here
  protected streams: Map<string, MlclStream> = new Map();
  // subjects are stored here
  protected subjects: Map<string, Subject<any>> = new Map();
  // this is for data input and output functions
  protected dataFactories: Array<MlclDataFactory> = new Array();
  // params for dataFactories
  private dataParams: Map<string, Map<string, Array<MlclDataParam>>> = new Map();

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

  /**
   * @description Init function which creates a init stream
   * 
   * @returns {Promise<any>}
   * 
   * @memberOf MlclCore
   */
  public init(): Promise<any> {
    let initObs = Observable.from([{}]);
    let initStream: MlclStream = this.createStream('init');
    initObs = initStream.renderStream(initObs);
    return initObs.toPromise();
  }

  public addDataFactory(factory: MlclDataFactory): void {
    this.dataFactories.push(factory);
  }

  public getDataFactories(): Array<MlclDataFactory> {
    return this.dataFactories;
  }

  public addDataParams(className: string, propertyName: string, dataParams: Array<MlclDataParam>) {
    if(!this.dataParams.has(className)) {
      let newMap: Map<string, Array<MlclDataParam>> = new Map();
      this.dataParams.set(className, newMap);
    }
    let classMap = this.dataParams.get(className);
    classMap.set(propertyName, dataParams);
  }

  public getDataParams(className, propertyName): Array<MlclDataParam> {
    let classMap = this.dataParams.get(className);
    if(classMap) {
      return classMap.get(propertyName);
    } else {
      return;
    }
  }

  public renderDataParams(params: Object, target: string, propertyKey: string): any[] {
    let result = [];
    let targetParamsList = this.getDataParams(target, propertyKey);
    if (targetParamsList) {
      for (let targetParam of targetParamsList) {
        let sourceParam = params[targetParam.inputParam];
        if (sourceParam && targetParam.size && sourceParam.length > targetParam.size) {
          result.push(undefined);
        }
        else if (sourceParam) {
          result.push(this.parseParam(sourceParam, targetParam.type));
        }
        else {
          result.push(undefined);
        }
      }
    }
    return result;
  }

  protected parseParam(param: any, targetType: string): any {
    let result: any;
    if (Array.isArray(param)) {
      result = [];
      for (let item of param) {
        result.push(this.parseParam(item, targetType));
      }
      return result;
    }
    else if (typeof param !== 'string') {
      result = param.toString();
    }
    else {
      result = param;
    }
    try {
      switch (targetType.toLowerCase()) {
        case 'string':
          return result;
        case 'number':
        case 'float':
        case 'double':
        case 'decimal':
          return parseFloat(result);
        case 'integer':
          return parseInt(parseFloat(result).toString(), 10);
        case 'boolean':
          if (result === 'true') {
            return true;
          }
          else if( result === 'false') {
            return false;
          }
          else {
            throw new Error('Cannot parse "' + result + '" to "' + targetType +'".');
          }
        case 'date':
          let sort = /^(\d{2})[^\d]?(\d{2})[^\d]?(\d{4})$/; // MMDDYYYY or DDMMYYYY
          result = result.replace(/[\W]+/g, '-').replace(sort, '$3-$2-1');
          if (!isNaN(parseFloat(result)) && isFinite(result)) {
            return new Date(parseInt(result, 10));
          }
          else {
            return new Date(result);
          }
        default:
          throw new Error('"' + targetType + '" is no valid type.');
      }
    }
    catch (error) {
      return undefined;
    }
  }
}