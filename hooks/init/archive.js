module.exports = function({ generate, model }) {
  generate(
    '/archive/index.html',
    'archive',
    model.register({
      type: 'page',
      title: 'Archive',
      pathname: '/archive/',
    }),
  );
};
