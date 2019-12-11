import { Fs, fs } from "uv";
/**
 * Used when a libuv callback is required, but the user didn't provide one.
 * It also helps debugging by causing uncaught exceptions on otherwise silent errors.
 */
export const noop = (err) => { if (err) {
    throw err;
} };
export function openSync(path, flags, mode) {
    return fs.open(new Fs(), path, flags, mode);
}
export function open(path, flags, mode, onOpen = noop) {
    fs.open(new Fs(), path, flags, mode, onOpen);
}
export function closeSync(fd) {
    fs.close(new Fs(), fd);
}
export function close(fd, onClose = noop) {
    fs.close(new Fs(), fd, onClose);
}
export function readSync(fd, data, position) {
    const safeData = workaroundPrep(data);
    const bytesRead = fs.read(new Fs(), fd, safeData, position);
    workaroundSet(data, safeData);
    return bytesRead;
}
export function read(fd, data, position, onRead) {
    const safeData = workaroundPrep(data);
    fs.read(new Fs(), fd, safeData, position, (error, bytesRead) => {
        if (bytesRead) {
            workaroundSet(data, safeData);
        }
        onRead(error, bytesRead);
    });
}
export function writeSync(fd, data, position) {
    const safeData = workaroundPrep(data);
    return fs.write(new Fs(), fd, safeData, position);
}
export function write(fd, data, position, onWrite) {
    const safeData = workaroundPrep(data);
    fs.write(new Fs(), fd, safeData, position, onWrite);
}
/**
 * Workaround a bug in libuv bindings in Lumin OS 0.98.0.
 * This ensures that the backing array buffer is not larger than the view.
 */
export function workaroundPrep(data) {
    return data;
    // return data.byteOffset === 0 && data.byteLength === data.buffer.byteLength
    //     ? data : data.slice();
}
/**
 * Workaround a bug in libuv bindings in Lumin OS 0.98.0.
 * This ensures that data read into safeData is also set in data.
 */
export function workaroundSet(data, safeData) {
    if (data !== safeData) {
        data.set(safeData);
    }
}
//# sourceMappingURL=fs-uv.js.map