'use strict';
import 'reflect-metadata';
import should = require('should');
import assert = require('assert');
import * as _ from 'lodash';
import {di, injectable} from '@molecuel/di';
import {Subject, Observable} from '@reactivex/rxjs';
import {MlclCore, MlclMessage, MlclStream, init} from '../dist';
should();

describe('mlcl_core', function() {
  describe('Subject', function() {
    let testSubject: Subject<MlclMessage>;
    let core: MlclCore;
    before(function() {
      di.bootstrap(MlclCore);
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
}); // test end
