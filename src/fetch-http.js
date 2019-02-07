import { connect } from './tcp.js';
import { Headers, Response } from './fetch.js';
import { decoder, encoder } from './weblit-js/libs/http-codec.js';
import { wrapStream } from './weblit-js/libs/gen-channel.js';

/**
 * Perform an HTTP Request
 * @param {Request} req
 * @returns {Response}
 */
export async function httpRequest (req) {
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
