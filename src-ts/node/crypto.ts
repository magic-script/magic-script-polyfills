import { getRandomValues } from "../crypto.js";
import { close, open, read } from "../fs-promised.js";
import { OnResult } from "../fs-uv.js";

export function createHash() {
    throw new Error("TODO: Implement crypto.createHash for node");
}

export function randomBytes(size: number): Uint8Array;
export function randomBytes(size: number, callback: OnResult<Uint8Array>): void;
export function randomBytes(size: number, callback?: OnResult<Uint8Array>): Uint8Array | void {
    const buffer = new Uint8Array(size);
    if (callback) {
        randomBytesCallback(buffer, callback);
    } else {
        return getRandomValues(buffer);
    }
}

function randomBytesCallback(buffer: Uint8Array, callback: OnResult<Uint8Array>): void {
    randomBytesPromised(buffer).then((data) => callback(null, data), (err) => callback(err));
}

async function randomBytesPromised(buffer: Uint8Array): Promise<Uint8Array> {
    const fd = await open("/dev/urandom", "r", 0o400);
    try {
        await read(fd, buffer, 0);
    } finally {
        await close(fd);
    }
    return buffer;
}

export function randomFillSync(buffer: Uint8Array, rawOffset?: number, rawSize?: number): Uint8Array {
    getRandomValues(normalizeOffsetBuffer(buffer, rawOffset, rawSize));
    return buffer;
}

export function randomFill(buffer: Uint8Array, offset: number, size: number, callback: OnResult<Uint8Array>): void;
export function randomFill(buffer: Uint8Array, offset: number, callback: OnResult<Uint8Array>): void;
export function randomFill(buffer: Uint8Array, callback: OnResult<Uint8Array>): void;
export function randomFill(
    buffer: Uint8Array,
    rawOffset: number | OnResult<Uint8Array>,
    rawSize?: number | OnResult<Uint8Array>,
    rawCallback?: OnResult<Uint8Array>): void {
    randomBytesCallback(
        normalizeOffsetBuffer(buffer, rawOffset, rawSize),
        (rawOffset || rawSize || rawCallback) as OnResult<Uint8Array>);
}

function normalizeOffsetBuffer(buffer: Uint8Array, rawOffset: any, rawSize: any) {
    const offset = typeof rawOffset === "number" ? rawOffset : 0;
    const size = typeof rawSize === "number" ? rawSize : buffer.length - offset;
    return (offset === 0 && size === buffer.length)
        ? buffer : buffer.subarray(offset, offset + size);
}
