import { Fs, fs as fsRaw } from "uv";
import * as fsPromised from "../fs-promised.js";
import * as fs from "../fs-uv.js";
import { noop } from "../fs-uv.js";
import { normalizeBinary, utf8Decode, utf8Encode } from "../utils2.js";
/**
 * Use passed in value if it's a function, otherwise, use fallback noop function.
 */
const maybeCallback = (callback) => typeof callback === "function" ? callback : noop;
export function open(path, ...args) {
    let last = args.length - 1;
    const onOpen = (typeof args[last] === "function" ? args[last] : noop);
    const mode = last ? args[--last] : 0o666;
    const flags = last ? args[--last] : "r";
    fs.open(path, flags, mode, onOpen);
}
export function openSync(path, flags = "r", mode = 0o666) {
    return fs.openSync(path, flags, mode);
}
async function openPromised(path, flags = "r", mode = 0o666) {
    return fsPromised.open(path, flags, mode);
}
export function close(fd, onClose = noop) {
    fs.close(fd, onClose);
}
export function closeSync(fd) {
    fs.closeSync(fd);
}
async function closePromised(fd) {
    return fsPromised.close(fd);
}
export function read(fd, buffer, rawOffset, rawLength, rawPosition, rawCallback) {
    if (typeof fd !== "number") {
        throw new TypeError("Expected number for fd");
    }
    const array = normalizeBinary(buffer);
    if (!array) {
        throw new TypeError("Invalid buffer type");
    }
    const offset = typeof rawOffset === "number" ? rawOffset : 0;
    const length = typeof rawLength === "number" ? rawLength : -1;
    const position = typeof rawPosition === "number" ? rawPosition : -1;
    const callback = maybeCallback(rawCallback || rawPosition || rawLength || rawOffset);
    fs.read(fd, nodeSlice(array, offset, length), position, (error, bytesRead) => callback(error, bytesRead || 0, buffer));
}
export function readSync(fd, buffer, offset, length, position) {
    if (typeof fd !== "number") {
        throw new TypeError("Expected number for fd");
    }
    const array = normalizeBinary(buffer);
    if (!array) {
        throw new TypeError("Invalid buffer type");
    }
    offset = typeof offset === "number" ? offset : 0;
    length = typeof length === "number" ? length : -1;
    position = typeof position === "number" ? position : -1;
    return fs.readSync(fd, nodeSlice(array, offset, length), position);
}
async function readPromised(fd, buffer, offset, length, position) {
    if (typeof fd !== "number") {
        throw new TypeError("Expected number for fd");
    }
    const array = normalizeBinary(buffer);
    if (!array) {
        throw new TypeError("Invalid buffer type");
    }
    offset = typeof offset === "number" ? offset : 0;
    length = typeof length === "number" ? length : -1;
    position = typeof position === "number" ? position : -1;
    return fsPromised.read(fd, nodeSlice(array, offset, length), position);
}
export function write(fd, bufferOrString, offsetOrPosition, lengthOrEncoding, rawPosition, rawCallback) {
    if (typeof fd !== "number") {
        throw new TypeError("Expected number for fd");
    }
    const callback = maybeCallback(rawCallback || rawPosition || lengthOrEncoding || offsetOrPosition);
    if (typeof bufferOrString === "object" && typeof bufferOrString.byteLength === "number") {
        // Write binary values as is.
        const offset = typeof offsetOrPosition === "number" ? offsetOrPosition : 0;
        const length = typeof lengthOrEncoding === "number" ? lengthOrEncoding : -1;
        const position = typeof rawPosition === "number" ? rawPosition : -1;
        const array = normalizeBinary(bufferOrString);
        if (!array) {
            throw new TypeError("Invalid buffer value type");
        }
        fs.write(fd, nodeSlice(array, offset, length), position, onWrite);
    }
    else {
        // Write all other values as UTF8 encoded strings
        const position = typeof offsetOrPosition === "number" ? offsetOrPosition : -1;
        const encoding = typeof lengthOrEncoding === "string" ? lengthOrEncoding : "utf8";
        if (encoding !== "utf8") {
            throw new TypeError("Only utf8 encoding is currently supported");
        }
        fs.write(fd, utf8Encode(String(bufferOrString)), position, onWrite);
    }
    function onWrite(error, bytesWritten) {
        callback(error, bytesWritten || 0, bufferOrString);
    }
}
export function writeSync(fd, bufferOrString, offsetOrPosition, lengthOrEncoding, rawPosition) {
    if (typeof fd !== "number") {
        throw new TypeError("Expected number for fd");
    }
    if (typeof bufferOrString === "object" && typeof bufferOrString.byteLength === "number") {
        // Write binary values as is.
        const offset = typeof offsetOrPosition === "number" ? offsetOrPosition : 0;
        const length = typeof lengthOrEncoding === "number" ? lengthOrEncoding : -1;
        const position = typeof rawPosition === "number" ? rawPosition : -1;
        const array = normalizeBinary(bufferOrString);
        if (!array) {
            throw new TypeError("Invalid buffer value type");
        }
        return fs.writeSync(fd, nodeSlice(array, offset, length), position);
    }
    else {
        // Write all other values as UTF8 encoded strings
        const position = typeof offsetOrPosition === "number" ? offsetOrPosition : -1;
        const encoding = typeof lengthOrEncoding === "string" ? lengthOrEncoding : "utf8";
        if (encoding !== "utf8") {
            throw new TypeError("Only utf8 encoding is currently supported");
        }
        return fs.writeSync(fd, utf8Encode(String(bufferOrString)), position);
    }
}
async function writePromised(fd, bufferOrString, offsetOrPosition, lengthOrEncoding, rawPosition) {
    if (typeof fd !== "number") {
        throw new TypeError("Expected number for fd");
    }
    if (typeof bufferOrString === "object" && typeof bufferOrString.byteLength === "number") {
        // Write binary values as is.
        const offset = typeof offsetOrPosition === "number" ? offsetOrPosition : 0;
        const length = typeof lengthOrEncoding === "number" ? lengthOrEncoding : -1;
        const position = typeof rawPosition === "number" ? rawPosition : -1;
        const array = normalizeBinary(bufferOrString);
        if (!array) {
            throw new TypeError("Invalid buffer value type");
        }
        return fsPromised.write(fd, nodeSlice(array, offset, length), position);
    }
    else {
        // Write all other values as UTF8 encoded strings
        const position = typeof offsetOrPosition === "number" ? offsetOrPosition : -1;
        const encoding = typeof lengthOrEncoding === "string" ? lengthOrEncoding : "utf8";
        if (encoding !== "utf8") {
            throw new TypeError("Only utf8 encoding is currently supported");
        }
        return fsPromised.write(fd, utf8Encode(String(bufferOrString)), position);
    }
}
export function unlink(path, callback = noop) {
    fsRaw.unlink(new Fs(), path, callback);
}
export function unlinkSync(path) {
    fsRaw.unlink(new Fs(), path);
}
const mkdirOptions = (options) => ({ recursive: false, mode: 0o777, ...options });
function dirname(path) {
    const parts = path.split("/");
    parts.pop();
    return parts.join("/");
}
export function mkdir(path, rawOptions, rawCallback) {
    const options = mkdirOptions(rawOptions);
    const callback = maybeCallback(rawCallback || rawOptions);
    if (options.recursive) {
        mkdirRecursive(new Fs(), path, options.mode, callback);
    }
    else {
        fsRaw.mkdir(new Fs(), path, options.mode, callback);
    }
}
function mkdirRecursive(req, path, mode, callback) {
    if (!path) {
        callback(new Error("Recursion reached empty path"));
        return;
    }
    fsRaw.mkdir(req, path, mode, (err) => {
        if (err && err.message.match(/^ENOENT:/)) {
            mkdirRecursive(req, dirname(path), mode, (error) => {
                if (error) {
                    callback(error);
                }
                else {
                    fsRaw.mkdir(req, path, mode, callback);
                }
            });
            return;
        }
        callback(err);
    });
}
export function mkdirSync(path, rawOptions) {
    const options = mkdirOptions(rawOptions);
    if (options.recursive) {
        mkdirRecursiveSync(new Fs(), path, options.mode);
    }
    else {
        fsRaw.mkdir(new Fs(), path, options.mode);
    }
}
function mkdirRecursiveSync(req, path, mode) {
    if (!path) {
        throw new Error("Recursion reached empty path");
        return;
    }
    try {
        fsRaw.mkdir(req, path, mode);
    }
    catch (err) {
        if (err.message.match(/^ENOENT:/)) {
            mkdirRecursiveSync(req, dirname(path), mode);
            fsRaw.mkdir(req, path, mode);
        }
        else {
            throw err;
        }
    }
}
export function rmdir(path, callback) {
    fsRaw.rmdir(new Fs(), path, callback || noop);
}
export function rmdirSync(path) {
    fsRaw.rmdir(new Fs(), path);
}
export function readdir(path, callback = noop) {
    fsRaw.scandir(new Fs(), path, 0, (error, req) => {
        if (error) {
            callback(error);
            return;
        }
        let entry;
        const names = [];
        // tslint:disable-next-line: no-conditional-assignment
        while ((entry = fsRaw.scandirNext(req))) {
            names.push(entry.name);
        }
        callback(error, names);
    });
}
export function readdirSync(path) {
    const req = fsRaw.scandir(new Fs(), path, 0);
    let entry;
    const names = [];
    // tslint:disable-next-line: no-conditional-assignment
    while ((entry = fsRaw.scandirNext(req))) {
        names.push(entry.name);
    }
    return names;
}
export function stat(path, callback) {
    fsRaw.stat(new Fs(), path, callback);
}
export function statSync(path) {
    return fsRaw.stat(new Fs(), path);
}
export function fstat(fd, callback) {
    fsRaw.fstat(new Fs(), fd, callback);
}
export function fstatSync(fd) {
    return fsRaw.fstat(new Fs(), fd);
}
export function lstat(path, callback) {
    fsRaw.lstat(new Fs(), path, callback);
}
export function lstatSync(path) {
    return fsRaw.lstat(new Fs(), path);
}
export function readFile(path, rawOptions, rawCallback) {
    const callback = maybeCallback(rawCallback || rawOptions);
    const flag = typeof rawOptions === "object" && rawOptions && typeof rawOptions.flag !== "undefined"
        ? rawOptions.flag
        : "r";
    const encoding = typeof rawOptions === "string"
        ? rawOptions
        : typeof rawOptions === "object" && rawOptions && typeof rawOptions.encoding === "string"
            ? rawOptions.encoding
            : null;
    if (encoding !== null && encoding !== "utf8") {
        throw new Error(`Unsupported encoding requested: ${encoding}`);
    }
    let fd;
    const parts = [];
    let size = 0;
    const buffer = new Uint8Array(1024);
    fs.open(path, flag, 0o644, onOpen);
    function onOpen(error, newFd) {
        if (typeof newFd !== "number") {
            callback(error);
            return;
        }
        fd = newFd;
        readChunk();
    }
    function readChunk() {
        fs.read(fd, buffer, -1, (error, bytesRead) => {
            if (error || !bytesRead) {
                cleanup(error);
            }
            else {
                parts.push(buffer.slice(0, bytesRead));
                size += bytesRead;
                readChunk();
            }
        });
    }
    function cleanup(error) {
        fs.close(fd, (err) => {
            if (error || err) {
                callback(error || err);
            }
            else {
                let result;
                try {
                    result = joinParts(parts, size, encoding);
                }
                catch (err) {
                    callback(err);
                    return;
                }
                callback(undefined, result);
            }
        });
    }
}
export function readFileSync(path, rawOptions) {
    const flag = typeof rawOptions === "object" && rawOptions && typeof rawOptions.flag !== "undefined"
        ? rawOptions.flag : "r";
    const encoding = typeof rawOptions === "string"
        ? rawOptions
        : typeof rawOptions === "object" && rawOptions && typeof rawOptions.encoding === "string"
            ? rawOptions.encoding : null;
    if (encoding !== null && encoding !== "utf8") {
        throw new Error(`Unsupported encoding requested: ${encoding}`);
    }
    const parts = [];
    let size = 0;
    const buffer = new Uint8Array(1024 * 16);
    const fd = fs.openSync(path, flag, 0o666);
    try {
        let bytesRead;
        // tslint:disable-next-line: no-conditional-assignment
        while (bytesRead = fs.readSync(fd, buffer, -1)) {
            parts.push(buffer.slice(0, bytesRead));
            size += bytesRead;
        }
    }
    finally {
        fs.closeSync(fd);
    }
    return joinParts(parts, size, encoding);
}
function joinParts(parts, size, encoding) {
    const data = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) {
        data.set(part, offset);
        offset += part.byteLength;
    }
    return encoding === null ? data : utf8Decode(data);
}
async function readFilePromised(path, rawOptions) {
    const flag = typeof rawOptions === "object" && rawOptions && typeof rawOptions.flag !== "undefined"
        ? rawOptions.flag : "r";
    const encoding = typeof rawOptions === "string"
        ? rawOptions
        : typeof rawOptions === "object" && rawOptions && typeof rawOptions.encoding === "string"
            ? rawOptions.encoding : null;
    if (encoding !== null && encoding !== "utf8") {
        throw new Error(`Unsupported encoding requested: ${encoding}`);
    }
    const parts = [];
    let size = 0;
    const buffer = new Uint8Array(1024 * 16);
    const fd = await fsPromised.open(path, flag, 0o644);
    try {
        let bytesRead;
        // tslint:disable-next-line: no-conditional-assignment
        while (bytesRead = await fsPromised.read(fd, buffer, -1)) {
            parts.push(buffer.slice(0, bytesRead));
            size += bytesRead;
        }
    }
    finally {
        await fsPromised.close(fd);
    }
    return joinParts(parts, size, encoding);
}
export function writeFile(pathOrFd, textOrBinary, optionsOrCallback, rawCallback) {
    const callback = maybeCallback(rawCallback || optionsOrCallback);
    const { mode, flag, array } = normalizeWriteFileInputs(textOrBinary, optionsOrCallback);
    if (typeof pathOrFd === "number") {
        onOpen(undefined, pathOrFd);
    }
    else {
        fs.open(pathOrFd, flag, mode, onOpen);
    }
    function onOpen(error, fd) {
        if (!fd) {
            callback(error);
            return;
        }
        fs.write(fd, array, -1, (err) => 
        // TODO: find out if we need to check bytesWritten here.
        // I'm assuming the entire buffer is written.
        fs.close(fd, (err2) => callback(err || err2)));
    }
}
export function writeFileSync(pathOrFd, textOrBinary, rawOptions) {
    const { mode, flag, array } = normalizeWriteFileInputs(textOrBinary, rawOptions);
    const fd = typeof pathOrFd === "number"
        ? pathOrFd
        : fs.openSync(pathOrFd, flag, mode);
    try {
        fs.writeSync(fd, array, -1);
        // TODO: find out if we need to check bytesWritten here.
        // I'm assuming the entire buffer is written.
    }
    finally {
        fs.closeSync(fd);
    }
}
async function writeFilePromised(pathOrFd, textOrBinary, rawOptions) {
    const { mode, flag, array } = normalizeWriteFileInputs(textOrBinary, rawOptions);
    const fd = typeof pathOrFd === "number"
        ? pathOrFd
        : await fsPromised.open(pathOrFd, flag, mode);
    try {
        await fsPromised.write(fd, array, 0);
        // TODO: find out if we need to check bytesWritten here.
        // I'm assuming the entire buffer is written.
    }
    finally {
        await fsPromised.close(fd);
    }
}
function normalizeWriteFileInputs(textOrBinary, rawOptions) {
    const options = typeof rawOptions === "object" && rawOptions
        ? rawOptions
        : {};
    const encoding = typeof textOrBinary === "string"
        ? typeof rawOptions === "string"
            ? rawOptions
            : typeof options.encoding === "string"
                ? options.encoding
                : "utf8"
        : null;
    if (encoding !== null && encoding !== "utf8") {
        throw new Error(`Unsupported encoding requested: ${encoding}`);
    }
    const mode = typeof options.mode === "number"
        ? options.mode
        : 0o666;
    const flag = typeof options.flag !== "undefined"
        ? options.flag
        : "w";
    const data = typeof textOrBinary === "string" ? utf8Encode(textOrBinary) : textOrBinary;
    const array = normalizeBinary(data);
    if (!array) {
        throw new Error("Unable to normalize data");
    }
    return { mode, flag, array };
}
export const promises = {
    open: openPromised,
    close: closePromised,
    read: readPromised,
    write: writePromised,
    readFile: readFilePromised,
    writeFile: writeFilePromised,
};
function nodeSlice(array, offset, length) {
    return array.subarray(offset, length === -1 ? undefined : length);
}
//# sourceMappingURL=fs.js.map