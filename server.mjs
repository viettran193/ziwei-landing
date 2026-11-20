import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const ROOT_DIR = path.resolve(__dirname);
const LOG_DIR = path.join(ROOT_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'access.log');

fs.mkdirSync(LOG_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function logAccess(req, res, bytes) {
  const now = new Date().toISOString();
  const remoteIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '-';
  const method = req.method;
  const url = req.url;
  const status = res.statusCode;
  const referer = req.headers['referer'] || '-';
  const ua = req.headers['user-agent'] || '-';
  const line = `${now} | ${remoteIp} | ${method} ${url} | ${status} | ${bytes}B | ref: "${referer}" | ua: "${ua}"\n`;
  fs.appendFile(LOG_FILE, line, (err) => {
    if (err) console.error('Failed to write access log:', err);
  });
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    const msg = 'Method Not Allowed';
    res.end(msg);
    logAccess(req, res, Buffer.byteLength(msg));
    return;
  }

  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(ROOT_DIR, safePath);

  if (!filePath.startsWith(ROOT_DIR)) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    const msg = 'Forbidden';
    res.end(msg);
    logAccess(req, res, Buffer.byteLength(msg));
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      const msg = '404 Not Found';
      res.end(msg);
      logAccess(req, res, Buffer.byteLength(msg));
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }

    if (req.method === 'HEAD') {
      res.end();
      logAccess(req, res, 0);
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('end', () => {
      logAccess(req, res, stats.size);
    });
    stream.on('error', (streamErr) => {
      console.error('Stream error:', streamErr);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Server Error');
      }
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Ziwei Landing Server running at http://${HOST}:${PORT}/`);
  console.log(`Serving files from: ${ROOT_DIR}`);
  console.log(`Logging access to: ${LOG_FILE}`);
});
