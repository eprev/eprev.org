module.exports = function(text) {
  return text;
};

const block = {
  thematicBreak: /^[*-_][*-_ ]{1,}[*-_](?:\n+|$)/,
  heading: /^(#{1,6}) +(.*?)(?:\n+|$)/,
  underlineHeading: /^([^\n]+)\n([=-]+)(?:\n+|$)/,
  code: /^(?: {4}[^\n]*\n*)+/,
  fencedCode: /^([`~]{3}) *([^\n]*)\n([\s\S]*?)\1(?:\n+|$)/,
  blockQuote: /^>(?:[^\n]+\n?)+(?:\n+|$)/,
  paragraph: /^(?:[^\n]+\n?)+(?:\n+|$)/, // TODO: skip empty lines
  list: /^(([*+-]|[0-9][.)]) +)(?:[^\n]+\n?)/, // first line
  // bulletList: /^([*+-]) +(?:[^\n]+\n?)(?:(?: {2}|\1 +)[^\n]+\n?| *\n)*(?:\n+|$)/,
};

// const inline = {
//   text: /^ *\S+ */,
// };

class Tokenizer {
  constructor(source) {
    this._tokens = [];
    this._blockToken(
      source.replace(/ +$/gm, '')
    );
  }
  get tokens() {
    return this._tokens;
  }
  _blockToken(source) {
    while (source) {
      let match;
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
          type: 'code_start',
        });
        this._tokens.push({
          type: 'text',
          value: str.replace(/^ {4}/gm, '').trimRight(),
        });
        this._tokens.push({
          type: 'code_end',
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = block.fencedCode.exec(source))) {
        const [str, _, lang, text] = match;
        this._tokens.push({
          type: 'code_start',
          lang,
        });
        this._tokens.push({
          type: 'text',
          value: text.trimRight(),
        });
        this._tokens.push({
          type: 'code_end',
          lang,
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = block.blockQuote.exec(source))) {
        const [str] = match;
        this._tokens.push({
          type: 'block_quote_start',
        });
        this._blockToken(
          str.replace(/^ {0,3}> */gm, '').trimRight()
        );
        this._tokens.push({
          type: 'block_quote_end',
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = block.list.exec(source))) {
        // console.log(match);
        const [str, indent, marker] = match;
        const style = ['*', '-', '+'].includes(marker) ? 'bullet': 'ordered';
        this._tokens.push({
          type: 'list_start',
          style,
        });
        const re = new RegExp('^' +
          '(?:' + // match line:
            '(?:' + // non blank:
              '(?:[*+-]|[0-9][.)]) +' + // line starts with a list marker followed by any numer of spaces
              '|' +
              ' {' + indent.length + '}' + // or line is indented as much as the text in the first item
            ')' +
            '[^ ][^\\n]*\\n?' +
            '|' +
            ' *\\n?' + // blank
          ')+' +
          '(?:\\n+|$)'
        );
        console.log(re.source, match);
        const [ gstr ] = match;
        const items = gstr.split(/\s*[*+-]|[0-9][.)]\s*/g);
        // console.log(items);
        items.forEach(item => {
          if (item) {
            this._tokens.push({type: 'list_item_start'});
            this._blockToken(
              item.replace(/^ {1,2}/gm, '').trimRight()
            );
            this._tokens.push({type: 'list_item_end'});
          }
        });
        this._tokens.push({
          type: 'list_end',
          style,
        });
        source = source.slice(gstr.length);
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
    this._tokens.push({
      type: 'text',
      value: source,
    });
    // while (source) {
    //   let match;
    //   if ((match = inline.text.exec(source))) {
    //     const [str] = match;
    //     this._tokens.push({
    //       type: 'text',
    //       value: str,
    //     });
    //     source = source.slice(str.length);
    //     continue;
    //   }
    //   break;
    // }
    // if (source) {
    //   throw new Error(`Unexpected token: ${source}`);
    // }
  }
}

module.exports.parse = function(source) {
  const tokenizer = new Tokenizer(source);
  return tokenizer.tokens;
};