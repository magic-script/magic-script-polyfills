import { readdir, readdirSync, promises } from '../node/fs.js';

readdir('.', (err, files) => {
  if (err) throw err;
  for (const file of files) {
    print(file);
  }
  print('done');
});

for (const file of readdirSync('.')) {
  print('sync', file);
}
print('sync done');

promises.readdir('.').then(files => {
  for (const file of files) {
    print('promises', file);
  }
  print('promises done');
});
