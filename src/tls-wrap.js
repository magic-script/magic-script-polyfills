import { Ssl } from 'ssl';
import { assert } from './weblit-js/libs/assert.js';

// Input read/write
// read() -> Promise<ArrayBuffer|null>
// write(ArrayBuffer|null) -> Promise
export async function tlsWrap({ read: innerRead, write: innerWrite, ...rest }, hostname) {
  assert(innerRead);
  assert(innerWrite);
  read.inner = innerRead;
  write.inner = innerWrite;

  let ssl = new Ssl();
  if (hostname) ssl.setHostname(hostname);
  await handshake();

  return { read, write, ssl, ...rest };

  async function handshake() {
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

  async function flush() {
    let data;
    while ((data = ssl.bioRead())) {
      if (data) await innerWrite(data);
    }
  }

  async function read() {
    let buffer = new ArrayBuffer(2048);
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
        }
        throw new Error(status);
      }
    }
  }

  async function write(data) {
    if (data) {
      ssl.sslWrite(data);
      while ((data = ssl.bioRead())) {
        if (data) await innerWrite(data);
      }
    } else {
      await innerWrite();
    }
  }

}