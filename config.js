const path = require('path');
const env = process.env.NODE_ENV || 'development';

module.exports = {
  src: path.join(__dirname, 'source'),
  dest: path.join(__dirname, 'static'),
  env,
  site: {
    title: 'Anton Eprev',
    description:
      'My name’s Anton Eprev and I’m a software engineer working ' +
      'as front-end developer at Booking.com in Amsterdam. ' +
      'Tinker with electronics and 3D printers in spare time.',
    url: env === 'production' ? 'https://eprev.org' : 'https://dev.eprev.org',
    twitter: 'eprev',
    editUrl: 'https://github.com/eprev/eprev.org/blob/master/source',
  },
  serverUrl: 'http://localhost:3000',
  exclude: ['/gif/src', '/gif/Makefile'],
  rewrites: [
    [
      /^\/posts\/(\d{4})-(\d{2})-(\d{2})-([^/.]+)(?:\/(.+)|\.md)?$/,
      (doc, [pathname, yyyy, mm, dd, slug, filename]) => {
        if (filename === `${slug}.md` || filename === undefined) {
          doc.type = 'post';
          doc.date = new Date(Date.UTC(yyyy, mm - 1, dd));
          filename = ''; // eq. index.html
          if (!doc.layout) {
            doc.layout = 'post';
          }
        }
        doc.pathname = `/${yyyy}/${mm}/${dd}/${slug}/${filename}`;
      },
    ],
    [
      /^\/posts\/drafts\/([^/.]+)(?:\/(.+)|\.md)?$/,
      (doc, [pathname, slug, filename]) => {
        if (filename === `${slug}.md` || filename === undefined) {
          doc.type = 'post';
          doc.date = new Date();
          doc.draft = true;
          filename = ''; // eq. index.html
          if (!doc.layout) {
            doc.layout = 'post';
          }
        }
        doc.pathname = `/drafts/${slug}/${filename}`;
      },
    ],
  ],
};
