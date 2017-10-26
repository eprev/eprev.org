'use strict';

const http = require('http');

http.createServer((request, response) => {
  function html(scriptType, scriptLocation = 'header') {
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
    });
    // Early-head
    response.write(`
      <!doctype html>
      <html><head>
        <title>Charset Encoding Test</title>
        <link rel="stylesheet" href="/styles.css">
        ${ scriptLocation === 'header' ?
          `<script src="/${ scriptType }-script.js"${ scriptType === 'sync' ? '' : ' ' + scriptType }></script>` : ''
        }
      </head><body>
    `);
    // The rest of the document
    setTimeout(() => {
      response.write('<img src="/pixel.png" alt="" width="32" height="32">');
      setTimeout(() => {
        response.end(`
          <p>Hello.</p>
          ${ scriptLocation === 'body' ?
            `<script src="/${ scriptType }-script.js"${ scriptType === 'sync' ? '' : ' ' + scriptType }></script>` : ''
          }
          </body></html>
        `);
      }, 100);
    }, 50);
  }
  switch (request.url) {
    case '/':
      html('sync');
      break;
    case '/async':
        html('async');
        break;
    case '/defer':
        html('defer');
        break;
    case '/sync':
      html('sync', 'body');
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
    case '/sync-script.js':
    case '/async-script.js':
    case '/defer-script.js':
      response.writeHead(200, {
        'Content-Type': 'application/javascript',
      });
      setTimeout(() => {
        response.end(`
          const ts = Date.now(); while (Date.now() - ts < 100);
          console.log(document.readyState);
          document.addEventListener('readystatechange', (e) => {
            if (e.target.readyState === 'complete') {
              const [metrics] = performance.getEntriesByType('navigation');
              ['domInteractive', 'domComplete'].forEach((name) =>
                console.log(name, metrics[name])
              );
            }
          });
        `);
      }, 50);
      break;
    case '/styles.css':
      response.writeHead(200, {
        'Content-Type': 'text/css',
      });
      setTimeout(() => {
        response.end('body { background-color: #333; color: #eee; font-family: Arial, sans-serif; }');
      }, 50);
      break;
    default:
      response.writeHead(404, {
        'Content-Type': 'text/plain',
      });
      response.end();
  }
}).listen(8080);