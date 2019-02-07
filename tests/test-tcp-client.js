/// <reference path="../lib.uv.d.ts"/>

import { Getaddrinfo, getaddrinfo, Connect, Write, Shutdown, Tcp } from 'uv';

// This tests the DNS resolver and TCP client by making a manual HTTP request to the lit.luvit.io API server.
// It's in a single file for easy copy-paste testing.

let client;
let parts = [];

// Store the request in an array buffer.
let request =
  'GET / HTTP/1.1\r\n' +
  'Host: lit.luvit.io\r\n' +
  'User-Agent: MagicScript\r\n' +
  'Accept: application/json\r\n' +
  'Connection: close\r\n' +
  '\r\n';

print('Resolving domain...');
let req = getaddrinfo(new Getaddrinfo(), onResolve, 'lit.luvit.io', 'http');
req.cancel;
function onResolve (err, value) {
  if (err) throw err;
  let [{ ip, port }] = value;
  client = new Tcp();
  print('Connecting', JSON.stringify({ ip, port }, null, 2));
  client.connect(new Connect(), ip, port, onConnect);
}

function onConnect (err) {
  if (err) throw err;
  print();
  print('Request:');
  print(request);
  client.write(new Write(), rawToBin(request), onWrite);

  print('Reading response...');
  client.readStart(onRead);
}

function onWrite (err) {
  if (err) throw err;
  print('Request written.');
}

function onRead (err, bin) {
  if (err) throw err;
  if (bin) {
    parts.push(binToRaw(bin));
    return;
  }
  let body = parts.join('');
  print();
  print('Response:');
  print(body);
  client.shutdown(new Shutdown(), onShutdown);
}

function onShutdown (err) {
  if (err) throw err;
  print('Stream shutdown.');
  client.close(onClose);
}

function onClose () {
  print('TCP handle closed');
}

/**
 * convert ASCII string to ArrayBuffer
 * @param {string} raw
 * @returns {ArrayBuffer{}}
 */
function rawToBin (raw) {
  let len = raw.length;
  let bin = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bin[i] = raw.charCodeAt(i);
  }
  return bin.buffer;
}

/**
 * Convert ArrayBuffer containing ASCII to string.
 * @param {ArrayBuffer} bin
 * @returns {string}
 */
function binToRaw (bin) {
  let array = new Uint8Array(bin);
  let raw = '';
  let end = array.length;
  for (let i = 0; i < end; i++) {
    raw += String.fromCharCode(array[i]);
  }
  return raw;
}
