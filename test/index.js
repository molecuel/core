'use strict';
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
require("reflect-metadata");
const should = require("should");
const assert = require("assert");
const di_1 = require("@molecuel/di");
const rxjs_1 = require("@reactivex/rxjs");
const dist_1 = require("../dist");
should();
describe('mlcl_core', function () {
    describe('Subject', function () {
        let testSubject;
        let core;
        before(function () {
            di_1.di.bootstrap(dist_1.MlclCore);
            core = di_1.di.getInstance('MlclCore');
            testSubject = core.createSubject('test');
        });
        it('should get a message from the test subject', function (done) {
            testSubject.subscribe(function (msg) {
                assert(msg instanceof dist_1.MlclMessage);
                done();
            });
            let msg = new dist_1.MlclMessage();
            msg.topic = 'test';
            msg.message = 'hello world';
            testSubject.next(msg);
        });
    });
    describe('Stream', function () {
        let core;
        let testStream;
        let obs1Success;
        let obs2Success;
        before(function () {
            core = di_1.di.getInstance('MlclCore');
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
                    y.complete();
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
                    y.complete();
                }, 500);
            });
            testStream.addObserverFactory(obs1, 50);
            testStream.addObserverFactory(obs2, 10);
        });
        it('should stream the data through the registered observables by priority', function (done) {
            let myobs = rxjs_1.Observable.from([{ firstname: 'Dominic' }]);
            myobs = testStream.renderStream(myobs);
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
    describe('Init', function () {
        let core;
        let obs1Success;
        let obs2Success;
        before(function () {
            core = di_1.di.getInstance('MlclCore');
        });
        it('should init', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let MyInitTestClass = class MyInitTestClass {
                    myinit(x) {
                        return rxjs_1.Observable.create(y => {
                            setTimeout(function () {
                                if (obs2Success) {
                                    obs1Success = true;
                                    y.next(x);
                                }
                                else {
                                    y.error(new Error('Wrong priority'));
                                }
                                y.complete();
                            }, 100);
                        });
                    }
                };
                __decorate([
                    dist_1.init(20),
                    __metadata("design:type", Function),
                    __metadata("design:paramtypes", [Object]),
                    __metadata("design:returntype", void 0)
                ], MyInitTestClass.prototype, "myinit", null);
                MyInitTestClass = __decorate([
                    di_1.injectable,
                    __metadata("design:paramtypes", [])
                ], MyInitTestClass);
                let MyInitTestClass2 = class MyInitTestClass2 {
                    myini2t(x) {
                        return rxjs_1.Observable.create(y => {
                            setTimeout(function () {
                                if (!obs1Success) {
                                    obs2Success = true;
                                    y.next(x);
                                }
                                else {
                                    y.error(new Error('Wrong priority'));
                                }
                                y.complete();
                            }, 100);
                        });
                    }
                };
                __decorate([
                    dist_1.init(10),
                    __metadata("design:type", Function),
                    __metadata("design:paramtypes", [Object]),
                    __metadata("design:returntype", void 0)
                ], MyInitTestClass2.prototype, "myini2t", null);
                MyInitTestClass2 = __decorate([
                    di_1.injectable,
                    __metadata("design:paramtypes", [])
                ], MyInitTestClass2);
                yield core.init();
            });
        });
    });
});
