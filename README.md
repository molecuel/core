# Core module for molecuel Framework

mlcl_core is the core module for the molecuel application framework. It's initialization is based on the mlcl_di Typescript dependency injection module.

The version 2.x branch supports Subjects and streams based on rxjs. 
Streams can be used as DataStreams. For example for save handlers and much more. The streams in this case works like a queue of handlers for a dataset.
Subjects can be used as EventEmitters (but should not be used too much).

The core module is initialized as real Singleton based on the dependency injection module.

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

## API Documentation

The current API Documentation can be found on <https://molecuel.github.io/mlcl_core/>
