'use strict';
require("reflect-metadata");
const should = require("should");
const assert = require("assert");
const mlcl_di_1 = require("mlcl_di");
const rxjs_1 = require("@reactivex/rxjs");
const dist_1 = require("../dist");
should();
describe('mlcl_core', function () {
    describe('Subject', function () {
        let initSubject;
        let core;
        before(function () {
            mlcl_di_1.di.bootstrap(dist_1.MlclCore);
            core = mlcl_di_1.di.getInstance('MlclCore');
            initSubject = core.createSubject('init');
        });
        it('should get a message from the init subject', function (done) {
            initSubject.subscribe(function (msg) {
                assert(msg instanceof dist_1.MlclMessage);
                done();
            });
            let msg = new dist_1.MlclMessage();
            msg.topic = 'test';
            msg.message = 'hello world';
            initSubject.next(msg);
        });
    });
    describe('Stream', function () {
        let core;
        let testStream;
        let obs1Success;
        let obs2Success;
        before(function () {
            core = mlcl_di_1.di.getInstance('MlclCore');
        });
        it('should create a new Stream', function () {
            testStream = core.createStream('teststream');
        });
        it('should add observers to the new stream', function () {
            let obs1 = x => rxjs_1.Observable.create(y => {
                setTimeout(function () {
                    if (obs2Success) {
                        obs1Success = true;
                        y.next(x);
                    }
                    else {
                        y.error(new Error('Wrong priority'));
                    }
                    y.completed(x);
                }, 100);
            });
            let obs2 = x => rxjs_1.Observable.create(y => {
                setTimeout(function () {
                    if (!obs1Success) {
                        obs2Success = true;
                        x.firstname = 'Dominic2';
                        y.next(x);
                    }
                    else {
                        y.error(new Error('Wrong priority'));
                    }
                    y.completed(x);
                }, 500);
            });
            testStream.addObserverFactory(obs1, 50);
            testStream.addObserverFactory(obs2, 10);
        });
        it('should stream the data through the registered observables by priority', function (done) {
            let myobs = rxjs_1.Observable.from([{ firstname: 'Dominic' }]);
            testStream.renderStream(myobs);
            myobs.subscribe(function (res) {
                assert(res.firstname === 'Dominic2');
            }, function (err) {
                should.not.exist(err);
            }, function () {
                assert(obs1Success === true);
                assert(obs2Success === true);
                done();
            });
        });
    });
});
