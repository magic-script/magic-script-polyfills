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
  let fs: {
    open: (req: Fs, path: string, flags: number, mode: number, onOpen: (error: Error, fd: number) => void) => Fs,
    close: (req: Fs, fd: number, onClose: (error: Error) => void) => Fs,
    read: (req: Fs, fd: number, buffer: ArrayBuffer, offset: number, onRead: (error: Error, bytesRead: number) => void) => Fs,
    unlink: (req: Fs, path: string, onUnlink: (error: Error)) => Fs,
    write: (req: Fs, fd: number, buffer: ArrayBuffer, offset: number, onRead: (error: Error, bytesRead: number) => void) => Fs,
    mkdir: (req: Fs, args: any) => Fs,
    mkdtemp: (req: Fs, args: any) => Fs,
    rmdir: (req: Fs, args: any) => Fs,
    scandir: (req: Fs, path: string, flags: integer, callback: (error: Error, req: Fs) => void) => Fs,
    scandirNext: (req: Fs) => { name: string, type: string },
    stat: (req: Fs, args: any) => Fs,
    fstat: (req: Fs, args: any) => Fs,
    lstat: (req: Fs, args: any) => Fs,
    rename: (req: Fs, args: any) => Fs,
    fsync: (req: Fs, args: any) => Fs,
    fdatasync: (req: Fs, args: any) => Fs,
    ftruncate: (req: Fs, args: any) => Fs,
    copyfile: (req: Fs, args: any) => Fs,
    sendfile: (req: Fs, args: any) => Fs,
    access: (req: Fs, args: any) => Fs,
    chmod: (req: Fs, args: any) => Fs,
    fchmod: (req: Fs, args: any) => Fs,
    utime: (req: Fs, args: any) => Fs,
    futime: (req: Fs, args: any) => Fs,
    link: (req: Fs, args: any) => Fs,
    symlink: (req: Fs, args: any) => Fs,
    readlink: (req: Fs, args: any) => Fs,
    realpath: (req: Fs, args: any) => Fs,
    chown: (req: Fs, args: any) => Fs,
    fchown: (req: Fs, args: any) => Fs,
    lchown: (req: Fs, args: any) => Fs,


  }
  function getaddrinfo(
    req: Getaddrinfo,
    onGetaddrinfo: (error: Error, results: Address[]) => void,
    node: string,
    service: string
  ): Getaddrinfo
}
