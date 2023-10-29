// <reference types="../wsngn/types/tmpl.d.ts" />

import { dateFormat } from '@eprev/wsngn';
// const { dateFormat } = require('@eprev/wsngn');

/** @type {import('@eprev/wsngn').TemplateFunction} */
export default ({ html, render, page }) => {
  const tagPage = /** @type {import('../plugins/tags.plugin.js').TagPage} */ (
    page
  );

  const { res: contents } = tagPage.posts
    .descBy('date')
    .reduce(({ year, res }, post, index, posts) => {
      if (post.date instanceof Date) {
        const postYear = post.date.getUTCFullYear();
        if (year !== postYear) {
          if (year) {
            res += '</ul>';
          }
          year = postYear;
          res += `<h2>${year}</h2><ul class="archive">`;
        }
        res += `
        <li class="archive__item">
          <div class="archive__date">${dateFormat(post.date, '%M D')}</div>
          <div class="archive__header">
            <a href="${post.pathname}">${post.title}</a>
          </div>
        </li>`;
        if (index === posts.length - 1) {
          res += '</ul>';
          return { res };
        }
      }
      return { year, res };
    }, /** @type {{year?: number, res: string}} */ ({ year: undefined, res: '' }));

  return html`${render('includes/header')}
    <h1 class="page__header">${tagPage.title}</h1>
    ${contents} ${render('includes/footer')}`;
};
