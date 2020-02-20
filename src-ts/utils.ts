
/**
 * Consume an async iterator of ArrayBuffers into a single ArrayBuffer
 * @param {IterableIterator<Promise<ArrayBuffer>>} stream
 * @returns {Promise<ArrayBuffer>}
 */
export async function consume(stream) {
  let total = 0;
  let parts = [];
  for await (let part of stream) {
    total += part.byteLength;
    parts.push(part);
  }
  let array = new Uint8Array(total);
  let offset = 0;
  for (let part of parts) {
    array.set(new Uint8Array(part), offset);
    offset += part.byteLength;
  }
  return array.buffer;
}

/**
 * Convert an ArrayBuffer containing utf8 encoded text into a string.
 * @param {ArrayBuffer} bin
 * @returns {string}
 */
export function binToStr(bin) {
  const array = new Uint8Array(bin);
  const end = array.length;
  let raw = '';
  for (let i = 0; i < end; i++) {
    raw += String.fromCharCode(array[i]);
  }
  // Minimal UTF8 decode (doesn't work for all edge cases)
  return decodeURIComponent(escape(raw));
}

/**
 * Convert a string into a new utf8 encoded ArrayBuffer.
 * @param {string} str
 * @returns {ArrayBuffer}
 */
export function strToBin(str) {
  // Minimal UTF8 encode (doesn't work for all edge cases)
  const raw = unescape(encodeURIComponent(str));
  const length = raw.length;
  const bin = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bin[i] = raw.charCodeAt(i);
  }
  return bin.buffer;
}
