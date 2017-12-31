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
    const [prevToken, prevIndex] = this._findLast(
      token => token.type !== 'text',
    );
    if (prevToken) {
      if (prevToken.type.endsWith('_end')) {
        const tokenType = prevToken.type.slice(0, -4);
        const [startToken, startIndex] = this._findLast(
          token => token.type == tokenType + '_start',
        );
        return startToken;
      } else {
        if (prevToken.type === 'paragraph_start' && prevIndex) {
          const tokenBefore = this._tokens[prevIndex - 1];
          if (tokenBefore.type.endsWith('_start')) {
            return tokenBefore;
          }
        } else {
          return prevToken;
        }
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
    const currToken = this._tokens[this._tokens.length - 1];
    if (currToken.type === 'text') {
      // if the current token is a text one, then trim trailing spaces
      // (that are followed by "<!--:")
      currToken.value = currToken.value.trimRight();
      if (currToken.value === '') {
        // If it appears to be empty now, delete it completely
        this._tokens.length--;
      }
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
            // TODO: refactor this
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

module.exports = function markdown(source) {
  const tokenizer = new Tokenizer(source);
  return tokenizer.tokens;
};
