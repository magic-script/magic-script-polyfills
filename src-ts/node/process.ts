import { fs, Fs } from "uv";

export default {
    platform: "linux",
    release: "mxs",
    cwd() {
        return fs.realpath(new Fs(), ".");
    },
};
