import { fetch } from '../src/fetch.js';

async function main() {
  print('Fetching test.json...');
  let res = await fetch('test.json');
  print('RESPONSE', JSON.stringify(res, null, 2));
  let data = await res.json();
  print('test.json:', JSON.stringify(data, null, 2));

  print('Fetching http://lit.luvit.io...');
  res = await fetch('http://lit.luvit.io');
  print('HTTP Response', JSON.stringify(res, null, 2));
  data = await res.json();
  print('Http Data', JSON.stringify(data, null, 2));
}

main().catch(err => print(err.stack));
