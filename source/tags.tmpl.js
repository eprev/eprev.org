/*---
title: Tags
pathname: /tags/
layout: default
---*/

// TODO: expert from config.js
/** @typedef {import('../config.js')['default']['site']} ConfigSite */

/** @type {import('@eprev/wsngn').TemplateFunction} */
export default async ({ html, site: _site }) => {
  const site = /** @type {import('@eprev/wsngn').Site<ConfigSite>} */ (_site);
  return html`<h1 class="page__header">Tags</h1>
    <ul class="tags">
      ${site
        .byType('tag')
        .ascBy('id')
        .map((tag) => {
          return `
      <li class="tags__item">
        <a href="${tag.pathname}">${tag.title}</a>
      </li>`;
        })}
    </ul>`;
};
