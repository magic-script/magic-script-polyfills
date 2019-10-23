/**
 * LibUV bindings exposed to JavaScript in a mostly 1-1 manner.
 * 
 * See http://docs.libuv.org/en/v1.x/
 */
declare module "uv" {

  /**
   * Wrapper for `uv_req_t` request base type. See http://docs.libuv.org/en/v1.x/request.html
   */
  abstract class Req {
    /**
     * Cancel a pending request. Fails if the request is executing or has finished executing.
     * 
     * Wrapper for `uv_cancel` request method.
     */
    cancel(): void
  }

  /**
   * Wrapper for `uv_connect_t` request type. See http://docs.libuv.org/en/v1.x/stream.html#c.uv_connect_t
   */
  class Connect extends Req { }

  /**
   * Wrapper for `uv_shutdown_t` request type. See http://docs.libuv.org/en/v1.x/stream.html#c.uv_shutdown_t
   */
  class Shutdown extends Req { }

  /**
   * Wrapper for `uv_write_t` request type. See http://docs.libuv.org/en/v1.x/stream.html#c.uv_write_t
   */
  class Write extends Req { }

  /**
   * Wrapper for `uv_fs_t` request type. See http://docs.libuv.org/en/v1.x/fs.html#c.uv_fs_t
   */
  class Fs extends Req { }

  /**
   * Wrapper for `uv_getaddrinfo_t` request type. See http://docs.libuv.org/en/v1.x/dns.html#c.uv_getaddrinfo_t
   */
  class Getaddrinfo extends Req { }

  /**
   * Wrapper for `uv_handle_t` handle base type. See http://docs.libuv.org/en/v1.x/handle.html
   */
  abstract class Handle {
    /**
     * Request handle to be closed.
     *
     * Wrapper for `uv_close`.
     */
    close(onClose: () => void): void

    /**
     * Reference the handle.
     *
     * Wrapper for `uv_ref`.
     */
    ref(): void

    /**
     * Un-reference the handle.
     *
     * Wrapper for `uv_unref`.
     */
    unref(): void

    /**
     * Returns `true` if the handle referenced, `false` otherwise.
     *
     * Wrapper for `uv_has_ref`.
     */
    hasRef(): boolean
  }

  /**
   * Timer handles are used to schedule callbacks to be called in the future.
   *
   * Wrapper for `uv_timer_t`. See http://docs.libuv.org/en/v1.x/timer.html
   */
  class Timer extends Handle {
    /**
     * Start the timer. timeout and repeat are in milliseconds.
     *
     * If timeout is zero, the callback fires on the next event loop iteration. If repeat is non-zero, the callback fires first after timeout milliseconds and then repeatedly after repeat milliseconds.
     *
     * Wrapper for `uv_timer_start`.
     */
    start(onTimeout: () => void, timeout: number, repeat: number): void

    /**
     * Stop the timer, the callback will not be called anymore.
     *
     * Wrapper for `uv_timer_stop`.
     */
    stop(): void

    /**
     * Stop the timer, and if it is repeating restart it using the repeat value as the timeout. If the timer has never been started before it throws UV_EINVAL.
     *
     * Wrapper for `uv_timer_again`.
     */
    again(): void

    /**
     * Get or set the repeat value in milliseconds. The timer will be scheduled to run on the given interval, regardless of the callback execution duration, and will follow normal timer semantics in the case of a time-slice overrun.
     *
     * Wrapper for `uv_timer_set_repeat` and `uv_timer_get_repeat` exposed as a writable JS property.
     */
    repeat: number
  }

  /**
   * Check handles will run the given callback once per loop iteration, right after polling for i/o.
   *
   * Wrapper for `uv_check_t`.
   * See http://docs.libuv.org/en/v1.x/check.html
   */
  class Check extends Handle {
    /**
     * Check handles will run the given callback once per loop iteration, right after polling for i/o.
     *
     * Wrapper for `uv_check_start`.
     */
    start(onCheck: () => void): void

    /**
     * Stop the handle, the callback will no longer be called.
     *
     * Wrapper for `uv_check_stop`.
     */
    stop(): void
  }

  /**
   * Wrapper for `uv_stream_t` handle base type. See http://docs.libuv.org/en/v1.x/stream.html
   */
  abstract class Stream extends Handle {
    /**
     * Shutdown the outgoing (write) side of a duplex stream.
     * 
     * Wraps `uv_shutdown`.
     */
    shutdown(req: Shutdown, onShutdown: (error: Error) => void): void

    /**
     * Start listening for incoming connections.
     * 
     * Wraps `uv_listen`.
     * @param backlog indicates the number of connections the kernel might queue.
     * @param onConnection is called when a new incoming connection is received.
     */
    listen(backlog: number, onConnection: (error: Error) => void): void

    /**
     * This call is used in conjunction with [Stream.listen](#Stream.listen) to accept incoming connections.
     * Call this function after receiving a connection callback to accept the connection.
     * 
     * ```js
     * server.listen(backlog, (error) => {
     *   ...
     *   const client = new Tcp();
     *   server.accept(client)
     *   ...
     * });
     * ```
     * 
     * Wraps `uv_accept`.
     */
    accept(client: Stream): void

    /**
     * Read data from an incoming stream.
     * @param onRead will be called several times until there is no more data to read or [Stream.readStop](#Stream.readStop) is called.
     * 
     * Wraps `uv_read_start`.
     */
    readStart(onRead: (error: Error, data: ArrayBuffer | null) => void): void

    /**
     * Stop reading data from the stream. The [Stream.readStart](#Stream.readStart) callback will no longer be called.
     * 
     * Wraps `uv_read_stop`.
     */
    readStop(): void

    /**
     * Write data to stream. Buffers are written in order.
     * 
     * ```js
     * stream.write(new Write(), data, (error) => {
     *   print('The data was written...');
     * });
     * ```
     * 
     * Wraps `uv_write`.
     */
    write(req: Write, data: ArrayBuffer, onWrite: (error: Error) => void): void
  }

  type Address = {
    ip: string,
    port: number,
    family?: string
  }

  /**
   * TCP handles are used to represent both TCP streams and servers.
   *
   * Wrapper for `uv_tcp_t`. See http://docs.libuv.org/en/v1.x/tcp.html
   */
  class Tcp extends Stream {

    /**
     * Bind the handle to an address and port.
     * 
     * Wraps `uv_tcp_bind`.
     */
    bind(ip: string, port: number): void

    /**
     * Establish an IPv4 or IPv6 TCP connection.
     * 
     * Wraps `uv_tcp_connect`.
     */
    connect(req: Connect, ip: string, port: number, onConnect: (error: Error) => void): void

    /**
     * Readable property exposing the current address to which the handle is bound
     * 
     * Wraps `uv_tcp_getsockname`.
     */
    sockname: Address

    /**
     * Readable property exposing the address of the peer connected to the handle.
     * 
     * Wraps `uv_tcp_getpeername`.
     */
    peername: Address
  }
  
  /**
   * Bindings for libuv file system operations.
   * See http://docs.libuv.org/en/v1.x/fs.html
   */
  namespace fs {
    /** Non-blocking file open */
    function open(req: Fs, path: string, flags: string | number, mode: number, onOpen?: (error: Error, fd: number) => void): Fs
    /** Blocking file open */
    function open(req: Fs, path: string, flags: string | number, mode: number): number
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
