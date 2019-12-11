export interface IReadableStream<Out> extends AsyncIterableIterator<Out> {
}
export interface IWritableStream<In> {
    push(evt: IteratorResult<In>): Promise<void>;
}
export interface IDuplexStream<In, Out = In> extends IReadableStream<Out>, IWritableStream<In> {
}
export declare type Binary = ArrayBuffer | ArrayBufferView;
export declare type RecursiveIterable<T> = T | Iterable<RecursiveIterable<T>>;
export declare type AsyncRecursiveIterable<T> = T | Promise<AsyncRecursiveIterable<T>> | Iterable<AsyncRecursiveIterable<T>> | AsyncIterable<AsyncRecursiveIterable<T>>;
export declare type DataStream = RecursiveIterable<Binary | string>;
export declare type AsyncDataStream = undefined | Binary | string | Promise<Binary | string> | Iterable<Binary | string> | AsyncIterable<Binary | string>;
/**
 * lua-style assert helper.
 * Throws `message` if `val` is falsy.
 */
export declare function assert(val: any, message?: string): asserts val;
/**
 * Get the Object.prototype.toString version of a value.
 */
export declare function tagOf(val: any): string;
/**
 * Check if a value is thenable
 */
export declare function getPromise<T>(val: any): Promise<T> | undefined;
export declare function getIterable<T>(val: any): Iterable<T> | undefined;
export declare function getAsyncIterable<T>(val: any): AsyncIterable<T> | undefined;
/**
 * Normalize binary values into Uint8Array
 */
export declare function normalizeBinary(data: any): Uint8Array | null;
/**
 * Normalize text or binary values into Uint8Array type.
 * Returns `null` if input is invalid type.
 */
export declare function normalizeTextOrBinary(data: any): Uint8Array | null;
/**
 * Consume an async iterator of Uint8Array values into a single Uint8Array
 */
export declare function consume(stream: AsyncIterableIterator<Uint8Array>): Promise<Uint8Array>;
/**
 * Consume an iterator of Uint8Array value into a single Uint8Array
 */
export declare function consumeSync(stream: Iterable<Uint8Array>): Uint8Array;
/**
 * Turn a flexible body into a strict async iterator of Uint8Array values.
 */
export declare function iterateBody(data: AsyncDataStream): AsyncIterableIterator<Uint8Array>;
/**
 * Turn a flexible body into a strict async iterator of Uint8Array values.
 */
export declare function iterateBodySync(data: DataStream): IterableIterator<Uint8Array>;
/**
 * Flatten a flexible body into a single Uint8Array
 */
export declare function flatten(stream: AsyncDataStream): Promise<Uint8Array>;
/**
 * Flatten a sync flexible body into a single Uint8Array
 */
export declare function flattenSync(stream: DataStream): Uint8Array;
/** Attempt to flatten a value as sync, but return nothing if not possible. */
export declare function tryFlatten(stream?: AsyncDataStream): Uint8Array | undefined;
/** Convert an utf8 encoded Uint8Array into a unicode string (with surrogate pairs.) */
export declare function utf8Decode(bin: Uint8Array): string;
export declare function utf8Length(str: string): number;
/** Convert a unicode string (with surrogate pairs) into an utf8 encoded Uint8Array */
export declare function utf8Encode(str: string): Uint8Array;
/**
 * indexOf for arrays/buffers.  Raw is a string in raw encoding (or ascii)
 * returns -1 when not found.
 * start and end are indexes into buffer.  Default is 0 and length.
 */
export declare function indexOf(bin: Uint8Array, raw: string, start?: number, end?: number): number;
export declare function pathJoin(base: string, ...inputs: string[]): string;
export declare type UrlMeta = {
    protocol: "http" | "https";
    host: string;
    port: number;
    path: string;
    query: string;
    hash: string;
    hostname: string;
    pathname: string;
} | {
    protocol: "file";
    path: string;
    query: string;
    hash: string;
};
export declare function normalizeUrl(input: string): [string, UrlMeta];
export declare function map<T, K>(iter: AsyncIterableIterator<T>, fn: (val: T) => K): AsyncIterableIterator<K>;
export declare function stringJoin(a: string, b: string): string;
export declare function uint8Join(a: Uint8Array, b: Uint8Array): Uint8Array;
export declare function uint8Add(a?: Uint8Array, b?: Uint8Array): Uint8Array | undefined;
export declare function noJoin<T>(a: T, b: T): T;
export interface IParsable {
    /** Read the next data chunk with optional size limit. */
    read(max?: number): Promise<Uint8Array | undefined>;
    /** Read into buffer till terminator is found and included in result. */
    readTo(buffer: Uint8Array, terminator?: string): Promise<Uint8Array | undefined>;
}
export declare function toParsable(iter: AsyncIterableIterator<Uint8Array>): IParsable;
