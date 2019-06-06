/* global print */
import { fetch } from '../src/fetch.js';
import { assert } from '../src/assert.js';
import { writeFileStream, readFileStream } from '../src/fs.js';

const data = {
  squares: [],
  cubes: [],
  hexCubes: [],
  b36Cubes: []
};
for (let i = 0; i < 1000; i += 13) {
  const square = i * i;
  data.squares.push(square);
  const cube = square * i;
  data.cubes.push(cube);
  data.hexCubes.push(cube.toString(16));
  data.b36Cubes.push(cube.toString(36));
}
const json = JSON.stringify(data, null, 2);
print(JSON.stringify(json));

main();
async function main () {
  const filepath = '/tmp/file.json';
  const input = json + '\n';
  await writeFileStream(filepath, input);
  const res = await fetch(filepath);
  print(JSON.stringify(res, null, 2));
  const txt = await res.text();
  print(JSON.stringify(txt));
  assert(txt === input, 'Write file failed roundtrip');
}
