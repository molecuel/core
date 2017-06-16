import {singleton} from "@molecuel/di";
import {Observable, Subject} from "@reactivex/rxjs";
import {MlclDataFactory} from "../data/MlclDataFactory";
import {MlclDataParam} from "../data/MlclDataParam";
import {MlclStream} from "../stream/MlclStream";

@singleton
export class MlclCore {
  // stream are stored here
  protected streams: Map<string, MlclStream> = new Map();
  // subjects are stored here
  protected subjects: Map<string, Subject<any>> = new Map();
  // this is for data input and output functions
  protected dataFactories: MlclDataFactory[] = new Array();
  // params for dataFactories
  private dataParams: Map<string, Map<string, MlclDataParam[]>> = new Map();

  /**
   * @description Creates a new subject which enables EventEmitter like functionality
   *
   * @param {string} topic
   * @returns {Subject<any>}
   *
   * @memberOf MlclCore
   */
  public createSubject(topic: string): Subject<any> {
    if (this.subjects.get(topic)) {
      return this.subjects.get(topic);
    } else {
      const subject = new Subject();
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
    if (!currentStream) {
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
    const initStream: MlclStream = this.createStream("init");
    initObs = initStream.renderStream(initObs);
    return initObs.toPromise();
  }

  public addDataFactory(factory: MlclDataFactory): void {
    this.dataFactories.push(factory);
  }

  public getDataFactories(): MlclDataFactory[] {
    return this.dataFactories;
  }

  public addDataParams(className: string, propertyName: string, dataParams: MlclDataParam[]) {
    if (!this.dataParams.has(className)) {
      const newMap: Map<string, MlclDataParam[]> = new Map();
      this.dataParams.set(className, newMap);
    }
    const classMap = this.dataParams.get(className);
    classMap.set(propertyName, dataParams);
  }

  public getDataParams(className, propertyName): MlclDataParam[] {
    const classMap = this.dataParams.get(className);
    if (classMap) {
      return classMap.get(propertyName);
    } else {
      return;
    }
  }

  public renderDataParams(params: object, target: string, propertyKey: string): any[] {
    const result = [];
    const targetParamsList = this.getDataParams(target, propertyKey);
    // console.log({params, targetParamsList});
    if (targetParamsList) {
      for (const targetParam of targetParamsList) {
        const sourceParam: any = targetParam.inputParam.split(".").reduce((obj, prop) => {
          if (obj !== undefined && obj[prop] !== undefined) {
            return obj[prop];
          }
        }, params);
        // const sourceParam = params[targetParam.inputParam];
        if (sourceParam && targetParam.size && sourceParam.length > targetParam.size) {
          result.push(undefined);
        } else if (sourceParam) {
          result.push(this.parseParam(sourceParam, targetParam.type));
        } else {
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
      for (const item of param) {
        result.push(this.parseParam(item, targetType));
      }
      return result;
    } else if (typeof param !== "string") {
      if (typeof param === "object" && targetType === "json") {
        try {
          return JSON.parse(JSON.stringify(param));
        } catch (error) {
          return undefined;
        }
      } else {
        result = param.toString();
      }
    } else {
      result = param;
    }
    try {
      switch (targetType.toLowerCase()) {
        case "string":
          return result;
        case "number":
        case "float":
        case "double":
        case "decimal":
          return parseFloat(result);
        case "integer":
          return parseInt(parseFloat(result).toString(), 10);
        case "boolean":
          if (result === "true") {
            return true;
          } else if ( result === "false") {
            return false;
          } else {
            throw new Error("Cannot parse " + result + " to " + targetType + ".");
          }
        case "json":
          return JSON.parse(result);
        case "date":
          const sort = /^(\d{1,2})[^\d\w]?(\d{1,2})[^\d\w]?(\d{4})$/; // MMDDYYYY or DDMMYYYY
          const restruct = result.replace(/[\W]+/g, "-").replace(sort, "$3-$2-$1");
          if (!isNaN(parseFloat(restruct)) && isFinite(restruct)) {
            return new Date(parseInt(restruct, 10));
          } else {
            const restructDate = new Date(restruct);
            if (restructDate.getTime() !== restructDate.getTime()) { // since (NaN !== NaN) -> true
              return new Date(result);
            } else {
              return restructDate;
            }
          }
        default:
          throw new Error(targetType + " is no valid type.");
      }
    } catch (error) {
      return undefined;
    }
  }
}
