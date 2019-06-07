/* global WebSocket, print */
import '../src/polyfills.js';
import { assert } from '../src/assert.js';

function testEcho () {
  return new Promise((resolve, reject) => {
    print('Connecting to wss://echo.websocket.org...');
    const ws = new WebSocket('wss://echo.websocket.org');
    ws.onerror = reject;
    const greeting = 'Hello Echo\n';
    ws.addEventListener('open', () => {
      print('Connected!', JSON.stringify(ws));
      print('Sending greeting...');
      ws.send(greeting);
    });
    ws.addEventListener('message', message => {
      assert(message === greeting, 'Echo failure');
      print('Greeting was echoed');
      ws.close();
    });
    ws.addEventListener('close', () => {
      print('Echo test complete\n');
      resolve();
    });
  });
}

function testLit () {
  return new Promise((resolve, reject) => {
    print('Connecting to wss://lit.luvit.io with lit subprotocol...');
    const ws = new WebSocket('wss://lit.luvit.io', 'lit');
    ws.onerror = reject;
    ws.onopen = () => {
      print('Connected!', JSON.stringify(ws));
      print('Sending match query for creationix/weblit...');
      ws.send('match creationix/weblit');
    };
    ws.onmessage = message => {
      if (message instanceof ArrayBuffer) {
        print(`Block received: ${message.byteLength} bytes long`);
        print('Closing websocket connection');
        ws.close();
      } else if (typeof message === 'string') {
        print('Match response:', message);
        print('Sending want command to get body of match...');
        const hash = message.match(/[0-9a-f]+$/)[0];
        ws.send(`want ${hash}`);
      } else {
        throw new Error('Unexpected data type in message handler');
      }
    };
    ws.onclose = () => {
      print('Lit test complete\n');
      resolve();
    };
  });
}

main();
async function main () {
  print('Starting websocket tests...\n');
  await testEcho();
  await testLit();
  print('All tests passed!\n');
}
