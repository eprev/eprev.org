const https = require('https');
const fs = require('fs');
const path = require('path');
const port = 4000;
const publicDir = path.join(__dirname, 'public');
const { URL } = require('url');

const options = {
  key: fs.readFileSync('ssl/localhost.key'),
  cert: fs.readFileSync('ssl/localhost.crt'),
};

const mime = require('./lib/mime');
const markdown = require('./lib/markdown');
const render = require('./lib/template').render;

function end(res, code, msg) {
  res.writeHead(code, {
    'Content-Length': Buffer.byteLength(msg),
    'Content-Type': 'text/plain; charset=utf-8',
  });
  res.end(msg);
}

const config = require('./config');

https
  .createServer(options, (req, res) => {
    if (req.method !== 'GET') {
      return end(res, 405, 'Method Not Allowed');
    }
    const url = new URL(req.url, config.url);
    let pathname = url.pathname;
    let match;
    if ((match = /^\/(\d{4})\/(\d{2})\/(\d{2})\/([^/]+)\/(.*)/.exec(pathname))) {
      const [_, yyyy, mm, dd, slug, filename] = match;
      pathname = `/${yyyy}-${mm}-${dd}-${slug}/${filename}`;
      if (pathname.endsWith('/')) {
        pathname += slug + '.md';
      }
    } else {
      if (pathname.endsWith('/')) {
        pathname += 'index.md';
      }
    }

    const filename = path.join(publicDir, pathname);
    fs.stat(filename, (err, stat) => {
      if (err) {
        if (err.code === 'ENOENT') {
          end(res, 404, 'Not Found');
        } else {
          end(res, 500, err.toString());
        }
      } else {
        const ext = path.extname(filename);
        if (ext === '.md') {
          const source = fs.readFileSync(filename, { encoding: 'utf-8' });
          const options = {
            baseUrl: config.url + url.pathname,
          };
          const { content, meta } = markdown(source, options);
          const context = {
            site: config,
            page: Object.assign(
              {
                content: content,
                url: url.pathname,
              },
              meta,
            ),
          };
          const document = render(meta.layout, context);
          res.writeHead(200, {
            'Content-Length': Buffer.byteLength(document),
            'Content-Type': 'text/html; charset=utf-8',
          });
          res.end(document);
        } else {
          res.writeHead(200, {
            'Content-Length': stat.size,
            'Content-Type': mime[ext] || 'application/octet-stream',
          });
          fs.createReadStream(filename).pipe(res);
        }
      }
    });
  })
  .listen(port);
