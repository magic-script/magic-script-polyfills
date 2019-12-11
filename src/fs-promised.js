/**
 * Promise and async iterator friendly filesystem APIs.
 */
import * as fs from "./fs-uv.js";
import { iterateBody } from "./utils2.js";
/** Open a file. */
export async function open(path, flags, mode) {
    return new Promise((resolve, reject) => fs.open(path, flags, mode, (error, fd) => error ? reject(error) : resolve(fd)));
}
export async function close(fd) {
    return new Promise((resolve, reject) => fs.close(fd, (error) => error ? reject(error) : resolve()));
}
export async function read(fd, buffer, position) {
    return new Promise((resolve, reject) => fs.read(fd, buffer, position, (error, bytesRead) => error ? reject(error) : resolve(bytesRead)));
}
export function write(fd, buffer, position) {
    return new Promise((resolve, reject) => fs.write(fd, buffer, position, (error, bytesWritten) => error ? reject(error) : resolve(bytesWritten)));
}
export async function* readStreaming(fd, buffer) {
    while (true) {
        const bytesRead = await read(fd, buffer, -1);
        if (bytesRead === 0) {
            return;
        }
        yield buffer.subarray(0, bytesRead);
    }
}
export async function* readStreamingSlice(fd, buffer, start, length) {
    const position = start;
    while (length !== 0) {
        if (length > 0 && length < buffer.length) {
            buffer = buffer.subarray(0, length);
        }
        const bytesRead = await read(fd, buffer, position);
        if (bytesRead === 0) {
            return;
        }
        length -= bytesRead;
        yield buffer.subarray(0, bytesRead);
    }
}
export async function* readFileStream(path, { chunkSize = 64 * 1024, flags = "r", mode = 0o666, start = 0, length = -1, } = {}) {
    const fd = await open(path, flags, mode);
    try {
        const buffer = new Uint8Array(chunkSize);
        const iterable = start === 0 && length === -1
            ? readStreaming(fd, buffer)
            : readStreamingSlice(fd, buffer, start, length);
        for await (const chunk of iterable) {
            yield chunk.slice();
        }
    }
    finally {
        await close(fd);
    }
}
export async function writeFileStream(path, body, { flags = "w", mode = 0o666, } = {}) {
    const fd = await open(path, flags, mode);
    try {
        for await (const chunk of iterateBody(body)) {
            await write(fd, chunk, -1);
        }
    }
    finally {
        await close(fd);
    }
}
//# sourceMappingURL=fs-promised.js.map