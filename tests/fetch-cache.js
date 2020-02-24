import '../src/polyfills.js';
import { setPath } from '../src/writable-path.js';
import { fetch } from '../src/fetch.js';

// Enable filesystem persistence.
setPath('.');


async function main(name) {

    async function logRes(res) {
        console.log(name, res.status, res.url, { Via: res.headers.get('Via') }, await res.cacheFile, ' ');
        return res;
    }

    await fetch('https://creationix.github.io/minecss').then(logRes);
    await fetch('http://luvit.io/logo-white.svg').then(logRes);
    await fetch('https://creationix.com/content/images/2016/11/Logo_V2.png').then(logRes);
    await fetch('https://creationix.com/content/images/2016/11/IMG_20161115_073457.jpg').then(logRes);

    const res = await fetch('https://lit.luvit.io/').then(logRes);
    // console.log(i, res);
    // return res.cachePath;
    // console.log(name, { arrayBuffer: await res.arrayBuffer() });
    // console.log(name, { text: await res.text() });
    // console.log(name, { json: await res.json() });
    const data = await res.json();
    const authors = await fetch(data.authors).then(logRes).then(res => res.json());
    return authors;
    // console.log(authors);
    return Promise.all(
        Object.keys(authors).map(async (name) => [
            name,
            await fetch(authors[name]).then(res => res.json())
        ])
    );
}

let count = 0;
const timer = setInterval(() => {
    if (count++ >= 10) return clearInterval(timer);

    for (let i = 0; i++ < 2; i) {
        let name = `${count}.${i}`;
        const start = Date.now();
        console.log("Starting", name);
        main(name)
            .then(data =>
                console.log('Finished', name, Date.now() - start, typeof data))
            .catch(err => {
                i = count = Infinity;
                print(err.stack);
            })
    }
}, 500);
