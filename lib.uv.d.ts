/**
 * LibUV bindings exposed to JavaScript in a mostly 1-1 manner.
 */
declare module "uv" {
  abstract class Req {
    cancel(): void
  }
  class Connect extends Req { }
  class Shutdown extends Req { }
  class Write extends Req { }
  class Fs extends Req { }
  class Getaddrinfo extends Req { }
  abstract class Handle {
    close(onClose: () => void): void
    ref(): void
    unref(): void
    hasRef(): boolean
  }
  class Timer extends Handle {
    start(onTimeout: () => void, timeout: number, repeat: number): void
    stop(): void
    again(): void
    repeat: number
  }
  class Check extends Handle {
    start(onCheck: () => void): void
    stop(): void
  }
  abstract class Stream extends Handle {
    shutdown(req: Shutdown, onShutdown: (error: Error) => void): void
    listen(backlog: number, onConnection: (error: Error) => void): void
    accept(client: Stream): void
    readStart(onRead: (error: Error, data: ArrayBuffer | null) => void): void
    readStop(): void
    write(req: Write, data: ArrayBuffer, onWrite: (error: Error) => void): void
  }
  type Address = {
    ip: string,
    port: number,
    family?: string
  }
  class Tcp extends Stream {
    bind(ip: string, port: number): void
    connect(req: Connect, ip: string, port: number, onConnect: (error: Error) => void): void
    sockname: Address
    peername: Address
  }
  namespace fs {
    /** Non-blocking file open */
    function open(req: Fs, path: string, flags: string|number, mode: number, onOpen?: (error: Error, fd: number) => void): Fs
    /** Blocking file open */
    function open(req: Fs, path: string, flags: string|number, mode: number): number
    /** Non-blocking file close */
    function close(req: Fs, fd: number, onClose: (error: Error) => void): Fs
    /** Blocking file close */
    function close(req: Fs, fd: number): void
    /** Non-blocking file read */
    function read(req: Fs, fd: number, buffer: ArrayBuffer, offset: number, onRead: (error: Error, bytesRead: number) => void): Fs
    /** Blocking file read */
    function read(req: Fs, fd: number, buffer: ArrayBuffer, offset: number): number
    /** Non-blocking file unlink */
    function unlink(req: Fs, path: string, onUnlink: (error: Error)): Fs
    /** Blocking file unlink */
    function unlink(req: Fs, path: string): void
    /** Non-blocking file write */
    function write(req: Fs, fd: number, buffer: ArrayBuffer, offset: number, onRead: (error: Error, bytesRead: number) => void): Fs
    /** Blocking file write */
    function write(req: Fs, fd: number, buffer: ArrayBuffer, offset: number): number

    function mkdir(req: Fs, args: any): Fs
    function mkdtemp(req: Fs, args: any): Fs
    function rmdir(req: Fs, args: any): Fs
    function scandir(req: Fs, path: string, flags: integer, callback: (error: Error, req: Fs) => void): Fs
    function scandirNext(req: Fs): { name: string, type: string }
    function stat(req: Fs, args: any): Fs
    function fstat(req: Fs, args: any): Fs
    function lstat(req: Fs, args: any): Fs
    function rename(req: Fs, args: any): Fs
    function fsync(req: Fs, args: any): Fs
    function fdatasync(req: Fs, args: any): Fs
    function ftruncate(req: Fs, args: any): Fs
    function copyfile(req: Fs, args: any): Fs
    function sendfile(req: Fs, args: any): Fs
    function access(req: Fs, args: any): Fs
    function chmod(req: Fs, args: any): Fs
    function fchmod(req: Fs, args: any): Fs
    function utime(req: Fs, args: any): Fs
    function futime(req: Fs, args: any): Fs
    function link(req: Fs, args: any): Fs
    function symlink(req: Fs, args: any): Fs
    function readlink(req: Fs, args: any): Fs
    function realpath(req: Fs, args: any): Fs
    function chown(req: Fs, args: any): Fs
    function fchown(req: Fs, args: any): Fs
    function lchown(req: Fs, args: any): Fs
  }
  function getaddrinfo(
    req: Getaddrinfo,
    onGetaddrinfo: (error: Error, results: Address[]) => void,
    node: string,
    service: string
  ): Getaddrinfo
}
