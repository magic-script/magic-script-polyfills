/// <reference path="../lib.uv.d.ts"/>
import { Timer, Check } from 'uv';

/**
 * Sets a timer which executes a function or specified piece of code once the timer expires.
 * @param {function} fn - A function to be executed after the timer expires.
 * @param {number} delay - The time, in milliseconds, the timer should wait before the specified function or code is executed.
 * @param  {...any} args - Additional parameters which are passed through to the function once the timer expires.
 * @returns {Timer}
 */
export function setTimeout (fn, delay = 0, ...args) {
  let timer = new Timer();
  timer.start(() => {
    timer.close();
    fn(...args);
  }, delay, 0);
  return timer;
}

/**
 * Cancels a timeout previously established by calling setTimeout().
 * @param {Timer} timer - The identifier of the timeout you want to cancel.
 */
export function clearTimeout (timer) {
  timer.close();
}

/**
 * Repeatedly calls a function or executes a code snippet, with a fixed time delay between each call.
 * @param {function} fn - A function to be executed every delay milliseconds.
 * @param {number} delay - The time, in milliseconds, the timer should delay in between executions of the specified function or code
 * @param  {...any} args - Additional parameters which are passed through to the function once the timer expires.
 * @returns {Timer}
 */
export function setInterval (fn, delay, ...args) {
  if (delay < 10) {
    delay = 10;
  }
  let timer = new Timer();
  timer.start(() => {
    fn(...args);
  }, delay, delay);
  return timer;
}

/**
 * Cancels an interval previously established by calling setInterval().
 * @param {Timer} timer - The identifier of the interval you want to cancel.
 */
export function clearInterval (timer) {
  timer.close();
}

let check;
let checkQueue = [];

/**
 * This method is used to defer running some code till after the current JS stack.
 * Unlike using promises, this is lighter weight and doesn't swallow errors.
 * @param {function} fn - the function you wish to call later.
 * @param  {...any} args - Additional parameters which are passed through to the function when called.
 * @returns {any} - the ID used for clearing the immediate.
 */
export function setImmediate (fn, ...args) {
  if (!check) {
    check = new Check();
    check.start(onCheck);
  }
  let id = () => fn(...args);
  checkQueue.push(id);
  return id;
}

/**
 * Clear the immediate actions, just like window.clearTimeout for window.setTimeout.
 * @param {any} id  - the ID returned from setImmediate
 */
export function clearImmediate (id) {
  checkQueue.splice(checkQueue.indexOf(id), 1);
}

function onCheck () {
  let errors = [];
  while (checkQueue.length) {
    let tasks = checkQueue;
    checkQueue = [];
    for (let fn of tasks) {
      try {
        fn();
      } catch (err) {
        errors.push(err);
      }
    }
  }
  check.stop();
  check.close();
  check = null;
}
