import { fs, Fs } from "uv";

export function relative(from: string, to: string): string {
    const fromList = resolve(from).split("/");
    const toList = resolve(to).split("/");

    // Remove common prefixes
    while (fromList.length && toList.length && fromList[0] === toList[0]) {
        fromList.shift();
        toList.shift();
    }

    return "../".repeat(fromList.length) + toList.join("/");

}

export function extname(path: string): string {
    const base = basename(path);
    const match = base.match(/\.[^\.]*$/);
    if (match) { return match[0]; }
    return "";
}

export function basename(path: string, ext?: string): string {
    const parts = path.split("/").filter(Boolean);
    if (!parts.length) { return ""; }
    let base = parts[parts.length - 1];
    if (ext) {
        if (base.endsWith(ext)) {
            base = base.substr(0, base.length - ext.length);
        }
    }
    return base;
}

export function dirname(path: string): string {
    const parts = path.split("/").filter(Boolean);
    parts.pop();
    return (path[0] === "/" ? "/" : "") + parts.join("/");
}

export function join(...paths: string[]): string {
    const stack: string[] = [];
    const absolute = paths.length && paths[0][0] === "/" ? "/" : "";
    for (const path of paths) {
        for (const part of path.split("/").filter(Boolean)) {
            if (part === ".") { continue; }
            if (part === "..") { stack.pop(); } else { stack.push(part); }
        }
    }
    return absolute + stack.join("/");
}

export function resolve(...paths: string[]) {
    const cwd = fs.realpath(new Fs(), ".");
    const stack: string[] = [cwd.split("/").filter(Boolean).join("/")];
    for (const path of paths) {
        if (path[0] === "/") {
            stack.length = 0;
        }
        for (const part of path.split("/").filter(Boolean)) {
            if (part === ".") { continue; }
            if (part === "..") { stack.pop(); } else { stack.push(part); }
        }
    }
    return "/" + stack.join("/");
}

export const sep = "/";

export default { relative, extname, basename, dirname, resolve, sep };
