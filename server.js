const https = require('https');
const fs = require('fs');
const path = require('path');
const port = 4000;
const publicDir = path.join(__dirname, 'public');

const options = {
  key: fs.readFileSync('ssl/localhost.key'),
  cert: fs.readFileSync('ssl/localhost.crt'),
};

const mime = require('./lib/mime');
const markdown = require('./lib/markdown');

function end(res, code, msg) {
  res.writeHead(code, {
    'Content-Length': Buffer.byteLength(msg),
    'Content-Type': 'text/plain; charset=utf-8',
  });
  res.end(msg);
}

https
  .createServer(options, (req, res) => {
    if (req.method !== 'GET') {
      return end(res, 405, 'Method Not Allowed');
    }
    let url = req.url;
    let match;
    if ((match = /^\/(\d{4})\/(\d{2})\/(\d{2})\/([^/]+)\/(.*)/.exec(url))) {
      const [_, yyyy, mm, dd, slug, pathname] = match;
      url = `/${yyyy}-${mm}-${dd}-${slug}/${pathname}`;
      if (url.endsWith('/')) {
        url += slug + '.md';
      }
    } else {
      if (url.endsWith('/')) {
        url += 'index.md';
      }
    }

    const filename = path.join(publicDir, url);
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
          const document = markdown(source);
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
