import { mkdirSync } from "./fs-uv.js";
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from "./node/fs.js";
import { pathJoin } from "./utils2.js";

export class Storage {
    private base: string;
    private data: Map<string, string>;

    constructor(basePath?: string) {
        this.updateBase(basePath);
    }

    public updateBase(basePath?: string) {
        if (!basePath) {
            this.data = new Map();
            this.base = undefined;
        } else {
            try {
                mkdirSync(basePath, 0o700);
            } catch (err) {
                if (!/^EEXIST/.test(err.message)) { throw err; }
            }
            this.data = undefined;
            this.base = basePath;
        }
    }

    public setItem(name: string, value: string) {
        if (this.base) {
            writeFileSync(pathJoin(this.base, String(name)), String(value));
        } else {
            this.data.set(String(name), String(value));
        }
    }

    public getItem(name: string): string | null {
        if (this.base) {
            try {
                return readFileSync(pathJoin(this.base, String(name)), 'utf8');
            }
            catch (err) {
                if (!/^ENOENT/.test(err.message)) { throw err; }
                return null;
            }
        } else {
            const stringKey = String(name);
            if (this.data.has(stringKey)) {
                return String(this.data.get(stringKey));
            }
            return null;
        }
    }

    public removeItem(name: string) {
        if (this.base) {
            try {
                unlinkSync(pathJoin(this.base, String(name)));
            } catch (err) {
                if (!/^ENOENT/.test(err.message)) { throw err; }
            }
        } else {
            const stringKey = String(name);
            this.data.delete(stringKey);

        }
    }

    public clear(): void {
        if (this.base) {
            for (const name of readdirSync(this.base)) {
                unlinkSync(pathJoin(this.base, name));
            }
        } else {
            this.data.clear();
        }
    }

}
