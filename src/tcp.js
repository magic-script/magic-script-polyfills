/// <reference path="../lib.uv.d.ts"/>
import { Getaddrinfo, getaddrinfo, Connect, Tcp } from 'uv';

function makeCallback () {
  let callback, promise;
  promise = new Promise((resolve, reject) => {
    callback = (err, val) => err ? reject(err) : resolve(val);
  });
  callback.promise = promise;
  return callback;
}

export async function connect (host, service) {
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
