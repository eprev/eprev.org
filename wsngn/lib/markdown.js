const block = {
  // HTML comments and block attributes (<!--: -->)
  comment: /^<!--:?\s*([\s\S]*?)\s*-->(?:\n+|$)/,
  // --- or * * * or ___
  thematicBreak: /^(?:[*_-] *){2,}[*_-](?:\n+|$)/,
  // # ... or ## ... etc.
  heading: /^(#{1,6}) +(.*?)(?:\n+|$)/,
  // ...    ...
  // === or ---
  underlineHeading: /^([^\n]+)\n([=-]+)(?:\n+|$)/,
  // Indented code can cantain blank lines
  code: /^(?: {4}[^\n]+\n*|\n)+/,
  // ```    ~~~
  // ...    ...
  // ``` or ~~~
  fencedCode: /^([`~]{3}) *([^\n]*)\n([\s\S]*?)\n\1(?:\n+|$)/,
  // > ... (quotes must end with a blank line)
  blockQuote: /^>(?:[^\n]+\n?)+(?:\n+|$)/,
  // ... (paragraphs must end with a blank line)
  paragraph: /^(?:[^\n]+\n?)+(?:\n+|$)/,
  // List item's content needs not be indented (at least by 2 spaces)
  list: /^(([*+-]|[0-9]{1,9}[.)]) +)(?:[^\n]+\n?)(?:(?: {2,}|(?:[*+-]|[0-9]{1,9}[.)]) +)[^\n]+\n?|\n)*(?:\n+|$)/,
};

const inline = {
  // "_..._ ..." or "...*...*..."
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)\b|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/,
  // "__...__ ..." or "...**...**..."
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)\b|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  // `...` or ``...`...``
  code: /^(`+)([\s\S]*?[^`])\1(?!`)/,
  // [...](...) or [...](... '...') where
  //   1) Link text can contain escaped "[" and "]"
  //   2) URL must be encoded and cannot contain spaces
  link: /^!?\[((?:[^\[\]]|\\\[|\\\])+?)\]\(\s*(\S+?)\s*(?:\s+(['"])([\s\S]*?)\3)?\)/,
  // HTML comments and block attributes (<!--: -->)
  comment: /^<!--:?\s*([\s\S]*?)\s*-->/,
  // Matches single special character
  escape: /^\\([\\`*_#=\[\]()+-<])/,
  // Text matches everything till the start of possible inline element
  text: /^[\s\S]+?(?=[_*`[\\<]|$)/,
};

/** @type {(text: string) => string} */
function unescape(text) {
  return text.replace(/&#(\d+|x[0-9A-Fa-f]+);/g, (_, code) => {
    return code.startsWith('x')
      ? String.fromCharCode(parseInt(code.substring(1), 16))
      : String.fromCharCode(code);
  });
}

/** @typedef {{
 *    attrs?: Record<string, string>
 * } & ({
 *   type: "text" | "comment" | "code",
 *   value: string,
 * } | {
 *   type: "block_code_start" | "block_code_end",
 *   lang?: string,
 * } | {
 *   type: "list_start" | "list_end",
 *   style: "bullet" | "ordered",
 * } | {
 *   type: "heading_start" | "heading_end",
 *   level: number,
 * } | {
 *   type: "link_start",
 *   href: string,
 *   title: string,
 * } | {
 *   type: "image",
 *   src: string,
 *   alt: string,
 *   title: string,
 * } | {
 *   type: "thematic_break" | "paragraph_start" | "paragraph_end" | "block_quote_start"
 *       | "block_quote_end" | "list_item_start" | "list_item_end" | "link_end"
 *       | "strong_start" | "strong_end" | "em_start" | "em_end"
 * })} Token */

class Tokenizer {
  /** @param {string} source */
  constructor(source) {
    /** @type {Token[]} */
    this._tokens = [];
    this._blockToken(this._normalize(source));
  }

  get tokens() {
    return this._tokens;
  }

  /** @type {(source: string) => string} */
  _normalize(source) {
    return source
      .replace(/\r\n|\r/g, '\n')
      .replace(/\t/g, '    ')
      .replace(/ +$/gm, '') // trailing spaces (multiline)
      .replace(/^\n*/, ''); // leading new-line characters
  }

  /** @type {(test: (t: Token) => boolean) => [Token | undefined, number]} */
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

  /** @type {(token: Token) => boolean} */
  _isBlock(token) {
    return /^(paragraph|heading|list|block_quote|block_code)_start$/.test(
      token.type,
    );
  }

  _tokenForAttributes() {
    // find the last block token
    const [blockToken, blockIndex] = this._findLast(this._isBlock);
    if (blockToken) {
      // if the found token is a paragraph following another block token,
      // then the token it follows is the target one
      if (blockToken.type === 'paragraph_start' && blockIndex) {
        const tokenBefore = this._tokens[blockIndex - 1];
        if (tokenBefore.type.endsWith('_start')) {
          return tokenBefore;
        }
      }
      return blockToken;
    }
  }

  /** @param {string} text */
  _parseAttributes(text) {
    /** @type {Record<string, string>} */
    const attrs = {};
    const re = /(\w+)\s*=\s*(['"])([\s\S].*?)\2\s*/g;
    let match;
    while ((match = re.exec(text))) {
      const [str, name, quote, value] = match;
      attrs[name] = value;
    }
    return attrs;
  }

  /** @param {string} text */
  _processAttributes(text) {
    const token = this._tokenForAttributes();
    if (token) {
      token.attrs = this._parseAttributes(text);
    }
    // if the current token is a text one, then trim trailing spaces
    // (that are followed by "<!--:")
    const currToken = this._tokens[this._tokens.length - 1];
    if (currToken.type === 'text') {
      currToken.value = currToken.value.trimRight();
      // If it appears to be empty now, delete it completely
      if (currToken.value === '') {
        this._tokens.length--;
      }
    }
  }

  /** @param {string} source */
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
          type: 'block_code_start',
        });
        this._tokens.push({
          type: 'text',
          value: str.replace(/^ {4}/gm, '').trimRight(),
        });
        this._tokens.push({
          type: 'block_code_end',
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = block.fencedCode.exec(source))) {
        const [str, _, lang, text] = match;
        this._tokens.push({
          type: 'block_code_start',
          lang,
        });
        this._tokens.push({
          type: 'text',
          value: text.trimRight(),
        });
        this._tokens.push({
          type: 'block_code_end',
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
        items.forEach((item) => {
          if (item) {
            this._tokens.push({ type: 'list_item_start' });
            const listItemIndex = this._tokens.length - 1;
            this._blockToken(
              item
                .replace(new RegExp('^ {' + indent.length + '}', 'gm'), '')
                .trimRight(),
            );
            // Find how many block tokens the list item contains
            let blockNo = 0;
            for (let i = listItemIndex + 1; i < this._tokens.length; i++) {
              if (this._isBlock(this._tokens[i])) {
                blockNo++;
              }
            }
            // If the list item contains a single paragraph token,
            // then remove the paragraph: <li><p>...</p></li> => <li>...</li>
            if (
              blockNo === 1 &&
              this._tokens[listItemIndex + 1].type === 'paragraph_start'
            ) {
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

  /** @param {string} source */
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
        const [str, textU, textA] = match;
        this._tokens.push({
          type: 'strong_start',
        });
        this._inlineToken(textU || textA);
        this._tokens.push({
          type: 'strong_end',
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = inline.em.exec(source))) {
        const [str, textU, textA] = match;
        this._tokens.push({
          type: 'em_start',
        });
        this._inlineToken(textU || textA);
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

  /** @param {string} value */
  _pushText(value) {
    // Add "BREAK PERMITTED HERE" if the line ends with "\"
    value = value.replace(/\\\n/g, '\u0082');
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

/** @param {string} source */
export default function markdown(source) {
  const tokenizer = new Tokenizer(source);
  return tokenizer.tokens;
}
