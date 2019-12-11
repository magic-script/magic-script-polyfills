import { Flags, StatEntry } from "uv";
import { OnDone, OnResult, OnResults } from "../fs-uv.js";
import { Binary } from "../utils2.js";
export declare function open(path: string, onOpen: OnResult<number>): void;
export declare function open(path: string, flags: Flags, onOpen: OnResult<number>): void;
export declare function open(path: string, flags: Flags, mode: number, onOpen: OnResult<number>): void;
export declare function openSync(path: string, flags?: Flags, mode?: number): number;
declare function openPromised(path: string, flags?: Flags, mode?: number): Promise<number>;
export declare function close(fd: number, onClose?: OnDone): void;
export declare function closeSync(fd: number): void;
declare function closePromised(fd: number): Promise<void>;
export declare function read(fd: number, buffer: Binary, offset: number, length: number, position: number, callback: OnResults<[number, Binary]>): void;
export declare function read(fd: number, buffer: Binary, offset: number, length: number, callback: OnResults<[number, Binary]>): void;
export declare function read(fd: number, buffer: Binary, offset: number, callback: OnResults<[number, Binary]>): void;
export declare function read(fd: number, buffer: Binary, callback: OnResults<[number, Binary]>): void;
export declare function readSync(fd: number, buffer: Binary, offset?: number, length?: number, position?: number): number;
declare function readPromised(fd: number, buffer: Binary, offset?: number, length?: number, position?: number): Promise<number>;
export declare function write(fd: number, buffer: Binary, offset: number, length: number, position: number, callback: OnResults<[number, string | Binary]>): void;
export declare function write(fd: number, buffer: Binary, offset: number, length: number, callback: OnResults<[number, string | Binary]>): void;
export declare function write(fd: number, buffer: Binary, offset: number, callback: OnResults<[number, string | Binary]>): void;
export declare function write(fd: number, buffer: Binary, callback: OnResults<[number, string | Binary]>): void;
export declare function write(fd: number, text: string, position: number, encoding: string, callback: OnResults<[number, string | Binary]>): void;
export declare function write(fd: number, text: string, position: number, callback: OnResults<[number, string | Binary]>): void;
export declare function write(fd: number, text: string, callback: OnResults<[number, string | Binary]>): void;
export declare function writeSync(fd: number, buffer: Binary, offset?: number, length?: number, position?: number): number;
export declare function writeSync(fd: number, text: string, position?: number, encoding?: string): number;
declare function writePromised(fd: number, buffer: Binary, offset?: number, length?: number, position?: number): Promise<number>;
declare function writePromised(fd: number, text: string, position?: number, encoding?: string): Promise<number>;
export declare function unlink(path: string, callback?: OnDone): void;
export declare function unlinkSync(path: string): void;
export declare function mkdir(path: string, options: {
    recursive: boolean;
    mode: number;
}, callback: OnDone): void;
export declare function mkdir(path: string, callback: OnDone): void;
export declare function mkdirSync(path: string, rawOptions?: {
    recursive: boolean;
    mode: number;
}): void;
export declare function rmdir(path: string, callback: OnDone): void;
export declare function rmdirSync(path: string): void;
export declare function readdir(path: string, callback?: OnResult<string[]>): void;
export declare function readdirSync(path: string): string[];
export declare function stat(path: string, callback: OnResult<StatEntry>): void;
export declare function statSync(path: string): StatEntry;
export declare function fstat(fd: number, callback: OnResult<StatEntry>): void;
export declare function fstatSync(fd: number): StatEntry;
export declare function lstat(path: string, callback: OnResult<StatEntry>): void;
export declare function lstatSync(path: string): StatEntry;
export declare function readFile(path: string, options: {
    encoding: string;
    flag?: Flags;
}, callback: OnResult<string>): void;
export declare function readFile(path: string, options: {
    encoding?: null;
    flag?: Flags;
}, callback: OnResult<Uint8Array>): void;
export declare function readFile(path: string, encoding: string, callback: OnResult<string>): void;
export declare function readFile(path: string, encoding: null | undefined, callback: OnResult<Uint8Array>): void;
export declare function readFile(path: string, callback: OnResult<Uint8Array>): void;
export declare function readFileSync(path: string, options: {
    encoding: string;
    flag?: Flags;
}): string;
export declare function readFileSync(path: string, options: {
    encoding?: null;
    flag?: Flags;
}): Uint8Array;
export declare function readFileSync(path: string, encoding: string): string;
export declare function readFileSync(path: string, encoding?: null): Uint8Array;
declare function readFilePromised(path: string, options: {
    encoding: string;
    flag?: Flags;
}): Promise<string>;
declare function readFilePromised(path: string, options: {
    encoding?: null;
    flag?: Flags;
}): Promise<Uint8Array>;
declare function readFilePromised(path: string, encoding: string): Promise<string>;
declare function readFilePromised(path: string, encoding?: null): Promise<Uint8Array>;
export declare function writeFile(path: string, data: string, options: string | {
    encoding?: string;
    mode?: number;
    flag?: Flags;
}, callback: OnDone): void;
export declare function writeFile(path: string, data: Binary, options: {
    mode?: number;
    flag?: Flags;
}, callback: OnDone): void;
export declare function writeFile(path: string, data: string | Binary, callback: OnDone): void;
export declare function writeFile(fd: number, data: string, options: {
    encoding?: string;
}, callback: OnDone): void;
export declare function writeFile(fd: number, data: Binary, options: {}, callback: OnDone): void;
export declare function writeFile(fd: number, data: string | Binary, callback: OnDone): void;
export declare function writeFileSync(path: string, data: string, options: string | {
    encoding?: string;
    mode?: number;
    flag?: Flags;
}): void;
export declare function writeFileSync(path: string, data: Binary, options: {
    mode?: number;
    flag?: Flags;
}): void;
export declare function writeFileSync(path: string, data: string | Binary): void;
export declare function writeFileSync(fd: number, data: string, options: {
    encoding?: string;
}): void;
export declare function writeFileSync(fd: number, data: Binary, options: {}): void;
export declare function writeFileSync(fd: number, data: string | Binary): void;
declare function writeFilePromised(path: string, data: string, options: string | {
    encoding?: string;
    mode?: number;
    flag?: Flags;
}): Promise<void>;
declare function writeFilePromised(path: string, data: Binary, options: {
    mode?: number;
    flag?: Flags;
}): Promise<void>;
declare function writeFilePromised(path: string, data: string | Binary): Promise<void>;
declare function writeFilePromised(fd: number, data: string, options: {
    encoding?: string;
}): Promise<void>;
declare function writeFilePromised(fd: number, data: Binary, options: {}): Promise<void>;
declare function writeFilePromised(fd: number, data: string | Binary): Promise<void>;
export declare const promises: {
    open: typeof openPromised;
    close: typeof closePromised;
    read: typeof readPromised;
    write: typeof writePromised;
    readFile: typeof readFilePromised;
    writeFile: typeof writeFilePromised;
};
export {};
