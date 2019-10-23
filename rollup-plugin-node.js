/* global require, module, __dirname */

const { readdirSync } = require('fs');
const nodeDir = __dirname + '/node/';
console.log({nodeDir});
const modules = {};
for (const file of readdirSync(nodeDir)) {
  const [base] = file.match(/[^.]*/);
  modules[base] = nodeDir + file;
}
console.log({modules});

/**
 * Rollup Plugin that injects node/*.js as node.js builtins
 * 
 * Include as plugin before commonjs and node resolve plugins.
 */
module.exports = {
  /**
   * Resolver that redirects for node.js builtins that are implemented in the polyfill.
   * @param {string} id 
   * @returns {string|undefined}
   */
  resolveId(id) {
    return modules[id];
  }
};

