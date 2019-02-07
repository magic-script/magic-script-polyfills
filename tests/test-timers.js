import { setTimeout, setInterval, clearInterval, setImmediate } from '../src/timers.js';

import { Check } from 'uv';

setTimeout(() => {
  print('Timeout!');
}, 500);

let count = 10;
let i = setInterval(() => {
  print('ping...', count);
  if (!count--) clearInterval(i);
}, 100);

let im = 500;
print('immediate', i);
setImmediate(onImmediate);
function onImmediate () {
  im--;
  print('immediate', im);
  if (im) setImmediate(onImmediate);
}

let check = new Check();
check.unref();
check.start(() => {
  print(check, check.hasRef());
});
