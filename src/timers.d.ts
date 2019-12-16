import { Timer } from "uv";
/**
 * Sets a timer which executes a function or specified piece of code once the timer expires.
 * @param fn A function to be executed after the timer expires.
 * @param delay The time, in milliseconds, the timer should wait before the specified function or code is executed.
 * @param args Additional parameters which are passed through to the function once the timer expires.
 */
export declare function setTimeout(fn: (...args: any[]) => void, delay: number, ...args: any[]): Timer;
/**
 * Cancels a timeout previously established by calling setTimeout().
 * @param timer The identifier of the timeout you want to cancel.
 */
export declare function clearTimeout(timer: Timer): void;
/**
 * Repeatedly calls a function or executes a code snippet, with a fixed time delay between each call.
 * @param fn A function to be executed every delay milliseconds.
 * @param delay The time, in milliseconds, the timer should delay in between
 * executions of the specified function or code
 * @param args Additional parameters which are passed through to the function once the timer expires.
 */
export declare function setInterval(fn: (...args: any[]) => void, delay: number, ...args: any[]): Timer;
/**
 * Cancels an interval previously established by calling setInterval().
 * @param timer The identifier of the interval you want to cancel.
 */
export declare function clearInterval(timer: Timer): void;
/**
 * This method is used to defer running some code till after the current JS stack.
 * Unlike using promises, this is lighter weight and doesn't swallow errors.
 * @param fn the function you wish to call later.
 * @param args Additional parameters which are passed through to the function when called.
 * @returns the ID used for clearing the immediate.
 */
export declare function setImmediate(fn: (...args: any[]) => void, ...args: any[]): () => void;
/**
 * Clear the immediate actions, just like window.clearTimeout for window.setTimeout.
 * @param id the ID returned from setImmediate
 */
export declare function clearImmediate(id: () => void): void;
