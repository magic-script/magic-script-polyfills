import { binToStr } from '../src/weblit-js/libs/bintools.js';
import { decoder, encoder } from '../src/weblit-js/libs/http-codec.js';
import { connect } from '../src/tcp.js';
import { wrapStream } from '../src/weblit-js/libs/gen-channel.js';

connect('lit.luvit.io', 80).then(async socket => {
  let { read, write } = wrapStream(socket, {
    encode: encoder(),
    decode: decoder()
  });
  await write({
    method: 'GET',
    path: '/',
    headers: [
      'Host', 'lit.luvit.io',
      'User-Agent', 'MagicScript',
      'Accept', 'application/json',
      'Connection', 'close'
    ]
  });
  await write('');
  let res = await read();
  print(JSON.stringify(res, null, 2));
  let chunks = [];
  let chunk;
  while ((chunk = await read()).length) {
    chunks.push(binToStr(chunk));
  }
  let response = JSON.parse(chunks.join(''));
  print('Response:');
  print(JSON.stringify(response, null, 2));
  await write();
}).catch(err => print(err.stack));
