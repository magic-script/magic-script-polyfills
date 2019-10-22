/// <reference path="../lib.uv.d.ts"/>

import { fs, Fs } from 'uv';

/**
 * fs.open from node.js
 * @param {string} path 
 * @param {string|number} flags? 
 * @param {number} mode? 
 * @param {(err?: Error, fd?: number) => void} callback 
 */
export function open (path, flags, mode, callback) {
  if (callback === undefined) {
    if (mode === undefined) {
      if (typeof flags === 'function') {
        callback = flags;
        flags = undefined;
      } else if (typeof mode === 'function') {
        callback = mode;
        mode = undefined;
      }
    }
  }
  if (flags === undefined) flags = 'r';
  if (mode === undefined) mode = 0o666;
  fs.open(new Fs(), path, flags, mode, callback);
}

/**
 * fs.openSync from node.js
 * @param {string} path 
 * @param {string|number?} flags?
 * @param {number} mode? 
 * @returns  {number} fd
 */
export function openSync (path, flags, mode) {
  if (flags === undefined) flags = 'r';
  if (mode === undefined) mode = 0o666;
  return fs.open(new Fs(), path, flags, mode);
}

/**
 * fs.readdir from node.js.
 *
 * @param {string} path
 * @param {(err?: Error, files?: string[]) => void} callback
 */
export function readdir (path, callback) {
  const flags = 0;
  fs.scandir(new Fs(), path, flags, (err, req) => {
    if (err) return callback(err);
    let files;
    try {
      files = readdirAccum(req);
    } catch (err2) {
      return callback(err2);
    }
    return callback(null, files);
  });
}

/**
 * fs.readdirSync from node.js
 *
 * Does not implement optional `options` argument.
 * @param {string} path
 * @returns {string[]} files
 */
export function readdirSync (path) {
  const flags = 0;
  const req = fs.scandir(new Fs(), path, flags);
  return readdirAccum(req);
}

function readdirAccum (req) {
  let entry;
  let files = [];
  while ((entry = fs.scandirNext(req))) {
    files.push(entry.name);
  }
  return files;
}

/**
 * The fs.promises API provides an alternative set of asynchronous file system
 * methods that return Promise objects rather than using callbacks.
 */
export let promises = {
  /**
   * fs.promises.readdir from node.js
   * @param {string} path
   * @returns {Promise<string[]>} files
   */
  readdir: path =>
    new Promise((resolve, reject) =>
      readdir(path, (err, files) =>
        err ? reject(err) : resolve(files)
      )
    ),
  
  /**
   * fs.promises.open from node.js
   * 
   * @param {string} path
   * @param {string|number} flags
   * @param {number} mode
   * @returns {Promise<FileHandle>} fileHandle
   */
  open: (path, flags, mode) =>
    new Promise((resolve, reject) =>
      open(path, flags, mode, (err, fd) =>
        err ? reject(err) : resolve(new FileHandle(fd))
      )
    )

};

export class FileHandle {
  // TODO: Implement
}
