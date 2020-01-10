import { closeSync, openSync, readSync } from "./fs-uv.js";

type IntegerArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array;

export function getRandomValues<T extends IntegerArray>(typedArray: T): T {
    const buffer = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    const fd = openSync("/dev/urandom", "r", 0o400);
    try {
        readSync(fd, buffer, 0);
    } finally {
        closeSync(fd);
    }
    return typedArray;
}

export const crypto = {
    getRandomValues,
};
