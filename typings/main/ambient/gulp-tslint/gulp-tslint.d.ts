// Compiled using typings@0.6.8
// Source: https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/ba3d78e4b5965cedf44a52e9c36fb72932352c16/gulp-tslint/gulp-tslint.d.ts
// Type definitions for gulp-tslint 3.6.0
// Project: https://github.com/panuhorsmalahti/gulp-tslint
// Definitions by: Asana <https://asana.com>
// Definitions: https://github.com/borisyankov/DefinitelyTyped


declare module "gulp-tslint" {
    import vinyl = require("vinyl");

    namespace gulpTsLint {
        interface GulpTsLint {
            (options?: Options): NodeJS.ReadWriteStream;
            report(reporter?: Reporter, options?: ReportOptions): NodeJS.ReadWriteStream;
            report(options?: ReportOptions): NodeJS.ReadWriteStream;
        }

        interface Options {
            configuration?: {},
            rulesDirectory?: string,
            tslint?: GulpTsLint
        }

        interface ReportOptions {
            emitError?: boolean,
            reportLimit?: number,
            summarizeFailureOutput?: boolean
        }

        interface Position {
            position: number;
            line: number;
            character: number;
        }

        interface Output {
            name: string;
            failure: string;
            startPosition: Position;
            endPosition: Position;
            ruleName: string;
        }

        type Reporter = string|((output: Output[], file: vinyl, options: ReportOptions) => any);
    }

    var gulpTsLint: gulpTsLint.GulpTsLint;
    export = gulpTsLint;
}