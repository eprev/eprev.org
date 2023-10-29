/*---
type: system
pathname: /atom.xml
---*/

/** @param {string} html */
function sanitize(html) {
  html = html
    .replace(/\s+(class|style)="[^"]*"/g, '')
    .replace(/<span>([^<]+)<\/span>/g, '$1')
    .replace(/<span>([^<]+)<\/span>/g, '$1'); // Nested spans (substr in highlight.js)
  return html;
}

import assert from 'assert';
import { dateFormat } from '@eprev/wsngn';

/** @type {import('@eprev/wsngn').TemplateFunction} */
export default async ({ html, render, url, escape, site: _site }) => {
  /** @typedef {import('../config.js').ConfigSite} ConfigSite */
  const site = /** @type {import('@eprev/wsngn').Site<ConfigSite>} */ (_site);
  return html`<?xml version="1.0" encoding="UTF-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>Anton Eprev</title>
      <link href="${url('/atom.xml')}" rel="self" />
      <link href="${site.config.url}/" />
      <updated>${dateFormat(site.time, 'YYYY-MM-DDTmm:hh:ss+00:00')}</updated>
      <id>${site.config.url}/</id>
      <author>
        <name>Anton Eprev</name>
        <email>a.eprev@gmail.com</email>
      </author>
      ${site
        .byType('post')
        .descBy('date')
        .map((post) => {
          assert(post.title);
          assert(post.content);
          assert(post.date instanceof Date);
          return `
      <entry>
        <title>${escape(post.title)}</title>
        <link href="${url(post.pathname)}"/>
        <updated>${dateFormat(post.date, 'YYYY-MM-DDTmm:hh:ss+00:00')}</updated>
        <id>${url(post.pathname)}</id>
        <content type="html">${escape(sanitize(post.content))}</content>
      </entry>
      `;
        })}
    </feed>`;
};
