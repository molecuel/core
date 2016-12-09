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
const mlcl_di_1 = require("mlcl_di");
let MlclCore = class MlclCore {
    constructor() {
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
};
MlclCore = __decorate([
    mlcl_di_1.singleton,
    __metadata("design:paramtypes", [])
], MlclCore);
exports.MlclCore = MlclCore;
let MlclMessage = class MlclMessage {
};
MlclMessage = __decorate([
    mlcl_di_1.injectable,
    __metadata("design:paramtypes", [])
], MlclMessage);
exports.MlclMessage = MlclMessage;

//# sourceMappingURL=index.js.map
