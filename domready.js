'use strict';

const http = require('http');

http.createServer((request, response) => {
  switch (request.url) {
    case '/':
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
      });
      // Early-head
      response.write(`
        <!doctype html>
        <html><head>
          <title>Charset Encoding Test</title>
          <link rel="stylesheet" href="/styles.css">
        </head><body>
      `);
      // The rest of the document
      setTimeout(() => {
        response.write('<img src="/pixel.png" alt="" width="32" height="32">');
        setTimeout(() => {
          response.end(`
            <p>Hello.</p>
            </body></html>
          `);
        }, 50);
      }, 50);
      break;
    case '/styles.css':
      response.writeHead(200, {
        'Content-Type': 'text/css',
      });
      setTimeout(() => {
        response.end('body { background-color: #333; color: #eee; font-family: Arial, sans-serif; }');
      }, 150);
      break;
    case '/pixel.png':
      response.writeHead(200, {
        'Content-Type': 'image/png',
      });
      setTimeout(() => {
        response.end(
          Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=', 'base64')
        );
      }, 200);
      break;
    default:
      response.writeHead(404, {
        'Content-Type': 'text/plain',
      });
      response.end();
  }
}).listen(8080);