const path = require('path');
const env = process.env.NODE_ENV || 'development';

module.exports = {
  src: path.join(__dirname, 'documents'),
  dest: path.join(__dirname, 'static'),
  env,
  site: {
    title: 'Anton Eprev',
    description:
      'My name’s Anton Eprev and I’m a web developer working as front-end engineer at Booking.com in Amsterdam, Netherlands',
    url: env === 'production' ? 'http://eprev.org' : 'https://localhost:4000',
    twitter: 'eprev',
  },
  // timezone: '+0100', // CET
  exclude: ['/gif/src', '/gif/Makefile'],
  documents: [
    [
      /^\/posts\/(\d{4})-(\d{2})-(\d{2})_([^/]+)\/(.+)$/,
      (doc, [pathname, yyyy, mm, dd, slug, filename]) => {
        if (filename === `${slug}.md`) {
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
  ],
};