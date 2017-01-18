'use strict';
process.env.configfilepath = './test/config/dev.json';
import 'reflect-metadata';
import should = require('should');
import assert = require('assert');
import {di, injectable} from '@molecuel/di';
import {Subject, Observable} from '@reactivex/rxjs';
import {MlclCore, MlclMessage, MlclStream, init, healthCheck,
  dataRead, dataCreate, dataUpdate, dataDelete, mapDataParams,
  MlclDataParam, MlclConfig} from '../dist';
import * as fs from 'fs';
should();

describe('mlcl_core', function() {
  before(function() {
    di.bootstrap(MlclCore, MlclConfig);
  });
  describe('Config', function() {
    let config: MlclConfig;
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
      assert(typeof config.getConfig('test') === 'string');
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
        @dataDelete()
        public myDataDeleteCheck() {
          return async function() {
            return true;
          };
        }
        @mapDataParams([
          new MlclDataParam('id', 'id', 'integer', 999),
          new MlclDataParam('test', 'name', 'string', 10)
        ])
        @dataRead()
        public async myDataReadCheck(id: number, name: string) {
          return {
            data: 'mydata'
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
    it('should parse params to target type', () => {
      let params: {value: any, type: string}[] = [];
      params.push({value: '05.02.2017', type: 'Date'});
      params.push({value: (new Date()).getTime(), type: 'Date'});
      params.push({value: 1024, type: 'string'});
      params.push({ value: '204.8', type: 'float' });

      let results = [];
      for (let item of params) {
        results.push(core.parseParam(item.value, item.type));
      }
      for (let i = 0; i < params.length; i++) {
        assert(results[i]);
      }
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
