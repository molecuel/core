'use strict';
process.env.configfilepath = './test/config/dev.json';
import 'reflect-metadata';
import * as should from 'should';
import assert = require('assert');
import {di, injectable} from '@molecuel/di';
import {Subject, Observable} from '@reactivex/rxjs';
import {MlclCore, MlclMessage, MlclStream, init, healthCheck,
  dataRead, dataCreate, dataUpdate, dataReplace, dataDelete, mapDataParams,
  MlclDataParam} from '../dist';
import * as fs from 'fs';
describe('mlcl_core', function() {
  before(function() {
    di.bootstrap();
  });
  describe('Config', function() {
    let config: any;
    before(function() {
     // create configs
     fs.mkdirSync('./config');
     fs.writeFileSync('./config/development.json', '{"test": "validPath"}', 'utf8' );
     config = di.getInstance('MlclConfig');
    });
    it('should be able to get the complete config via configfilepath', function() {
      assert(typeof config.getConfig() === 'object');
    });
    it('should be able to get a specific config key', function() {
      should.strictEqual(typeof config.getConfig('test'), 'string');
      assert(config.getConfig('test') === 'valid');
    });
    it('should be able to get the complete config via default path', function() {
      delete process.env.configfilepath;
      config.readConfig();
      assert(typeof config.getConfig() === 'object');
    });
    it('should be able to get a specific config key', function() {
      assert(typeof config.getConfig('test') === 'string');
      assert(config.getConfig('test') === 'validPath');
    });
    it('should be able to get the complete config via path with environment', function() {
      process.env.NODE_ENV = 'testing';
      process.env.configpath = './test/config/';
      config.readConfig();
      assert(typeof config.getConfig() === 'object');
    });
    it('should be able to get a specific config key', function() {
      assert(typeof config.getConfig('test') === 'string');
      assert(config.getConfig('test') === 'validTesting');
    });
    it('should catch the error and return a empty config', function() {
      process.env.NODE_ENV = 'testing2';
      process.env.configpath = './test/config/';
      config.readConfig();
      assert(typeof config.getConfig() === 'object');
      assert(Object.keys(config.getConfig()).length === 0);
    });
    after(function() {
      delete process.env.configpath;
      delete process.env.configfilepath;
      fs.unlinkSync('./config/development.json');
      fs.rmdirSync('./config');
    });
  });
  describe('Subject', function() {
    let testSubject: Subject<MlclMessage>;
    let core: MlclCore;
    before(function() {
      core = di.getInstance('MlclCore');
      testSubject = core.createSubject('test');
    });
    it('should get a message from the test subject', function(done) {
      testSubject.subscribe(function(msg: MlclMessage) {
        assert(msg instanceof MlclMessage);
        done();
      });
      let msg = new MlclMessage();
      msg.topic= 'test';
      msg.message = 'hello world';
      testSubject.next(msg);
    });
    it('should get a existing subject', function() {
      let exSubject = core.createSubject('test');
      assert(exSubject !== undefined);
    });
  });
  describe('Stream', function() {
    let core: MlclCore;
    let testStream: MlclStream;
    let obs1Success: boolean;
    let obs2Success: boolean;
    before(function() {
      core = di.getInstance('MlclCore');
    });
    it('should create a new Stream', function() {
      testStream = core.createStream('teststream');
    });
    it('should add observers to the new stream', function() {
      let obs1 = x=> Observable.create(y => {
        setTimeout(function() {
          if(obs2Success) {
            obs1Success = true;
            y.next(x);
          } else {
            y.error(new Error('Wrong priority'));
          }
          y.complete();
        }, 100);
      });

      let obs2 = x => Observable.create(y => {
        setTimeout(function() {
          if(!obs1Success) {
             obs2Success = true;
             x.firstname = 'Dominic2';
             y.next(x);
          } else {
            y.error(new Error('Wrong priority'));
          }
          y.complete();
        }, 500);
      });
      testStream.addObserverFactory(obs1, 50);
      testStream.addObserverFactory(obs2, 10);
    });
    it('should stream the data through the registered observables by priority', function(done) {
      let myobs = Observable.from([{firstname: 'Dominic'}]);
      myobs = testStream.renderStream(myobs);
      myobs.subscribe(function(res) {
        assert(res.firstname === 'Dominic2');
      }, function(err) {
        should.not.exist(err);
      }, function() {
        assert(obs1Success === true);
        assert(obs2Success === true);
        done();
      });
    });
  });
  describe('Init', function() {
    let core: MlclCore;
    let obs1Success: boolean;
    let obs2Success: boolean;
    before(function() {
      core = di.getInstance('MlclCore');
    });
    it('should init', async function() {
      @injectable
      class MyInitTestClass {
        @init(20)
        public myinit(x) {
          return Observable.create(y => {
            setTimeout(function() {
              if(obs2Success) {
                obs1Success = true;
                y.next(x);
              } else {
                y.error(new Error('Wrong priority'));
              }
              y.complete();
            }, 100);
          });
        }
      }
      @injectable
      class MyInitTestClass2 {
        @init(10)
        public myini2t(x) {
          return Observable.create(y => {
            setTimeout(function() {
              if(!obs1Success) {
                obs2Success = true;
                y.next(x);
              } else {
                y.error(new Error('Wrong priority'));
              }
              y.complete();
            }, 100);
          });
        }
      }
      await core.init();
    });
  });
  describe('dataInAndOut', function() {
    let core: MlclCore;
    before(function() {
      core = di.getInstance('MlclCore');
    });
    it('should add data functions', function() {
      @injectable
      class MyDataFunctionClass {
        @dataCreate()
        public myDataCreaCheck() {
          return async function() {
            return true;
          };
        }
        @dataUpdate()
        public myDataUpdateCheck() {
          return async function() {
            return true;
          };
        }
        @dataReplace()
        public async myDataReplaceCheck() {
          return true;
        }
        @dataDelete()
        public myDataDeleteCheck() {
          return async function() {
            return true;
          };
        }
        @mapDataParams([
          new MlclDataParam('id', 'id', 'integer', 999),
          new MlclDataParam('test', 'name', 'string', 10),
          new MlclDataParam('extra', 'optional', 'string', 999)
        ])
        @dataRead()
        public async myDataReadCheck(id: number, name: string, optional?: any) {
          return {
            data: (id + ' = "' + name+'"'),
            optional: optional
          };
        }
        @mapDataParams([
          new MlclDataParam('inputNumber', 'dateOne', 'Date', 999),
          new MlclDataParam('inputDateString', 'dateTwo', 'Date', 999),
          new MlclDataParam('inputGermanDate', 'dateThree', 'Date', 10),
          new MlclDataParam('inputString', 'str', 'string', 999),
          new MlclDataParam('inputTooLong', 'long', 'string', 1),
          new MlclDataParam('inputAnyArray', 'strArr', 'string', 999),
          new MlclDataParam('inputDecimalString', 'dec', 'decimal', 999),
          new MlclDataParam('inputTrueString', 'boolTrue', 'boolean', 5),
          new MlclDataParam('inputFalseString', 'boolFalse', 'boolean', 5),
          new MlclDataParam('inputNotBoolString', 'boolNot', 'boolean', 5),
          new MlclDataParam('inputAny', 'invalidType', 'Foo', 5)
        ])
        @dataRead()
        public async myParsedParams(dateOne: Date,
                                    dateTwo: Date,
                                    dateThree: Date,
                                    str: string,
                                    long: string,
                                    strArr: string[],
                                    dec: number,
                                    boolTrue: boolean,
                                    boolFalse: boolean,
                                    boolNot: boolean,
                                    invalidType: any) {
          return {
            dateOne: dateOne,
            dateTwo: dateTwo,
            dateThree: dateThree,
            str: str,
            long: long,
            strArr: strArr,
            dec: dec,
            boolTrue: boolTrue,
            boolFalse: boolFalse,
            boolNot: boolNot,
            invalidType: invalidType
          };
        }
      }
    });
    it('should have data params for functions', function() {
      let dataParams = core.getDataParams('MyDataFunctionClass', 'myDataReadCheck');
      assert(dataParams instanceof Array);
      assert(dataParams[0] instanceof MlclDataParam);
      assert(dataParams[0].type === 'integer');
    });
    it('should parse params for most basic types', async () => {
      let testData = {
        inputNumber: new Date().getTime(),
        inputDateString: new Date().toString(),
        inputGermanDate: '01.02.2017',
        inputString: 'test',
        inputTooLong: 'test',
        inputAnyArray: [1234, 'test', 567, true, new Date()],
        inputDecimalString: '1234.567',
        inputTrueString: 'true',
        inputFalseString: 'false',
        inputNotBoolString: 'test',
        inputAny: {}
      };
      let functionParams = core.renderDataParams(testData, 'MyDataFunctionClass', 'myParsedParams');
      assert(functionParams);
      assert(functionParams.length);
      let functionResult = await (di.getInstance('MyDataFunctionClass').myParsedParams(...functionParams));
      assert(functionResult);
      assert(functionResult.dateOne instanceof Date && functionResult.dateOne.toString() === (new Date(testData.inputNumber)).toString());
      assert(functionResult.dateTwo instanceof Date && functionResult.dateTwo.toString() === testData.inputDateString);
      assert(functionResult.dateThree instanceof Date && functionResult.dateThree.toString() === (new Date('2017-02-01')).toString());
      assert(functionResult.str === testData.inputString);
      assert(functionResult.long === undefined);
      let stringyfiedArr = testData.inputAnyArray.map(item => { return item.toString(); });
      assert(!functionResult.strArr.filter(item => {
        return stringyfiedArr.indexOf(item) < 0;
      }).length);
      assert(functionResult.dec === parseFloat(testData.inputDecimalString));
      assert(functionResult.boolTrue === true);
      assert(functionResult.boolFalse === false);
      assert(functionResult.boolNot === undefined);
      assert(functionResult.invalidType === undefined);
    });
    it('should parse params for target function and supply them', async () => {
      let functionParams = core.renderDataParams({id: '500', test: 'Hello!'}, 'MyDataFunctionClass', 'myDataReadCheck');
      assert(functionParams);
      assert(functionParams.length);
      assert(functionParams[0] === 500);
      let functionResult = await (di.getInstance('MyDataFunctionClass').myDataReadCheck(...functionParams));
      assert(functionResult);
      assert(functionResult.data === '500 = "Hello!"');
      assert(functionResult.optional === undefined);
    });
    it('should return undefined datafunctions', function() {
      let dataParams = core.getDataParams('MyDataFunctionC2lass', 'myDataReadCheck');
      assert(dataParams === undefined);
      let dataParams2 = core.getDataParams('MyDataFunctionClass', 'my2DataReadCheck');
      assert(dataParams2 === undefined);
    });
    it('should return all data functions', function() {
      let dataFactories = core.getDataFactories();
      assert(dataFactories !== undefined);
      assert(dataFactories.length >= 3);
    });
  });
  describe('health', function() {
    let core: MlclCore;
    before(function() {
      core = di.getInstance('MlclCore');
    });
    it('should add healthcheck', function() {
      @injectable
      class MyHealthTest {
        @healthCheck()
        public mycheck(x) {
          return Observable.create(y => {
            x.myhealthtest = true;
            y.next(x);
            y.complete();
          });
        }
      }
    });
  });
}); // test end
