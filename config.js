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
  exclude: /^\./,
  collections: {
    posts: {
      layout: 'post',
      rewrite: [
        /^\/(\d{4})-(\d{2})-(\d{2})-([^/]+)\/(.+)$/,
        (_, yyyy, mm, dd, slug, filename) => {
          if (filename === `${slug}.md`) {
            filename = 'index.html';
          }
          return `/${yyyy}/${mm}/${dd}/${slug}/${filename}`;
        },
      ],
    },
    pages: {
      layout: 'default',
      rewrite: [
        /\/(?:([^/]+)\/\1|index)\.(?:md|tmpl)$/,
        (_, slug) => {
          return slug ? `/${slug}/index.html` : '/index.html';
        },
      ],
    },
  },
};