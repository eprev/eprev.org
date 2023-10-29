/*---
type: system
pathname: /index.json
---*/

/** @param {string} text */
function vectorize(text) {
  return text
    .replace(/’/g, "'")
    .split(/[^A-Za-z0-9'-]+/)
    .map((t) => t.toLowerCase().replace(/['-]/g, ''))
    .filter((t) => t.length > 1 && !stopWords[t])
    .reduce(
      (m, t) => (m[t] ? m[t]++ : (m[t] = 1), m),
      /** @type {Record<string, number>} */ ({}),
    );
}

import { dateFormat } from '@eprev/wsngn';
import assert from 'assert';

/** @typedef {{
 *   title: string,
 *   url: string,
 *   date: string,
 *   tokens: Record<string, number>
 * }} IndexedDocument
 */

/** @type {import('@eprev/wsngn').TemplateFunction} */
export default async ({ html, stringify, site }) => {
  /** @type {IndexedDocument[]} */
  const documents = site.byType('post').map((post) => {
    assert(post.title);
    assert(post.__source__);
    assert(post.date instanceof Date);
    const text = post.__source__
      .replace(/https?:\/\/[^\s]*/g, '') // Ignore URLs
      .replace(/<!--:[^>]*-->/g, ''); // Ignore markdown attributes

    return {
      title: post.title,
      url: post.pathname,
      date: dateFormat(post.date, '%MM D, YYYY'),
      tokens: vectorize(`${post.title}. ${text}`),
    };
  });
  return html`${stringify(documents)}`;
};

// TODO: Set?
const stopWords =
  `a,able,about,across,after,all,almost,also,am,among,an,and,any,are,as,at,be,because,been,but,by,can,cannot,could,dear,did,do,does,either,else,ever,every,for,from,get,got,had,has,have,he,her,hers,him,his,how,however,i,if,in,into,is,it,its,just,least,let,like,likely,may,me,might,most,must,my,neither,no,nor,not,of,off,often,on,only,or,other,our,own,rather,said,say,says,she,should,since,so,some,than,that,the,their,them,then,there,these,they,this,tis,to,too,twas,us,wants,was,we,were,what,when,where,which,while,who,whom,why,will,with,would,yet,you,your,ain't,aren't,can't,could've,couldn't,didn't,doesn't,don't,hasn't,he'd,he'll,he's,how'd,how'll,how's,i'd,i'll,i'm,i've,isn't,it's,might've,mightn't,must've,mustn't,shan't,she'd,she'll,she's,should've,shouldn't,that'll,that's,there's,they'd,they'll,they're,they've,wasn't,we'd,we'll,we're,weren't,what'd,what's,when'd,when'll,when's,where'd,where'll,where's,who'd,who'll,who's,why'd,why'll,why's,won't,would've,wouldn't,you'd,you'll,you're,you've`
    .split(',')
    .reduce(
      (h, w) => ((h[w] = true), h),
      /** @type {Record<string, true>} */ ({}),
    );
