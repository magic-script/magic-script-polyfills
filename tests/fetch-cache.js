import '../src/polyfills.js';
import { setPath } from '../src/writable-path.js';
import { fetch } from '../src/fetch.js';

// Enable filesystem persistence.
setPath('.');

const extra = true;

async function main(name) {

    async function logRes(res) {
        console.log(name, res.status, res.url, { Via: res.headers.get('Via') }, await res.cacheFile, ' ');
        return res;
    }

    await Promise.all([
        fetch('https://creationix.github.io/minecss').then(logRes),
        fetch('http://luvit.io/logo-white.svg').then(logRes),
        fetch('https://creationix.com/content/images/2016/11/Logo_V2.png').then(logRes),
        fetch('https://creationix.com/content/images/2016/11/IMG_20161115_073457.jpg').then(logRes)
    ]);

    const res = await fetch('https://lit.luvit.io/').then(logRes);
    const data = await res.json();
    const authors = await fetch(data.authors).then(logRes).then(res => res.json());
    if (!extra) return authors;
    return Promise.all(
        Object.keys(authors).map(async (name) => [
            name,
            await fetch(authors[name]).then(logRes).then(res => res.json())
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
