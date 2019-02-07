import { Timer, Check, getaddrinfo, Getaddrinfo, Tcp, Connect, Write, Shutdown, Fs, fs } from 'uv';

/// <reference path="../lib.uv.d.ts"/>

/**
 * Sets a timer which executes a function or specified piece of code once the timer expires.
 * @param {function} fn - A function to be executed after the timer expires.
 * @param {number} delay - The time, in milliseconds, the timer should wait before the specified function or code is executed.
 * @param  {...any} args - Additional parameters which are passed through to the function once the timer expires.
 * @returns {Timer}
 */
function setTimeout (fn, delay = 0, ...args) {
  let timer = new Timer();
  timer.start(() => {
    timer.close();
    fn(...args);
  }, delay, 0);
  return timer;
}

/**
 * Cancels a timeout previously established by calling setTimeout().
 * @param {Timer} timer - The identifier of the timeout you want to cancel.
 */
function clearTimeout (timer) {
  timer.close();
}

/**
 * Repeatedly calls a function or executes a code snippet, with a fixed time delay between each call.
 * @param {function} fn - A function to be executed every delay milliseconds.
 * @param {number} delay - The time, in milliseconds, the timer should delay in between executions of the specified function or code
 * @param  {...any} args - Additional parameters which are passed through to the function once the timer expires.
 * @returns {Timer}
 */
function setInterval (fn, delay, ...args) {
  if (delay < 10) {
    delay = 10;
  }
  let timer = new Timer();
  timer.start(() => {
    fn(...args);
  }, delay, delay);
  return timer;
}

/**
 * Cancels an interval previously established by calling setInterval().
 * @param {Timer} timer - The identifier of the interval you want to cancel.
 */
function clearInterval (timer) {
  timer.close();
}

let check;
let checkQueue = [];

/**
 * This method is used to defer running some code till after the current JS stack.
 * Unlike using promises, this is lighter weight and doesn't swallow errors.
 * @param {function} fn - the function you wish to call later.
 * @param  {...any} args - Additional parameters which are passed through to the function when called.
 * @returns {any} - the ID used for clearing the immediate.
 */
function setImmediate (fn, ...args) {
  if (!check) {
    check = new Check();
    check.start(onCheck);
  }
  let id = () => fn(...args);
  checkQueue.push(id);
  return id;
}

/**
 * Clear the immediate actions, just like window.clearTimeout for window.setTimeout.
 * @param {any} id  - the ID returned from setImmediate
 */
function clearImmediate (id) {
  checkQueue.splice(checkQueue.indexOf(id), 1);
}

function onCheck () {
  while (checkQueue.length) {
    let tasks = checkQueue;
    checkQueue = [];
    for (let fn of tasks) {
      try {
        fn();
      } catch (err) {
      }
    }
  }
  check.stop();
  check.close();
  check = null;
}

/// <reference path="../lib.uv.d.ts"/>

function makeCallback () {
  let callback, promise;
  promise = new Promise((resolve, reject) => {
    callback = (err, val) => err ? reject(err) : resolve(val);
  });
  callback.promise = promise;
  return callback;
}

async function connect (host, service) {
  // Resolve IP address and TCP port
  let cb = makeCallback();
  getaddrinfo(new Getaddrinfo(), cb, host, '' + service);
  let [{ ip, port }] = await cb.promise;

  // Connect to server
  let socket = new Tcp();
  cb = makeCallback();
  socket.connect(new Connect(), ip, port, cb);
  await cb.promise;

  return socket;
}

/**
 * @param {Uint8Array} bin
 * @param {number} start
 * @param {number} end
 * @returns {string}
 */
function binToRaw (bin, start, end) {
  if (!(bin instanceof Uint8Array)) bin = new Uint8Array(bin);
  start = start == null ? 0 : start | 0;
  end = end == null ? bin.length : end | 0;
  let raw = '';
  for (let i = start || 0; i < end; i++) {
    raw += String.fromCharCode(bin[i]);
  }
  return raw
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
function flatten (parts) {
  if (typeof parts === 'number') return new Uint8Array([parts])
  if (parts instanceof Uint8Array) return parts
  let buffer = new Uint8Array(count(parts));
  copy(buffer, 0, parts);
  return buffer
}

function count (value) {
  if (value == null) return 0
  if (typeof value === 'number') return 1
  if (typeof value === 'string') return value.length
  if (value instanceof Uint8Array) return value.length
  if (!Array.isArray(value)) {
    console.log('VALUE', value);
    throw new TypeError('Bad type for flatten: ' + typeof value)
  }
  let sum = 0;
  for (let piece of value) {
    sum += count(piece);
  }
  return sum
}

function copy (buffer, offset, value) {
  if (value == null) return offset
  if (typeof value === 'number') {
    buffer[offset++] = value;
    return offset
  }
  if (typeof value === 'string') {
    for (let i = 0, l = value.length; i < l; i++) {
      buffer[offset++] = value.charCodeAt(i);
    }
    return offset
  }
  if (value instanceof ArrayBuffer) {
    value = new Uint8Array(value);
  }
  for (let piece of value) {
    offset = copy(buffer, offset, piece);
  }
  return offset
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
function indexOf (bin, raw, start, end) {
  /* eslint-disable no-labels */
  start = start == null ? 0 : start | 0;
  end = end == null ? bin.length : end | 0;
  outer: for (let i = start || 0; i < end; i++) {
    for (let j = 0, l = raw.length; j < l; j++) {
      if (i + j >= end || bin[i + j] !== raw.charCodeAt(j)) {
        continue outer
      }
    }
    return i
  }
  return -1
}

/**
 * lua-style assert helper
 * @param {any} val
 * @param {String} message
 */
function assert (val, message) {
  if (!val) throw new Error(message || 'Assertion Failed')
  return val
}

let STATUS_CODES = {
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
  '418': "I'm a teapot", // RFC 2324
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

function encoder () {
  let mode;

  function encodeHead (item) {
    if (!item || item.constructor !== Object) {
      return item
    } else if (typeof item !== 'object') {
      throw new Error(
        'expected an object but got a ' + (typeof item) + ' when encoding data'
      )
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
    function processHeader (key, value) {
      let lowerKey = key.toLowerCase();
      if (lowerKey === 'transfer-encoding') {
        chunkedEncoding = value.toLowerCase() === 'chunked';
      }
      value = ('' + value).replace(/[\r\n]+/, ' ');
      head[head.length] = key + ': ' + value + '\r\n';
    }

    head[head.length] = '\r\n';

    mode = chunkedEncoding ? encodeChunked : encodeRaw;
    return head.join('')
  }

  function encodeRaw (item) {
    if (typeof item !== 'string') {
      mode = encodeHead;
      return encodeHead(item)
    }
    return item
  }

  function encodeChunked (item) {
    if (typeof item !== 'string') {
      mode = encodeHead;
      let extra = encodeHead(item);
      if (extra) {
        return '0\r\n\r\n' + extra
      } else {
        return '0\r\n\r\n'
      }
    }
    if (item.length === 0) {
      mode = encodeHead;
    }
    return item.length.toString(16) + '\r\n' + item + '\r\n'
  }

  mode = encodeHead;
  function encode (item) {
    return mode(item)
  }
  return encode
}

function decoder () {
  // This decoder is somewhat stateful with 5 different parsing states.
  let mode; // state variable that points to various decoders
  let bytesLeft; // For counted decoder

  // This state is for decoding the status line and headers.
  function decodeHead (chunk, offset) {
    if (!chunk || chunk.length <= offset) return

    // First make sure we have all the head before continuing
    let index = indexOf(chunk, '\r\n\r\n', offset);
    if (index < 0) {
      if ((chunk.length - offset) < 8 * 1024) return
      // But protect against evil clients by refusing heads over 8K long.
      throw new Error('entity too large')
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
        throw new Error('expected HTTP data')
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
      if (line === '\r\n') break
      start = index;
      let match = line.match(/^([^:\r\n]+): *([^\r\n]+)/);
      if (!match) {
        throw new Error('Malformed HTTP header: ' + line)
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
    return [head, bodyStart]
  }

  // This is used for inserting a single empty string into the output string for known empty bodies
  function decodeEmpty (chunk, offset) {
    mode = decodeHead;
    return [new Uint8Array(0), offset]
  }

  function decodeRaw (chunk, offset) {
    if (!chunk || chunk.length >= offset) return [new Uint8Array(0)]
    if (chunk.length === 0) return
    return [chunk.slice(offset), chunk.length]
  }

  function decodeChunked (chunk, offset) {
    // Make sure we have at least the length header
    let index = indexOf(chunk, '\r\n', offset);
    if (index < 0) return

    // And parse it
    let hex = binToRaw(chunk, offset, index);
    let length = parseInt(hex, 16);

    // Wait till we have the rest of the body
    let start = hex.length + 2;
    let end = start + length;
    if ((chunk.length - offset) < end + 2) return

    // An empty chunk means end of stream; reset state.
    if (length === 0) mode = decodeHead;

    // Make sure the chunk ends in '\r\n'
    assert(binToRaw(chunk, end, end + 2) === '\r\n', 'Invalid chunk tail');

    return [chunk.slice(start, end), end + 2]
  }

  function decodeCounted (chunk, offset) {
    if (bytesLeft === 0) {
      mode = decodeEmpty;
      return mode(chunk, offset)
    }
    let length = chunk.length - offset;
    // Make sure we have at least one byte to process
    if (length <= 0) return

    if (length >= bytesLeft) { mode = decodeEmpty; }

    // If the entire chunk fits, pass it all through
    if (length <= bytesLeft) {
      bytesLeft -= length;
      return [chunk.slice(offset), chunk.length]
    }

    return [chunk.slice(offset, bytesLeft), offset + bytesLeft + 1]
  }

  // Switch between states by changing which decoder mode points to
  mode = decodeHead;
  function decode (chunk, offset) {
    return mode(chunk, offset)
  }
  return decode
}

function makeCloser (socket) {
  let closer = {
    read: false,
    written: false,
    errored: false
  };

  let closed = false;

  function close () {
    if (closed) return
    closed = true;
    if (!closer.readClosed) {
      closer.readClosed = true;
      if (closer.onClose) {
        closer.onClose();
      }
    }
    socket.close();
  }

  closer.close = close;

  closer.check = function check () {
    if (closer.errored || (closer.read && closer.written)) {
      return close()
    }
  };

  return closer
}

function makeRead (socket, decode, closer) {
  // null = not started, true = flowing, false = paused
  let state = null;

  // If writer > reader, there is data to be read.
  // if reader > writer, there is data required.
  let queue = [];
  let reader = 0;
  let writer = 0;

  let concat = decode.concat || defaultConcat;

  function onValue (err, val) {
    // console.log('<-', err || JSON.stringify(val))

    // If there is a pending writer, give it the data right away.
    if (reader > writer) {
      let { resolve, reject } = queue[writer];
      queue[writer++] = undefined;
      return err ? reject(err) : resolve(val)
    }

    // Pause the read stream if we're buffering data already.
    if (state && writer > reader) {
      state = false;
      // console.log('[[ READ STOP ]]')
      socket.readStop();
    }

    // Store the event in the queue waiting for a future reader
    queue[writer++] = { err, val };
  }

  closer.onClose = function onClose () {
    if (!closer.read) {
      closer.read = true;
      return onValue(closer.errored)
    }
  };

  // buffer to store leftover data between decoder calls.
  let buffer;

  function onData (err, array) {
    if (err) {
      closer.errored = err;
      return closer.check()
    }
    if (!array) {
      if (closer.read) return
      closer.read = true;
      onValue();
      return closer.check()
    }
    let chunk = new Uint8Array(array);
    if (!decode) return onValue(null, chunk)
    buffer = concat(buffer, chunk);
    let out;
    let offset = 0;
    while ((out = decode(buffer, offset))) {
      // console.log('OUT', out)
      offset = out[1];
      onValue(null, out[0]);
    }
    buffer = buffer && buffer.length > offset ? buffer.slice(offset) : null;
    // console.log('Done parsing')
  }

  async function read () {
    // If there is pending data, return it right away.
    if (writer > reader) {
      let { err, val } = queue[reader];
      queue[reader++] = undefined;
      if (err) throw err
      return val
    }

    // Make sure the data is flowing since we need it.
    if (!state) {
      state = true;
      // console.log('[[ READ START]]')
      socket.readStart(onData);
    }

    // Wait for the data or a parse error.
    return new Promise(function (resolve, reject) {
      queue[reader++] = { resolve, reject };
    })
  }

  read.updateDecode = (newDecode) => {
    decode = newDecode;
    concat = decode.concat || defaultConcat;
  };

  return read
}

function makeWrite (socket, encode, closer) {
  async function write (value) {
    if (closer.written) {
      throw new Error('Already shutdown')
    }

    // console.log('->', JSON.stringify(value))

    if (encode) value = encode(value);

    return new Promise((resolve, reject) => {
      if (value != null) {
        socket.write(
          new Write(),
          flatten(value).buffer,
          err => err ? reject(err) : resolve()
        );
      } else {
        socket.shutdown(new Shutdown(), err => {
          if (err) closer.errored = err;
          closer.written = true;
          closer.check();
          err ? reject(err) : resolve();
        });
      }
    })
  }

  write.updateEncode = function (newEncode) {
    encode = newEncode;
  };

  return write
}

function wrapStream (socket, { decode, encode }) {
  assert(socket && socket.write && socket.shutdown && socket.readStart && socket.readStop && socket.close, 'Missing stream functions');
  let closer = makeCloser(socket);
  let read = makeRead(socket, decode, closer);
  let write = makeWrite(socket, encode, closer);
  read.close = closer.close;
  write.close = closer.close;
  return { read, write }
}

function defaultConcat (buffer, chunk) {
  return (buffer && buffer.length) ? flatten([buffer, chunk]) : chunk
}

/**
 * Perform an HTTP Request
 * @param {Request} req
 * @returns {Response}
 */
async function httpRequest (req) {
  let { host, port, hostname, pathname } = req.meta;
  let socket = await connect(host, port);
  let { read, write } = wrapStream(socket, {
    encode: encoder(),
    decode: decoder()
  });

  req.headers.set('Host', hostname);
  req.headers.set('Connection', 'close');
  req.headers.set('User-Agent', 'MagicScript');

  let headers = [];
  for (let [key, value] of req.headers) {
    headers.push(key, value);
  }

  await write({
    method: req.method,
    path: pathname,
    headers
  });
  if (req.body) {
    throw new Error('TODO: implement request bodies');
  }
  await write('');

  let res = await read();

  async function next () {
    let part = await read();
    if (!part || part.length === 0) return { done: true };
    await write();
    return {
      done: false, value: part
    };
  }
  let body = { [Symbol.asyncIterator] () { return this; }, next };
  let resHeaders = new Headers();
  for (let i = 0, l = res.headers.length; i < l; i += 2) {
    resHeaders.set(res.headers[i], res.headers[i + 1]);
  }
  return new Response(body, {
    status: res.code,
    statusText: res.reason,
    url: req.url,
    headers: resHeaders
  });
}

// A simple mime database.
let types;

let defaultBinary = 'application/octet-stream';
let defaultText = 'text/plain';

function guess (path, isText) {
  path = path.toLowerCase().trim();
  var index = path.lastIndexOf('/');
  if (index >= 0) {
    path = path.substr(index + 1);
  }
  index = path.lastIndexOf('.');
  if (index >= 0) {
    path = path.substr(index + 1);
  }
  return types[path] || ((isText && isText()) ? defaultText : defaultBinary)
}

// Borrowed and passed around from who knows where, last grabbed from connect.
types = {
  '3gp': 'video/3gpp',
  a: 'application/octet-stream',
  ai: 'application/postscript',
  aif: 'audio/x-aiff',
  aiff: 'audio/x-aiff',
  asc: 'application/pgp-signature',
  asf: 'video/x-ms-asf',
  asm: 'text/x-asm',
  asx: 'video/x-ms-asf',
  atom: 'application/atom+xml',
  au: 'audio/basic',
  avi: 'video/x-msvideo',
  bat: 'application/x-msdownload',
  bin: 'application/octet-stream',
  bmp: 'image/bmp',
  bz2: 'application/x-bzip2',
  c: 'text/x-csrc',
  cab: 'application/vnd.ms-cab-compressed',
  can: 'application/candor',
  cc: 'text/x-c++src',
  chm: 'application/vnd.ms-htmlhelp',
  'class': 'application/octet-stream',
  com: 'application/x-msdownload',
  conf: 'text/plain',
  cpp: 'text/x-c',
  crt: 'application/x-x509-ca-cert',
  css: 'text/css',
  csv: 'text/csv',
  cxx: 'text/x-c',
  deb: 'application/x-debian-package',
  der: 'application/x-x509-ca-cert',
  diff: 'text/x-diff',
  djv: 'image/vnd.djvu',
  djvu: 'image/vnd.djvu',
  dll: 'application/x-msdownload',
  dmg: 'application/octet-stream',
  doc: 'application/msword',
  dot: 'application/msword',
  dtd: 'application/xml-dtd',
  dvi: 'application/x-dvi',
  ear: 'application/java-archive',
  eml: 'message/rfc822',
  eps: 'application/postscript',
  exe: 'application/x-msdownload',
  f: 'text/x-fortran',
  f77: 'text/x-fortran',
  f90: 'text/x-fortran',
  flv: 'video/x-flv',
  'for': 'text/x-fortran',
  gem: 'application/octet-stream',
  gemspec: 'text/x-script.ruby',
  gif: 'image/gif',
  gyp: 'text/x-script.python',
  gypi: 'text/x-script.python',
  gz: 'application/x-gzip',
  h: 'text/x-chdr',
  hh: 'text/x-c++hdr',
  htm: 'text/html',
  html: 'text/html',
  ico: 'image/vnd.microsoft.icon',
  ics: 'text/calendar',
  ifb: 'text/calendar',
  iso: 'application/octet-stream',
  jar: 'application/java-archive',
  java: 'text/x-java-source',
  jnlp: 'application/x-java-jnlp-file',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  js: 'application/javascript',
  json: 'application/json',
  less: 'text/css',
  log: 'text/plain',
  lua: 'text/x-script.lua',
  luac: 'application/x-bytecode.lua',
  makefile: 'text/x-makefile',
  appcache: 'text/cache-manifest',
  m3u: 'audio/x-mpegurl',
  m4v: 'video/mp4',
  man: 'text/troff',
  manifest: 'text/cache-manifest',
  markdown: 'text/x-markdown',
  mathml: 'application/mathml+xml',
  mbox: 'application/mbox',
  mdoc: 'text/troff',
  md: 'text/x-markdown',
  me: 'text/troff',
  mid: 'audio/midi',
  midi: 'audio/midi',
  mime: 'message/rfc822',
  mml: 'application/mathml+xml',
  mng: 'video/x-mng',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  mp4v: 'video/mp4',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  ms: 'text/troff',
  msi: 'application/x-msdownload',
  odp: 'application/vnd.oasis.opendocument.presentation',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  odt: 'application/vnd.oasis.opendocument.text',
  ogg: 'application/ogg',
  p: 'text/x-pascal',
  pas: 'text/x-pascal',
  pbm: 'image/x-portable-bitmap',
  pdf: 'application/pdf',
  pem: 'application/x-x509-ca-cert',
  pgm: 'image/x-portable-graymap',
  pgp: 'application/pgp-encrypted',
  pkg: 'application/octet-stream',
  pl: 'text/x-script.perl',
  pm: 'text/x-script.perl-module',
  png: 'image/png',
  pnm: 'image/x-portable-anymap',
  ppm: 'image/x-portable-pixmap',
  pps: 'application/vnd.ms-powerpoint',
  ppt: 'application/vnd.ms-powerpoint',
  ps: 'application/postscript',
  psd: 'image/vnd.adobe.photoshop',
  py: 'text/x-script.python',
  qt: 'video/quicktime',
  ra: 'audio/x-pn-realaudio',
  rake: 'text/x-script.ruby',
  ram: 'audio/x-pn-realaudio',
  rar: 'application/x-rar-compressed',
  rb: 'text/x-script.ruby',
  rdf: 'application/rdf+xml',
  roff: 'text/troff',
  rpm: 'application/x-redhat-package-manager',
  rss: 'application/rss+xml',
  rtf: 'application/rtf',
  ru: 'text/x-script.ruby',
  s: 'text/x-asm',
  sgm: 'text/sgml',
  sgml: 'text/sgml',
  sh: 'application/x-sh',
  sig: 'application/pgp-signature',
  snd: 'audio/basic',
  so: 'application/octet-stream',
  svg: 'image/svg+xml',
  svgz: 'image/svg+xml',
  swf: 'application/x-shockwave-flash',
  t: 'text/troff',
  tar: 'application/x-tar',
  tbz: 'application/x-bzip-compressed-tar',
  tci: 'application/x-topcloud',
  tcl: 'application/x-tcl',
  tex: 'application/x-tex',
  texi: 'application/x-texinfo',
  texinfo: 'application/x-texinfo',
  text: 'text/plain',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  torrent: 'application/x-bittorrent',
  tr: 'text/troff',
  ts: 'application/x-typescript',
  ttf: 'application/x-font-ttf',
  txt: 'text/plain',
  vcf: 'text/x-vcard',
  vcs: 'text/x-vcalendar',
  vrml: 'model/vrml',
  war: 'application/java-archive',
  wav: 'audio/x-wav',
  webapp: 'application/x-web-app-manifest+json',
  webm: 'video/webm',
  wma: 'audio/x-ms-wma',
  wmv: 'video/x-ms-wmv',
  wmx: 'video/x-ms-wmx',
  wrl: 'model/vrml',
  wsdl: 'application/wsdl+xml',
  xbm: 'image/x-xbitmap',
  xhtml: 'application/xhtml+xml',
  xls: 'application/vnd.ms-excel',
  xml: 'application/xml',
  xpm: 'image/x-xpixmap',
  xsl: 'application/xml',
  xslt: 'application/xslt+xml',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  zip: 'application/zip'
};

/// <reference path="../lib.uv.d.ts"/>

function readFileStream (path, offset = 0, end = -1) {
  let { open, read, close } = fs;
  let fd;
  let buf = new Uint8Array(256 * 512);
  let queue = [];
  let reads = 0;
  let writes = 0;
  let reading = false;

  return new Promise((resolve, reject) =>
    open(new Fs(), path, 0, 0, (err, value) =>
      err ? reject(err)
        : ((fd = value),
        resolve({
          [Symbol.asyncIterator] () { return this; },
          next
        }))
    )
  );

  function next () {
    return new Promise((resolve, reject) => {
      if (writes > reads) {
        let { error, result } = queue[reads];
        queue[reads++] = null;
        return error ? reject(error) : resolve(result);
      }
      queue[reads++] = { resolve, reject };
      reading = true;
      pull();
    });
  }

  function push ({ error, result }) {
    if (reads > writes) {
      let { resolve, reject } = queue[writes];
      queue[writes++] = null;
      return error ? reject(error) : resolve(result);
    }
    queue[writes++] = { error, result };
    if (writes > reads) reading = false;
  }

  function pull () {
    if (!reading) return;
    read(new Fs(), fd, buf.buffer, offset, onRead);
  }

  function onRead (err, bytesRead) {
    if (err) return push({ error: err });
    if (end >= 0 && bytesRead > end - offset) {
      bytesRead = end - offset;
    }
    if (bytesRead > 0) {
      offset += bytesRead;
      push({ result: { done: false, value: buf.slice(0, bytesRead) } });
      pull();
    } else {
      push({ result: { done: true } });
      close(new Fs(), fd);
    }
  }
}

/**
 * Load a local file as if it was an HTTP request.
 * @param {Request} req
 * @returns {Response}
 */
async function fileRequest (req) {
  let body = await readFileStream(req.meta.path);
  return new Response(body, { headers: {
    'Content-Type': guess(req.meta.path),
  }});
}

let mapKey = Symbol('HeaderMapKey');
class Headers {
  constructor (init = {}) {
    Object.defineProperty(this, mapKey, { value: {} });
    for (let key in init) {
      this.set(key, init[key]);
    }
  }
  append (name, value) {
    let key = this[mapKey][name.toLowerCase()];
    if (!key) {
      key = this[mapKey][name.toLowerCase()] = name;
      this[key] = '' + value;
    } else {
      this[key] += ', ' + value;
    }
  }
  delete (name) {
    let lower = name.toLowerCase();
    let key = this[mapKey][lower];
    if (key) {
      delete this[mapKey][lower];
      delete this[key];
    }
  }
  get (name) {
    return this[this[mapKey][name.toLowerCase()]] || null;
  }
  has (name) {
    return !!this[mapKey][name.toLowerCase()];
  }
  set (name, value) {
    let key = this[mapKey][name.toLowerCase()];
    if (!key) {
      key = this[mapKey][name.toLowerCase()] = name;
    }
    this[key] = '' + value;
  }
  forEach (callbackfn, thisArg) {
    for (let [key, value] of this) {
      callbackfn.call(thisArg, value, key, this);
    }
  }
  [Symbol.iterator] () {
    return this.entries();
  }
  entries () {
    let map = (key) => [key, this[key]];
    return Object.keys(this).map(map)[Symbol.iterator]();
  }
  keys () {
    return Object.keys(this)[Symbol.iterator]();
  }
  values () {
    return Object.keys(this).map(key => this[key])[Symbol.iterator]();
  }
}

let fetch = makeFetch({
  file: fileRequest,
  http: httpRequest
});

function makeFetch(protocols) {
  return async function fetch(input, init) {
    let req;
    if (input instanceof Request) {
      // TODO: should we apply `init` to the request?
      req = input;
    } else {
      req = new Request(input, init);
    }
    let protocol = req.meta.protocol;
    let handler = protocols[protocol];
    if (handler) return handler(req);
    if (protocol === 'https') throw new Error('TODO: Implement TLS for HTTPS clients');
  };
}


class Response {
  constructor(body, init = {}) {
    let status = init.status || 200;
    let statusText = init.statusText || 'OK';
    let headers = new Headers(init.headers);
    let url = init.url;
    Object.defineProperties(this, {
      url: { value: url, enumerable: true, writable: false },
      body: { value: body, enumerable: true, writable: false },
      status: { value: status, enumerable: true, writable: false },
      statusText: { value: statusText, enumerable: true, writable: false },
      headers: { value: headers, enumerable: true, writable: false }
    });
  }

  async arrayBuffer() {
    return consume(this.body);
  }

  async text() {
    return binToStr$1(await consume(this.body));
  }

  async json() {
    return JSON.parse(binToStr$1(await consume(this.body)));
  }

  get ok() {
    return this.status >= 200 && this.status < 300;
  }
}

async function consume(stream) {
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

function binToStr$1(bin) {
  let array = new Uint8Array(bin);
  let end = array.length;
  let raw = '';
  for (let i = 0; i < end; i++) {
    raw += String.fromCharCode(array[i]);
  }
  // UTF8 decode
  return decodeURIComponent(escape(raw));
}

class Request {
  constructor(input, init = {}) {
    let [url, meta] = normalizeUrl(input);
    let method = init.method || 'GET';
    let headers = new Headers(init.headers);
    let body = init.body;
    Object.defineProperties(this, {
      meta: { value: meta, writable: false },
      url: { value: url, enumerable: true, writable: false },
      method: { value: method, enumerable: true, writable: false },
      headers: { value: headers, enumerable: true, writable: false },
      body: { value: body, enumerable: true, writable: false }
    });
  }
}

function pathJoin(base, ...inputs) {
  let segments = [];
  for (let part of (base + '/' + inputs.join('/')).split(/\/+/)) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      segments.pop();
      continue;
    }
    segments.push(part);
  }
  return (base[0] === '/' ? '/' : '') + segments.join('/');
}

function normalizeUrl(input) {
  if (typeof input !== 'string') { throw new TypeError('Input must be string'); }
  let match = input.match(/^([a-z]+):/);
  let protocol;

  if (!match) {
    protocol = 'file';
    if (input[0] === '/') {
      input = `file:/${input}`;
    } else {
      input = `file://${getCaller()}/../${input}`;
    }
  } else {
    protocol = match[1];
  }

  if (protocol === 'http' || protocol === 'https') {
    match = input.match(/^https?:\/\/([^:/]+)(:[0-9]+)?(\/[^?#]*)?([?][^#]*)?(#.*)?$/);
    if (!match) {
      throw new TypeError(`Invalid ${protocol} url: '${input}'`);
    }
    let [, host, portStr, path, query, hash] = match;
    path = pathJoin('/', path);
    let defaultPort = protocol === 'http' ? 80 : 443;
    let port = portStr ? parseInt(portStr.substr(1), 10) : defaultPort;
    let hostname = `${host}${port === defaultPort ? '' : ':' + port}`;
    let pathname = `${path}${query || ''}`;
    let url = `${protocol}://${hostname}${pathname}${query || ''}${hash || ''}`;
    return [url, { protocol, host, port, path, query, hash, hostname, pathname }];
  }

  if (protocol === 'file') {
    match = input.match(/^file:\/\/([^?#]+)([?][^#]*)?(#.*)?$/);
    if (!match) {
      throw new TypeError(`Invalid ${protocol} url: '${input}'`);
    }
    let [, path, query, hash] = match;
    path = pathJoin(path);
    let url = `${protocol}://${path}${query || ''}`;
    return [url, { protocol, path, query, hash }];
  }
  throw new TypeError(`Unsupported protocol: '${protocol}'`);
}

// Use the V8 Stack Trace API to find the filename of the caller outside this file.
function getCaller() {
  let old = Error.prepareStackTrace;
  Error.prepareStackTrace = findCaller;
  let caller = new Error().stack;
  Error.prepareStackTrace = old;
  return caller;
}

function findCaller(_, stack) {
  // Skip down the stack till get leave this file.
  let self = stack[0].getFileName();
  let other;
  for (let frame of stack) {
    let entry = frame.getFileName();
    if (entry !== self) {
      other = entry;
      break;
    }
  }
  return other || self;
}

// Re-export all polyfilled web builtins

// Also place on globalThis

globalThis.setTimeout = setTimeout;
globalThis.clearTimeout = clearTimeout;
globalThis.setInterval = setInterval;
globalThis.clearInterval = clearInterval;
globalThis.setImmediate = setImmediate;
globalThis.clearImmediate = clearImmediate;
globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.Request = Request;
globalThis.Response = Response;
//# sourceMappingURL=polyfills.js.map
