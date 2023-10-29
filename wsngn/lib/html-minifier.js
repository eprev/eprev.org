/** @type {(s: string) => string} */
function strip(s) {
  return (
    s
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Trim heading spaces if not in a string literal (scripts)
      .replace(/^\s+(?!['"`])/gm, '')
      // Collapse white-spaces inside paragraphs, figcaption and etc.
      .replace(
        /\s*(<(h\d|p|li|dt|figcaption|button)(?:| [^>]*)>)([\s\S]*?)(<\/\2>)/g,
        (s, opening, tag, content, closing) => {
          return '\n' + opening + content.replace(/\s+/g, ' ') + closing;
        },
      )
  );
}

/** @type {(html: string) => string} */
export default function htmlMinifier(html) {
  // Stretch a tag onto a single line (collapse white-spaces in between)
  html = html.replace(/<[^>]+>/g, (tag) => {
    return tag.replace(/\s+/g, ' ');
  });
  // Strip white-spaces, but keep them between <pre> and </pre>
  let res = '';
  while (html) {
    let start = html.indexOf('<pre');
    if (start !== -1) {
      start += 4;
      res += strip(html.slice(0, start));
      let end = html.indexOf('</pre>', start);
      if (end !== -1) {
        end += 6;
        res += html.slice(start, end);
        html = html.slice(end);
      } else {
        res += html.slice(start);
        break;
      }
    } else {
      res += strip(html);
      break;
    }
  }
  return res;
}
