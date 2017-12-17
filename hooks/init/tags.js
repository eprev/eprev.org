module.exports = function({ generate, model, config }) {
  const tagName = {
    css: 'CSS',
    devops: 'DevOps',
    git: 'GIT',
    graphql: 'GraphQL',
    html: 'HTML',
    javascript: 'JavaScript',
    mongodb: 'MongoDB',
    'os-x': 'OS X',
    svg: 'SVG',
    ux: 'UX',
    'hacking-web': 'Hacking Web',
  };
  const tags = {};
  Object.values(model.documents).forEach(doc => {
    if (doc.type == 'post' && doc.tags) {
      doc.tags.forEach(tag => {
        if (!tags[tag]) {
          tags[tag] = [];
        }
        tags[tag].push(doc);
      });
    }
  });
  Object.values(tags).forEach(tag => {
    tag.sort((a, b) => b.date - a.date);
  });
  config.site.tags = Object.keys(tags)
    .sort()
    .map(tag => {
      const posts = tags[tag];
      const page = model.register({
        type: 'page',
        pathname: `/tags/${tag}/`,
        title: tagName[tag] || tag[0].toUpperCase() + tag.slice(1),
        posts,
      });
      generate(`/tags/${tag}/index.html`, 'tag', page);
      return page;
    });
  generate(
    '/tags/index.html',
    'tags',
    model.register({
      type: 'page',
      title: 'Tags',
      pathname: '/tags/',
    }),
  );
};
