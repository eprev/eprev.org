/*---
title: Archive
pathname: /archive/
layout: default
---*/

import { dateFormat } from '@eprev/wsngn';

/** @type {import('@eprev/wsngn').TemplateFunction} */
export default async ({ html, render, site }) => {
  const { res: contents } = site
    .byType('post')
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

  return html`<h1 class="page__header">Archive</h1>
    ${contents}`;
};
