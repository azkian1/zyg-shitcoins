import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.ZYG_PORT || 8798);
const types = { '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
http.createServer((req, res) => {
  let file;
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    if (name.split(/[\\/]/).some(segment => segment.startsWith('.'))) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  } catch {
    res.writeHead(400).end('Invalid path');
    return;
  }
  const relative = path.relative(root, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.stat(file, (error, info) => {
    if (error || !info.isFile()) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-cache' });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(file).pipe(res);
  });
}).listen(port, '127.0.0.1', () => console.log(`ZYG: http://127.0.0.1:${port}`));
