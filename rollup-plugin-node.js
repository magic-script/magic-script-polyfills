/* global require, module, __dirname */
const { readdirSync } = require('fs');

/**
 * Rollup Plugin that injects node/*.js as node.js builtins
 * 
 * Include as plugin before commonjs and node resolve plugins.
 */
module.exports = () => {
    const nodeDir = __dirname + '/src/node/';
    const modules = {};
    for (const file of readdirSync(nodeDir)) {
        const match = file.match(/^([^.]*)\.js$/);
        if (!match) continue;
        const [, base] = match;
        modules[base] = nodeDir + file;
    }

    return {
        /**
         * Resolver that redirects for node.js builtins that are implemented in the polyfill.
         * @param {string} id 
         * @returns {string|undefined}
         */
        resolveId(id) {
            return modules[id];
        }
    };
}