import fs from 'fs';
import { extname } from 'path';
import mime from './mime.js';
import properties from './properties.js';
/** @typedef {import('./properties.js').Properties} Properties */

const re = /^(?:<!|-|\/\*-)--\s*([\s\S]*?)\s*--(?:-\*\/|-|>)\n*([\s\S]*)$/;

/** @type {(pathame: string) => [Properties, string] | undefined} */
export default function frontMatter(pathname) {
  const ext = extname(pathname);
  const mimeType = mime[ext];
  if (
    /^text|(x|ht)ml$|\+template$/.test(mimeType) ||
    pathname.endsWith('.tmpl.js')
  ) {
    const source = fs.readFileSync(pathname, { encoding: 'utf8' });
    const match = re.exec(source);
    if (match) {
      const [_, fm, content] = match;
      const meta = properties(fm, { transform: true });
      if (!meta) {
        return undefined;
      }
      if (!meta.mime) {
        meta.mime = mimeType;
      }
      return [meta, content];
    }
  }
}
