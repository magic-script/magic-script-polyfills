import { socketWrap } from './socket-wrap.js';
import { tlsWrap } from './tls-wrap.js';
import { codecWrap } from './codec-wrap.js';
import { decoder, encoder } from './http-codec.js';
import { connect } from './tcp.js';
import { binToB64 } from './bintools.js';
import { Evented } from './evented.js';
import { Headers } from './headers.js';
import { encodeRaw, decodeRaw, acceptKey } from './websocket-codec.js';

const writeKey = Symbol('Websocket::Write');
const closedKey = Symbol('Websocket::Closed');
const streamKey = Symbol('Websocket::Stream');

export class WebSocket extends Evented {
  private [writeKey]: any;
  private [closedKey]: any;
  private [streamKey]: any;
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  static CLOSING = 3;
  /**
   * Establish a websocket client connection.
   * @param url the ws(s) url of the remote server
   * @param protocols optional websocket subprotocol(s)
   */
  constructor(url: string, protocols?: string[]) {
    const urlParts = url.match(/^ws(s?):\/\/([^:/]+)(:[0-9]+)?(\/[^?#]*)?([?][^#]*)?(#.*)?$/);
    if (!urlParts) {
      throw new Error('Not a valid websocket URL: ' + url);
    }
    const [, secure, host, port, path, query] = urlParts;
    super();
    this.doHandshake(secure, host, port, path, query, protocols)
      .catch(err => this.emit('error', err));
  }

  async doHandshake(secure: string, host: string, rawPort: string, path: string, query: string, protocols?: string[] | string) {
    const defaultPort = secure ? 443 : 80;
    const port = rawPort ? parseInt(rawPort.substr(1), 10) : defaultPort;
    path = path || '/';
    query = query || '';
    protocols = protocols ? Array.isArray(protocols) ? protocols : [protocols] : [];
    const protocol = `ws${secure ? 's' : ''}://`;
    const origin = host + (port === defaultPort ? '' : port);
    const pathquery = path + query;
    const url = protocol + origin + pathquery;
    Object.defineProperty(this, 'url', {
      value: url,
      writable: false,
      enumerable: true
    });

    let keyBuf = new Uint8Array(21);
    for (let i = 0; i < 21; i++) {
      keyBuf[i] = Math.random() * 256;
    }
    const key = binToB64(keyBuf);

    const headers = [
      'Host', origin,
      'User-Agent', 'MagicScript WebSocket Polyfills',
      'Upgrade', 'websocket',
      'Connection', 'Upgrade',
      'Sec-WebSocket-Version', '13',
      'Sec-WebSocket-Key', key
    ];
    for (const protocol of protocols) {
      headers.push('Sec-WebSocket-Protocol', protocol);
    }
    this.readyState = WebSocket.CONNECTING;
    // print('Connecting to TCP server', host, port);
    let stream = socketWrap(await connect(host, port));
    Object.defineProperty(this, streamKey, { value: stream });
    if (secure) {
      // print('Performing TLS handshake...');
      stream = await tlsWrap(stream, host);
    }
    // print('Switching to HTTP protocol...');
    let { read, write } = codecWrap(stream, {
      encode: encoder(),
      decode: decoder()
    });
    // print('Sending websocket handshake request...');
    await write({
      method: 'GET',
      path: pathquery,
      headers
    });
    // print('reading handshake response...');
    const res = await read();
    if (!res) throw new Error('Websocket server closed connection during handshake');
    if (res.code !== 101) throw new Error('Websocket server responded with non 101 status code');
    let resHeaders = new Headers(res.headers);
    // print(JSON.stringify(resHeaders, null, 2));
    if (resHeaders.get('Sec-WebSocket-Accept') !== acceptKey(key)) {
      throw new Error('Server responded with wrong Sec-WebSocket-Accept header');
    }
    if (resHeaders.get('Upgrade') !== 'websocket') {
      throw new Error('Server did not respond expected header: Upgrade: websocket');
    }
    if (resHeaders.get('Connection').toLowerCase() !== 'upgrade') {
      throw new Error('Server did not respond expected header: Connection: Upgrade');
    }
    this.protocol = resHeaders.get('Sec-WebSocket-Protocol');
    // print('Upgrading to websocket protocol...');
    read.updateDecode(decodeRaw);
    write.updateEncode(encodeRaw);
    Object.defineProperty(this, writeKey, { value: write });
    this.readyState = WebSocket.OPEN;
    this.emit('open');

    function makeMessageEvent(data: Uint8Array) {
      return {
        data,
        origin: '',
        lastEventId: '',
        source: null as string | null,
        ports: [] as number[]
      }
    }

    let frame;
    while ((frame = await read())) {
      // print('FRAME IN', JSON.stringify(frame, null, 2));
      switch (frame.opcode) {
        case 1: // text
          this.emit('message', makeMessageEvent(frame.payload));
          break;
        case 2: // binary
          if (this.binaryType === 'arraybuffer') {
            this.emit('message', makeMessageEvent(frame.payload));
            break;
          }
          throw new Error('Unsupported binaryType: ' + this.binaryType);
        case 8: // close
          if (!this[closedKey]) this.close();
          break;
        case 9: // ping
          this[writeKey]({ opcode: 10, mask: true }).catch((err: Error) => this.emit('error', err));
          break;
      }
    }
    if (this.readyState === WebSocket.OPEN) this.close();
    await this[streamKey].close();
    this.readyState = WebSocket.CLOSED;
    this.emit('close');
  }

  close(payload = '') {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('Attempt to close Websocket when not open');
    }
    this.readyState = WebSocket.CLOSING;
    this[closedKey] = true;
    this[writeKey]({ opcode: 8, mask: true, payload }).catch((err: Error) => this.emit('error', err));
    this[writeKey]();
  }

  send(message: string | Uint8Array | ArrayBuffer) {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('Attempt to send Websocket frame when not open');
    }
    let frame;
    if (typeof message === 'string') {
      frame = {
        opcode: 1,
        payload: message,
        mask: true
      };
    } else if (message instanceof ArrayBuffer || message instanceof Uint8Array) {
      frame = {
        opcode: 2,
        payload: message,
        mask: true
      };
    } else {
      throw new TypeError('Expected string or binary value in websocket send');
    }
    this[writeKey](frame).catch((err: Error) => this.emit('error', err));
  }
}
WebSocket.prototype.binaryType = 'arraybuffer';
