'use strict';
/// <reference path="./typings/node/node.d.ts"/>
/// <reference path="./typings/lodash/lodash.d.ts"/>
/// <reference path="./typings/async/async.d.ts"/>
/// <reference path="./typings/cookie-parser/cookie-parser.d.ts"/>
/// <reference path="./typings/body-parser/body-parser.d.ts"/>
/// <reference path="./typings/express/express.d.ts"/>
/// <reference path="./typings/serve-static/serve-static.d.ts"/>

import path    = require('path');
import _ = require('lodash');
import url     = require('url');
import fs      = require('fs');
import async   = require('async');
import util    = require('util');
import events = require('events');
import mlcl_utils = require('./lib/utils');
import mlcl_log = require('mlcl_log');
import cookieParser = require('cookie-parser');
import bodyparser = require('body-parser');
import serveStatic = require('serve-static');

var methods = require('methods');

class mlcl_core extends events.EventEmitter {
  public static mlclconfig:any;
  public static rootPath:any;
  public static instance:any;
  protected modules:Array<any>;
  protected booting:Array<Boolean>;
  public config:any;
  public app:Express.Application;
  protected serveStatic:any;
  public log:any;
  public serverroles:any;
  constructor(mconfig:any) {
    super();
    mlcl_core.rootPath = path.resolve(process.cwd());
    if(mconfig) {
      mlcl_core.mlclconfig = mconfig;
    }
    if (!mlcl_core.instance) { //Singleton
      mlcl_core.instance = this;
      mlcl_core.instance.config = mlcl_core.mlclconfig;
      mlcl_core.instance.modules = {};
      mlcl_core.instance.booting = {};
      new mlcl_log(this, null);
      mlcl_core.instance.log.info('molecuel', 'instance created');
      mlcl_core.instance.utils = new mlcl_utils(this);

      mlcl_core.instance.serverroles = {
        worker: true,
        server: true
      }

      if(process.env && parseInt(process.env.WORKER) === 0) {
        mlcl_core.instance.serverroles.worker = false;
      }

      if(process.env && parseInt(process.env.SERVER) === 0) {
        mlcl_core.instance.serverroles.server = false;
      }

      this.on('mlcl::core::module:init:start', this.markModuleInitStart);
      this.on('mlcl::core::module:init:complete', this.markModuleInitComplete);
      this.emit('mlcl::core::module:init:start', this, 'mlcl');


      _.extend(mlcl_core.instance, {
        name: "",

        paths: function() {
          return {
            'root': mlcl_core.rootPath
          }
        }
      });
      mlcl_core.instance.count = 0;
      async.series([
        (callback) => {
          this.initModules(callback);
        },
        (callback) => {
          // event when all modules have entered init phase
          this.emit('mlcl::core::init:post', mlcl_core.instance);
          this.emit('mlcl::core::module:init:complete', this, 'mlcl');
        }
      ]);
    }
  }

  markModuleInitStart(module, name) {
    this.booting[name] = true;
  }

  markModuleInitComplete(module, name) {
    delete this.booting[name];
    if(!Object.keys(this.booting).length) {
      //now I am ready
      this.emit('init', mlcl_core.instance);
    }
  }
  initModules(callback) {
    var self = this;
    var currconfig = mlcl_core.mlclconfig.molecuel;
    this.config = currconfig;
    if(!currconfig) {
      if(mlcl_core.mlclconfig) {
        currconfig = mlcl_core.mlclconfig;
      } else {
        throw new Error('no config found')
      }
    };
    if(!_.isObject(currconfig.modules)) throw new Error('no config object found');
    var arr = Object.keys(currconfig.modules);

    if(arr.length > 0) {
      async.each(arr, (key, cb) => {
        var item = currconfig.modules[key];
        item.module_name = key;
        self.initModule(item, cb);
      }, (err) => {
        callback();
      });
    } else {
      callback();
    }
  }

  /**
   * initModule
   * @param item
   * @param callback
   *
   * Initialize a module
   * @todo: merge the config object which the main config e.g. routes
   */
  initModule(item, callback) {
    var self = this;
    var location  = require.resolve(item.module_name);
    var dirname   = path.dirname(location);
    var conf      = require(path.join(dirname, 'config.js'));
    var modfile    = require(item.module_name);

    var module:any;
    if(modfile.loaderversion === 2 ) {
      module = new modfile(self, conf);
    } else {
      module = modfile(self,conf);
    }

    var name = conf.name;
    // Save a module reference
    var defaults = {
      name: name,
      module: module,
      root: dirname
    };
    self.modules[item.name] = defaults;
    process.nextTick(function() {
      callback();
    });
  }

  getModule(name) {
    if(this.modules[name]) {
      return this.modules[name];
    }
  }
  require(name) {
    var m = this.getModule(name)
    if(m) {
      return m.module;
    }
  }
  parseRequest(req) {
    var u = url.parse(req.protocol + "://" + req.headers.host + req.url);
    return u;
  }

  initApplication(app) {
    this.app = app;

    // @todo rewrite this to make it configureable
    var allowCrossDomain = function(req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

      // intercept OPTIONS method
      if ('OPTIONS' == req.method) {
        res.sendStatus(200);
      }
      else {
        next();
      }
    };

    // Because you're the type of developer who cares about this sort of thing!
    app.enable('strict routing');
    /**
     * Register middleware
     */
    this.emit('mlcl::core::middlewareRegister:pre', this, app);

    // body parser
    // https://groups.google.com/forum/#!msg/express-js/iP2VyhkypHo/5AXQiYN3RPcJ
    // http://expressjs.com/api.html#bodyParser
    //var bodyparser = require('body-parser');
    app.use(bodyparser.json());
    app.use(bodyparser.urlencoded({extended: true}));

    app.use(cookieParser());

    //logger
    if(mlcl_core.mlclconfig.molecuel.log.pathdebug) {
      var morgan = require('morgan');
      app.use(morgan('dev'));
    }

    this.serveStatic = serveStatic;

    // Locals Middleware
    app.use(this.locals);

    this.emit('mlcl::core::middlewareRegister:post', this, app);

    app.use('/public', serveStatic(mlcl_core.rootPath + '/public'));

    // Initialize Modules before configurable routes registration
    _.each(this.modules, (module:any) => {
      var m:any = module.module;
      if('function' == typeof m.initApplication) {
        m.initApplication(app);
      }
    });

    // Register molecuel routes on express app router

    if(mlcl_core.mlclconfig.molecuel.routes) {
      // iterate over the routes defined in config
      _.each(mlcl_core.mlclconfig.molecuel.routes, (item:any) => {
        if(item.crossdomain) {
          app.use(item.url, allowCrossDomain);
        }
        // Configuration may contain direct callbacks for registration
        methods.forEach((method) => {
          if(item[method] == true) {
            // check if there is a permission defined for the item
            if(item.permission) {
              app[method](item.url, (req, res, next) => {
                // check if the user module is activated
                if(this.modules.user) {
                  var usermodule = this.modules.user.module;
                  usermodule.checkPermission(item, req, res, next);
                } else {
                  res.sendStatus(401);
                }
              });
            }
          }
        });
        // Callbacks defintions
        if(item.callbacks) {
          var callbacks = [];
          item.callbacks.forEach((cb) => {
            var m = this.require(cb.module);
            if(!m) return;
            var fn = m[cb.function];
            if('function' == typeof fn) {
              callbacks.push(fn.bind(m));
            }
            methods.forEach((method) => {
              if(item[method] == true) {
                app[method].apply(app, [item.url, (req, res, next) => {
                  this.dispatch(callbacks, req, res, next);
                }]);
              }
            });
          });
        }
        // If configuration contains middleware =true, a middleware function is called to do the registration
        if(item.middleware) {
          if(item.module) {
            var m = this.require(item.module);
            if(!m) return;
            if('function' == typeof m.middleware) {
              m.middleware(item.config, app);
            }
          }
        }
        // Statics
        if(item.statics) {
          if(item.module) {
            var m = this.getModule(item.module);
            if(m) {
              var modulePath = m.root;
            }
          }
          item.statics.forEach((currstatic) => {
            var staticPath;
            if(currstatic.module && this.getModule(currstatic.module)) {
              staticPath = this.getModule(currstatic.module).root;
            }
            staticPath = staticPath || modulePath;
            if(staticPath && currstatic.path) {
              app.use(item.url, serveStatic(path.join(staticPath, currstatic.path)));
            }
          });
        }
      });
    }

    app.use(function(req, res, next){
      res.status(404).send('Sorry cant find that!');
    });
  }
  checkPermission(item, req, res, next) {
    if(req.headers.authorization) {

    } else {
      // ** send 401 directly - Should be a rendered page later
      res.sendStatus(401);
    }
  }

  /**
   * Dispatch routes to previously registered mlcl_module callbacks
   *
   * @param callbacks
   * @param req
   * @param res
   * @param next
   * @private
   */
   dispatch(callbacks, req, res, next) {
    var i = 0;
    //handle route callbacks
    function route(err) {
      var fn = callbacks[i++];
      try {
        if ('route' == err) {
          next('route');
        } else if (err && fn) {
          if (fn.length < 4) return route(err);
          fn(err, req, res, route);
        } else if (fn) {
          if (fn.length < 4) return fn(req, res, route);
          route(null);
        } else {
          next(err);
        }
      } catch (err) {
        route(err);
      }
    }
    // @todo: how to handle errors, next [...]
    route(null);
  }

  /**
   * LOCALS Middleware, sets Molecuel default locals
   *
   * @param req
   * @param res
   * @param next
   */
  locals(req, res, next) {
    // Make sure locals object exists
    res.locals = res.locals || {};
    res.locals.path = req.path;
    res.locals.mlcl = {
      modules: {}
    };

    // Initialize module objects on locals
    _.each(mlcl_core.instance.modules, function(module:any) {
      res.locals.mlcl.modules[module.name] = {
        blocks: {},
        data: {}
      };
    });

    next();
  }
  setContent(res, region, data) {
    res.locals = res.locals || {};
    res.locals.data = res.locals.data || {};
    res.locals.data[region] = res.locals.data[region] || {};
    res.locals.data[region] = data;
  }

  getContent(res) {
    return res.locals.data;
  }
}

export = mlcl_core;
