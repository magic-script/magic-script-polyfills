import { readFileSync, writeFileSync, unlinkSync } from "./node/fs.js";

export class Storage {
    private base: string;
    private data: Map<string, string>;

    constructor(basePath?: string) {
        this.updateBase(basePath);
    }

    public get length() {
        return this.data.size;
    }

    public key(index: number) {
        let keys = this.data.keys();
        if (index < this.data.size && index >= 0) {
            let myIndex = 0;
            while (true) {
                let key = keys.next();
                if ((key.value === undefined && !key.done) || myIndex > this.data.size) {
                    return null;
                }
                if (myIndex++ === index) {
                    return key.value;
                }
            }
        }
        return null;
    }

    public updateBase(basePath?: string) {
        if (!basePath) {
            this.data = new Map();
            this.base = undefined;
        } else {
            let fileData = JSON.parse(readFileSync(basePath, "utf-8"));
            this.data = new Map(Object.entries(fileData));
            this.base = basePath;
        }
    }

    public setItem(name: string, value: string) {
        this.data.set(String(name), String(value));
        if (this.base) {
            writeFileSync(this.base, JSON.stringify(Object.fromEntries(this.data)));
        }
    }

    public getItem(name: string): string | null {
        const stringKey = String(name);
        if (this.data.has(stringKey)) {
            return String(this.data.get(stringKey));
        }
        return null;
    }

    public removeItem(name: string) {
        const stringKey = String(name);
        this.data.delete(stringKey);
        if (this.base) {
            writeFileSync(this.base, JSON.stringify(Object.fromEntries(this.data)));
        }
    }

    public clear(): void {
        this.data.clear();
        if (this.base) {
            unlinkSync(this.base);
        }
    }

}
