/// <reference path="../lib.uv.d.ts"/>

import uv, { Timer, Tcp, Connect, Write, Shutdown, Getaddrinfo, getaddrinfo } from 'uv';
print('uv', JSON.stringify(Object.keys(uv)));

let timer = new Timer();
print('timer', timer);
print('start');
let count = 10;
timer.start(() => {
  print('timeout');
  if (!--count) {
    timer.stop();
    timer.close(() => {
      print('closed!');
    });
  }
}, 100, 100);

function makeServer () {
  let server = new Tcp();
  server.bind('127.0.0.1', 0);
  server.listen(127, () => {
    print('A new client knocked');
    let client = new Tcp();
    server.accept(client);
    client.readStart((err, data) => {
      if (err) throw err;
      print('Server read', data);
      if (!data) {
        client.shutdown(new Shutdown(), () => {
          print('server shutdown');
          client.close();
          server.close();
        });
      }
    });
  });
  return server.sockname;
}

function makeClient ({ ip, port }) {
  print('Connecting', JSON.stringify({ ip, port }));
  let client = new Tcp();
  client.connect(new Connect(), ip, port, (err, value) => {
    if (err) throw err;
    print('Connected!', value);
    client.write(new Write(), 'Hello World\n', () => {
      print('client Written');
      client.shutdown(new Shutdown(), () => {
        print('client Shutdown');
        client.close(() => {
          print('client closed');
        });
      });
    });
  });
}

makeClient(makeServer());

let req = getaddrinfo(new Getaddrinfo(), (err, value) => {
  if (err) throw err;
  print('Results', JSON.stringify(value, null, 2));
}, 'luvit.io', 'https');
print('req', req);

// Cancel the DNS lookup after 10 ms
let timeout = new Timer();
timeout.start(() => {
  timeout.close();
  req.cancel();
}, 10);
