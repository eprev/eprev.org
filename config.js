const path = require('path');
const env = process.env.NODE_ENV || 'development';

module.exports = {
  public: path.join(__dirname, 'public'),
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
  objects: [
    [
      /^\/(\d{4})-(\d{2})-(\d{2})-([^/]+)\/(.+)$/,
      (object, [pathname, yyyy, mm, dd, slug, filename]) => {
        if (filename === `${slug}.md`) {
          object.type = 'post';
          object.date = new Date(Date.UTC(yyyy, mm, dd));
          filename = ''; // eq. index.html
        }
        object.pathname = `/${yyyy}/${mm}/${dd}/${slug}/${filename}`;
      },
    ],
    [
      /^\/(?:[^/]+\/)*(?:([^/]+)\/\1|index)\.(?:md|tmpl)$/,
      (object, [_, slug]) => {
        object.type = 'page';
        object.pathname = slug ? `/${slug}/` : '/';
      },
    ],
  ],
};