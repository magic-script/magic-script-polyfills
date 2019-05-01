import { resolveUrl } from '../src/resolve.js';

function check (actual, expected) {
  print('Expected: ', expected);
  print('Actual:   ', actual);
  if (actual !== expected) {
    throw new Error('Sanity check failed');
  }
}
check(resolveUrl('http://test.com/foo/bar', '/baz'), 'http://test.com/baz');
check(resolveUrl('http://test.com/foo/', '/baz'), 'http://test.com/baz');
check(resolveUrl('http://test.com/foo/bar', 'baz'), 'http://test.com/foo/baz');
check(resolveUrl('http://test.com/foo/', 'baz'), 'http://test.com/foo/baz');
check(resolveUrl('http://test.com/foo/bar', './baz'), 'http://test.com/foo/baz');
check(resolveUrl('http://test.com/foo/', './baz'), 'http://test.com/foo/baz');
check(resolveUrl('http://test.com/foo/bar', '../baz'), 'http://test.com/baz');
check(resolveUrl('http://test.com/foo/', '../baz'), 'http://test.com/baz');
check(resolveUrl('http://test.com/foo/bar', '//test.org/baz'), 'http://test.org/baz');
check(resolveUrl('https://test.com/foo/bar', '//test.org/baz'), 'https://test.org/baz');
check(resolveUrl('http://test.com/foo/bar', 'https://test.com/foo/bar'), 'https://test.com/foo/bar');
print('All tests pass!');
