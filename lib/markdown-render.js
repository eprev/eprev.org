const path = require('path');
const { execFileSync } = require('child_process');
const { URL } = require('url');
const { highlight } = require('highlight.js');

const memoize = require('./memoize');

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

const getImageSize = memoize(function getImageSize(pathname) {
  const stdout = execFileSync('identify', [
    '-ping',
    '-format',
    '%w %h',
    pathname,
  ]);
  return stdout.toString().split(' ');
});

module.exports = async function renderMarkdown(
  tokens,
  { baseUrl = '', baseDir = '' },
) {
  function makeUrl(s) {
    const url = new URL(s, baseUrl);
    return url.toString();
  }
  let html = '';
  let token;
  let index = 0;
  while ((token = tokens[index])) {
    const className = token.class ? ` class="${escape(token.class)}"` : '';
    switch (token.type) {
      case 'thematic_break':
        html += '<hr>';
        break;
      case 'text':
        html += escape(token.value);
        break;
      case 'heading_start':
        // TODO: auto-ids
        html += `<h${token.level}${className}>`;
        break;
      case 'heading_end':
        html += `</h${token.level}>`;
        break;
      case 'paragraph_start':
        const nextToken = tokens[index + 1];
        if (
          token.layout &&
          nextToken.type === 'image' &&
          tokens[index + 2].type === 'paragraph_end'
        ) {
          const imageToken = nextToken;
          if (token.layout !== 'responsive') {
            throw new Error('Only responsive layout is supported');
          }
          const clickable = token.clickable === 'yes';
          let { width, height } = token;
          if (!width || !height) {
            [width, height] = getImageSize(path.join(baseDir, imageToken.src));
          }
          html += `<figure
              class="responsive-image${
                token.class ? ' ' + escape(token.class) : ''
              }"
              style="max-width: ${width}px"
            >
            <div style="padding-bottom: ${(100 * height / width).toFixed(2)}%">
            ${clickable ? `<a href="${makeUrl(imageToken.src)}">` : ''}
            <img
              src="${makeUrl(imageToken.src)}"
              alt="${escape(imageToken.alt)}"
            >
            ${clickable ? `</a>` : ''}
            </div>
            ${
              imageToken.title
                ? `<figcaption>${escape(imageToken.title)}</figcaption>`
                : ''
            }
            </figure>`;
          index += 2; // image, paragraph_end
        } else {
          html += `<p${className}>`;
        }
        break;
      case 'paragraph_end':
        html += `</p>`;
        break;
      case 'list_start':
        html +=
          token.style === 'ordered' ? `<ol${className}>` : `<ul${className}>`;
        break;
      case 'list_end':
        html += token.style === 'ordered' ? '</ol>' : '</ul>';
        break;
      case 'list_item_start':
        html += '<li>';
        break;
      case 'list_item_end':
        html += '</li>';
        break;
      case 'block_quote_start':
        html += `<blockquote${className}>`;
        break;
      case 'block_quote_end':
        html += '</blockquote>';
        break;
      case 'block_code_start':
        const textToken = tokens[index + 1];
        let value;
        if (token.lang) {
          value = highlight(token.lang, textToken.value).value;
        } else {
          value = escape(textToken.value);
        }
        html +=
          `<figure class="highlight${
            token.class ? ' ' + escape(token.class) : ''
          }"><code><div class="scrollable"><pre>` +
          value +
          `</pre></div></code>
          ${
            token.caption
              ? `<figcaption>${escape(token.caption)}</figcaption>`
              : ''
          }
          </figure>`;
        index += 2; // text, block_code_end
        break;
      case 'em_start':
        html += `<em${className}>`;
        break;
      case 'em_end':
        html += '</em>';
        break;
      case 'strong_start':
        html += `<strong${className}>`;
        break;
      case 'strong_end':
        html += '</strong>';
        break;
      case 'code':
        html += `<code${className}>${escape(token.value)}</code>`;
        break;
      case 'link_start':
        html +=
          `<a href="${makeUrl(token.href)}"${className}` +
          (token.title ? ` title="${escape(token.title)}"` : '') +
          '>';
        break;
      case 'link_end':
        html += '</a>';
        break;
      case 'image':
        html +=
          `<img src="${makeUrl(token.src)}" alt="${escape(token.alt)}"${
            className
          }` +
          (token.title ? ` title="${escape(token.title)}"` : '') +
          '>';
        break;
      case 'comment':
        html += `<!-- ${escape(token.value)} -->`;
        break;
      default:
        html += `&lt;unimplemented ${token.type}&gt;`;
    }
    index++;
  }
  return html;
};
