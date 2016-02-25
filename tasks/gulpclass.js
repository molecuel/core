"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var Decorators_1 = require('gulpclass/Decorators');
var gulp = require('gulp');
var ts = require('gulp-typescript');
var plumber = require('gulp-plumber');
var tslint = require('gulp-tslint');
var del = require('del');
var fs = require('fs');
var Gulpfile = (function () {
    function Gulpfile() {
        this.readpkgjson();
        this.tsProject = ts.createProject('tsconfig.json');
    }
    Gulpfile.prototype.readpkgjson = function () {
        var configobject = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        if (configobject && configobject.devconfig) {
            this.config = configobject.devconfig;
        }
    };
    Gulpfile.prototype.clean = function (cb) {
        return del(['./dist/**'], cb);
    };
    Gulpfile.prototype.tslint = function () {
        var lintoptions = {
            emitError: false,
            sort: true,
            bell: true
        };
        return gulp.src(this.config.paths.source)
            .pipe(plumber())
            .pipe(tslint())
            .pipe(tslint.report(require('tslint-stylish'), lintoptions));
    };
    Gulpfile.prototype.tscompile = function () {
        var sourcepaths = ['typings/**/*.d.ts'];
        sourcepaths.push(this.config.paths.source);
        var tsResult = this.tsProject.src()
            .pipe(ts(this.tsProject));
        return tsResult.js
            .pipe(gulp.dest(this.config.paths.dist));
    };
    Gulpfile.prototype.build = function () {
        return [['clean>>dist', 'ts>>lint'], 'ts>>compile'];
    };
    Gulpfile.prototype.watch = function () {
        return gulp.watch(this.config.paths.source, ['build']);
    };
    Gulpfile.prototype.default = function () {
        return ['build', 'watch'];
    };
    __decorate([
        Decorators_1.Task('config:readpkgjson'), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', Object)
    ], Gulpfile.prototype, "readpkgjson", null);
    __decorate([
        Decorators_1.Task('clean>>dist'), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', [Function]), 
        __metadata('design:returntype', void 0)
    ], Gulpfile.prototype, "clean", null);
    __decorate([
        Decorators_1.Task('ts>>lint'), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], Gulpfile.prototype, "tslint", null);
    __decorate([
        Decorators_1.Task('ts>>compile'), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], Gulpfile.prototype, "tscompile", null);
    __decorate([
        Decorators_1.SequenceTask('build'), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], Gulpfile.prototype, "build", null);
    __decorate([
        Decorators_1.SequenceTask('watch'), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], Gulpfile.prototype, "watch", null);
    __decorate([
        Decorators_1.SequenceTask('default'), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], Gulpfile.prototype, "default", null);
    Gulpfile = __decorate([
        Decorators_1.Gulpclass(), 
        __metadata('design:paramtypes', [])
    ], Gulpfile);
    return Gulpfile;
}());
exports.Gulpfile = Gulpfile;
