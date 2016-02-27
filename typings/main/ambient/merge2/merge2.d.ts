// Compiled using typings@0.6.8
// Source: https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/1034cc35525f804a2e9102f85e6efe4e5af317ad/merge2/merge2.d.ts
// Type definitions for merge2 v0.3.6
// Project: https://github.com/teambition/merge2
// Definitions by: Tanguy Krotoff <https://github.com/tkrotoff>
// Definitions: https://github.com/borisyankov/DefinitelyTyped


declare module 'merge2' {
    interface IOptions {
        end?: boolean;
        objectMode?: boolean;
    }

    interface IMerge2Stream extends NodeJS.ReadWriteStream {
        add(...args: Array<NodeJS.ReadWriteStream | IMerge2Stream | Array<NodeJS.ReadWriteStream | IMerge2Stream | IOptions>>): IMerge2Stream;
    }

    interface IMerge2 {
        (...args: Array<NodeJS.ReadWriteStream | IMerge2Stream | Array<NodeJS.ReadWriteStream | IMerge2Stream> | IOptions>): IMerge2Stream;
    }

    var _tmp: IMerge2;
    export = _tmp;
}