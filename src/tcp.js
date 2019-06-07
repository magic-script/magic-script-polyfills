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

const cache = {};

export async function resolve (host, service) {
  // Resolve IP address and TCP port
  const key = host + service;
  const cached = cache[key];
  if (cached) return cached;
  let cb = makeCallback();
  getaddrinfo(new Getaddrinfo(), cb, host, '' + service);
  let [{ ip, port }] = await cb.promise;
  return (cache[key] = { ip, port });
}

export async function connect (host, service) {
  const { ip, port } = await resolve(host, service);
  // Connect to server
  let socket = new Tcp();
  let cb = makeCallback();
  socket.connect(new Connect(), ip, port, cb);
  await cb.promise;

  return socket;
}
