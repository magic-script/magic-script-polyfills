/**
 * lua-style assert helper
 * @param {any} val
 * @param {String} message
 */
export function assert (val, message) {
  if (!val) throw new Error(message || 'Assertion Failed');
  return val;
}
