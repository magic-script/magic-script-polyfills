
export interface IReadableStream<Out> extends AsyncIterableIterator<Out> { }

export interface IWritableStream<In> {
    push(evt: IteratorResult<In>): Promise<void>;
}

export interface IDuplexStream<In, Out = In> extends IReadableStream<Out>, IWritableStream<In> { }

export type Binary = ArrayBuffer | ArrayBufferView;
export type RecursiveIterable<T> = T
    | Iterable<RecursiveIterable<T>>;
export type AsyncRecursiveIterable<T> = T
    | Promise<AsyncRecursiveIterable<T>>
    | Iterable<AsyncRecursiveIterable<T>>
    | AsyncIterable<AsyncRecursiveIterable<T>>;
export type DataStream = RecursiveIterable<Binary | string>;

// TODO: find a way to represent this properly without crashing typescript
// export type AsyncDataStream = AsyncRecursiveIterable<Binary | string>;
export type AsyncDataStream = undefined |
    Binary | string | Promise<Binary | string> | Iterable<Binary | string> | AsyncIterable<Binary | string>;

/**
 * lua-style assert helper.
 * Throws `message` if `val` is falsy.
 */
export function assert(val: any, message = "Assertion failed"): asserts val {
    if (!val) { throw new Error(message); }
}

/**
 * Get the Object.prototype.toString version of a value.
 */
export function tagOf(val: any): string {
    return Object.prototype.toString.call(val);
}

/**
 * Check if a value is thenable
 */
export function getPromise<T>(val: any): Promise<T> | undefined {
    return val && typeof val.then === "function"
        ? val
        : undefined;
}

export function getIterable<T>(val: any): Iterable<T> | undefined {
    return val && typeof val === "object" && typeof val[Symbol.iterator] === "function"
        ? val as Iterable<T>
        : undefined;
}

export function getAsyncIterable<T>(val: any): AsyncIterable<T> | undefined {
    return val && typeof val === "object" && typeof val[Symbol.asyncIterator] === "function"
        ? val as AsyncIterable<T>
        : undefined;
}

/**
 * Normalize binary values into Uint8Array
 */
export function normalizeBinary(data: any): Uint8Array | null {
    // Wrap raw ArrayBuffer values in Uint8Array
    const tag = tagOf(data);
    if (tag === "[object ArrayBuffer]") {
        return new Uint8Array(data as ArrayBuffer);
    }

    // Normalize all ArrayBufferView types into Uint8Array
    if (ArrayBuffer.isView(data)) {
        if (tag === "[object Uint8Array]") { return data as Uint8Array; }
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }

    return null;
}

/**
 * Normalize text or binary values into Uint8Array type.
 * Returns `null` if input is invalid type.
 */
export function normalizeTextOrBinary(data: any): Uint8Array | null {
    // Convert strings into a binary type.
    if (typeof data === "string") {
        return utf8Encode(data);
    }

    return normalizeBinary(data);
}

/**
 * Consume an async iterator of Uint8Array values into a single Uint8Array
 */
export async function consume(stream: AsyncIterableIterator<Uint8Array>): Promise<Uint8Array> {
    let total = 0;
    const parts: Uint8Array[] = [];
    for await (const part of stream) {
        assert(tagOf(part) === "[object Uint8Array]");
        total += part.byteLength;
        parts.push(part);
    }
    const array = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
        array.set(part, offset);
        offset += part.byteLength;
    }
    return array;
}

/**
 * Consume an iterator of Uint8Array value into a single Uint8Array
 */
export function consumeSync(stream: Iterable<Uint8Array>): Uint8Array {
    let total = 0;
    const parts: Uint8Array[] = [];
    for (const part of stream) {
        assert(tagOf(part) === "[object Uint8Array]");
        total += part.byteLength;
        parts.push(part);
    }
    const array = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
        array.set(part, offset);
        offset += part.byteLength;
    }
    return array;
}

/**
 * Turn a flexible body into a strict async iterator of Uint8Array values.
 */
export async function* iterateBody(data: AsyncDataStream): AsyncIterableIterator<Uint8Array> {
    // Emit text or binary values as Uint8Array
    const binary = normalizeTextOrBinary(data);
    if (binary) {
        yield binary;
        return;
    }

    // Recursively iterate on promises after resolving them.
    const promise = getPromise<AsyncDataStream>(data);
    if (promise) {
        yield* iterateBody(await promise);
        return;
    }

    const iterable = getIterable<AsyncDataStream>(data);
    if (iterable) {
        for await (const part of iterable) {
            yield* iterateBody(part);
        }
        return;
    }

    const asyncIterable = getAsyncIterable<AsyncDataStream>(data);
    if (asyncIterable) {
        for await (const part of asyncIterable) {
            yield* iterateBody(part);
        }
        return;
    }

    // An unexpected type was passed in, we're done here.
    throw new Error("Unsupported value type in async body stream");
}

/**
 * Turn a flexible body into a strict async iterator of Uint8Array values.
 */
export function* iterateBodySync(data: DataStream): IterableIterator<Uint8Array> {

    // Emit text or binary values as Uint8Array
    const binary = normalizeTextOrBinary(data);
    if (binary) {
        yield binary;
        return;
    }

    // Recursively iterate on iterators.
    const iterable = getIterable<DataStream>(data);
    if (iterable) {
        for (const part of iterable) {
            yield* iterateBodySync(part);
        }
        return;
    }

    // An unexpected type was passed in, we're done here.
    throw new Error("Unsupported value type in sync body stream");
}

/**
 * Flatten a flexible body into a single Uint8Array
 */
export async function flatten(stream: AsyncDataStream): Promise<Uint8Array> {
    return consume(iterateBody(stream));
}

/**
 * Flatten a sync flexible body into a single Uint8Array
 */
export function flattenSync(stream: DataStream): Uint8Array {
    return consumeSync(iterateBodySync(stream));
}

/** Attempt to flatten a value as sync, but return nothing if not possible. */
export function tryFlatten(stream?: AsyncDataStream): Uint8Array | undefined {
    if (stream === undefined) { return new Uint8Array(0); }
    let iter;
    try {
        iter = iterateBodySync(stream as DataStream);
    } catch (err) {
        return undefined;
    }
    return consumeSync(iter);
}

/** Convert an utf8 encoded Uint8Array into a unicode string (with surrogate pairs.) */
export function utf8Decode(bin: Uint8Array): string {
    // tslint:disable: no-bitwise
    let str = "";
    for (let i = 0, l = bin.length; i < l;) {
        const byte = bin[i++];
        const codePoint =
            byte < 0x80
                ? byte
                : byte >= 0xc0 && byte < 0xe0
                    ? (byte & 0x1f) << 6 |
                    bin[i++] & 0x3f
                    : byte >= 0xe0 && byte < 0xf0
                        ? (byte & 0xf) << 12 |
                        (bin[i++] & 0x3f) << 6 |
                        bin[i++] & 0x3f
                        : byte >= 0xf0 && byte < 0xf8
                            ? (byte & 0x7) << 18 |
                            (bin[i++] & 0x3f) << 12 |
                            (bin[i++] & 0x3f) << 6 |
                            bin[i++] & 0x3f
                            : -1;
        if (codePoint < 0) {
            throw new Error("Invalid UTF-8 value found in decoding");
        }
        str += String.fromCodePoint(codePoint);
    }
    return str;
}

export function utf8Length(str: string): number {
    let sizeNeeded = 0;
    const length = str.length;
    for (let i = 0; i < length; i++) {
        const codePoint = str.codePointAt(i) as number;
        if (codePoint < 0x80) {
            sizeNeeded++;
        } else if (codePoint < 0x800) {
            sizeNeeded += 2;
        } else if (codePoint < 0x10000) {
            sizeNeeded += 3;
        } else {
            i++;
            sizeNeeded += 4;
        }
    }
    return sizeNeeded;
}

/** Convert a unicode string (with surrogate pairs) into an utf8 encoded Uint8Array */
export function utf8Encode(str: string): Uint8Array {
    const length = utf8Length(str);
    const buffer = new Uint8Array(length);
    let offset = 0;
    for (let i = 0; i < length; i++) {
        const codePoint = str.codePointAt(i) as number;
        if (codePoint < 0x80) {
            buffer[offset++] = codePoint;
        } else if (codePoint < 0x800) {
            buffer[offset++] = 0xc0 | (codePoint >> 6);
            buffer[offset++] = 0x80 | (codePoint & 0x3f);
        } else if (codePoint < 0x10000) {
            buffer[offset++] = 0xe0 | (codePoint >> 12);
            buffer[offset++] = 0x80 | ((codePoint >> 6) & 0x3f);
            buffer[offset++] = 0x80 | (codePoint & 0x3f);
        } else {
            i++;
            buffer[offset++] = 0xf0 | (codePoint >> 18);
            buffer[offset++] = 0x80 | ((codePoint >> 12) & 0x3f);
            buffer[offset++] = 0x80 | ((codePoint >> 6) & 0x3f);
            buffer[offset++] = 0x80 | (codePoint & 0x3f);
        }
    }
    return buffer;
}

/**
 * indexOf for arrays/buffers.  Raw is a string in raw encoding (or ascii)
 * returns -1 when not found.
 * start and end are indexes into buffer.  Default is 0 and length.
 */
export function indexOf(bin: Uint8Array, raw: string, start?: number, end?: number): number {
    /* eslint-disable no-labels */
    start = start == null ? 0 : start | 0;
    end = end == null ? bin.length : end | 0;
    outer: for (let i = start || 0; i < end; i++) {
        for (let j = 0, l = raw.length; j < l; j++) {
            if (i + j >= end || bin[i + j] !== raw.charCodeAt(j)) {
                continue outer;
            }
        }
        return i;
    }
    return -1;
}

export function pathJoin(base: string, ...inputs: string[]): string {
    const segments: string[] = [];
    for (const part of (base + "/" + inputs.join("/")).split(/\/+/)) {
        if (part === "" || part === ".") { continue; }
        if (part === "..") {
            segments.pop();
            continue;
        }
        segments.push(part);
    }
    return (base[0] === "/" ? "/" : "") + segments.join("/");
}

export type UrlMeta =
    {
        protocol: "http" | "https", host: string, port: number,
        path: string, query: string, hash: string, hostname: string, pathname: string,
    } | {
        protocol: "file", path: string, query: string, hash: string,
    };

export function normalizeUrl(input: string): [string, UrlMeta] {
    print("Normalize", input);
    if (typeof input !== "string") { throw new TypeError("Input must be string"); }
    let match = input.match(/^([a-z]+):/);
    let protocol;

    if (match) {
        protocol = match[1];
    } else {
        protocol = "file";
        input = `file://${input}`;
    }

    if (protocol === "http" || protocol === "https") {
        match = input.match(/^https?:\/\/([^:/]+)(:[0-9]+)?(\/[^?#]*)?([?][^#]*)?(#.*)?$/);
        if (!match) {
            throw new TypeError(`Invalid ${protocol} url: '${input}'`);
        }
        const [, host, portStr, rawPath, query, hash] = match;
        const path = pathJoin("/", rawPath);
        const defaultPort = protocol === "http" ? 80 : 443;
        const port = portStr ? parseInt(portStr.substr(1), 10) : defaultPort;
        const hostname = `${host}${port === defaultPort ? "" : ":" + port}`;
        const pathname = `${path}${query || ""}`;
        const url = `${protocol}://${hostname}${pathname}${hash || ""}`;
        return [url, { protocol, host, port, path, query, hash, hostname, pathname }];
    }

    if (protocol === "file") {
        match = input.match(/^file:\/\/([^?#]+)([?][^#]*)?(#.*)?$/);
        if (!match) {
            throw new TypeError(`Invalid ${protocol} url: '${input}'`);
        }
        const [, rawPath, query, hash] = match;
        const path = pathJoin(rawPath);
        const url = `${protocol}://${path}${query || ""}`;
        return [url, { protocol, path, query, hash }];
    }
    throw new TypeError(`Unsupported protocol: '${protocol}'`);
}

export async function* map<T, K>(iter: AsyncIterableIterator<T>, fn: (val: T) => K): AsyncIterableIterator<K> {
    for await (const value of iter) {
        yield (fn(value));
    }
}

export function stringJoin(a: string, b: string): string {
    return a + b;
}

export function uint8Join(a: Uint8Array, b: Uint8Array): Uint8Array {
    const combined = new Uint8Array(a.byteLength + b.byteLength);
    combined.set(a, 0);
    combined.set(b, a.byteLength);
    return combined;
}

export function uint8Add(a?: Uint8Array, b?: Uint8Array): Uint8Array | undefined {
    return a && a.length
        ? b && b.length
            ? uint8Join(a, b)
            : a
        : b && b.length
            ? b
            : undefined;
}

export function noJoin<T>(a: T, b: T): T {
    throw new Error(`Cannot join parts: ${a} + ${b}`);
}

export interface IParsable {
    /** Read the next data chunk with optional size limit. */
    read(max?: number): Promise<Uint8Array | undefined>;

    /** Read into buffer till terminator is found and included in result. */
    readTo(buffer: Uint8Array, terminator?: string): Promise<Uint8Array | undefined>;
}

export function toParsable(iter: AsyncIterableIterator<Uint8Array>): IParsable {

    let extra: Uint8Array | undefined;

    async function grow() {
        do {
            const { done, value } = await iter.next();
            if (done) { return; }
            extra = uint8Add(extra, value);
        } while (!extra);
    }

    return {
        async read(max?: number): Promise<Uint8Array | undefined> {
            if (!extra) { await grow(); }
            if (!extra) { return undefined; }

            // p("reading", { max, "extra.length": extra.length });
            let value: Uint8Array;
            if (max && max < extra.length) {
                value = extra.subarray(0, max);
                extra = extra.subarray(max);
            } else {
                value = extra;
                extra = undefined;
            }
            return value;
        },

        async readTo(buffer: Uint8Array, terminator?: string): Promise<Uint8Array | undefined> {
            let left = buffer.length;
            let written = 0;

            while (left > 0) {
                if (!extra) { await grow(); }
                if (!extra) { return undefined; }

                const data = extra.length > left
                    ? extra.subarray(0, left)
                    : extra;
                // p("readTo2", { left, extra: extra && extra.length, data: data && data.length });
                // p("writing", { buffer, data, written, extra })
                buffer.set(data, written);
                const oldWritten = written;
                written += data.length;
                extra = extra.length > left
                    ? extra.subarray(left)
                    : undefined;
                left -= data.length;

                if (terminator) {
                    // If the last chunk didn't match, we need to re-search it's last bits in case
                    // the terminator is split across boundaries.
                    const start = Math.max(0, oldWritten - terminator.length + 1);
                    // no sense in searching past the written to part.
                    let end = written;
                    const index = indexOf(buffer, terminator, start, end);
                    if (index >= 0) {
                        end = index + terminator.length;
                        extra = uint8Add(extra, buffer.subarray(end, written));
                        return buffer.subarray(0, end);
                    } else if (left === 0) {
                        throw new Error("Terminator never found in time");
                    }
                }
            }
            // p("readto", { left, written, extra, buffer })
            return buffer;
        },
    };
}
