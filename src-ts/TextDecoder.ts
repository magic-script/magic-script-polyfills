import { utf8Decode } from "./utils2.js";

export class TextDecoder {
    public [Symbol.toStringTag]: string;

    constructor() {
        this[Symbol.toStringTag] = "TextDecoder";
    }

    public decode(bin: Uint8Array): string {
        return utf8Decode(bin);
    }

}
