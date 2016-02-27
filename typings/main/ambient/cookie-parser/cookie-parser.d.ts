// Compiled using typings@0.6.8
// Source: https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/e2001653ffbd99c2fc80a272ca80d8c958136de4/cookie-parser/cookie-parser.d.ts
// Type definitions for cookie-parser v1.3.4
// Project: https://github.com/expressjs/cookie-parser
// Definitions by: Santi Albo <https://github.com/santialbo/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped


declare module "cookie-parser" {
    import express = require('express');
    function e(secret?: string, options?: any): express.RequestHandler;
    namespace e{}
    export = e;
}