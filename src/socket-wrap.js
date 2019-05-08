import { Write, Shutdown } from 'uv';
import { assert } from './assert.js';

// Socket is a libuv socket class (like a TCP socket)
// Output is promise based read/write functions.
export function socketWrap (socket) {
  assert(socket && socket.write && socket.shutdown && socket.readStart && socket.readStop && socket.close, 'Missing stream functions');
  let writeClosed = false;
  let readClosed = false;
  let socketClosed = false;
  let reading = false;
  // If writer > reader, there is data to be read.
  // if reader > writer, there is data required.
  let queue = [];
  let reader = 0;
  let writer = 0;

  return { read, write, socket, close };

  async function close () {
    readClosed = true;
    if (!writeClosed) {
      await write();
    } else {
      check();
    }
  }

  function check () {
    if (readClosed && writeClosed && !socketClosed) {
      socketClosed = true;
      socket.close();
    }
  }

  function onData (err, val) {
    // If there is a pending reader, give it the data right away.
    if (reader > writer) {
      let { resolve, reject } = queue[writer];
      queue[writer++] = undefined;
      if (err) return reject(err);
      readClosed = !val;
      return resolve(val);
    }

    // Pause the read socket if we're buffering data already.
    if (reading && writer > reader) {
      reading = false;
      socket.readStop();
    }

    // Store the event in the queue waiting for a future reader
    queue[writer++] = { err, val };
  }

  async function read () {
    if (socketClosed || readClosed) throw new Error('Cannot read from closed socket');
    // If there is pending data, return it right away.
    if (writer > reader) {
      let { err, val } = queue[reader];
      queue[reader++] = undefined;
      if (err) throw err;
      return val;
    }

    // Make sure the data is flowing since we need it.
    if (!reading) {
      reading = true;
      socket.readStart(onData);
    }

    // Wait for the data or a parse error.
    return new Promise(function (resolve, reject) {
      queue[reader++] = { resolve, reject };
    });
  }

  // write(ArrayBuffer | null) -> Promise
  function write (buffer) {
    return new Promise((resolve, reject) => {
      if (socketClosed || writeClosed) throw new Error('Cannot write to closed socket');
      if (buffer) {
        socket.write(new Write(), buffer, err => err ? reject(err) : resolve());
      } else {
        writeClosed = true;
        socket.shutdown(new Shutdown(), err => {
          check();
          err ? reject(err) : resolve();
        });
      }
    });
  }
}
