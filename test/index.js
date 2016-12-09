'use strict';
require("reflect-metadata");
const should = require("should");
const mlcl_di_1 = require("mlcl_di");
const dist_1 = require("../dist");
should();
describe('mlcl_core', function () {
    describe('init', function () {
        mlcl_di_1.di.bootstrap(dist_1.MlclCore);
        let core = mlcl_di_1.di.getInstance('MlclCore');
        let initSubject = core.createSubject('init');
        initSubject.subscribe(function () {
            console.log('here');
        });
        console.log(initSubject);
        initSubject.next(1);
    });
});
