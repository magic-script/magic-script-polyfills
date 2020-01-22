import { Fs, fs } from "uv";
import { readfileSync } from "./fs-sync.js";

export class Storage {
    private base: string;

    constructor(basePath?: string) {
        try {
            fs.mkdir(new Fs(), basePath, 0o700);
        } catch (err) {
            if (!/^EEXIST/.test(err.message)) { throw err; }
        }
        this.base = basePath;
    }
    public setItem(name: string, value: string) {

    }

    public getItem(name: string): string {

    }

    public clear(): void {

    }

}

/**
 * To mimic the native implementation as close as possible
 * the class was called 'Storage' and carries the data in a map().
 */
export class Storage {
    constructor() {
        this.data = new Map();
    }

    // If key exists get entry from map by key
    public getItem(key) {
        const stringKey = String(key);
        if (this.data.has(stringKey)) {
            return String(this.data.get(stringKey));
        }
        return null;
    }

    // Set entry with a string key identifier
    public setItem(key, val) {
        this.data.set(String(key), String(val));
    }

    // Remove entry by key
    public removeItem(key) {
        const stringKey = String(key);
        this.data.delete(stringKey);
    }

    // Clear all entries from localStorage
    public clear() {
        this.data.clear();
    }

    // Get key by index
    public key(index) {
        const arr = Array.from(this.data.keys());
        return arr[index];
    }

    // Get quantity of entries in localStorage
    get length() {
        return this.data.size;
    }
}
