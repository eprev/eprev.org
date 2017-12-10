const env = process.env.NODE_ENV || 'development';
module.exports = {
  env,
  title: "Anton Eprev",
  description: "My name’s Anton Eprev and I’m a web developer working as front-end engineer at Booking.com in Amsterdam, Netherlands",
  url: env === 'production' ? 'http://eprev.org' : 'https://localhost:4000',
  twitter: "eprev",
};
