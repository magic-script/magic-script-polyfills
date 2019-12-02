/**
 * To mimic the native implementation as close as possible
 * the class was called 'Storage' and carries the data in a map().
 */
export class Storage {
  constructor() {
    this.data = new Map();
  }

  // If key exists get entry from map by key
  getItem(key) {
    const stringKey = String(key);
    if (this.data.has(stringKey)) {
      return String(this.data.get(stringKey));
    }
    return null;
  }

  // Set entry with a string key identifier
  setItem(key, val) {
    this.data.set(String(key), String(val));
  }

  // Remove entry by key
  removeItem(key) {
    const stringKey = String(key);
    this.data.delete(stringKey);
  }

  // Clear all entries from localStorage
  clear() {
    this.data.clear();
  }

  // Get key by index
  key(index) {
    const arr = Array.from(this.data.keys());
    return arr[index];
  }

  // Get quantity of entries in localStorage
  get length() {
    return this.data.size;
  }
}
