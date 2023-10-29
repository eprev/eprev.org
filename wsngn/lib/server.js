import fs from 'fs';
import path from 'path';
import url, { URL } from 'url';

import mime from './mime.js';
import colorize from './colorize.js';

/** @typedef {import("http").RequestListener} RequestListener */
/** @typedef {import("http").ServerResponse} ServerResponse */
/** @typedef {import("events").EventEmitter} EventEmitter */
/** @typedef {import("./config.js").Config} Config */

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/**
 * @param {Config} config
 * @param {EventEmitter} buildEvents
 */
export default async function createServer(config, buildEvents) {
  const { port, protocol } = new URL(config.serverUrl);

  if (protocol === 'https:/') {
    const options = {
      key: fs.readFileSync(path.join(__dirname, '../bin/ssl/localhost.key')),
      cert: fs.readFileSync(path.join(__dirname, '../bin/ssl/localhost.crt')),
    };
    const { createServer } = await import('https');
    createServer(options, reqHandler).listen(port);
  } else {
    const { createServer } = await import('http');
    createServer(reqHandler).listen(port);
  }

  /** @type {(res: ServerResponse, code: number, msg: string) => void } */
  function end(res, code, msg) {
    res.writeHead(code, {
      'Content-Length': Buffer.byteLength(msg),
      'Content-Type': 'text/plain; charset=utf-8',
    });
    res.end(msg);
  }

  /** @type {RequestListener} */
  function reqHandler(req, res) {
    if (req.method !== 'GET') {
      return end(res, 405, 'Method Not Allowed');
    }
    if (req.url === '/build-events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset: utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      const buildSuccess = function () {
        res.write(`event: build-success\r\ndata:\r\n\r\n`);
      };
      /** @param {Error} error */
      const buildError = function (error) {
        res.write(
          `event: build-error\r\ndata: ${JSON.stringify(error.stack)}\r\n\r\n`,
        );
      };

      buildEvents.on('success', buildSuccess);
      buildEvents.on('error', buildError);

      req.setTimeout(0);

      req.on('close', () => {
        buildEvents.removeListener('success', buildSuccess);
        buildEvents.removeListener('error', buildError);
      });
    } else if (req.url) {
      const url = new URL(req.url, config.site.url);
      const pathname = path.join(
        config.dest,
        url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname,
      );
      fs.stat(pathname, (err, stat) => {
        if (err) {
          if (err.code === 'ENOENT') {
            end(res, 404, 'Not Found');
          } else {
            end(res, 500, err.toString());
          }
        } else {
          const ext = path.extname(pathname);
          res.writeHead(200, {
            // 'Cache-Control': 'max-age=600',
            'Cache-Control': 'no-cache',
            'Content-Length': stat.size,
            'Content-Type': mime[ext] || 'application/octet-stream',
          });
          fs.createReadStream(pathname).pipe(res);
        }
      });
    }
  }

  console.log(`Listening ${colorize(config.serverUrl, 'grey')}`);
}
