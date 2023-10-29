/*---
type: system
pathname: /sitemap.xml
---*/

import { dateFormat } from '@eprev/wsngn';
import assert from 'assert';

/** @type {import('@eprev/wsngn').TemplateFunction} */
export default async ({ html, url, site: _site }) => {
  /** @typedef {import('../config.js').ConfigSite} ConfigSite */
  const site = /** @type {import('@eprev/wsngn').Site<ConfigSite>} */ (_site);
  return html`<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${site.config.url}/</loc>
        <changefreq>daily</changefreq>
        <priority>1</priority>
      </url>
      ${site.byType('post').map((post) => {
        assert(post.date instanceof Date);
        return `
      <url>
        <loc>${url(post.pathname)}</loc>
        <lastmod>${dateFormat(post.date, 'YYYY-MM-DD')}</lastmod>
        <changefreq>weekly</changefreq>
      </url>
      `;
      })}
      ${site.byType('page').map((page) => {
        return `
      <url>
        <loc>${url(page.pathname)}</loc>
        ${
          page.date instanceof Date
            ? `<lastmod>${dateFormat(page.date, 'YYYY-MM-DD')}</lastmod>`
            : ''
        }
        <changefreq>weekly</changefreq>
      </url>
      `;
      })}
    </urlset>`;
};
