import { Flags, Fs, fs } from "uv";
/**
 * Filesystem Bindings from libuv with minor tweaks.
 *
 * Non-blocking calls use callbacks and blocking calls have *Sync postfix.
 */

/** Node.js style callback with no result value.  This only signals completion or error. */
export type OnDone = (error?: Error) => void;
/** Node.js style callback with a single result value.  This signals result or error. */
export type OnResult<T> = (error?: Error, value?: T) => void;
/** Node.js style callback with multiple result values.  This signals results or error. */
export type OnResults<T extends any[]> = (error?: Error, ...values: T) => void;

/**
 * Used when a libuv callback is required, but the user didn't provide one.
 * It also helps debugging by causing uncaught exceptions on otherwise silent errors.
 */
export const noop: OnDone = (err) => { if (err) { throw err; } };

export function openSync(path: string, flags: Flags, mode: number): number {
    return fs.open(new Fs(), path, flags, mode);
}
export function open(path: string, flags: Flags, mode: number, onOpen: OnResult<number> = noop): void {
    fs.open(new Fs(), path, flags, mode, onOpen);
}

export function closeSync(fd: number): void {
    fs.close(new Fs(), fd);
}
export function close(fd: number, onClose: OnDone = noop): void {
    fs.close(new Fs(), fd, onClose);
}

export function readSync(fd: number, data: Uint8Array, position: number): number {
    const safeData = workaroundPrep(data);
    const bytesRead = fs.read(new Fs(), fd, safeData, position);
    workaroundSet(data, safeData);
    return bytesRead;
}
export function read(fd: number, data: Uint8Array, position: number, onRead: OnResult<number>): void {
    const safeData = workaroundPrep(data);
    fs.read(new Fs(), fd, safeData, position, (error, bytesRead) => {
        if (bytesRead) { workaroundSet(data, safeData); }
        onRead(error, bytesRead);
    });
}

export function writeSync(fd: number, data: Uint8Array, position: number): number {
    const safeData = workaroundPrep(data);
    return fs.write(new Fs(), fd, safeData, position);
}
export function write(fd: number, data: Uint8Array, position: number, onWrite: OnResult<number>): void {
    const safeData = workaroundPrep(data);
    fs.write(new Fs(), fd, safeData, position, onWrite);
}

export function realpathSync(path: string): string {
    return fs.realpath(new Fs(), path);
}

export function realpath(path: string, onPath: OnResult<string>): void {
    fs.realpath(new Fs(), path, onPath);
}

export function mkdir(path: string, mode:number, onMake: OnResult<void>): void {
    fs.mkdir(new Fs(), path, mode, onMake);
}

export function mkdirSync(path: string, mode:number): void {
    fs.mkdir(new Fs(), path, mode);
}


/**
 * Workaround a bug in libuv bindings in Lumin OS 0.98.0.
 * This ensures that the backing array buffer is not larger than the view.
 */
export function workaroundPrep(data: Uint8Array): Uint8Array {
    return data;
    // return data.byteOffset === 0 && data.byteLength === data.buffer.byteLength
    //     ? data : data.slice();
}

/**
 * Workaround a bug in libuv bindings in Lumin OS 0.98.0.
 * This ensures that data read into safeData is also set in data.
 */
export function workaroundSet(data: Uint8Array, safeData: Uint8Array): void {
    if (data !== safeData) { data.set(safeData); }
}
