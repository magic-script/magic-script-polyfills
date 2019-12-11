import { utf8Decode } from "./utils2.js";
export class TextDecoder {
    constructor() {
        this[Symbol.toStringTag] = "TextDecoder";
    }
    decode(bin) {
        return utf8Decode(bin);
    }
}
//# sourceMappingURL=TextDecoder.js.map