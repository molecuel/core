# Dependency injection for Typescript

mlcl_di is a dependency injection module mainly created for the Molecuel application framework but can be used with any Node project. It's highly inspired by the Spring java framework. The development is focused on simple usage and good code readability.

We also developed an option to define and reuse Singleton instances in your code. We are using the latest features from Typescript, ECMAScript and Reflect Metadata.

## Example

```js
import {di, injectable, singleton, component} from 'mlcl_di';

@injectable
class InnerClass {
  constructor() {

  }
}
@injectable
class SomeClass {
  inside: InnerClass;
  constructor(inj: InnerClass) {
    this.inside = inj;
  }
  someMethod(){
    console.log('did something.');
  }
}

@singleton
class MySingletonClass {
  prop: any;
  constructor(inj: SomeClass) {
    this.prop = inj || false;
  }
}

@component
class MyComponent {
  prop: any;
  constructor(inj: SomeClass) {
    this.prop = inj || false;
  }
}

@component
@singleton
class MySingletonComponent {
  prop: any;
  constructor(inj: SomeClass) {
    this.prop = inj || false;
  }
}
// automatically initializes all components and it's dependencies
di.bootstrap();
```` 

## API Documentation

The current API Documentation can be found on <https://molecuel.github.io/mlcl_di/>
