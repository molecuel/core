[![Build Status](https://travis-ci.org/molecuel/core.svg?branch=master)](https://travis-ci.org/molecuel/core)
[![Coverage Status](https://coveralls.io/repos/github/molecuel/mlcl_core/badge.svg?branch=master)](https://coveralls.io/github/molecuel/mlcl_core?branch=master)

# Core module for molecuel Framework

@molecuel/core is the core module for the molecuel application framework. It's initialization is based on the @molecuel/di Typescript dependency injection module.

The version 2.x branch supports Subjects and streams based on rxjs. 
Streams can be used as DataStreams. For example for save handlers and much more. The streams in this case works like a queue of handlers for a dataset.
Subjects can be used as EventEmitters (but should not be used too much).

The core module is initialized as real Singleton based on the dependency injection module.


## Registering data functions<a name="regdatafunc"></a>

Data functions are very important for a typical molecuel application. They are async and can be registered to be executed by various modules. For example a http or socket module can use a registered data function to return data from a datbase.
The routes can be registered in the configuration.
If the http module (for example) has a configured route which points to a @dataRead function it creates a app.get route from it and the return value of the registered function will be returned via http.

Data Decorator provided by the core module:
@dataRead - Tags a data function for reading data
@dataCreate - Tags a data function for creating data
@dataUpdate - Tags a data function for updating data
@dataReplace - Tags a data function for replacing data. This is for example used by HTTP Put request which know the exact URI.
@dataDelete - Tags a data function for deleting data
@mapDataParams - Maps request parameters to the data function and specifies limits and type for parameters to enhance security.

Example for a tagged class: 

```js
import {di, injectable} from '@molecuel/di';
import {MlclCore, dataRead, dataCreate, dataUpdate, dataDelete, mapDataParams} from '../dist';

@injectable
class MyDataFunctionClass {
  @dataCreate()
  public myDataCreaCheck() {
    return true;
  }
  @dataUpdate()
  public myDataUpdateCheck() {
    return true;
  }
  @dataDelete()
  public async myDataDeleteCheck() {
    return true;
  }
  @mapDataParams([
    new MlclDataParam('id', 'id', 'integer', 999),
    new MlclDataParam('test', 'name', 'string', 10)
  ])
  @dataRead()
  public async myDataReadCheck(id: number, name: string) {
    return {
      data: (id + ' = "' + name+'"')
    };
  }
}
di.bootstrap(MlclCore);
```

### Init system

The init system is based on the stream feature of molecuel core described below but can be combined with a method decorator on a injectable class to set different init methods.

For example database initialization can have a higher priority ( lower init value ) or port listen directives can have higher priorities.

The code example show how it works internally ( this can be used by every molecuel module and this is just example code). For example a http module can have two or more init functions. The first to initialize the routes and the second one to add the port listener after some other init priorities have been initialized.

```js
import {di, injectable} from '@molecuel/di';
import {Observable} from '@reactivex/rxjs';
import {MlclCore, init} from '../dist';
di.bootstrap(MlclCore);
let core = di.getInstance('MlclCore');
let obs1Success;
let obs2Success;
// this is normally part of a module and can be added via imports
@injectable
class MyInitTestClass {
  // sets the init priority to 20
  @init(20)
  public myinit(x) {
    return Observable.create(y => {
      setTimeout(function() {
        if(obs2Success) {
          obs1Success = true;
          console.log('huhu');
          y.next(x);
        } else {
          y.error(new Error('Wrong priority'));
        }
        y.complete();
      }, 100);
    });
  }
}
// this is normally part of a module and can be added via imports
@injectable
class MyInitTestClass2 {
  // sets the init priority to 10
  @init(50)
  public myini2t(x) {
    return Observable.create(y => {
      setTimeout(function() {
        if(!obs1Success) {
          obs2Success = true;
          console.log('here');
          y.next(x);
        } else {
          y.error(new Error('Wrong priority'));
        }
        y.complete();
      }, 100);
    });
  }
}
let mlclInit = async () => core.init();
mlclInit();
// alternative init with promise
// this is the important part to run the complete init stream of the molecuel framework
/*core.init().then(function() {
  console.log('cherr');
});*/
```


### Subject example

```js
import {di} from 'mlcl_di';
import {Subject, Observable} from '@reactivex/rxjs';
import {MlclCore, MlclMessage} from '../dist';
di.bootstrap(MlclCore);
let core = di.getInstance('MlclCore')
let initSubject = core.createSubject('init');
initSubject.subscribe(function(msg: MlclMessage) {
    console.log(msg);
});
let msg = new MlclMessage();
msg.topic= 'test';
msg.message = 'hello world';
initSubject.next(msg);
```

### Stream example
```js
import {di} from 'mlcl_di';
import {Subject, Observable} from '@reactivex/rxjs';
import {MlclCore, MlclStream} from '../dist';
di.bootstrap(MlclCore);
let core = di.getInstance('MlclCore')
let testStream = core.createStream('teststream');
let obs1 = x=> Observable.create(y => {
  setTimeout(function() {
    if(obs2Success) {
      obs1Success = true;
      y.next(x);
    } else {
      y.error(new Error('Wrong priority'));
    }
    y.complete();
  }, 100);
});

let obs2 = x => Observable.create(y => {
  setTimeout(function() {
    if(!obs1Success) {
      obs2Success = true;
      x.firstname = 'Dominic2';
      y.next(x);
    } else {
      y.error(new Error('Wrong priority'));
    }
    y.complete();
  }, 500);
});
testStream.addObserverFactory(obs1, 50);
testStream.addObserverFactory(obs2, 10);

let myobs = Observable.from([{firstname: 'Dominic'}]);
myobs = testStream.renderStream(myobs);
myobs.subscribe(function(res) {
  console.log('got result');
}, function(err) {
  should.not.exist(err);
}, function() {
  console.log('execution of all observables completed');
});
```

## Config handling

The default config will be searched in the current working directory of the process in the config subfolder. If no NODE_ENV variable is set the development.json will be used.
It's possible to override the configpath via environment variables.

configpath is the path and will be combined with the NODE_ENV.
configfilepath is the full path to a json configuration.

```js
import {di} from 'mlcl_di';
import {MlclConfig} from '../dist';

let config = di.getInstance('MlclConfig');
// returns the whole configuration
config.getConfig();
// returns a dot notated path
config.getConfig('database.url');
```

## Parameter handling

To handle parsing of an object with parameters for use in any registered function (cf. [Registering data functions](#regdatafunc)), use the core's renderDataParams method which returns an array of values to supply said function with, according to previously defined mapping.

```js
import {di} from 'mlcl_di';

let core = di.getInstance('MlclCore');
let functionParams = core.renderDataParams({id: '500', test: 'Hello!'}, 'MyDataFunctionClass', 'myDataReadCheck');
let functionResult = await (di.getInstance('MyDataFunctionClass').myDataReadCheck(...functionParams));

```

## API Documentation

The current API Documentation can be found on <https://molecuel.github.io/core/>
