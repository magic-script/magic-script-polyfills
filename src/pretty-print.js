let TERMINAL_WIDTH = 120;
export function setWidth(width = 120) {
    TERMINAL_WIDTH = width;
}
export const themes = {
    // nice color theme using 16 ansi colors
    16: {
        property: "0;37",
        sep: "1;30",
        braces: "1;30",
        nil: "1;30",
        boolean: "0;33",
        number: "1;33",
        string: "0;32",
        quotes: "1;32",
        escape: "1;32",
        function: "0;35",
        thread: "1;35",
        object: "1;34",
        regexp: "1;36",
        json: "0;36",
        err: "1;31",
        success: "1;33;42",
        failure: "1;33;41",
        highlight: "1;36;44",
    },
    // nice color theme using ansi 256-mode colors
    256: {
        property: "38;5;253",
        braces: "38;5;247",
        sep: "38;5;240",
        nil: "38;5;244",
        boolean: "38;5;220",
        number: "38;5;202",
        string: "38;5;34",
        quotes: "38;5;40",
        escape: "38;5;46",
        function: "38;5;129",
        thread: "38;5;199",
        object: "38;5;27",
        regexp: "38;5;39",
        json: "38;5;69",
        err: "38;5;196",
        success: "38;5;120;48;5;22",
        failure: "38;5;215;48;5;52",
        highlight: "38;5;45;48;5;236",
    },
};
let theme = themes[256];
export function setTheme(newTheme) {
    if (typeof newTheme === "number") {
        theme = themes[newTheme];
    }
    else {
        theme = newTheme;
    }
}
export function color(colorName) {
    return `\x1b[${colorName ? theme[colorName] : "0"}m`;
}
export function colorize(colorName, str, resetName) {
    // print("colorize", colorName, JSON.stringify(str));
    return color(colorName) + String(str) + color(resetName);
}
const quote = colorize("quotes", "'", "string");
const quote2 = colorize("quotes", "'");
const dquote = colorize("quotes", '"', "string");
const dquote2 = colorize("quotes", '"');
const obrace = colorize("braces", "{");
const cbrace = colorize("braces", "}");
const obracket = colorize("property", "[");
const cbracket = colorize("property", "]");
const comma = colorize("sep", ",");
const colon = colorize("sep", ": ");
const undef = colorize("nil", "undefined");
const nul = colorize("object", "null");
const tru = colorize("boolean", "true");
const fal = colorize("boolean", "false");
const json = colorize("json", "toJSON");
// String literal escapes treated special in JS
const stringEscapes = {};
const specialEscapes = {
    "\0": "\\0",
    "\b": "\\b",
    "\t": "\\t",
    "\n": "\\n",
    "\v": "\\v",
    "\f": "\\f",
    "\r": "\\r",
    "\"": "\\\"",
    "'": "\\'",
    "\\": "\\\\",
};
// TODO: add unicode ranges for unprintable unicode values
const singleEscape = /['\\\0-\x1F\x7F-\x9F]/g;
const doubleEscape = /["\\\0-\x1F\x7F-\x9F]/g;
function charEscape(char) {
    const special = specialEscapes[char];
    if (special) {
        return colorize("escape", special, "string");
    }
    const point = char.codePointAt(0);
    if (typeof point === "undefined") {
        return colorize("err", "\\?", "string");
    }
    const hex = point.toString(16);
    return colorize("escape", hex.length === 1
        ? "\\x0" + hex
        : hex.length === 2
            ? "\\x" + hex
            : hex.length === 3
                ? "\\u0" + hex
                : hex.length === 4
                    ? "\\u" + hex
                    : "\\u{" + hex + "}", "string");
}
function cachedCharEscape(char) {
    return stringEscapes[char] || (stringEscapes[char] = charEscape(char));
}
function stringEscape(str) {
    if (/'/.test(str) && !/"/.test(str)) {
        return dquote + str.replace(doubleEscape, cachedCharEscape) + dquote2;
    }
    else {
        return quote + str.replace(singleEscape, cachedCharEscape) + quote2;
    }
}
function printKey(key) {
    return /^[$A-Z_][0-9A-Z_$]*$/i.test(key) ? colorize("property", key) : prettyPrint(key);
}
export function prettyPrint(val, depthLeft = 2, indent = 0) {
    const seen = new Set();
    return inspect(val, depthLeft, indent);
    // tslint:disable-next-line: no-shadowed-variable
    function inspect(val, depthLeft = 2, indent = 0) {
        if (val === undefined) {
            return undef;
        }
        if (val === null) {
            return nul;
        }
        const typ = typeof val;
        if (typ === "boolean") {
            return val ? tru : fal;
        }
        if (typ === "string") {
            return stringEscape(val);
        }
        if (typ === "number") {
            return colorize("number", val);
        }
        if (typ === "object" || typ === "function") {
            const original = val;
            let special = "";
            let isJSON = false;
            if (typeof val.toJSON === "function") {
                val = val.toJSON();
                isJSON = true;
            }
            const isArray = Array.isArray(val) || ArrayBuffer.isView(val) && typeof val.length === "number";
            let name = "";
            const Kind = original.constructor;
            const keys = (!isArray || val.length < depthLeft * 20)
                ? Object.keys(val).filter((key, i) => "" + i !== key) : [];
            const entries = [];
            if (seen.has(val)) {
                return "...";
            }
            seen.add(val);
            if (depthLeft) {
                let i = 0;
                const max = depthLeft * 20;
                if (isArray) {
                    for (const entry of val) {
                        if (++i > max) {
                            entries.push("...");
                            break;
                        }
                        entries.push(inspect(entry, depthLeft - 1, indent + 2));
                    }
                }
                i = 0;
                for (const key of keys) {
                    if (++i > max) {
                        entries.push("...");
                        break;
                    }
                    entries.push(printKey(key) + colon + inspect(val[key], depthLeft - 1, indent + 2));
                }
            }
            else {
                if (keys.length || isArray && val.length) {
                    entries.push("...");
                }
            }
            if (typ === "function") {
                const match = ("" + val).match(/(.*){/);
                special = colorize("function", match ? `${match[1]}{...}` : val);
            }
            else if (Kind === RegExp) {
                special = colorize("regexp", val);
            }
            if (isJSON || special && entries.length || !special && Kind !== (isArray ? Array : Object)) {
                name = typeof Kind === "function" ? colorize("object", Kind.name) : inspect(Kind, 0);
                if (isJSON) {
                    name += "." + json;
                }
            }
            const open = isArray ? obracket : obrace;
            const close = isArray ? cbracket : cbrace;
            if (entries.length || name) {
                const lineLength = TERMINAL_WIDTH - indent;
                const multiLine = entries.some((entry) => entry.indexOf("\n") >= 0);
                // First try to fit entry on one line
                if (!multiLine) {
                    const line = name + open + " " + special + (special ? " " : "") +
                        entries.join(comma + " ") + " " + close;
                    if (measure(line) <= lineLength) {
                        return line;
                    }
                }
                // Otherwise flow into multiple lines
                const indentation = " ".repeat(indent);
                const groups = [];
                const group = [];
                let lineLeft = lineLength;
                for (const entry of entries) {
                    const size = measure(entry);
                    if (group.length && size + 2 >= lineLeft) {
                        groups.push(group.join(comma + " "));
                        group.length = 0;
                        lineLeft = lineLength;
                    }
                    lineLeft -= size + 2;
                    group.push(entry);
                }
                if (group.length) {
                    groups.push(group.join(comma + " "));
                    group.length = 0;
                }
                return name + open + " " + special + "\n  " + indentation +
                    groups.join(comma + "\n  " + indentation) + "\n" + indentation + close;
            }
            if (special) {
                return special;
            }
            return open + close;
        }
        return String(val);
    }
}
/** Give length of line with formatting stripped */
function measure(str) {
    return str.replace(/\x1b\[[^m]*m/g, "").length;
}
export function p(...args) {
    let output = args.map((arg) => prettyPrint(arg, 5)).join(" ");
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
}
//# sourceMappingURL=pretty-print.js.map