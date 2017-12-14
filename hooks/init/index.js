module.exports = function({ generate, model }) {
  generate(
    '/index.html',
    'index',
    model.register({
      type: 'page',
      pathname: '/',
    }),
  );
};
