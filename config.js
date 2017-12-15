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
  exclude: /^\./,
  documents: [
    [
      /^\/(\d{4})\/([^/]+)(-\d+)?\/(.+)$/,
      (doc, [pathname, yyyy, slug, issue, filename]) => {
        if (filename === `${slug}.md`) {
          doc.type = 'post';
          // doc.date = new Date(Date.UTC(yyyy, mm, dd));
          filename = ''; // eq. index.html
        }
        // TODO: meta infromation should be read upfront and date will be available already
        doc.pathname = `/${yyyy}/${mm}/${dd}/${slug}/${filename}`;
      },
    ],
  ],
};