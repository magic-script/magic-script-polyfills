import { indexOf, binToRaw } from './bintools.js';
import { assert } from './assert.js';

export let STATUS_CODES = {
  '100': 'Continue',
  '101': 'Switching Protocols',
  '102': 'Processing', // RFC 2518, obsoleted by RFC 4918
  '200': 'OK',
  '201': 'Created',
  '202': 'Accepted',
  '203': 'Non-Authoritative Information',
  '204': 'No Content',
  '205': 'Reset Content',
  '206': 'Partial Content',
  '207': 'Multi-Status', // RFC 4918
  '300': 'Multiple Choices',
  '301': 'Moved Permanently',
  '302': 'Moved Temporarily',
  '303': 'See Other',
  '304': 'Not Modified',
  '305': 'Use Proxy',
  '307': 'Temporary Redirect',
  '400': 'Bad Request',
  '401': 'Unauthorized',
  '402': 'Payment Required',
  '403': 'Forbidden',
  '404': 'Not Found',
  '405': 'Method Not Allowed',
  '406': 'Not Acceptable',
  '407': 'Proxy Authentication Required',
  '408': 'Request Time-out',
  '409': 'Conflict',
  '410': 'Gone',
  '411': 'Length Required',
  '412': 'Precondition Failed',
  '413': 'Request Entity Too Large',
  '414': 'Request-URI Too Large',
  '415': 'Unsupported Media Type',
  '416': 'Requested Range Not Satisfiable',
  '417': 'Expectation Failed',
  '418': 'I\'m a teapot', // RFC 2324
  '422': 'Unprocessable Entity', // RFC 4918
  '423': 'Locked', // RFC 4918
  '424': 'Failed Dependency', // RFC 4918
  '425': 'Unordered Collection', // RFC 4918
  '426': 'Upgrade Required', // RFC 2817
  '500': 'Internal Server Error',
  '501': 'Not Implemented',
  '502': 'Bad Gateway',
  '503': 'Service Unavailable',
  '504': 'Gateway Time-out',
  '505': 'HTTP Version not supported',
  '506': 'Variant Also Negotiates', // RFC 2295
  '507': 'Insufficient Storage', // RFC 4918
  '509': 'Bandwidth Limit Exceeded',
  '510': 'Not Extended' // RFC 2774
};

export function encoder() {
  let mode;

  function encodeHead(item) {
    if (!item || item.constructor !== Object) {
      return item;
    } else if (typeof item !== 'object') {
      throw new Error(
        'expected an object but got a ' + (typeof item) + ' when encoding data'
      );
    }
    let head, chunkedEncoding;
    let version = item.version || 1.1;
    if (item.method) {
      let path = item.path;
      assert(path && path.length > 0, 'expected non-empty path');
      head = [item.method + ' ' + item.path + ' HTTP/' + version + '\r\n'];
    } else {
      let reason = item.reason || STATUS_CODES[item.code];
      head = ['HTTP/' + version + ' ' + item.code + ' ' + reason + '\r\n'];
    }
    let headers = item.headers;
    if (Array.isArray(headers)) {
      for (let i = 0, l = headers.length; i < l; i += 2) {
        processHeader(headers[i], headers[i + 1]);
      }
    } else {
      for (let key in headers) {
        processHeader(key, headers[key]);
      }
    }
    function processHeader(key, value) {
      let lowerKey = key.toLowerCase();
      if (lowerKey === 'transfer-encoding') {
        chunkedEncoding = value.toLowerCase() === 'chunked';
      }
      value = ('' + value).replace(/[\r\n]+/, ' ');
      head[head.length] = key + ': ' + value + '\r\n';
    }

    head[head.length] = '\r\n';

    mode = chunkedEncoding ? encodeChunked : encodeRaw;
    return head.join('');
  }

  function encodeRaw(item) {
    if (typeof item !== 'string') {
      mode = encodeHead;
      return encodeHead(item);
    }
    return item;
  }

  function encodeChunked(item) {
    if (typeof item !== 'string') {
      mode = encodeHead;
      let extra = encodeHead(item);
      if (extra) {
        return '0\r\n\r\n' + extra;
      } else {
        return '0\r\n\r\n';
      }
    }
    if (item.length === 0) {
      mode = encodeHead;
    }
    return item.length.toString(16) + '\r\n' + item + '\r\n';
  }

  mode = encodeHead;
  function encode(item) {
    return mode(item);
  }
  return encode;
}

export function decoder() {
  // This decoder is somewhat stateful with 5 different parsing states.
  let mode; // state variable that points to various decoders
  let bytesLeft; // For counted decoder

  // This state is for decoding the status line and headers.
  function decodeHead(chunk, offset) {
    if (!chunk || chunk.length <= offset) return;

    // First make sure we have all the head before continuing
    let index = indexOf(chunk, '\r\n\r\n', offset);
    if (index < 0) {
      if ((chunk.length - offset) < 8 * 1024) return;
      // But protect against evil clients by refusing heads over 8K long.
      throw new Error('entity too large');
    }
    // Remember where the head ended and the body started
    let bodyStart = index + 4;

    // Parse the status/request line
    let head = {};

    index = indexOf(chunk, '\n', offset) + 1;
    let line = binToRaw(chunk, offset, index);
    let match = line.match(/^HTTP\/(\d\.\d) (\d+) ([^\r\n]+)/);
    let version;
    if (match) {
      version = match[1];
      head.code = parseInt(match[2], 10);
      head.reason = match[3];
    } else {
      match = line.match(/^([A-Z]+) ([^ ]+) HTTP\/(\d\.\d)/);
      if (match) {
        head.method = match[1];
        head.path = match[2];
        version = match[3];
      } else {
        throw new Error('expected HTTP data');
      }
    }
    head.version = parseFloat(version);
    head.keepAlive = head.version > 1.0;

    // We need to inspect some headers to know how to parse the body.
    let contentLength;
    let chunkedEncoding;

    let headers = head.headers = [];
    // Parse the header lines
    let start = index;
    while ((index = indexOf(chunk, '\n', index) + 1)) {
      line = binToRaw(chunk, start, index);
      if (line === '\r\n') break;
      start = index;
      let match = line.match(/^([^:\r\n]+): *([^\r\n]*)/);
      if (!match) {
        throw new Error('Malformed HTTP header: ' + line);
      }
      let key = match[1];
      let value = match[2];
      let lowerKey = key.toLowerCase();

      // Inspect a few headers and remember the values
      if (lowerKey === 'content-length') {
        contentLength = parseInt(value);
      } else if (lowerKey === 'transfer-encoding') {
        chunkedEncoding = value.toLowerCase() === 'chunked';
      } else if (lowerKey === 'connection') {
        head.keepAlive = value.toLowerCase() === 'keep-alive';
      }
      headers.push(key, value);
    }

    if (head.keepAlive
      ? !(chunkedEncoding || (contentLength !== undefined && contentLength > 0))
      : (head.method === 'GET' || head.method === 'HEAD')
    ) {
      mode = decodeEmpty;
    } else if (chunkedEncoding) {
      mode = decodeChunked;
    } else if (contentLength !== undefined) {
      bytesLeft = contentLength;
      mode = decodeCounted;
    } else if (!head.keepAlive) {
      mode = decodeRaw;
    }
    return [head, bodyStart];
  }

  // This is used for inserting a single empty string into the output string for known empty bodies
  function decodeEmpty(chunk, offset) {
    mode = decodeHead;
    return [new Uint8Array(0), offset];
  }

  function decodeRaw(chunk, offset) {
    if (!chunk || chunk.length <= offset || !chunk.length) return;
    return [chunk.slice(offset), chunk.length];
  }

  function decodeChunked(chunk, offset) {
    if (!chunk) return;
    // Make sure we have at least the length header
    let index = indexOf(chunk, '\r\n', offset);
    if (index < 0) return;

    // And parse it
    let hex = binToRaw(chunk, offset, index);
    let length = parseInt(hex, 16);

    // Wait till we have the rest of the body
    let start = offset + hex.length + 2;
    let end = start + length;
    if ((chunk.length - offset) < end + 2) return;

    // An empty chunk means end of stream; reset state.
    if (length === 0) mode = decodeHead;

    // Make sure the chunk ends in '\r\n'
    assert(binToRaw(chunk, end, end + 2) === '\r\n', 'Invalid chunk tail');

    return [chunk.slice(start, end), end + 2];
  }

  function decodeCounted(chunk, offset) {
    if (bytesLeft === 0) {
      mode = decodeEmpty;
      return mode(chunk, offset);
    }
    let length = (chunk && chunk.length) - offset;
    // Make sure we have at least one byte to process
    if (length <= 0) return;

    if (length >= bytesLeft) { mode = decodeEmpty; }

    // If the entire chunk fits, pass it all through
    if (length <= bytesLeft) {
      bytesLeft -= length;
      return [chunk.slice(offset), chunk.length];
    }

    return [chunk.slice(offset, bytesLeft), offset + bytesLeft + 1];
  }

  // Switch between states by changing which decoder mode points to
  mode = decodeHead;
  function decode(chunk, offset) {
    return mode(chunk, offset);
  }
  return decode;
}
