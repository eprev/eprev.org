const path = require('path');
const { execFileSync } = require('child_process');
const { URL } = require('url');
const { highlight } = require('highlight.js');

const escapeChars = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

function escape(str) {
  if (/[&<>"]/.test(str)) {
    return str.replace(/[&<>"]/g, ch => escapeChars[ch]);
  }
  return str;
}

function getImageSize(pathname) {
  const stdout = execFileSync('identify', [
    '-ping',
    '-format',
    '%w %h',
    pathname,
  ]);
  return stdout.toString().split(' ');
}

module.exports = function renderMarkdown(
  tokens,
  { baseUrl = '', baseDir = '' },
) {
  function makeUrl(s) {
    const url = new URL(s, baseUrl);
    return url.toString();
  }
  return tokens
    .map((token, index) => {
      const className = token.className
        ? ` class="${escape(token.className)}"`
        : '';
      switch (token.type) {
        case 'thematic_break':
          return '<hr>';
        case 'text':
          return escape(token.value);
        case 'heading_start':
          // TODO: auto-ids
          return `<h${token.level}${className}>`;
        case 'heading_end':
          return `</h${token.level}>`;
        case 'paragraph_start':
          const nextToken = tokens[index + 1];
          if (
            nextToken.type === 'image' &&
            nextToken.layout &&
            tokens[index + 2].type === 'paragraph_end'
          ) {
            return '';
          } else {
            return `<p${className}>`;
          }
        case 'paragraph_end':
          const prevToken = tokens[index - 1];
          if (
            prevToken.type === 'image' &&
            prevToken.layout &&
            tokens[index - 2].type === 'paragraph_start'
          ) {
            return '';
          } else {
            return `</p>`;
          }
        case 'list_start':
          return token.style === 'ordered'
            ? `<ol${className}>`
            : `<ul${className}>`;
        case 'list_end':
          return token.style === 'ordered' ? '</ol>' : '</ul>';
        case 'list_item_start':
          return '<li>';
        case 'list_item_end':
          return '</li>';
        case 'block_quote_start':
          return `<blockquote${className}>`;
        case 'block_quote_end':
          return '</blockquote>';
        case 'block_code':
          const caption = token.caption;
          let value;
          if (token.lang) {
            value = highlight(token.lang, token.value).value;
          } else {
            value = escape(token.value);
          }
          return (
            `<figure class="highlight${token.className ||
              ''}"><code><div class="scrollable"><pre>` +
            value +
            `</pre></div></code>
              ${caption ? `<figcaption>${escape(caption)}</figcaption>` : ''}
            </figure>`
          );
        case 'em_start':
          return `<em${className}>`;
        case 'em_end':
          return '</em>';
        case 'strong_start':
          return `<strong${className}>`;
        case 'strong_end':
          return '</strong>';
        case 'code':
          return `<code${className}>${escape(token.value)}</code>`;
        case 'link_start':
          return (
            `<a href="${makeUrl(token.href)}"${className}` +
            (token.title ? ` title="${escape(token.title)}"` : '') +
            '>'
          );
        case 'link_end':
          return '</a>';
        case 'image':
          if (token.layout) {
            if (token.layout !== 'responsive') {
              throw new Error('Only responsive layout is supported');
            }
            let { width, height } = token;
            if (!width || !height) {
              [width, height] = getImageSize(path.join(baseDir, token.src));
            }
            const caption = token.title;
            const mod = token.mod;
            const clickable = token.clickable === 'yes';
            return `<figure class="responsive-image${
              mod ? ' responsive-image--' + mod : '"'
            }" style="max-width: ${width}px">
              <div style="padding-bottom: ${(100 * height / width).toFixed(
                2,
              )}%">
              ${clickable ? `<a href="${makeUrl(token.src)}">` : ''}
              <img src="${makeUrl(token.src)}" alt="${escape(token.alt)}"${
              className
            }>
              ${clickable ? `</a>` : ''}
              </div>
              ${caption ? `<figcaption>${escape(caption)}</figcaption>` : ''}
              </figure>`;
          } else {
            return (
              `<img src="${makeUrl(token.src)}" alt="${escape(token.alt)}"${
                className
              }` +
              (token.title ? ` title="${escape(token.title)}"` : '') +
              '>'
            );
          }
        case 'comment':
          return `<!-- ${escape(token.value)} -->`;
        default:
          return `&lt;unimplemented ${token.type}&gt;`;
      }
    })
    .join('');
};
