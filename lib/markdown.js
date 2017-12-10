module.exports = function(text) {
  return render(parse(text));
};

// TODO: table
const block = {
  comment: /^<!--\s*([\s\S]*?)\s*-->(?:\n+|$)/,
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
  text: /^[\s\S]+?(?=[_*`[\\]|$)/,
  link: /^!?\[((?:[^\[\]]|\\\[|\\\])+?)\]\(\s*(\S+)\s*(?:\s+(['"])([\s\S]*?)\3)?\)/,
  escape: /^\\([\\`*_#=\[\]()+-])/,
};

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
  _blockToken(source) {
    while (source) {
      let match;
      if ((match = block.comment.exec(source))) {
        const [str, text] = match;
        this._tokens.push({
          type: 'comment',
          value: text,
        });
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
          type: 'code_block_start',
        });
        this._tokens.push({
          type: 'text',
          value: str.replace(/^ {4}/gm, '').trimRight(),
        });
        this._tokens.push({
          type: 'code_block_end',
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = block.fencedCode.exec(source))) {
        const [str, _, lang, text] = match;
        this._tokens.push({
          type: 'code_block_start',
          lang,
        });
        this._tokens.push({
          type: 'text',
          value: text.trimRight(),
        });
        this._tokens.push({
          type: 'code_block_end',
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
            this._blockToken(
              item
                .replace(new RegExp('^ {' + indent.length + '}', 'gm'), '')
                .trimRight(),
            );
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
            type: 'link_end'
          });
        }
        source = source.slice(str.length);
        continue;
      }
      if ((match = inline.strong.exec(source))) {
        const [str, text1, text2] = match;
        this._tokens.push({
          type: 'strong_start'
        });
        this._inlineToken(text1 || text2);
        this._tokens.push({
          type: 'strong_end'
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = inline.em.exec(source))) {
        const [str, text1, text2 ] = match;
        this._tokens.push({
          type: 'em_start'
        });
        this._inlineToken(text1 || text2);
        this._tokens.push({
          type: 'em_end'
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = inline.code.exec(source))) {
        const [str, _, text ] = match;
        this._tokens.push({
          type: 'code_start'
        });
        this._tokens.push({
          type: 'text',
          value: text.trim(),
        });
        this._tokens.push({
          type: 'code_end'
        });
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
      token.value += value;
    } else {
      this._tokens.push({
        type: 'text',
        value: value,
      });
    }
  }
}

const parse = module.exports.parse = function(source) {
  const tokenizer = new Tokenizer(source);
  return tokenizer.tokens;
};

const render = module.exports.render = function(tokens) {
  return tokens.map(token => {
    switch (token.type) {
      case 'thematic_break':
          return '<hr>';
      case 'text':
          return token.value;
      case 'heading_start':
          // TODO: auto-ids
          return `<h${token.level}>`;
      case 'heading_end':
          return `</h${token.level}>`;
      case 'paragraph_start':
          return '<p>';
      case 'paragraph_end':
          return '</p>';
      case 'list_start':
          return token.style === 'ordered' ? '<ol>' : '<ul>';
      case 'list_end':
          return token.style === 'ordered' ? '</ol>' : '</ul>';
      case 'list_item_start':
          return '<li>';
      case 'list_item_end':
          return '</li>';
      case 'block_quote_start':
          return '<blockquote>';
      case 'block_quote_end':
          return '</blockquote>';
      case 'code_block_start':
          return '<pre><code>';
      case 'code_block_end':
          return '</code></pre>';
      case 'em_start':
          return '<em>';
      case 'em_end':
          return '</em>';
      case 'strong_start':
          return '<strong>';
      case 'strong_end':
          return '</strong>';
      case 'code_start':
          return '<code>';
      case 'code_end':
          return '</code>';
      case 'link_start':
          return `<a href="${token.href}"` + (token.title ? ` title=${token.title}` : '') + '>';
      case 'link_end':
          return '</a>';
      case 'image':
          return `<img src="${token.src}" alt="${token.alt}"` + (token.title ? ` title=${token.title}` : '') + '>';
      case 'comment':
          return '';
      default:
        return `&lt;unimplemented ${token.type}&gt;`;
    }
  }).join('');
};
