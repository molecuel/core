'use strict';
import path = require('path');
import _ = require('lodash');
import url = require('url');
import async = require('async');
import events = require('events');
import mlcl_utils = require('./lib/utils');
import mlcl_log = require('mlcl_log');
import cookieParser = require('cookie-parser');
import bodyparser = require('body-parser');
import serveStatic = require('serve-static');
import express = require('express');

let methods = require('methods');

class mlcl_core extends events.EventEmitter {
  public static mlclconfig: any;
  public static rootPath: any;
  public static instance: any;
  protected modules: any;
  protected booting: Array<Boolean>;
  public config: any;
  public app: express.Application;
  protected serveStatic: any;
  public log: any;
  public serverroles: any;
  public servers: Array<any>;
  constructor(mconfig: any) {
    super();
    this.servers = [];
    mlcl_core.rootPath = path.resolve(process.cwd());
    if (mconfig) {
      mlcl_core.mlclconfig = mconfig;
    }
    if (!mlcl_core.instance) { // Singleton
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
      };

      if (process.env && parseInt(process.env.WORKER) === 0) {
        mlcl_core.instance.serverroles.worker = false;
      }

      if (process.env && parseInt(process.env.SERVER) === 0) {
        mlcl_core.instance.serverroles.server = false;
      }


      this.on('mlcl::core::module:init:start', this.markModuleInitStart);
      this.on('mlcl::core::module:init:complete', this.markModuleInitComplete);
      this.emit('mlcl::core::module:init:start', this, 'mlcl');

      _.extend(mlcl_core.instance, {
        name: '',

        paths: function() {
          return {
            'root': mlcl_core.rootPath
          };
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

  setServerInstance(server) {
    this.servers.push(server);
    this.emit('mlcl::core::init:server', this, server);
  }
  markModuleInitStart(module, name) {
    this.booting[name] = true;
  }

  markModuleInitComplete(module, name) {
    delete this.booting[name];
    if (!Object.keys(this.booting).length) {
      // now I am ready
      this.emit('init', mlcl_core.instance);
    }
  }
  initModules(callback) {
    let self = this;
    let currconfig = mlcl_core.mlclconfig.molecuel;
    this.config = currconfig;
    if (!currconfig) {
      if (mlcl_core.mlclconfig) {
        currconfig = mlcl_core.mlclconfig;
      } else {
        throw new Error('no config found');
      }
    };
    if (!_.isObject(currconfig.modules)) {
      throw new Error('no config object found');
    }
    let arr = Object.keys(currconfig.modules);

    if (arr.length > 0) {
      async.each(arr, (key, cb) => {
        let item = currconfig.modules[key];
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
    let self = this;
    let location = require.resolve(item.module_name);
    let dirname = path.dirname(location);
    let conf = require(path.join(dirname, 'config.js'));
    let modfile = require(item.module_name);

    let module: any;
    if (modfile.loaderversion === 2) {
      module = new modfile(self, conf);
    } else {
      module = modfile(self, conf);
    }

    let name = conf.name;
    // Save a module reference
    let defaults = {
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
    if (this.modules[name]) {
      return this.modules[name];
    }
  }
  require(name) {
    let m = this.getModule(name);
    if (m) {
      return m.module;
    }
  }
  parseRequest(req) {
    let u = url.parse(req.protocol + '://' + req.headers.host + req.url);
    return u;
  }

  initApplication(app) {
    this.app = app;

    // Because you're the type of developer who cares about this sort of thing!
    app.enable('strict routing');
    /**
     * Register middleware
     */
    this.emit('mlcl::core::middlewareRegister:pre', this, app);

    // quick workaround for AWS SNS OPTIONS
    // @todo body parser for each route
    app.use(function(req, res, next) {
      if (req.headers['x-amz-sns-message-type']) {
          req.headers['content-type'] = 'application/json;charset=UTF-8';
      }
      next();
    });

    // body parser
    // https://groups.google.com/forum/#!msg/express-js/iP2VyhkypHo/5AXQiYN3RPcJ
    // http://expressjs.com/api.html#bodyParser
    // let bodyparser = require('body-parser');
    app.use(bodyparser.json({ limit: 524288000 }));
    app.use(bodyparser.urlencoded({ extended: true }));

    app.use(cookieParser());

    // logger
    if (mlcl_core.mlclconfig.molecuel.log.pathdebug) {
      let morgan = require('morgan');
      app.use(morgan('dev'));
    }

    this.serveStatic = serveStatic;

    // Locals Middleware
    app.use(this.locals);

    this.emit('mlcl::core::middlewareRegister:post', this, app);

    app.use('/public', serveStatic(mlcl_core.rootPath + '/public'));

    // Initialize Modules before configurable routes registration
    _.each(this.modules, (module: any) => {
      let m: any = module.module;
      if ('function' === typeof m.initApplication) {
        m.initApplication(app);
      }
    });

    // Register molecuel routes on express app router

    if (mlcl_core.mlclconfig.molecuel.routes) {
      // iterate over the routes defined in config
      _.each(mlcl_core.mlclconfig.molecuel.routes, (item: any) => {
        if (item.crossdomain) {
          app.use(item.url, function(req, res, next) {
            if (item.crossdomain.domains && _.isArray(item.crossdomain.domains)) {
              res.header('Access-Control-Allow-Origin', item.crossdomain.domains.toString());
            } else {
              res.header('Access-Control-Allow-Origin', '*');
            }
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

            // intercept OPTIONS method
            if ('OPTIONS' === req.method) {
              res.sendStatus(200);
            }
            else {
              next();
            }
          });
        }
        // Configuration may contain direct callbacks for registration
        methods.forEach((method) => {
          if (item[method] === true) {
            // check if there is a permission defined for the item
            if (item.permission) {
              app[method](item.url, (req, res, next) => {
                // check if the user module is activated
                if (this.modules.user) {
                  let usermodule = this.modules.user.module;
                  usermodule.checkPermission(item, req, res, next);
                } else {
                  res.sendStatus(401);
                }
              });
            }
          }
        });
        // Callbacks defintions
        if (item.callbacks) {
          let callbacks = [];
          item.callbacks.forEach((cb) => {
            let m = this.require(cb.module);
            if (!m) {
              return;
            }
            let fn = m[cb.function];
            if ('function' === typeof fn) {
              callbacks.push(fn.bind(m));
            }
            methods.forEach((method) => {
              if (item[method] === true) {
                app[method].apply(app, [item.url, (req, res, next) => {
                  if (item.cacheAge) {
                    res.set('cache-control', 'public, max-age=' + item.cacheAge);
                  }
                  if (item.cacheControl) {
                    res.set('cache-control', item.cacheControl);
                  }
                  this.dispatch(callbacks, req, res, next);
                }]);
              }
            });
          });
        }
        // If configuration contains middleware =true, a middleware function is called to do the registration
        if (item.middleware) {
          if (item.module) {
            let m = this.require(item.module);
            if (!m) {
              return;
            }
            if ('function' === typeof m.middleware) {
              m.middleware(item.config, app);
            }
          }
        }
        // Statics
        if (item.statics) {
          let modulePath;
          if (item.module) {
            let m = this.getModule(item.module);
            if (m) {
              modulePath = m.root;
            }
          }
          item.statics.forEach((currstatic) => {
            let staticPath;
            if (currstatic.module && this.getModule(currstatic.module)) {
              staticPath = this.getModule(currstatic.module).root;
            }
            staticPath = staticPath || modulePath;
            if (staticPath && currstatic.path) {
              let cacheAge = currstatic.cacheAge || '1d';
              app.use(item.url, serveStatic(path.join(staticPath, currstatic.path), {
                maxAge: cacheAge
              }));
            }
          });
        }
      });
    }

    app.use(function(req, res, next) {
      res.status(404).send('Sorry cant find that!');
    });
  }
  checkPermission(item, req, res, next) {
    if (req.headers.authorization) {

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
    let i = 0;
    // handle route callbacks
    function route(err) {
      let fn = callbacks[i++];
      try {
        if ('route' === err) {
          next('route');
        } else if (err && fn) {
          if (fn.length < 4) {
            return route(err);
          }
          fn(err, req, res, route);
        } else if (fn) {
          if (fn.length < 4) {
            return fn(req, res, route);
          }
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
    _.each(mlcl_core.instance.modules, function(module: any) {
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
