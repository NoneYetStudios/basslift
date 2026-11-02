/**
 * Bass Shoplifting Championship — Application HTTP Server + SQLite Leaderboard API
 *
 * Serves only index.html, css/*, and js/* statically.
 * Routes /api/* to the persistent SQLite Global Leaderboard handler.
 * Never exposes database files, server scripts, or dotfiles.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createLeaderboardApi } from './server/leaderboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const PUBLIC_DIRS = ['css', 'js'];

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
};

export function resolvePublicFile(urlPath, root = __dirname) {
  let rel;
  try {
    rel = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (rel.includes('\0') || rel.includes('\\')) return null;
  rel = rel === '/' ? 'index.html' : rel.replace(/^\/+/, '');
  const segments = rel.split('/');
  const allowed =
    rel === 'index.html' || (segments.length >= 2 && PUBLIC_DIRS.includes(segments[0]));
  if (!allowed || segments.some((s) => s === '..' || s.startsWith('.'))) return null;
  const abs = path.resolve(root, rel);
  if (!abs.startsWith(path.resolve(root) + path.sep)) return null;
  if (!MIME_TYPES[path.extname(abs).toLowerCase()]) return null;
  try {
    if (!fs.statSync(abs).isFile()) return null;
  } catch {
    return null;
  }
  return abs;
}

export function createAppServer(options = {}) {
  const dbPath =
    options.dbPath ||
    process.env.LEADERBOARD_DB_PATH ||
    path.join(__dirname, 'data', 'leaderboard.sqlite');

  const api = createLeaderboardApi({
    dbPath,
    now: options.now,
    maxRequestsPerMinute: options.maxRequestsPerMinute,
    allowedOrigin: process.env.ALLOWED_ORIGIN || null,
    trustProxy: process.env.TRUST_PROXY === '1'
  });

  const server = http.createServer(async (req, res) => {
    const pathname = (req.url || '/').split('?')[0];

    if (pathname.startsWith('/api/')) {
      await api.handle(req, res);
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Method Not Allowed');
      return;
    }

    const filePath = resolvePublicFile(pathname, __dirname);
    if (!filePath) {
      res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      ...SECURITY_HEADERS,
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    fs.createReadStream(filePath).pipe(res);
  });

  server.leaderboardApi = api;
  return server;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const port = Number(process.argv[2] || process.env.PORT || 8080);
  const host = process.env.HOST || '127.0.0.1';
  const server = createAppServer();
  server.listen(port, host, () => {
    console.log(`Bass Shoplifting Championship running at http://${host}:${port}`);
  });
}
