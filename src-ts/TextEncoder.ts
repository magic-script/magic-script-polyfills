import { utf8Encode } from "./utils2.js";

export class TextEncoder {
    public [Symbol.toStringTag]: string;

    constructor() {
        this[Symbol.toStringTag] = "TextEncoder";
    }

    public encode(str: string): Uint8Array {
        return utf8Encode(str);
    }
}
