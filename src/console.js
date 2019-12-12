import { prettyPrint, getWidth } from "./pretty-print.js";
const console = globalThis.console;
const consoleLog = console.log
console.log = (...args) => {
    const TERMINAL_WIDTH = getWidth();
    let output = args.map((arg) => typeof arg === 'string' ? arg : prettyPrint(arg, 5)).join(" ");
    const stack = new Error().stack;
    if (stack) {
        const line = stack.split("\n")[2];
        if (line) {
            const match = line.match(/at (.*)/);
            if (match) {
                const meta = match[1];
                output = `\x1b[s\x1b[${TERMINAL_WIDTH - meta.length}C\x1b[30;1m${meta}\x1b[0m\x1b[u` + output;
            }
        }
    }
    for (const line of output.split("\n")) {
        print(line);
    }

    return consoleLog.call(console, ...args);
}
