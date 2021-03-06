/* global fetch, print */
import '../src/polyfills.js';
import { chmod, scandir, stat } from '../src/fs.js';

async function main () {
  print('Fetching test.json...');
  let res = await fetch('tests/test.json');
  print('RESPONSE', JSON.stringify(res, null, 2));
  let data = await res.json();
  print('test.json:', JSON.stringify(data, null, 2));

  print("fetching 'https://jsonplaceholder.typicode.com/todos/1'");
  res = await fetch('https://jsonplaceholder.typicode.com/todos/1');
  print('HTTP Response', JSON.stringify(res, null, 2));
  data = await res.json();
  print('HTTP Data', JSON.stringify(data, null, 2));

  print("Posting to 'https://jsonplaceholder.typicode.com/posts'");
  res = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    body: JSON.stringify({
      title: 'foo',
      body: 'bar',
      userId: 1
    }),
    headers: {
      'Content-type': 'application/json; charset=UTF-8'
    }
  });
  print('HTTP Response', JSON.stringify(res, null, 2));
  data = await res.json();
  print('HTTP Data', JSON.stringify(data, null, 2));

  print('Fetching http://lit.luvit.io...');
  res = await fetch('http://lit.luvit.io');
  print('HTTP Response', JSON.stringify(res, null, 2));
  data = await res.json();
  print('HTTP Data', JSON.stringify(data, null, 2));

  print('Fetching https://lit.luvit.io...');
  res = await fetch('https://lit.luvit.io');
  print('HTTPS Response', JSON.stringify(res, null, 2));
  data = await res.json();
  print('HTTPS Data', JSON.stringify(data, null, 2));

  print('Downloading file to save...');
  res = await fetch('https://lit.luvit.io/packages/creationix/gamepad/latest.zip');
  print('RESPONSE', JSON.stringify(res, null, 2));
  // Get the server specified filename from the response headers
  let filename = 'latest.zip';
  let contentDisposition = res.headers['Content-Disposition'];
  if (contentDisposition) {
    filename = contentDisposition.match(/filename=([^ ]+)/)[1] || filename;
  }
  await fetch(filename, { method: 'PUT', body: res.body });

  print('Building luvit package from online parts');
  await fetch('wscat', {
    method: 'PUT',
    body: [
      // First part of body is the luvi binary from github releases.
      // This requires to manually follow the redirect since our fetch doesn't do it yet.
      fetch('https://github.com/luvit/luvi/releases/download/v2.7.6/luvi-tiny-Linux_x86_64')
        .then(res => res.body),
      // The second part of the body is the zip for the wscat utility.
      // Again we're just putting a promise to a stream in the array.
      fetch('https://lit.luvit.io/packages/creationix/wscat/latest.zip')
        .then(res => res.body)
    ]
  });
  print('Setting wscat to exec');
  await chmod('wscat', parseInt('755', 8));
  let meta = await stat('wscat');
  print('wscat', JSON.stringify(meta, null, 2));
  print('wscat file created');

  print('scandir on tests folder');
  let dir = await scandir('tests');
  for (let entry of dir) {
    print(JSON.stringify(entry, null, 2));
  }
}

main();
