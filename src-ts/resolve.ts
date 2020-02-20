export function resolveUrl (baseUrl, url) {
  let [, protocol, host, path] = url.match(/^([a-z]+:)?(\/\/[^/]+)?(.*)$/);
  if (protocol && host) return url;
  let [, baseProtocol, baseHost, basePath] = baseUrl.match(/^([a-z]+:)?(\/\/[^/]+)?(.*)$/);
  if (host) {
    return baseProtocol + host + path;
  }
  return baseProtocol + baseHost + resolvePath(basePath, path);
}

export function resolvePath (basePath, path) {
  let parts;
  if (path[0] === '/') {
    parts = path.split('/');
  } else {
    let baseParts = basePath.split('/');
    baseParts.pop();
    parts = baseParts.concat(path.split('/'));
  }
  let stack = [];
  for (let part of parts) {
    if (!part || part === '.') {
      continue;
    }
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  return '/' + stack.join('/');
}
