/*---
pathname: /
layout: default
---*/

import assert from 'assert';

/** @param {string} content */
function extractExcerpt(content) {
  const idx = content.indexOf('<!-- Read More -->');
  return idx === -1 ? '' : content.slice(0, idx);
}

const POSTS_ON_PAGE = 7;

/** @type {import('@eprev/wsngn').TemplateFunction} */
export default async ({ html, render, site }) => {
  return html`${site
      .byType('post')
      .descBy('date')
      .slice(0, POSTS_ON_PAGE)
      .map((post) => {
        assert(post.content);
        return render('includes/post', {
          post: {
            ...post,
            headingLevel: 2,
            headingLink: true,
            excerpt: extractExcerpt(post.content),
          },
        });
      })}
    <div class="post-special-archive">
      <a
        href="/archive/"
        data-ga-on="click"
        data-ga-category="Click"
        data-ga-action="Archive"
        >Archive</a
      >
      &rsaquo;
    </div>`;
};
