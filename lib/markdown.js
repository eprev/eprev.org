module.exports = function(text) {
  return text;
};

const block = {
  thematicBreak: /^ {0,3}[*-_][*-_ ]{1,}[*-_] *(\n+|$)/,
  heading: /^ {0,3}(#{1,6}) +(.*?) *(\n+|$)/,
  underlineHeading: /^ {0,3}([^\n]+)\n {0,3}([=-]+) *(\n+|$)/,
  code: /^( {4}[^\n]+\n*)+/,
  fencedCode: /^([`~]{3}) *(\S*) *\n([\s\S]*?) *\1 *(\n+|$)/,
};

const inline = {
  text: /^ *\S+ */
};

class Tokenizer {
  constructor(source) {
    this.tokens = [];
    this._blockToken(source);
  }
  _blockToken(source) {
    while (source) {
      let match;
      if ((match = block.thematicBreak.exec(source))) {
        const [str] = match;
        this.tokens.push({
          type: 'thematic_break',
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = block.heading.exec(source))) {
        const [str, pattern, text] = match;
        const level = pattern.length;
        this.tokens.push({
          type: 'heading_start',
          level,
        });
        this._inlineToken(text);
        this.tokens.push({
          type: 'heading_end',
          level,
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = block.underlineHeading.exec(source))) {
        const [str, text, style] = match;
        const level = style === '=' ? 1 : 2;
        this.tokens.push({
          type: 'heading_start',
          level,
        });
        this._inlineToken(text);
        this.tokens.push({
          type: 'heading_end',
          level,
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = block.code.exec(source))) {
        const [str] = match;
        this.tokens.push({
          type: 'code_start',
        });
        this.tokens.push({
          type: 'text',
          value: str.replace(/^ {4}/gm, '').replace(/\s+$/gm, ''),
        });
        this.tokens.push({
          type: 'code_end',
        });
        source = source.slice(str.length);
        continue;
      }
      if ((match = block.fencedCode.exec(source))) {
        const [str, _, lang, text] = match;
        this.tokens.push({
          type: 'code_start',
          lang,
        });
        this.tokens.push({
          type: 'text',
          value: text.replace(/\s+$/gm, ''),
        });
        this.tokens.push({
          type: 'code_end',
          lang,
        });
        source = source.slice(str.length);
        continue;
      }
      break;
    }
    if (source) {
      throw new Error(`Unexpected token: ${ source }`);
    }
  }
  _inlineToken(source) {
    while (source) {
      let match;
      if ((match = inline.text.exec(source))) {
        const [str] = match;
        this.tokens.push({
          type: 'text',
          value: str,
        });
        source = source.slice(str.length);
        continue;
      }
      break;
    }
    if (source) {
      throw new Error(`Unexpected token: ${ source }`);
    }
  }
}

module.exports.parse = function(source) {
  const tokenizer = new Tokenizer(source);
  return tokenizer.tokens;
};
