/* global fetch, print */
import '../src/polyfills.js';

async function main () {
  let response = await fetch('https://loremflickr.com/320/240', { redirect: 'follow' });
  print(response);
}
main();
