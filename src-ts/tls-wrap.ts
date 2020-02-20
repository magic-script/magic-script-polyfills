import { Ssl } from 'ssl';
import { assert } from './assert.js';

// Input read/write
// read() -> Promise<ArrayBuffer|null>
// write(ArrayBuffer|null) -> Promise
export async function tlsWrap ({ read: innerRead, write: innerWrite, close: innerClose, ...rest }, hostname) {
  assert(innerRead);
  assert(innerWrite);
  read.inner = innerRead;
  write.inner = innerWrite;

  let ssl = new Ssl();
  if (hostname) ssl.setHostname(hostname);
  await handshake();

  return { read, write, close, ...rest };

  async function handshake () {
    let status;
    while ((status = ssl.getError(ssl.doHandshake())) !== 'SSL_ERROR_NONE') {
      if (status === 'SSL_ERROR_WANT_READ') {
        // If there is pending data to write, send it on the socket.
        let data = ssl.bioRead();
        if (data) {
          await innerWrite(data);
          continue;
        }
        // If that doesn't work, try to read from socket and write to bio.
        data = await innerRead();
        if (data) {
          ssl.bioWrite(data);
          continue;
        }
      }
      throw new Error(status);
    }
    if (!ssl.getVerify()) {
      throw new Error('Server certificate verification failure');
    }
  }

  async function close () {
    if (ssl.shutdown) {
      ssl.shutdown();
    }
    ssl = null;
    await innerClose();
  }

  async function flush () {
    let data;
    while ((data = ssl.bioRead())) {
      if (data) await innerWrite(data);
    }
  }

  async function read () {
    let buffer = new ArrayBuffer(16384);
    let result;
    while ((result = ssl.sslRead(buffer))) {
      if (result > 0) {
        return buffer.slice(0, result);
      }
      if (result < 0) {
        let status = ssl.getError(result);
        if (status === 'SSL_ERROR_WANT_READ') {
          await flush();
          let cipher = await innerRead();
          if (cipher) {
            ssl.bioWrite(cipher);
            continue;
          }
          return;
        }
        throw new Error(status);
      }
    }
  }

  async function write (data) {
    let shouldShutdown = false;
    if (data) {
      ssl.sslWrite(data);
    } else {
      shouldShutdown = true;
      if (ssl.shutdown) {
        ssl.shutdown();
      }
    }
    while ((data = ssl.bioRead())) {
      if (data) await innerWrite(data);
    }
    if (shouldShutdown) {
      await innerWrite();
    }
  }
}
