/**
 * Promise and async iterator friendly filesystem APIs.
 */
import { Flags } from "uv";
import { AsyncDataStream } from "./utils2.js";
/** Open a file. */
export declare function open(path: string, flags: Flags, mode: number): Promise<number>;
export declare function close(fd: number): Promise<void>;
export declare function read(fd: number, buffer: Uint8Array, position: number): Promise<number>;
export declare function write(fd: number, buffer: Uint8Array, position: number): Promise<number>;
export declare function readStreaming(fd: number, buffer: Uint8Array): AsyncGenerator<Uint8Array>;
export declare function readStreamingSlice(fd: number, buffer: Uint8Array, start: number, length: number): AsyncGenerator<Uint8Array>;
export declare function readFileStream(path: string, { chunkSize, flags, mode, start, length, }?: {
    chunkSize?: number | undefined;
    flags?: number | "a" | "r" | "r+" | "w" | "w+" | "a+" | "rs" | "rs+" | "sr" | "sr+" | "wx" | "wx+" | "xw" | "xw+" | "ax" | "ax+" | "xa" | "xa+" | undefined;
    mode?: number | undefined;
    start?: number | undefined;
    length?: number | undefined;
}): AsyncIterableIterator<Uint8Array>;
export declare function writeFileStream(path: string, body: AsyncDataStream, { flags, mode, }?: {
    flags?: number | "a" | "r" | "r+" | "w" | "w+" | "a+" | "rs" | "rs+" | "sr" | "sr+" | "wx" | "wx+" | "xw" | "xw+" | "ax" | "ax+" | "xa" | "xa+" | undefined;
    mode?: number | undefined;
}): Promise<void>;
