'use strict';
const path = require('path');
const _ = require('lodash');
const url = require('url');
const async = require('async');
const events = require('events');
const mlcl_utils = require('./lib/utils');
const mlcl_log = require('mlcl_log');
const cookieParser = require('cookie-parser');
const bodyparser = require('body-parser');
const serveStatic = require('serve-static');
let methods = require('methods');
class mlcl_core extends events.EventEmitter {
    constructor(mconfig) {
        super();
        this.servers = [];
        mlcl_core.rootPath = path.resolve(process.cwd());
        if (mconfig) {
            mlcl_core.mlclconfig = mconfig;
        }
        if (!mlcl_core.instance) {
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
                paths: function () {
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
            }
            else {
                throw new Error('no config found');
            }
        }
        ;
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
        }
        else {
            callback();
        }
    }
    initModule(item, callback) {
        let self = this;
        let location = require.resolve(item.module_name);
        let dirname = path.dirname(location);
        let conf = require(path.join(dirname, 'config.js'));
        let modfile = require(item.module_name);
        let module;
        if (modfile.loaderversion === 2) {
            module = new modfile(self, conf);
        }
        else {
            module = modfile(self, conf);
        }
        let name = conf.name;
        let defaults = {
            name: name,
            module: module,
            root: dirname
        };
        self.modules[item.name] = defaults;
        process.nextTick(function () {
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
        let allowCrossDomain = function (req, res, next) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
            if ('OPTIONS' === req.method) {
                res.sendStatus(200);
            }
            else {
                next();
            }
        };
        app.enable('strict routing');
        this.emit('mlcl::core::middlewareRegister:pre', this, app);
        app.use(bodyparser.json({ limit: '50mb' }));
        app.use(bodyparser.urlencoded({ extended: true }));
        app.use(cookieParser());
        if (mlcl_core.mlclconfig.molecuel.log.pathdebug) {
            let morgan = require('morgan');
            app.use(morgan('dev'));
        }
        this.serveStatic = serveStatic;
        app.use(this.locals);
        this.emit('mlcl::core::middlewareRegister:post', this, app);
        app.use('/public', serveStatic(mlcl_core.rootPath + '/public'));
        _.each(this.modules, (module) => {
            let m = module.module;
            if ('function' === typeof m.initApplication) {
                m.initApplication(app);
            }
        });
        if (mlcl_core.mlclconfig.molecuel.routes) {
            _.each(mlcl_core.mlclconfig.molecuel.routes, (item) => {
                if (item.crossdomain) {
                    app.use(item.url, allowCrossDomain);
                }
                methods.forEach((method) => {
                    if (item[method] === true) {
                        if (item.permission) {
                            app[method](item.url, (req, res, next) => {
                                if (this.modules.user) {
                                    let usermodule = this.modules.user.module;
                                    usermodule.checkPermission(item, req, res, next);
                                }
                                else {
                                    res.sendStatus(401);
                                }
                            });
                        }
                    }
                });
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
                                        this.dispatch(callbacks, req, res, next);
                                    }]);
                            }
                        });
                    });
                }
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
                            app.use(item.url, serveStatic(path.join(staticPath, currstatic.path)));
                        }
                    });
                }
            });
        }
        app.use(function (req, res, next) {
            res.status(404).send('Sorry cant find that!');
        });
    }
    checkPermission(item, req, res, next) {
        if (req.headers.authorization) {
        }
        else {
            res.sendStatus(401);
        }
    }
    dispatch(callbacks, req, res, next) {
        let i = 0;
        function route(err) {
            let fn = callbacks[i++];
            try {
                if ('route' === err) {
                    next('route');
                }
                else if (err && fn) {
                    if (fn.length < 4) {
                        return route(err);
                    }
                    fn(err, req, res, route);
                }
                else if (fn) {
                    if (fn.length < 4) {
                        return fn(req, res, route);
                    }
                    route(null);
                }
                else {
                    next(err);
                }
            }
            catch (err) {
                route(err);
            }
        }
        route(null);
    }
    locals(req, res, next) {
        res.locals = res.locals || {};
        res.locals.path = req.path;
        res.locals.mlcl = {
            modules: {}
        };
        _.each(mlcl_core.instance.modules, function (module) {
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
module.exports = mlcl_core;
