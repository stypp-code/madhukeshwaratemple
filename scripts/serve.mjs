import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const base = resolve(new URL('..', import.meta.url).pathname.replace(/^\//, '').replaceAll('/', sep));
const publicRoot = resolve(base,'public');
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml', '.xml':'application/xml; charset=utf-8', '.txt':'text/plain; charset=utf-8' };
createServer(async (req,res) => {
  try {
    const requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = resolve(base, `.${requested === '/' ? '/index.html' : requested}`);
    if (file !== base && !file.startsWith(base + sep)) throw new Error('Invalid path');
    try { if (!(await stat(file)).isFile()) throw new Error('Not found'); }
    catch {
      const asset = resolve(publicRoot,`.${requested}`);
      if (!asset.startsWith(publicRoot + sep) || !(await stat(asset)).isFile()) throw new Error('Not found');
      file = asset;
    }
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(8000, '0.0.0.0', () => console.log('Serving on http://127.0.0.1:8000'));
