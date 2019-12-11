import { p } from "./pretty-print.js";
const console = globalThis.console;
const consoleLog = console.log
console.log = (...args) => {
    p(...args);
    return consoleLog.call(console, ...args);
}