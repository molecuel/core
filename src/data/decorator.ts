import {di} from '@molecuel/di';
import {MlclDataFactory} from './MlclDataFactory';
import {MlclDataParam} from './MlclDataParam';

/**
 * @description Adds a data create factory method. This should be a async function. This is stored in core and can be used by differnt modules like HTTP to receive data.
 * 
 * @export
 * @param {number} [priority=50]
 * @returns
 */
export function dataCreate(priority: number = 50) {
  return function(target, propertyKey: string) {
    let targetFactory = new MlclDataFactory();
    targetFactory.operation = 'create';
    targetFactory.priority = priority;
    targetFactory.targetName = target.constructor.name;
    targetFactory.targetProperty = propertyKey;
    let core = di.getInstance('MlclCore');
    core.addDataFactory(targetFactory);
  };
}

/**
 * @description Adds a data update factory method. This should be a async function. This is stored in core and can be used by differnt modules like HTTP to receive data.
 * 
 * @export
 * @param {number} [priority=50]
 * @returns
 */
export function dataUpdate(priority: number = 50) {
  return function(target, propertyKey: string) {
    let targetFactory = new MlclDataFactory();
    targetFactory.operation = 'update';
    targetFactory.priority = priority;
    targetFactory.targetName = target.constructor.name;
    targetFactory.targetProperty = propertyKey;
    let core = di.getInstance('MlclCore');
    core.addDataFactory(targetFactory);
  };
}

/**
 * @description Adds a data read factory method. This should be a async function. This is stored in core and can be used by different modules like HTTP to return data.
 * 
 * @export
 * @param {number} priority
 * @returns
 */
export function dataRead(priority: number = 50) {
  return function(target, propertyKey: string, descriptor: PropertyDescriptor) {
    let targetFactory = new MlclDataFactory();
    targetFactory.operation = 'read';
    targetFactory.priority = priority;
    targetFactory.targetName = target.constructor.name;
    targetFactory.targetProperty = propertyKey;
    let core = di.getInstance('MlclCore');
    core.addDataFactory(targetFactory);
  };
}

/**
 * @description Adds a data read factory method. This should be a async function. This is stored in core and can be used by different modules like HTTP to return data.
 * 
 * @export
 * @param {number} priority
 * @returns
 */
export function dataDelete(priority: number = 50) {
  return function(target, propertyKey: string, descriptor: PropertyDescriptor) {
    let targetFactory = new MlclDataFactory();
    targetFactory.operation = 'delete';
    targetFactory.priority = priority;
    targetFactory.targetName = target.constructor.name;
    targetFactory.targetProperty = propertyKey;
    let core = di.getInstance('MlclCore');
    core.addDataFactory(targetFactory);
  };
}

export function mapDataParams(dataParams: Array<MlclDataParam>) {
  return function(target, propertyKey: string, descriptor: PropertyDescriptor) {
    let core = di.getInstance('MlclCore');
    core.addDataParams(target.constructor.name, propertyKey, dataParams);
  };
}