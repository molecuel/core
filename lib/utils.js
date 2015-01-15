var handlebars = require('handlebars');

var utils = function utils(molecuel) {
  this.molecuel = molecuel;
};


/**
 * getVar - resolves a variable value based on a handlebars pattern
 *
 * @param  {type} pattern | e.g. {{req.locale}}
 * @param  {type} req      express request
 * @param  {type} res      express response
 * @return {type}          description
 */
utils.prototype.getVar = function getVar(variable, req, res) {
  var self = this;
  return self.resolve(variable, {req:req, res:res});
};


/**
 * resolve - resolves a handlebars compatible expression
 *
 * @param  {type} text    | e.g. {{variable}}
 * @param  {type} options | context data (this)
 * @return {type} text    | the resolved values
 */
utils.prototype.resolve = function resolve(text, options) {
  var template = handlebars.compile(text);
  return template(options);
};

module.exports = utils;
