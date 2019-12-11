import { Flags } from "uv";
/**
 * Filesystem Bindings from libuv with minor tweaks.
 *
 * Non-blocking calls use callbacks and blocking calls have *Sync postfix.
 */
/** Node.js style callback with no result value.  This only signals completion or error. */
export declare type OnDone = (error?: Error) => void;
/** Node.js style callback with a single result value.  This signals result or error. */
export declare type OnResult<T> = (error?: Error, value?: T) => void;
/** Node.js style callback with multiple result values.  This signals results or error. */
export declare type OnResults<T extends any[]> = (error?: Error, ...values: T) => void;
/**
 * Used when a libuv callback is required, but the user didn't provide one.
 * It also helps debugging by causing uncaught exceptions on otherwise silent errors.
 */
export declare const noop: OnDone;
export declare function openSync(path: string, flags: Flags, mode: number): number;
export declare function open(path: string, flags: Flags, mode: number, onOpen?: OnResult<number>): void;
export declare function closeSync(fd: number): void;
export declare function close(fd: number, onClose?: OnDone): void;
export declare function readSync(fd: number, data: Uint8Array, position: number): number;
export declare function read(fd: number, data: Uint8Array, position: number, onRead: OnResult<number>): void;
export declare function writeSync(fd: number, data: Uint8Array, position: number): number;
export declare function write(fd: number, data: Uint8Array, position: number, onWrite: OnResult<number>): void;
/**
 * Workaround a bug in libuv bindings in Lumin OS 0.98.0.
 * This ensures that the backing array buffer is not larger than the view.
 */
export declare function workaroundPrep(data: Uint8Array): Uint8Array;
/**
 * Workaround a bug in libuv bindings in Lumin OS 0.98.0.
 * This ensures that data read into safeData is also set in data.
 */
export declare function workaroundSet(data: Uint8Array, safeData: Uint8Array): void;
