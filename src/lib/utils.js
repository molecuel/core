'use strict';
class mlcl_utils {
    constructor(molecuel) {
        this.molecuel = molecuel;
    }
    getVar(variable, req, res) {
        var self = this;
        return self.resolve(variable, { req: req, res: res });
    }
    resolve(text, options) {
        var template = handlebars.compile(text);
        return template(options);
    }
    ;
}
