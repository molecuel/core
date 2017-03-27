import {di} from "@molecuel/di";
import {MlclStream} from "../stream/MlclStream";
import {MlclCore} from "./MlclCore";

/**
 * @description Init decorator adds function as needed during init phase
 * @decorator
 * @export
 * @param {Number} [priority=50]
 * @returns
 */
export function init(priority: number = 50) {
  return (target, propertyKey: string, descriptor: PropertyDescriptor) => {
    let core: MlclCore;
    core = di.getInstance("MlclCore");
    let stream: MlclStream = core.createStream("init");
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
export function healthCheck(priority: number = 50) {
  return (target, propertyKey: string, descriptor: PropertyDescriptor) => {
    let core: MlclCore;
    core = di.getInstance("MlclCore");
    let stream: MlclStream = core.createStream("health");
    stream.addObserverFactoryByName(target.constructor.name, propertyKey, priority);
  };
}
