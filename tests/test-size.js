// Create list with `find ~/Downloads/ -type f \( -iname \*.jpg -o -iname \*.png \) > images.txt`

import { readfileSync } from '../src/fs-sync.js';
import '../src/polyfills.js';
import { getSize } from '../src/size.js';
import { utf8Decode } from "../src/utils2.js";

for (const file of utf8Decode(readfileSync('images-master.txt', 'r', 0o644)).split('\n').filter(Boolean)) {
    const data = readfileSync(file, 'r', 0o644);
    const meta = getSize(data);
    meta.name = file.split('/').pop();
    console.log(meta);
    if (typeof meta.width !== 'number' || typeof meta.height !== 'number') {
        console.log(file, data);
        throw new Error("Failed to get metadata");
    }
}
