
// TYPES:
//   bin - a Uint8Array in browser or node Buffer containing binary data.
//   str - a normal unicode string.
//   raw - a string where each character's charCode is a byte value. (utf-8)
//   hex - a string holding binary data as lowercase hexadecimal.
//   b64 - a string holding binary data in base64 encoding.

/**
 * @param {any} bin
 * @returns {boolean}
 */
export function isBin (bin) {
  return bin instanceof Uint8Array;
}

/**
 * @param {string} raw
 * @param {number} start
 * @param {number} end
 * @returns {Uint8Array}
 */
export function rawToBin (raw, start, end) {
  raw = '' + raw;
  start = start == null ? 0 : start | 0;
  end = end == null ? raw.length : end | 0;
  let len = end - start;
  let bin = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bin[i] = raw.charCodeAt(i + start);
  }
  return bin;
}

/**
 * @param {Uint8Array} bin
 * @param {number} start
 * @param {number} end
 * @returns {string}
 */
export function binToRaw (bin, start, end) {
  if (!(bin instanceof Uint8Array)) bin = new Uint8Array(bin);
  start = start == null ? 0 : start | 0;
  end = end == null ? bin.length : end | 0;
  let raw = '';
  for (let i = start || 0; i < end; i++) {
    raw += String.fromCharCode(bin[i]);
  }
  return raw;
}

/**
 * @param {Uint8Array} bin
 * @param {number} start
 * @param {number} end
 * @returns {string}
 */
export function binToHex (bin, start, end) {
  if (!(bin instanceof Uint8Array)) bin = new Uint8Array(bin);
  start = start == null ? 0 : start | 0;
  end = end == null ? bin.length : end | 0;
  let hex = '';
  for (let i = start; i < end; i++) {
    let byte = bin[i];
    hex += (byte < 0x10 ? '0' : '') + byte.toString(16);
  }
  return hex;
}

/**
 * @param {string} hex
 * @param {number} start
 * @param {number} end
 * @returns {Uint8Array}
 */
export function hexToBin (hex, start, end) {
  hex = '' + hex;
  start = start == null ? 0 : start | 0;
  end = end == null ? hex.length : end | 0;
  let len = (end - start) >> 1;
  let bin = new Uint8Array(len);
  let offset = 0;
  for (let i = start; i < end; i += 2) {
    bin[offset++] = parseInt(hex.substr(i, 2), 16);
  }
  return bin;
}

/**
 * @param {string} str
 * @returns {string}
 */
export function strToRaw (str) {
  return unescape(encodeURIComponent(str));
}

/**
 * @param {string} raw
 * @returns {string}
 */
export function rawToStr (raw) {
  return decodeURIComponent(escape(raw));
}

function getCodes () {
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
}
let map;
function getMap () {
  if (map) return map;
  map = [];
  let codes = getCodes();
  for (let i = 0, l = codes.length; i < l; i++) {
    map[codes.charCodeAt(i)] = i;
  }
  return map;
}

// Loop over input 3 bytes at a time
// a,b,c are 3 x 8-bit numbers
// they are encoded into groups of 4 x 6-bit numbers
// aaaaaa aabbbb bbbbcc cccccc
// if there is no c, then pad the 4th with =
// if there is also no b then pad the 3rd with =
/**
 * @param {Uint8Array} bin
 * @returns {string}
 */
export function binToB64 (bin) {
  let b64 = '';
  let codes = getCodes();
  for (let i = 0, l = bin.length; i < l; i += 3) {
    let a = bin[i];
    let b = i + 1 < l ? bin[i + 1] : -1;
    let c = i + 2 < l ? bin[i + 2] : -1;
    b64 +=
      // Higher 6 bits of a
      codes[a >> 2] +
      // Lower 2 bits of a + high 4 bits of b
      codes[((a & 3) << 4) | (b >= 0 ? b >> 4 : 0)] +
      // Low 4 bits of b + High 2 bits of c
      (b >= 0 ? codes[((b & 15) << 2) | (c >= 0 ? c >> 6 : 0)] : '=') +
      // Lower 6 bits of c
      (c >= 0 ? codes[c & 63] : '=');
  }
  return b64;
}

// loop over input 4 characters at a time
// The characters are mapped to 4 x 6-bit integers a,b,c,d
// They need to be reassembled into 3 x 8-bit bytes
// aaaaaabb bbbbcccc ccdddddd
// if d is padding then there is no 3rd byte
// if c is padding then there is no 2nd byte
/**
 * @param {string} b64
 * @returns {Uint8Array}
 */
export function b64ToBin (b64) {
  let map = getMap();
  let bytes = [];
  let j = 0;
  for (let i = 0, l = b64.length; i < l; i += 4) {
    let a = map[b64.charCodeAt(i)];
    let b = map[b64.charCodeAt(i + 1)];
    let c = map[b64.charCodeAt(i + 2)];
    let d = map[b64.charCodeAt(i + 3)];

    // higher 6 bits are the first char
    // lower 2 bits are upper 2 bits of second char
    bytes[j] = (a << 2) | (b >> 4);

    // if the third char is not padding, we have a second byte
    if (c < 64) {
      // high 4 bits come from lower 4 bits in b
      // low 4 bits come from high 4 bits in c
      bytes[j + 1] = ((b & 0xf) << 4) | (c >> 2);

      // if the fourth char is not padding, we have a third byte
      if (d < 64) {
        // Upper 2 bits come from Lower 2 bits of c
        // Lower 6 bits come from d
        bytes[j + 2] = ((c & 3) << 6) | d;
      }
    }
    j = j + 3;
  }
  return new Uint8Array(bytes);
}

/**
 * @param {string} str
 * @returns {Uint8Array}
 */
export function strToBin (str) {
  return rawToBin(strToRaw(str));
}

/**
 * @param {Uint8Array} bin
 * @param {number} [start]
 * @param {number} [end]
 * @returns {string}
 */
export function binToStr (bin, start, end) {
  return rawToStr(binToRaw(bin, start, end));
}

/**
 * @param {string} raw
 * @param {number} start
 * @param {number} end
 * @returns {string}
 */
export function rawToHex (raw, start, end) {
  return binToHex(rawToBin(raw, start, end));
}

/**
 * @param {string} hex
 * @returns {string}
 */
export function hexToRaw (hex) {
  return binToRaw(hexToBin(hex));
}

/**
 * @param {string} str
 * @returns {string}
 */
export function strToHex (str) {
  return binToHex(strToBin(str));
}

/**
 * @param {string} hex
 * @returns {string}
 */
export function hexToStr (hex) {
  return binToStr(hexToBin(hex));
}

/**
 * @param {string} b64
 * @returns {string}
 */
export function b64ToStr (b64) {
  return binToStr(b64ToBin(b64));
}

/**
 * @param {string} str
 * @returns {string}
 */
export function strToB64 (str) {
  return binToB64(strToBin(str));
}

/**
 * @param {string} b64
 * @returns {string}
 */
export function b64ToHex (b64) {
  return binToHex(b64ToBin(b64));
}

/**
 * @param {string} hex
 * @returns {string}
 */
export function hexToB64 (hex) {
  return binToB64(hexToBin(hex));
}

/**
 * @param {string} b64
 * @returns {string}
 */
export function b64ToRaw (b64) {
  return binToRaw(b64ToBin(b64));
}

/**
 * @param {string} raw
 * @param {number} start
 * @param {number} end
 * @returns {string}
 */
export function rawToB64 (raw, start, end) {
  return binToB64(rawToBin(raw, start, end));
}

// This takes nested lists of numbers, strings and array buffers and returns
// a single buffer.  Numbers represent single bytes, strings are raw 8-bit
// strings, and buffers represent themselves.
// EX:
//    1           -> <01>
//    "Hi"        -> <48 69>
//    [1, "Hi"]   -> <01 48 69>
//    [[1],2,[3]] -> <01 02 03>
/**
 * @param {any} parts
 * @returns {Uint8Array}
 */
export function flatten (parts) {
  if (typeof parts === 'number') return new Uint8Array([parts]);
  if (parts instanceof Uint8Array) return parts;
  if (parts instanceof ArrayBuffer) return new Uint8Array(parts);
  let buffer = new Uint8Array(count(parts));
  copy(buffer, 0, parts);
  return buffer;
}

function count (value) {
  if (value == null) return 0;
  if (typeof value === 'number') return 1;
  if (typeof value === 'string') return value.length;
  if (value instanceof Uint8Array) return value.length;
  if (value instanceof ArrayBuffer) return value.byteLength;
  if (!Array.isArray(value)) {
    print('VALUE', value);
    throw new TypeError('Bad type for flatten: ' + typeof value);
  }
  let sum = 0;
  for (let piece of value) {
    sum += count(piece);
  }
  return sum;
}

function copy (buffer, offset, value) {
  if (value == null) return offset;
  if (typeof value === 'number') {
    buffer[offset++] = value;
    return offset;
  }
  if (typeof value === 'string') {
    for (let i = 0, l = value.length; i < l; i++) {
      buffer[offset++] = value.charCodeAt(i);
    }
    return offset;
  }
  if (value instanceof ArrayBuffer) {
    value = new Uint8Array(value);
  }
  for (let piece of value) {
    offset = copy(buffer, offset, piece);
  }
  return offset;
}

/**
 * indexOf for arrays/buffers.  Raw is a string in raw encoding.
 * returns -1 when not found.
 * start and end are indexes into buffer.  Default is 0 and length.
 * @param {Uint8Array} bin
 * @param {string} raw
 * @param {number} start
 * @param {number} end
 * @returns {number}
 */
export function indexOf (bin, raw, start, end) {
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

/**
 * @param {number} num
 * @returns {number}
 */
export function uint8 (num) {
  return (num >>> 0) & 0xff;
}

/**
 * @param {number} num
 * @returns {[number, number]}
 */
export function uint16 (num) {
  num = (num >>> 0) & 0xffff;
  return [
    num >> 8,
    num & 0xff
  ];
}

/**
 * @param {number} num
 * @returns {[number, number, number, number]}
 */
export function uint32 (num) {
  num >>>= 0;
  return [
    num >> 24,
    (num >> 16) & 0xff,
    (num >> 8) & 0xff,
    num & 0xff
  ];
}

/**
 *
 * @param {number} num
 * @returns {[[number, number, number, number],[number, number, number, number]]}
 */
export function uint64 (num) {
  if (num < 0) num += 0x10000000000000000;
  return [
    uint32(num / 0x100000000),
    uint32(num % 0x100000000)
  ];
}

// If the first 1 bit of the byte is 0,that character is 1 byte width and this is the byte.
// If the first 2 bit of the byte is 10,that byte is not the first byte of a character
// If the first 3 bit is 110,that character is 2 byte width and this is the first byte
// If the first 4 bit is 1110,that character is 3 byte width and this is the first byte
// If the first 5 bit is 11110,that character is 4 byte width and this is the first byte
// If the first 6 bit is 111110,that character is 5 byte width and this is the first byte
/**
 * @param {Uint8Array} bin
 * @returns {boolean}
 */
export function isUTF8 (bin) {
  let i = 0;
  let l = bin.length;
  while (i < l) {
    if (bin[i] < 0x80) i++;
    else if (bin[i] < 0xc0) return false;
    else if (bin[i] < 0xe0) i += 2;
    else if (bin[i] < 0xf0) i += 3;
    else if (bin[i] < 0xf8) i += 4;
    else if (bin[i] < 0xfc) i += 5;
  }
  return i === l;
}

/**
 * @param {Uint8Array} bin
 * @param {number} start
 * @param {number} end
 * @returns {number}
 */
export function parseOct (bin, start, end) {
  let val = 0;
  let sign = 1;
  if (bin[start] === 0x2d) {
    start++;
    sign = -1;
  }
  while (start < end) {
    val = (val << 3) + bin[start++] - 0x30;
  }
  return sign * val;
}

/**
 * @param {Uint8Array} bin
 * @param {number} start
 * @param {number} end
 * @returns {number}
 */
export function parseDec (bin, start, end) {
  let val = 0;
  let sign = 1;
  if (bin[start] === 0x2d) {
    start++;
    sign = -1;
  }
  while (start < end) {
    val = val * 10 + bin[start++] - 0x30;
  }
  return sign * val;
}
