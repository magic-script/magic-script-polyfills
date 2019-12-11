import { utf8Encode } from "./utils2.js";
export class TextEncoder {
    constructor() {
        this[Symbol.toStringTag] = "TextEncoder";
    }
    encode(str) {
        return utf8Encode(str);
    }
}
//# sourceMappingURL=TextEncoder.js.map