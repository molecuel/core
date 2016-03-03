'use strict';
/// <reference path="../typings/handlebars/handlebars.d.ts"/>
import handlebars = require('handlebars');

class mlcl_utils {
  molecuel: any;
  constructor(molecuel: any) {
    this.molecuel = molecuel;
  }

  public getVar(variable: any, req: any, res: any) {
    let self = this;
    return self.resolve(variable, { req: req, res: res });
  }

  public resolve(text: string, options: any) {
    let template = handlebars.compile(text);
    return template(options);
  };
}

export = mlcl_utils;
