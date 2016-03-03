/// <reference path='../node_modules/gulpclass/index.d.ts'/>
/// <reference path="../typings/main.d.ts"/>
import {Gulpclass, Task, SequenceTask} from 'gulpclass/Decorators';

import * as gulp from 'gulp';
import * as ts from 'gulp-typescript';
import * as plumber from 'gulp-plumber';
import * as tslint from 'gulp-tslint';
import * as del from 'del';
import * as fs from 'fs';
import * as merge from 'merge2';

@Gulpclass()
export class Gulpfile {

  config: any;
  tsProject: ts.Project;

  constructor() {
    // initial read of package data
    this.readpkgjson();
    this.tsProject = ts.createProject('tsconfig.json');
  }

  /**
   * Read package.json task
   *
   * It reads the data of the devconfig object in the package.json file
   */
  @Task('config::readpkgjson')
  readpkgjson(): any {
    var configobject = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    if (configobject && configobject.devconfig) {
      this.config = configobject.devconfig;
    }
  }

  /**
   * Clean dist directory
   */
  @Task('clean::dist')
  clean(cb: Function) {
    return del(['./dist/**'], cb);
  }

  /**
   * Typescript lint task
   */
  @Task('ts::lint')
  tslint() {
    let lintoptions: any = {
      emitError: false,
      sort: true,
      bell: true
    }
    return gulp.src(this.config.paths.source)
      .pipe(plumber())
      .pipe(tslint())
      .pipe(tslint.report(require('tslint-stylish'), lintoptions));
  }

  /**
   * Typescript compile task
   */
  @Task('ts::compile')
  tscompile(): any {
    let sourcepaths = ['typings/main.d.ts'];
    sourcepaths.push(this.config.paths.source);
    var tsResult = gulp.src(sourcepaths)
      .pipe(plumber())
      .pipe(ts(this.tsProject));

    return merge([
      tsResult.dts.pipe(gulp.dest('definitions')),
      tsResult.js.pipe(gulp.dest(this.config.paths.dist))
    ]);
  }

  @SequenceTask('build') // this special annotation using "run-sequence" module to run returned tasks in sequence
  build() {
    return [['clean::dist', 'ts::lint'], 'ts::compile'];
  }

  @SequenceTask('watch') // this special annotation using "run-sequence" module to run returned tasks in sequence
  watch(): any {
    return gulp.watch(this.config.paths.source, ['build']);
  }

  @SequenceTask('default')
  default() { // because this task has "default" name it will be run as default gulp task
    return ['build', 'watch'];
  }
}
