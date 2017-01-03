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
require("reflect-metadata");
const rxjs_1 = require("@reactivex/rxjs");
const di_1 = require("@molecuel/di");
let MlclCore = class MlclCore {
    constructor() {
        this.streams = new Map();
        this.subjects = new Map();
    }
    createSubject(topic) {
        if (this.subjects.get(topic)) {
            return this.subjects.get(topic);
        }
        else {
            let subject = new rxjs_1.Subject();
            this.subjects.set(topic, subject);
            return subject;
        }
    }
    createStream(name) {
        let currentStream = this.streams.get(name);
        if (!currentStream) {
            currentStream = new MlclStream(name);
            this.streams.set(name, currentStream);
        }
        return currentStream;
    }
    init() {
        let initObs = rxjs_1.Observable.from([{}]);
        let initStream = this.createStream('init');
        initObs = initStream.renderStream(initObs);
        return initObs.toPromise();
    }
};
MlclCore = __decorate([
    di_1.singleton,
    __metadata("design:paramtypes", [])
], MlclCore);
exports.MlclCore = MlclCore;
let MlclStream = class MlclStream {
    constructor(name) {
        this.observerFactories = new Array();
        this.name = name;
    }
    renderStream(inputObservable) {
        let observables = this.observerFactories.sort(function (a, b) {
            return a.priority - b.priority;
        });
        for (let observ of observables) {
            if (!observ.factoryMethod && observ.targetName && observ.targetProperty) {
                let obsInstance = di_1.di.getInstance(observ.targetName);
                observ.factoryMethod = obsInstance[observ.targetProperty];
            }
            inputObservable = inputObservable.flatMap(observ.factoryMethod);
        }
        return inputObservable;
    }
    addObserverFactory(observerFactory, priority = 50) {
        let factoryElement = new ObserverFactoryElement(priority, observerFactory);
        this.observerFactories.push(factoryElement);
    }
    addObserverFactoryByName(targetName, propertyKey, priority = 50) {
        let factoryElement = new ObserverFactoryElement(priority);
        factoryElement.targetName = targetName;
        factoryElement.targetProperty = propertyKey;
        this.observerFactories.push(factoryElement);
    }
};
MlclStream = __decorate([
    di_1.injectable,
    __metadata("design:paramtypes", [String])
], MlclStream);
exports.MlclStream = MlclStream;
let ObserverFactoryElement = class ObserverFactoryElement {
    constructor(priority = 50, factoryMethod) {
        this.priority = priority;
        if (factoryMethod) {
            this.factoryMethod = factoryMethod;
        }
    }
};
ObserverFactoryElement = __decorate([
    di_1.injectable,
    __metadata("design:paramtypes", [Number, Function])
], ObserverFactoryElement);
exports.ObserverFactoryElement = ObserverFactoryElement;
let MlclConnection = class MlclConnection {
};
MlclConnection = __decorate([
    di_1.injectable,
    __metadata("design:paramtypes", [])
], MlclConnection);
exports.MlclConnection = MlclConnection;
let MlclMessage = class MlclMessage {
};
MlclMessage = __decorate([
    di_1.injectable,
    __metadata("design:paramtypes", [])
], MlclMessage);
exports.MlclMessage = MlclMessage;
function init(priority = 50) {
    return function (target, propertyKey, descriptor) {
        let core;
        core = di_1.di.getInstance('MlclCore');
        let stream = core.createStream('init');
        stream.addObserverFactoryByName(target.constructor.name, propertyKey, priority);
    };
}
exports.init = init;
;
function healthCheck(priority = 50) {
    console.log(priority);
    return function (target, propertyKey, descriptor) {
        console.log(target);
        console.log(propertyKey);
        console.log('g(): called');
    };
}
exports.healthCheck = healthCheck;
;

//# sourceMappingURL=index.js.map
