'use strict';
import 'reflect-metadata';
import should = require('should');
// import assert = require('assert');
import * as _ from 'lodash';
import {di} from 'mlcl_di';
import {MlclCore} from '../dist';
should();

describe('mlcl_core', function() {
  describe('init', function() {
    di.bootstrap(MlclCore);
    let core: MlclCore = di.getInstance('MlclCore');
    let initSubject = core.createSubject('init');
    initSubject.subscribe(function() {
      console.log('here');
    })
    console.log(initSubject);
    initSubject.next(1);
  });
}); // test end
