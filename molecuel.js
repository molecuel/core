// Dependencies
var path    = require('path');
var _       = require('underscore');
var url     = require('url');
var fs      = require('fs');
var async   = require('async');
var util    = require('util');
var methods = require('methods');
var EventEmitter = require('events').EventEmitter;
var mlcl_utils = require('./lib/utils');
var mlcl_log = require('mlcl_log');
var cookieParser = require('cookie-parser');
var bodyparser = require('body-parser');
var multer = require('multer');

// Paths
var rootPath = path.resolve(process.cwd());

// Instance variables
var Molecuel;
var instance;
var mlclconfig;

// Molecuel Constructor implements singleton pattern
// initialization is done only once
Molecuel = function (mconfig) {
  if(mconfig) {
    mlclconfig = mconfig;
  }
  var self = this;
  if (!instance) { //Singleton
    instance = this;
    instance.config = mlclconfig;
    instance.modules = {};
    instance.booting = {};
    mlcl_log(this);
    instance.log.info('molecuel', 'instance created');
    instance.utils = new mlcl_utils();

    instance.serverroles = {
      worker: true,
      server: true
    }

    if(process.env && parseInt(process.env.WORKER) === 0) {
      instance.serverroles.worker = false;
    }

    if(process.env && parseInt(process.env.SERVER) === 0) {
      instance.serverroles.server = false;
    }

    self.on('mlcl::core::module:init:start', self.markModuleInitStart);
    self.on('mlcl::core::module:init:complete', self.markModuleInitComplete);
    self.emit('mlcl::core::module:init:start', self, 'mlcl');


    _.extend(instance, {
      name: "",

      paths: function() {
        return {
          'root': rootPath
        }
      }
    });
    instance.count = 0;
    async.series([
      function(callback) {
        self.initModules(callback);
      },
      function(callback) {
        // event when all modules have entered init phase
        self.emit('mlcl::core::init:post', instance);
        self.emit('mlcl::core::module:init:complete', self, 'mlcl');
      }
    ]);
  }

  return instance;

}
// extend the EventEmitter class using our Molecuel class
util.inherits(Molecuel, EventEmitter);

Molecuel.prototype.markModuleInitStart = function(module, name) {
  var self = this;
  self.booting[name] = true;
};

Molecuel.prototype.markModuleInitComplete = function(module, name) {
  var self = this;
  delete self.booting[name];
  if(!Object.keys(self.booting).length) {
    //now I am ready
    self.emit('init', instance);
  }
};

// Loads the module list from configuration
Molecuel.prototype.initModules = function(callback) {
  var self = this;
  var currconfig = mlclconfig.molecuel;
  this.config = currconfig;
  if(!currconfig) {
    if(mlclconfig) {
      currconfig = mlclconfig;
    } else {
      throw new Error('no config found')
    }
  };
  if(!_.isObject(currconfig.modules)) throw new Error('no config object found');
  var arr = Object.keys(currconfig.modules);

  if(arr.length > 0) {
    async.each(arr, function(key, cb) {
      var item = currconfig.modules[key];
      item.module_name = key;
      self.initModule(item, cb);
    }, function(err) {
      callback();
    }, self);
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
Molecuel.prototype.initModule = function(item, callback) {
  var self = this;
  var location  = require.resolve(item.module_name);
  var dirname   = path.dirname(location);
  var conf      = require(path.join(dirname, 'config.js'));
  var module    = require(item.module_name)(self, conf);

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
};

Molecuel.prototype.getModule = function(name) {
  if(this.modules[name]) {
    return this.modules[name];
  }
}

Molecuel.prototype.require = function(name) {
  if(m = this.getModule(name)) {
    return m.module;
  }
}

Molecuel.prototype.parseRequest = function(req) {
  var u = url.parse(req.protocol + "://" + req.headers.host + req.url);
  return u;
}

// Initialize Express Application
// register middleware
Molecuel.prototype.initApplication = function(app) {
  var self = this;

  self.app = app;

  // @todo rewrite this to make it configureable
  var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
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
  app.use(multer());

  app.use(cookieParser());

  //logger
  var morgan = require('morgan');
  app.use(morgan('dev')); 					// log every request to the console

  var serveStatic = require('serve-static');
  this.serveStatic = serveStatic;

  // Locals Middleware
  app.use(locals);

  this.emit('mlcl::core::middlewareRegister:post', this, app);

  app.use('/public', serveStatic(rootPath + '/public'));

  // Initialize Modules before configurable routes registration
  _.each(self.modules, function(module) {
    var m = module.module;
    if('function' == typeof m.initApplication) {
      m.initApplication(app);
    }
  });

  // Register molecuel routes on express app router

  if(mlclconfig.molecuel.routes) {
    // iterate over the routes defined in config
    _.each(mlclconfig.molecuel.routes, function(item) {
      if(item.crossdomain) {
        app.use(item.url, allowCrossDomain);
      }
      // Configuration may contain direct callbacks for registration
      methods.forEach(function(method) {
        if(item[method] == true) {
          // check if there is a permission defined for the item
          if(item.permission) {
            app[method](item.url, function(req, res, next) {
              // check if the user module is activated
              if(self.modules.user) {
                var usermodule = self.modules.user.module;
                usermodule.checkPermission(item, req, res, next);
              } else {
                res.send(401);
              }
            });
          }
        }
      });
      // Callbacks defintions
      if(item.callbacks) {
        var callbacks = [];
        item.callbacks.forEach(function(cb) {
          var m = self.require(cb.module);
          if(!m) return;
          var fn = m[cb.function];
          if('function' == typeof fn) {
            callbacks.push(fn.bind(m));
          }
          methods.forEach(function(method) {
            if(item[method] == true) {
              app[method].apply(app, [item.url, function(req, res, next) {
                dispatch(callbacks, req, res, next);
              }]);
            }
          });
        });
      }
      // If configuration contains middleware =true, a middleware function is called to do the registration
      if(item.middleware) {
        if(item.module) {
          var m = self.require(item.module);
          if(!m) return;
          if('function' == typeof m.middleware) {
            m.middleware(item.config, app);
          }
        }
      }
      // Statics
      if(item.statics) {
        if(item.module) {
          var m = self.getModule(item.module);
          if(m) {
            var modulePath = m.root;
          }
        }
        item.statics.forEach(function(static) {
          var staticPath;
          if(static.module && self.getModule(static.module)) {
            staticPath = self.getModule(static.module).root;
          }
          staticPath = staticPath || modulePath;
          if(staticPath && static.path) {
            app.use(item.url, serveStatic(path.join(staticPath, static.path)));
          }
        });
      }
    });
  }

  app.use(function(req, res, next){
    res.send(404, 'Sorry cant find that!');
  });
}

function checkPermission(item, req, res, next) {
  if(req.headers.authorization) {

  } else {
    // ** send 401 directly - Should be a rendered page later
    res.send(401);
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
function dispatch(callbacks, req, res, next) {
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
        route();
      } else {
        next(err);
      }
    } catch (err) {
      route(err);
    }
  }
  // @todo: how to handle errors, next [...]
  route();
}

/**
 * LOCALS Middleware, sets Molecuel default locals
 *
 * @param req
 * @param res
 * @param next
 */
function locals(req, res, next) {
  // Make sure locals object exists
  res.locals = res.locals || {};
  res.locals.path = req.path;
  res.locals.mlcl = {
    modules: {}
  };

  // Initialize module objects on locals
  _.each(instance.modules, function(module) {
    res.locals.mlcl.modules[module.name] = {
      blocks: {},
      data: {}
    };
  });

  next();
}

/**
 * sets the main page content
 */
Molecuel.prototype.setContent = function(res, region, data) {
  res.locals = res.locals || {};
  res.locals.data = res.locals.data || {};
  res.locals.data[region] = res.locals.data[region] || {};
  res.locals.data[region] = data;
}

/**
 * sets the main page content
 */
Molecuel.prototype.getContent = function(res) {
  return res.locals.data;
}

module.exports = Molecuel;
