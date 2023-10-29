import fs from 'fs';
import path from 'path';
import config from '../config.js';
import { Collection, properties } from '@eprev/wsngn';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/** @typedef {import('@eprev/wsngn').Document} Document */

/** @typedef {{
 * id: string,
 * type: "page",
 * pathname: string,
 * title: string,
 * posts: Collection<Document>,
 * }} TagPage */

/** @type {import('@eprev/wsngn').PluginFunction}  */
export default async function ({ generate, site, config }) {
  const tagName =
    properties(fs.readFileSync(path.join(__dirname, 'tags.txt'), 'utf8')) ?? {};
  /** @type {Record<string, Document[]>} */
  const tags = {};
  Object.values(site.files).forEach((doc) => {
    if (config.env === 'production' && doc.draft) {
      return;
    }
    if (doc.type == 'post' && Array.isArray(doc.tags)) {
      doc.tags.forEach((tag) => {
        if (!tags[tag]) {
          tags[tag] = [];
        }
        tags[tag].push(doc);
      });
    }
  });
  site.types['tag'] = [];
  for (const tag of Object.keys(tags)) {
    const posts = new Collection(tags[tag]);
    /** @type {TagPage} */
    const page = site.register({
      id: tag, // Used for sorting
      type: 'page', // To make it to sitemap.xml
      pathname: `/tags/${tag}/`,
      title: tagName[tag]
        ? String(tagName[tag])
        : tag[0].toUpperCase() + tag.slice(1),
      posts,
    });
    await generate(`/tags/${tag}/index.html`, page, 'tag');
    site.types['tag'].push(page);
  }
}
