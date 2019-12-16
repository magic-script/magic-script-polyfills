import { Flags, Fs, fs as fsRaw, StatEntry } from "uv";
import * as fsPromised from "../fs-promised.js";
import * as fs from "../fs-uv.js";
import { noop, OnDone, OnResult, OnResults } from "../fs-uv.js";
import { Binary, normalizeBinary, utf8Decode, utf8Encode } from "../utils2.js";

/**
 * Use passed in value if it's a function, otherwise, use fallback noop function.
 */
const maybeCallback = (callback: any): OnResults<any[]> =>
    typeof callback === "function" ? callback : noop;

export function open(path: string, onOpen: OnResult<number>): void;
export function open(path: string, flags: Flags, onOpen: OnResult<number>): void;
export function open(path: string, flags: Flags, mode: number, onOpen: OnResult<number>): void;
export function open(path: string, ...args: any[]): void {
    let last = args.length - 1;
    const onOpen = (typeof args[last] === "function" ? args[last] : noop) as OnResult<number>;
    const mode = last ? args[--last] as number : 0o666;
    const flags = last ? args[--last] as Flags : "r";
    fs.open(path, flags, mode, onOpen);
}

export function openSync(path: string, flags: Flags = "r", mode: number = 0o666): number {
    return fs.openSync(path, flags, mode);
}

async function openPromised(path: string, flags: Flags = "r", mode: number = 0o666): Promise<number> {
    return fsPromised.open(path, flags, mode);
}

export function close(fd: number, onClose: OnDone = noop): void {
    fs.close(fd, onClose);
}

export function closeSync(fd: number): void {
    fs.closeSync(fd);
}

async function closePromised(fd: number): Promise<void> {
    return fsPromised.close(fd);
}

export function read(
    fd: number, buffer: Binary, offset: number, length: number, position: number,
    callback: OnResults<[number, Binary]>): void;
export function read(
    fd: number, buffer: Binary, offset: number, length: number,
    callback: OnResults<[number, Binary]>): void;
export function read(
    fd: number, buffer: Binary, offset: number,
    callback: OnResults<[number, Binary]>): void;
export function read(
    fd: number, buffer: Binary,
    callback: OnResults<[number, Binary]>): void;
export function read(
    fd: number, buffer: Binary,
    rawOffset: number | OnResults<[number, Binary]>, rawLength?: number | OnResults<[number, Binary]>,
    rawPosition?: number | OnResults<[number, Binary]>,
    rawCallback?: OnResults<[number, Binary]>,
): void {
    if (typeof fd !== "number") { throw new TypeError("Expected number for fd"); }
    const array = normalizeBinary(buffer);
    if (!array) { throw new TypeError("Invalid buffer type"); }
    const offset = typeof rawOffset === "number" ? rawOffset : 0;
    const length = typeof rawLength === "number" ? rawLength : -1;
    const position = typeof rawPosition === "number" ? rawPosition : -1;
    const callback = maybeCallback(rawCallback || rawPosition || rawLength || rawOffset);
    fs.read(fd, nodeSlice(array, offset, length), position, (error, bytesRead) =>
        callback(error, bytesRead || 0, buffer));
}

export function readSync(fd: number, buffer: Binary, offset?: number, length?: number, position?: number): number {
    if (typeof fd !== "number") { throw new TypeError("Expected number for fd"); }
    const array = normalizeBinary(buffer);
    if (!array) { throw new TypeError("Invalid buffer type"); }
    offset = typeof offset === "number" ? offset : 0;
    length = typeof length === "number" ? length : -1;
    position = typeof position === "number" ? position : -1;
    return fs.readSync(fd, nodeSlice(array, offset, length), position);
}

async function readPromised(
    fd: number, buffer: Binary, offset?: number, length?: number, position?: number): Promise<number> {
    if (typeof fd !== "number") { throw new TypeError("Expected number for fd"); }
    const array = normalizeBinary(buffer);
    if (!array) { throw new TypeError("Invalid buffer type"); }
    offset = typeof offset === "number" ? offset : 0;
    length = typeof length === "number" ? length : -1;
    position = typeof position === "number" ? position : -1;
    return fsPromised.read(fd, nodeSlice(array, offset, length), position as number);
}

export function write(
    fd: number, buffer: Binary, offset: number, length: number, position: number,
    callback: OnResults<[number, string | Binary]>): void;
export function write(
    fd: number, buffer: Binary, offset: number, length: number,
    callback: OnResults<[number, string | Binary]>): void;
export function write(
    fd: number, buffer: Binary, offset: number,
    callback: OnResults<[number, string | Binary]>): void;
export function write(
    fd: number, buffer: Binary,
    callback: OnResults<[number, string | Binary]>): void;
export function write(
    fd: number, text: string, position: number, encoding: string,
    callback: OnResults<[number, string | Binary]>): void;
export function write(
    fd: number, text: string, position: number,
    callback: OnResults<[number, string | Binary]>): void;
export function write(
    fd: number, text: string,
    callback: OnResults<[number, string | Binary]>): void;
export function write(
    fd: number, bufferOrString: string | Binary,
    offsetOrPosition?: number | OnResults<[number, string | Binary]>,
    lengthOrEncoding?: number | string | OnResults<[number, string | Binary]>,
    rawPosition?: number | OnResults<[number, string | Binary]>,
    rawCallback?: OnResults<[number, string | Binary]>,
): void {
    if (typeof fd !== "number") { throw new TypeError("Expected number for fd"); }
    const callback: OnResults<[number, string | Binary]> =
        maybeCallback(rawCallback || rawPosition || lengthOrEncoding || offsetOrPosition);

    if (typeof bufferOrString === "object" && typeof bufferOrString.byteLength === "number") {
        // Write binary values as is.
        const offset = typeof offsetOrPosition === "number" ? offsetOrPosition : 0;
        const length = typeof lengthOrEncoding === "number" ? lengthOrEncoding : -1;
        const position = typeof rawPosition === "number" ? rawPosition : -1;
        const array = normalizeBinary(bufferOrString);
        if (!array) { throw new TypeError("Invalid buffer value type"); }
        fs.write(fd, nodeSlice(array, offset, length), position, onWrite);
    } else {
        // Write all other values as UTF8 encoded strings
        const position = typeof offsetOrPosition === "number" ? offsetOrPosition : -1;
        const encoding = typeof lengthOrEncoding === "string" ? lengthOrEncoding : "utf8";
        if (encoding !== "utf8" && encoding !== "utf-8") {
            throw new TypeError("Only utf8 encoding is currently supported");
        }
        fs.write(fd, utf8Encode(String(bufferOrString)), position, onWrite);
    }

    function onWrite(error?: Error, bytesWritten?: number): void {
        callback(error, bytesWritten || 0, bufferOrString);
    }
}

export function writeSync(fd: number, buffer: Binary, offset?: number, length?: number, position?: number): number;
export function writeSync(fd: number, text: string, position?: number, encoding?: string): number;
export function writeSync(
    fd: number,
    bufferOrString: string | Binary,
    offsetOrPosition?: number,
    lengthOrEncoding?: number | string,
    rawPosition?: number,
): number {
    if (typeof fd !== "number") { throw new TypeError("Expected number for fd"); }

    if (typeof bufferOrString === "object" && typeof bufferOrString.byteLength === "number") {
        // Write binary values as is.
        const offset = typeof offsetOrPosition === "number" ? offsetOrPosition : 0;
        const length = typeof lengthOrEncoding === "number" ? lengthOrEncoding : -1;
        const position = typeof rawPosition === "number" ? rawPosition : -1;
        const array = normalizeBinary(bufferOrString);
        if (!array) { throw new TypeError("Invalid buffer value type"); }
        return fs.writeSync(fd, nodeSlice(array, offset, length), position);
    } else {
        // Write all other values as UTF8 encoded strings
        const position = typeof offsetOrPosition === "number" ? offsetOrPosition : -1;
        const encoding = typeof lengthOrEncoding === "string" ? lengthOrEncoding : "utf8";
        if (encoding !== "utf8" && encoding !== "utf-8") {
            throw new TypeError("Only utf8 encoding is currently supported");
        }
        return fs.writeSync(fd, utf8Encode(String(bufferOrString)), position);
    }
}

async function writePromised(
    fd: number, buffer: Binary, offset?: number, length?: number, position?: number): Promise<number>;
async function writePromised(
    fd: number, text: string, position?: number, encoding?: string): Promise<number>;
async function writePromised(
    fd: number,
    bufferOrString: string | Binary,
    offsetOrPosition?: number,
    lengthOrEncoding?: number | string,
    rawPosition?: number,
): Promise<number> {
    if (typeof fd !== "number") { throw new TypeError("Expected number for fd"); }

    if (typeof bufferOrString === "object" && typeof bufferOrString.byteLength === "number") {
        // Write binary values as is.
        const offset = typeof offsetOrPosition === "number" ? offsetOrPosition : 0;
        const length = typeof lengthOrEncoding === "number" ? lengthOrEncoding : -1;
        const position = typeof rawPosition === "number" ? rawPosition : -1;
        const array = normalizeBinary(bufferOrString);
        if (!array) { throw new TypeError("Invalid buffer value type"); }
        return fsPromised.write(fd, nodeSlice(array, offset, length), position);
    } else {
        // Write all other values as UTF8 encoded strings
        const position = typeof offsetOrPosition === "number" ? offsetOrPosition : -1;
        const encoding = typeof lengthOrEncoding === "string" ? lengthOrEncoding : "utf8";
        if (encoding !== "utf8" && encoding !== "utf-8") {
            throw new TypeError("Only utf8 encoding is currently supported");
        }
        return fsPromised.write(fd, utf8Encode(String(bufferOrString)), position);
    }
}

export function unlink(path: string, callback: OnDone = noop): void {
    fsRaw.unlink(new Fs(), path, callback);
}

export function unlinkSync(path: string): void {
    fsRaw.unlink(new Fs(), path);
}

const mkdirOptions: (options?: any) => { recursive: boolean, mode: number } =
    (options) => ({ recursive: false, mode: 0o777, ...options });

function dirname(path: string): string {
    const parts = path.split("/");
    parts.pop();
    return parts.join("/");
}

export function mkdir(path: string, options: { recursive: boolean, mode: number }, callback: OnDone): void;
export function mkdir(path: string, callback: OnDone): void;
export function mkdir(
    path: string, rawOptions: { recursive: boolean, mode: number } | OnDone, rawCallback?: OnDone,
): void {
    const options = mkdirOptions(rawOptions);
    const callback: OnDone = maybeCallback(rawCallback || rawOptions);
    if (options.recursive) {
        mkdirRecursive(new Fs(), path, options.mode, callback);
    } else {
        fsRaw.mkdir(new Fs(), path, options.mode, callback);
    }
}

function mkdirRecursive(req: Fs, path: string, mode: number, callback: OnDone): void {
    if (!path) {
        callback(new Error("Recursion reached empty path"));
        return;
    }
    fsRaw.mkdir(req, path, mode, (err) => {
        if (err && err.message.match(/^ENOENT:/)) {
            mkdirRecursive(req, dirname(path), mode, (error) => {
                if (error) {
                    callback(error);
                } else {
                    fsRaw.mkdir(req, path, mode, callback);
                }
            });
            return;
        }
        callback(err);
    });
}

export function mkdirSync(path: string, rawOptions?: { recursive: boolean, mode: number }): void {
    const options = mkdirOptions(rawOptions);
    if (options.recursive) {
        mkdirRecursiveSync(new Fs(), path, options.mode);
    } else {
        fsRaw.mkdir(new Fs(), path, options.mode);
    }
}

function mkdirRecursiveSync(req: Fs, path: string, mode: number): void {
    if (!path) {
        throw new Error("Recursion reached empty path");
        return;
    }
    try {
        fsRaw.mkdir(req, path, mode);
    } catch (err) {
        if (err.message.match(/^ENOENT:/)) {
            mkdirRecursiveSync(req, dirname(path), mode);
            fsRaw.mkdir(req, path, mode);
        } else {
            throw err;
        }
    }
}

export function rmdir(path: string, callback: OnDone): void {
    fsRaw.rmdir(new Fs(), path, callback || noop);
}

export function rmdirSync(path: string): void {
    fsRaw.rmdir(new Fs(), path);
}

export function readdir(path: string, callback: OnResult<string[]> = noop): void {
    fsRaw.scandir(new Fs(), path, 0, (error, req) => {
        if (error) {
            callback(error);
            return;
        }
        let entry: { name: string, type: string } | undefined;
        const names: string[] = [];
        // tslint:disable-next-line: no-conditional-assignment
        while ((entry = fsRaw.scandirNext(req))) {
            names.push(entry.name);
        }
        callback(error, names);
    });
}

export function readdirSync(path: string): string[] {
    const req = fsRaw.scandir(new Fs(), path, 0);
    let entry: { name: string, type: string } | undefined;
    const names: string[] = [];
    // tslint:disable-next-line: no-conditional-assignment
    while ((entry = fsRaw.scandirNext(req))) {
        names.push(entry.name);
    }
    return names;
}

export function readdirPromised(path: string): Promise<string[]> {
    return new Promise((resolve, reject) =>
        fsRaw.scandir(new Fs(), path, 0, (error, req) => {
            if (error) {
                reject(error);
                return;
            }
            let entry: { name: string, type: string } | undefined;
            const names: string[] = [];
            // tslint:disable-next-line: no-conditional-assignment
            while ((entry = fsRaw.scandirNext(req))) {
                names.push(entry.name);
            }
            resolve(names);
        }));
}

export class Stats {
    public readonly dev: number;
    public readonly ino: number;
    public readonly mode: number;
    public readonly nlink: number;
    public readonly uid: number;
    public readonly gid: number;
    public readonly rdev: number;
    public readonly size: number;
    public readonly blksize: number;
    public readonly blocks: number;
    public readonly atimeMs: number;
    public readonly mtimeMs: number;
    public readonly ctimeMs: number;
    public readonly birthtimeMs: number;
    public readonly atime: Date;
    public readonly mtime: Date;
    public readonly ctime: Date;
    public readonly birthtime: Date;
    private readonly type: "file" | "dir" | "link" | "fifo" | "socket" | "char" | "block";

    constructor(val: StatEntry & any) {
        this.dev = val.dev || 0;
        this.ino = val.ino || 0;
        this.mode = val.mode || 0;
        this.nlink = val.nlink || 0;
        this.uid = val.uid || 0;
        this.gid = val.gid || 0;
        this.rdev = val.rdev || 0;
        this.size = val.size || 0;
        this.blksize = val.blksize || 0;
        this.blocks = val.blocks || 0;
        this.atimeMs = val.atime || 0;
        this.mtimeMs = val.mtime || 0;
        this.ctimeMs = val.ctime || 0;
        this.birthtimeMs = val.birthtime || 0;
        this.atime = new Date(this.atimeMs);
        this.mtime = new Date(this.mtimeMs);
        this.ctime = new Date(this.ctimeMs);
        this.birthtime = new Date(this.birthtimeMs);
        this.type = val.type;
    }
    public isBlockDevice(): boolean { return this.type === "block"; }
    public isCharacterDevice(): boolean { return this.type === "char"; }
    public isDirectory(): boolean { return this.type === "dir"; }
    public isFIFO(): boolean { return this.type === "fifo"; }
    public isFile(): boolean { return this.type === "file"; }
    public isSocket(): boolean { return this.type === "socket"; }
    public isSymbolicLink(): boolean { return this.type === "link"; }
}

const statCallback: (cb: OnResult<Stats>) => OnResult<StatEntry> =
    (cb) => (err, val) => err ? cb(err) : cb(err, new Stats(val));

export function stat(path: string, callback: OnResult<Stats>): void {
    fsRaw.stat(new Fs(), path, statCallback(callback));
}

export function statSync(path: string): Stats {
    return new Stats(fsRaw.stat(new Fs(), path));
}

export function fstat(fd: number, callback: OnResult<Stats>): void {
    fsRaw.fstat(new Fs(), fd, statCallback(callback));
}

export function fstatSync(fd: number): Stats {
    return new Stats(fsRaw.fstat(new Fs(), fd));
}

export function lstat(path: string, callback: OnResult<Stats>): void {
    fsRaw.lstat(new Fs(), path, statCallback(callback));
}

export function lstatSync(path: string): Stats {
    return new Stats(fsRaw.lstat(new Fs(), path));
}

export function readFile(
    path: string, options: { encoding: string, flag?: Flags }, callback: OnResult<string>): void;
export function readFile(
    path: string, options: { encoding?: null, flag?: Flags }, callback: OnResult<Uint8Array>): void;
export function readFile(
    path: string, encoding: string, callback: OnResult<string>): void;
export function readFile(
    path: string, encoding: null | undefined, callback: OnResult<Uint8Array>): void;
export function readFile(
    path: string, callback: OnResult<Uint8Array>): void;
export function readFile(
    path: string,
    rawOptions?: { encoding?: string | null, flag?: Flags } | string | null | OnResult<string> | OnResult<Uint8Array>,
    rawCallback?: OnResult<string> | OnResult<Uint8Array>,
): void {
    const callback: OnResult<string | Uint8Array> = maybeCallback(rawCallback || rawOptions);
    const flag: Flags =
        typeof rawOptions === "object" && rawOptions && typeof rawOptions.flag !== "undefined"
            ? rawOptions.flag
            : "r";
    const encoding: string | null =
        typeof rawOptions === "string"
            ? rawOptions
            : typeof rawOptions === "object" && rawOptions && typeof rawOptions.encoding === "string"
                ? rawOptions.encoding
                : null;
    if (encoding !== null && encoding !== "utf8" && encoding !== "utf-8") {
        throw new Error(`Unsupported encoding requested: ${encoding}`);
    }
    let fd: number;
    const parts: Uint8Array[] = [];
    let size: number = 0;
    const buffer = new Uint8Array(1024);

    fs.open(path, flag, 0o644, onOpen);

    function onOpen(error?: Error, newFd?: number): void {
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
            } else {
                parts.push(buffer.slice(0, bytesRead));
                size += bytesRead;
                readChunk();
            }
        });
    }

    function cleanup(error?: Error) {
        fs.close(fd, (err) => {
            if (error || err) {
                callback(error || err);
            } else {
                let result: string | Uint8Array;
                try {
                    result = joinParts(parts, size, encoding);
                } catch (err) {
                    callback(err);
                    return;
                }
                callback(undefined, result);
            }
        });
    }
}

export function readFileSync(path: string, options: { encoding: string, flag?: Flags }): string;
export function readFileSync(path: string, options: { encoding?: null, flag?: Flags }): Uint8Array;
export function readFileSync(path: string, encoding: string): string;
export function readFileSync(path: string, encoding?: null): Uint8Array;
export function readFileSync(
    path: string, rawOptions?: { encoding?: string | null, flag?: Flags } | string | null,
): string | Uint8Array {
    const flag: Flags =
        typeof rawOptions === "object" && rawOptions && typeof rawOptions.flag !== "undefined"
            ? rawOptions.flag : "r";
    const encoding: string | null =
        typeof rawOptions === "string"
            ? rawOptions
            : typeof rawOptions === "object" && rawOptions && typeof rawOptions.encoding === "string"
                ? rawOptions.encoding : null;
    if (encoding !== null && encoding !== "utf8" && encoding !== "utf-8") {
        throw new Error(`Unsupported encoding requested: ${encoding}`);
    }
    const parts: Uint8Array[] = [];
    let size: number = 0;
    const buffer = new Uint8Array(1024 * 16);
    const fd = fs.openSync(path, flag, 0o666);
    try {
        let bytesRead;
        // tslint:disable-next-line: no-conditional-assignment
        while (bytesRead = fs.readSync(fd, buffer, -1)) {
            parts.push(buffer.slice(0, bytesRead));
            size += bytesRead;
        }
    } finally {
        fs.closeSync(fd);
    }
    return joinParts(parts, size, encoding);
}

function joinParts(parts: Uint8Array[], size: number, encoding: string | null): Uint8Array | string {
    const data = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) {
        data.set(part, offset);
        offset += part.byteLength;
    }
    return encoding === null ? data : utf8Decode(data);
}

async function readFilePromised(path: string, options: { encoding: string, flag?: Flags }): Promise<string>;
async function readFilePromised(path: string, options: { encoding?: null, flag?: Flags }): Promise<Uint8Array>;
async function readFilePromised(path: string, encoding: string): Promise<string>;
async function readFilePromised(path: string, encoding?: null): Promise<Uint8Array>;
async function readFilePromised(
    path: string, rawOptions?: { encoding?: string | null, flag?: Flags } | string | null,
): Promise<string | Uint8Array> {
    const flag: Flags =
        typeof rawOptions === "object" && rawOptions && typeof rawOptions.flag !== "undefined"
            ? rawOptions.flag : "r";
    const encoding: string | null =
        typeof rawOptions === "string"
            ? rawOptions
            : typeof rawOptions === "object" && rawOptions && typeof rawOptions.encoding === "string"
                ? rawOptions.encoding : null;
    if (encoding !== null && encoding !== "utf8" && encoding !== "utf-8") {
        throw new Error(`Unsupported encoding requested: ${encoding}`);
    }
    const parts: Uint8Array[] = [];
    let size: number = 0;
    const buffer = new Uint8Array(1024 * 16);
    const fd = await fsPromised.open(path, flag, 0o644);
    try {
        let bytesRead;
        // tslint:disable-next-line: no-conditional-assignment
        while (bytesRead = await fsPromised.read(fd, buffer, -1)) {
            parts.push(buffer.slice(0, bytesRead));
            size += bytesRead;
        }
    } finally {
        await fsPromised.close(fd);
    }
    return joinParts(parts, size, encoding);
}

export function writeFile(
    path: string, data: string, options: string | { encoding?: string, mode?: number, flag?: Flags }, callback: OnDone,
): void;
export function writeFile(path: string, data: Binary, options: { mode?: number, flag?: Flags }, callback: OnDone): void;
export function writeFile(path: string, data: string | Binary, callback: OnDone): void;
export function writeFile(fd: number, data: string, options: { encoding?: string }, callback: OnDone): void;
export function writeFile(fd: number, data: Binary, options: {}, callback: OnDone): void;
export function writeFile(fd: number, data: string | Binary, callback: OnDone): void;
export function writeFile(
    pathOrFd: string | number,
    textOrBinary: string | Binary,
    optionsOrCallback: string | { encoding?: string | null, mode?: number, flag?: Flags } | OnDone,
    rawCallback?: OnDone,
): void {
    const callback: OnDone = maybeCallback(rawCallback || optionsOrCallback);
    const { mode, flag, array } = normalizeWriteFileInputs(textOrBinary, optionsOrCallback);
    if (typeof pathOrFd === "number") {
        onOpen(undefined, pathOrFd);
    } else {
        fs.open(pathOrFd, flag, mode, onOpen);
    }
    function onOpen(error?: Error, fd?: number) {
        if (!fd) {
            callback(error);
            return;
        }
        fs.write(fd, array, -1, (err) =>
            // TODO: find out if we need to check bytesWritten here.
            // I'm assuming the entire buffer is written.
            fs.close(fd, (err2) => callback(err || err2)),
        );
    }
}

export function writeFileSync(
    path: string, data: string, options: string | { encoding?: string, mode?: number, flag?: Flags }): void;
export function writeFileSync(path: string, data: Binary, options: { mode?: number, flag?: Flags }): void;
export function writeFileSync(path: string, data: string | Binary): void;
export function writeFileSync(fd: number, data: string, options: { encoding?: string }): void;
export function writeFileSync(fd: number, data: Binary, options: {}): void;
export function writeFileSync(fd: number, data: string | Binary): void;
export function writeFileSync(
    pathOrFd: string | number, textOrBinary: string | Binary,
    rawOptions?: string | { encoding?: string | null, mode?: number, flag?: Flags },
): void {
    const { mode, flag, array } = normalizeWriteFileInputs(textOrBinary, rawOptions);
    const fd =
        typeof pathOrFd === "number"
            ? pathOrFd
            : fs.openSync(pathOrFd, flag, mode);
    try {
        fs.writeSync(fd, array, -1);
        // TODO: find out if we need to check bytesWritten here.
        // I'm assuming the entire buffer is written.
    } finally {
        fs.closeSync(fd);
    }
}

async function writeFilePromised(
    path: string, data: string, options: string | { encoding?: string, mode?: number, flag?: Flags }): Promise<void>;
async function writeFilePromised(
    path: string, data: Binary, options: { mode?: number, flag?: Flags }): Promise<void>;
async function writeFilePromised(path: string, data: string | Binary): Promise<void>;
async function writeFilePromised(fd: number, data: string, options: { encoding?: string }): Promise<void>;
async function writeFilePromised(fd: number, data: Binary, options: {}): Promise<void>;
async function writeFilePromised(fd: number, data: string | Binary): Promise<void>;
async function writeFilePromised(
    pathOrFd: string | number, textOrBinary: string | Binary,
    rawOptions?: string | { encoding?: string | null, mode?: number, flag?: Flags },
): Promise<void> {
    const { mode, flag, array } = normalizeWriteFileInputs(textOrBinary, rawOptions);
    const fd =
        typeof pathOrFd === "number"
            ? pathOrFd
            : await fsPromised.open(pathOrFd, flag, mode);
    try {
        await fsPromised.write(fd, array, 0);
        // TODO: find out if we need to check bytesWritten here.
        // I'm assuming the entire buffer is written.
    } finally {
        await fsPromised.close(fd);
    }
}

function normalizeWriteFileInputs(
    textOrBinary: string | Binary,
    rawOptions?: string | { encoding?: string | null, mode?: number, flag?: Flags } | OnDone,
): {
    mode: number,
    flag: Flags,
    array: Uint8Array,
} {
    const options: { encoding?: string | null, mode?: number, flag?: Flags } =
        typeof rawOptions === "object" && rawOptions
            ? rawOptions
            : {};
    const encoding: string | null =
        typeof textOrBinary === "string"
            ? typeof rawOptions === "string"
                ? rawOptions
                : typeof options.encoding === "string"
                    ? options.encoding
                    : "utf8"
            : null;
    if (encoding !== null && encoding !== "utf8" && encoding !== "utf-8") {
        throw new Error(`Unsupported encoding requested: ${encoding}`);
    }
    const mode: number = typeof options.mode === "number"
        ? options.mode
        : 0o666;
    const flag: Flags = typeof options.flag !== "undefined"
        ? options.flag
        : "w";
    const data: Binary = typeof textOrBinary === "string" ? utf8Encode(textOrBinary) : textOrBinary;
    const array = normalizeBinary(data);
    if (!array) { throw new Error("Unable to normalize data"); }
    return { mode, flag, array };
}

export function realpath(path: string, callback: OnResult<string>): void {
    fs.realpath(path, callback);
}

export function realpathSync(path: string): string {
    return fs.realpathSync(path);
}

function realpathPromised(path: string): Promise<string> {
    return new Promise((resolve, reject) => fs.realpath(path, (err, val) => err ? reject(err) : resolve(val)));
}

export function watch() {
    throw new Error("TODO: Implement fs.watch from node.js");
}

export const promises = {
    open: openPromised,
    close: closePromised,
    read: readPromised,
    write: writePromised,
    readFile: readFilePromised,
    writeFile: writeFilePromised,
    readdir: readdirPromised,
    realpath: realpathPromised,
};

function nodeSlice(array: Uint8Array, offset: number, length: number): Uint8Array {
    return array.subarray(offset, length === -1 ? undefined : length);
}
