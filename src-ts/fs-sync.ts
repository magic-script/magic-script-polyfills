import { Flags, Fs, fs } from "uv";

import { closeSync, openSync, readSync } from "./fs-uv.js";

const readfileBuffer = new Uint8Array(64 * 1024);
export function readfileSync(path: string, flags: Flags, mode: number): Uint8Array {
    const fd = openSync(path, flags, mode);
    const parts = [];
    let offset = 0;
    let bytesRead: number;
    try {
        do {
            bytesRead = readSync(fd, readfileBuffer, -1);
            if (bytesRead > 0) {
                parts.push(readfileBuffer.slice(0, bytesRead));
                offset += bytesRead;
            }
        } while (bytesRead === readfileBuffer.byteLength);
    } finally {
        closeSync(fd);
    }

    // If there is exactly one part, don't copy it to a new buffer.
    if (parts.length === 1) { return parts[0]; }

    // Otherwise, combine the parts into a single large buffer.
    const result = new Uint8Array(offset);
    offset = 0;
    for (const part of parts) {
        result.set(part, offset);
        offset += part.byteLength;
    }
    return result;
}
