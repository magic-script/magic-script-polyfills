/* global print */
// Use internal functions directly
import { writeFileStream, readFileStream } from '../src/fs.js';
import { consume, binToStr } from '../src/utils.js';

main();
async function main () {
  const filepath = '/tmp/file.json';
  // The value here can be an iterator, an async interator, a string, or a buffer or any combination of them.
  await writeFileStream(filepath, 'Hello World\n');

  // Read the file back in chunks as ArrayBuffer
  const stream = await readFileStream(filepath);
  print('stream', stream);
  const bin = await consume(stream);
  print('bin', bin);
  const str = binToStr(bin);
  print('str', str);
}
