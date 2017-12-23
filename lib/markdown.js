const { highlight } = require('highlight.js');

module.exports = function(text, options) {
  let tokens = parse(text);
  const meta = {};
  const headingStartIndex = tokens.findIndex(t => t.type === 'heading_start');
  if (headingStartIndex >= 0) {
    const headingToken = tokens[headingStartIndex + 1];
    if (headingToken.type === 'text') {
      meta.title = headingToken.value;
      const headingEndIndex = tokens.findIndex(t => t.type === 'heading_end');
      tokens = tokens.slice(headingEndIndex + 1);
    }
  }
  return { content: render(tokens, options), meta };
};

// TODO: table
const block = {
  comment: /^<!--:?\s*([\s\S]*?)\s*-->(?:\n+|$)/,
  thematicBreak: /^(?:[*-_] *){2,}[*-_](?:\n+|$)/,
  heading: /^(#{1,6}) +(.*?)(?:\n+|$)/,
  underlineHeading: /^([^\n]+)\n([=-]+)(?:\n+|$)/,
  code: /^(?: {4}[^\n]+\n*)+/,
  fencedCode: /^([`~]{3}) *([^\n]*)\n([\s\S]*?)\n\1(?:\n+|$)/,
  blockQuote: /^>(?:[^\n]+\n?)+(?:\n+|$)/,
  paragraph: /^(?:[^\n]+\n?)+(?:\n+|$)/,
  list: /^(([*+-]|[0-9]{1,9}[.)]) +)(?:[^\n]+\n?)(?:(?: {2,}|(?:[*+-]|[0-9]{1,9}[.)]) +)[^\n]+\n?|\n)*(?:\n+|$)/,
};

const inline = {
  em: /^\b_(?=\S)([\s\S]*?\S)_(?!_)\b|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/,
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)\b|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  code: /^(`+)([\s\S]*?[^`])\1(?!`)/,
  text: /^[\s\S]+?(?=[_*`[\\<]|$)/,
  link: /^!?\[((?:[^\[\]]|\\\[|\\\])+?)\]\(\s*(\S+?)\s*(?:\s+(['"])([\s\S]*?)\3)?\)/,
  comment: /^<!--:?\s*([\s\S]*?)\s*-->/,
  escape: /^\\([\\`*_#=\[\]()+-<])/,
};

function unescape(text) {
  return text.replace(/&#(\d+|x[0-9A-Fa-f]+);/g, (_, code) => {
    return code.startsWith('x')
      ? String.fromCharCode(parseInt(code.subst(1), 16))
      : String.fromCharCode(code);
  });
}

class Tokenizer {
  constructor(source) {
    this._tokens = [];
    this._blockToken(this._normalize(source));
  }
  get tokens() {
    return this._tokens;
  }
  _normalize(source) {
    return source
      .replace(/\r\n|\r/g, '\n')
      .replace(/\t/g, '    ')
      .replace(/ +$/gm, '')
      .replace(/^\n*/, '');
  }
  _findLast(test) {
    let index = this._tokens.length - 1;
    while (index >= 0) {
      const token = this._tokens[index];
      if (test(token)) {
        return [token, index];
      }
      index--;
    }
    return [undefined, -1];
  }
  _tokenForAttributes() {
    if (this._tokens.length) {
      const currToken = this._tokens[this._tokens.length - 1];
      if (currToken.type.endsWith('_end')) {
        const tokenType = currToken.type.slice(0, -4);
        const [startToken, startIndex] = this._findLast(
          token => token.type == tokenType + '_start',
        );
        return startToken;
      } else {
        const [expectedToken, expectedIndex] = this._findLast(
          token => token.type !== 'text',
        );
        if (
          expectedToken &&
          expectedToken.type === 'paragraph_start' &&
          expectedIndex
        ) {
          const tokenBefore = this._tokens[expectedIndex - 1];
          if (tokenBefore.type.endsWith('_start')) {
            return tokenBefore;
          }
        }
        return expectedToken;
      }
    }
  }
  _parseAttributes(text) {
    const attrs = {};
    const classNames = [];
    let match;
    while (text) {
      if ((match = /^\.(\S+)\s*/.exec(text))) {
        const [str, className] = match;
        classNames.push(className);
        text = text.substr(str.length);
        continue;
      }
      if ((match = /^(\w+)\s*=\s*(['"])([\s\S].*?)\2\s*/.exec(text))) {
        const [str, name, quote, value] = match;
        attrs[name] = value;
        text = text.substr(str.length);
        continue;
      }
      break;
    }
    if (classNames.length) {
      attrs.className = classNames.join(' ');
    }
    return attrs;
  }
  _processAttributes(text) {
    const token = this._tokenForAttributes();
    if (token) {
      const attrs = this._parseAttributes(text);
      Object.assign(token, attrs);
    }
  }
  _blockToken(source) {
    while (source) {
      let match;
      if ((match = block.comment.exec(source))) {
        const [str, text] = match;
        if (str.startsWith('<!--:')) {
          this._processAttributes(text);
        } else {
          this._tokens.push({
            type: 'comment',
            value: text,
          });
        }
        source = source.slice(str.length);
        continue;
      }
      if ((match = block.thematicBreak.exec(source))) {
        const [str] = match;
        this._tokens.push({
          type: 'thematic_break',
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = block.heading.exec(source))) {
        const [str, pattern, text] = match;
        const level = pattern.length;
        this._tokens.push({
          type: 'heading_start',
          level,
        });
        this._inlineToken(text);
        this._tokens.push({
          type: 'heading_end',
          level,
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = block.underlineHeading.exec(source))) {
        const [str, text, style] = match;
        const level = style === '=' ? 1 : 2;
        this._tokens.push({
          type: 'heading_start',
          level,
        });
        this._inlineToken(text);
        this._tokens.push({
          type: 'heading_end',
          level,
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = block.code.exec(source))) {
        const [str] = match;
        this._tokens.push({
          type: 'block_code',
          value: str.replace(/^ {4}/gm, '').trimRight(),
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = block.fencedCode.exec(source))) {
        const [str, _, lang, text] = match;
        this._tokens.push({
          type: 'block_code',
          lang,
          value: text.trimRight(),
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = block.blockQuote.exec(source))) {
        const [str] = match;
        this._tokens.push({
          type: 'block_quote_start',
        });
        this._blockToken(str.replace(/^> */gm, '').trimRight());
        this._tokens.push({
          type: 'block_quote_end',
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = block.list.exec(source))) {
        const [str, indent, marker] = match;
        const style = ['*', '-', '+'].includes(marker) ? 'bullet' : 'ordered';
        this._tokens.push({
          type: 'list_start',
          style,
        });
        const items = str.split(
          style === 'bullet' ? /^[*+-]\s*/gm : /^[0-9]{1,9}[.)]\s*/gm,
        );
        items.forEach(item => {
          if (item) {
            this._tokens.push({ type: 'list_item_start' });
            const listItemIndex = this._tokens.length - 1;
            this._blockToken(
              item
                .replace(new RegExp('^ {' + indent.length + '}', 'gm'), '')
                .trimRight(),
            );
            let blockNo = 0;
            for (let i = listItemIndex + 1; i < this._tokens.length; i++) {
              if (
                /(paragraph|heading|list|block_quote)_start|block_(code|image)/.test(
                  this._tokens[i].type,
                )
              ) {
                blockNo++;
              }
            }
            if (blockNo === 1) {
              this._tokens.splice(listItemIndex + 1, 1);
              this._tokens.length--;
            }
            this._tokens.push({ type: 'list_item_end' });
          }
        });
        this._tokens.push({
          type: 'list_end',
          style,
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = block.paragraph.exec(source))) {
        const [str] = match;
        this._tokens.push({
          type: 'paragraph_start',
        });
        this._inlineToken(str.replace(/^ +/gm, '').trimRight());
        this._tokens.push({
          type: 'paragraph_end',
        });
        source = source.slice(str.length);
        continue;
      }
      break;
    }
    if (source) {
      throw new Error(`Unexpected token: ${source}`);
    }
  }
  _inlineToken(source) {
    while (source) {
      let match;
      if ((match = inline.escape.exec(source))) {
        const [str, text] = match;
        this._pushText(text);
        source = source.slice(str.length);
        continue;
      }
      if ((match = inline.link.exec(source))) {
        const [str, text, url, _, title = ''] = match;
        if (str.startsWith('!')) {
          this._tokens.push({
            type: 'image',
            src: url,
            alt: text,
            title,
          });
        } else {
          this._tokens.push({
            type: 'link_start',
            href: url,
            title,
          });
          this._inlineToken(text);
          this._tokens.push({
            type: 'link_end',
          });
        }
        source = source.slice(str.length);
        continue;
      }
      if ((match = inline.strong.exec(source))) {
        const [str, text1, text2] = match;
        this._tokens.push({
          type: 'strong_start',
        });
        this._inlineToken(text1 || text2);
        this._tokens.push({
          type: 'strong_end',
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = inline.em.exec(source))) {
        const [str, text1, text2] = match;
        this._tokens.push({
          type: 'em_start',
        });
        this._inlineToken(text1 || text2);
        this._tokens.push({
          type: 'em_end',
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = inline.code.exec(source))) {
        const [str, _, text] = match;
        this._tokens.push({
          type: 'code',
          value: text.trim(),
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = inline.comment.exec(source))) {
        const [str, text] = match;
        if (str.startsWith('<!--:')) {
          this._processAttributes(text);
        } else {
          this._tokens.push({
            type: 'comment',
            value: text,
          });
        }
        source = source.slice(str.length);
        continue;
      }
      if ((match = inline.text.exec(source))) {
        const [str] = match;
        const token = this._tokens[this._tokens.length - 1];
        this._pushText(str);
        source = source.slice(str.length);
        continue;
      }
      break;
    }
    if (source) {
      throw new Error(`Unexpected token: ${source}`);
    }
  }
  _pushText(value) {
    const token = this._tokens[this._tokens.length - 1];
    if (token.type === 'text') {
      token.value += unescape(value);
    } else {
      this._tokens.push({
        type: 'text',
        value: unescape(value),
      });
    }
  }
}

const parse = (module.exports.parse = function(source) {
  const tokenizer = new Tokenizer(source);
  return tokenizer.tokens;
});

const { URL } = require('url');

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

const path = require('path');
const { execFileSync } = require('child_process');

function getImageSize(pathname) {
  const stdout = execFileSync('identify', [
    '-ping',
    '-format',
    '%w %h',
    pathname,
  ]);
  return stdout.toString().split(' ');
}

const render = (module.exports.render = function(
  tokens,
  { baseUrl = '', baseDir = '' },
) {
  function makeUrl(s) {
    const url = new URL(s, baseUrl);
    return url.toString();
  }
  return tokens
    .map((token, index) => {
      const className = token.className ? ` class="${escape(token.className)}"` : '';
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
          if (nextToken.type === 'image' && nextToken.layout && tokens[index + 2].type === 'paragraph_end') {
            return '';
          } else {
            return `<p${className}>`;
          }
        case 'paragraph_end':
          const prevToken = tokens[index - 1];
          if (prevToken.type === 'image' && prevToken.layout && tokens[index - 2].type === 'paragraph_start') {
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
            `</pre></div></code></figure>`
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
              <img src="${makeUrl(token.src)}" alt="${escape(token.alt)}"${className}>
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
});
