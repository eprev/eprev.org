const https = require('https');
// const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const options = {
  key: fs.readFileSync(path.join(__dirname, '../bin/ssl/localhost.key')),
  cert: fs.readFileSync(path.join(__dirname, '../bin/ssl/localhost.crt')),
};

const mime = require('./mime');
const colorize = require('./colorize');

exports.createServer = function createServer(config, buildEvents) {
  const port = new URL(config.site.url).port;

  function end(res, code, msg) {
    res.writeHead(code, {
      'Content-Length': Buffer.byteLength(msg),
      'Content-Type': 'text/plain; charset=utf-8',
    });
    res.end(msg);
  }

  https
    .createServer(options, (req, res) => {
  // http
  //   .createServer((req, res) => {
      if (req.method !== 'GET') {
        return end(res, 405, 'Method Not Allowed');
      }
      if (req.url === '/build-events') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset: utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });
        const buildSuccess = function() {
          res.write(`event: build-success\r\ndata:\r\n\r\n`);
        };
        const buildError = function(error) {
          res.write(`event: build-error\r\ndata: ${ JSON.stringify(error.stack) }\r\n\r\n`);
        };
        buildEvents.on('success', buildSuccess);
        buildEvents.on('error', buildError);
        req.setTimeout(0);
        req.on('close', () => {
          buildEvents.removeListener('success', buildSuccess)
          buildEvents.removeListener('error', buildError)
        });
      } else {
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
    })
    .listen(port);

  console.log(`Listening ${ colorize(config.site.url, 'grey')}`);
};
