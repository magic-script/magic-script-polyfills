import { os, hrtime } from 'uv';
const { getenv } = os;

print('hrtime', hrtime);
print('os', os);
print('getenv', getenv);
print(JSON.stringify({
  HOME: getenv('HOME'),
  PATH: getenv('PATH'),
  USER: getenv('USER'),
}, null, 2));
const start = hrtime();
const begin = Date.now();
for (let i = 0; i < 10; i++) {
  print('now', (hrtime()-start)/1000000, Date.now() - begin);
  for (let b = 0; b < 100000; b++) {
    i++;
    i--;
  }
}