let mapKey = Symbol('HeaderMapKey');
export class Headers {
  constructor (init = {}) {
    Object.defineProperty(this, mapKey, { value: {} });
    for (let key in init) {
      this.set(key, init[key]);
    }
  }
  append (name, value) {
    let key = this[mapKey][name.toLowerCase()];
    if (!key) {
      key = this[mapKey][name.toLowerCase()] = name;
      this[key] = '' + value;
    } else {
      this[key] += ', ' + value;
    }
  }
  delete (name) {
    let lower = name.toLowerCase();
    let key = this[mapKey][lower];
    if (key) {
      delete this[mapKey][lower];
      delete this[key];
    }
  }
  get (name) {
    return this[this[mapKey][name.toLowerCase()]] || null;
  }
  has (name) {
    return !!this[mapKey][name.toLowerCase()];
  }
  set (name, value) {
    let key = this[mapKey][name.toLowerCase()];
    if (!key) {
      key = this[mapKey][name.toLowerCase()] = name;
    }
    this[key] = '' + value;
  }
  forEach (callbackfn, thisArg) {
    for (let [key, value] of this) {
      callbackfn.call(thisArg, value, key, this);
    }
  }
  [Symbol.iterator] () {
    return this.entries();
  }
  entries () {
    let map = (key) => [key, this[key]];
    return Object.keys(this).map(map)[Symbol.iterator]();
  }
  keys () {
    return Object.keys(this)[Symbol.iterator]();
  }
  values () {
    return Object.keys(this).map(key => this[key])[Symbol.iterator]();
  }
}
