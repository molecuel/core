'use strict';
const handlebars = require('handlebars');
class mlcl_utils {
    constructor(molecuel) {
        this.molecuel = molecuel;
    }
    getVar(variable, req, res) {
        let self = this;
        return self.resolve(variable, { req: req, res: res });
    }
    resolve(text, options) {
        let template = handlebars.compile(text);
        return template(options);
    }
    ;
}
module.exports = mlcl_utils;

//# sourceMappingURL=utils.js.map
