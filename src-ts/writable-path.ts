let path: string | undefined;
type Listener = (newPath: string | undefined) => void
const listeners: Listener[] = [];


export function on(fn: Listener) {
    listeners.push(fn);
}

export function getPath(): string | undefined {
    return path;
}

export function setPath(newPath: string | undefined) {
    path = newPath;
    for (const listener of listeners) {
        listener(newPath);
    }
}