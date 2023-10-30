/*---
pathname: /404.html
type: system
layout: default
---*/

/** @type {import('@eprev/wsngn').TemplateFunction} */
export default ({ html, render, read, site, page, env }) => {
  return html` <h1>The page cannot be found</h1>
    <p>
      The page you are looking for might has been removed or something, but
      whatever, it’s not here.
    </p>
    <p>In the meantime, you can check out things I write about:</p>
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
