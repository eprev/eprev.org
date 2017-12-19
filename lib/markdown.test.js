const describe = require('./describe');

describe(`markdown`, it => {
  const parse = require('./markdown').parse;

  describe(`comment`, it => {
    it(`treat HTML comment as regular comment`, assert => {
      assert.deepEqual(parse('<!-- comment -->'), [{ type: 'comment', value: 'comment' }]);
    });
  });

  describe(`thematic break`, it => {
    it(`require minimum three characters`, assert => {
      assert.deepEqual(parse('***'), [{ type: 'thematic_break' }]);
      assert.deepEqual(parse('---'), [{ type: 'thematic_break' }]);
      assert.deepEqual(parse('___'), [{ type: 'thematic_break' }]);
    });
    it(`allow more than three characters`, assert => {
      assert.deepEqual(parse('*****'), [{ type: 'thematic_break' }]);
    });
    it(`allow spaces between haracters and at the end`, assert => {
      assert.deepEqual(parse('* * * '), [{ type: 'thematic_break' }]);
    });
  });

  describe(`heading`, it => {
    it(`require up to six # characters`, assert => {
      assert.deepEqual(parse('# Header'), [
        {
          type: 'heading_start',
          level: 1,
        },
        { type: 'text', value: 'Header' },
        {
          type: 'heading_end',
          level: 1,
        },
      ]);
      assert.deepEqual(parse('## Header'), [
        {
          type: 'heading_start',
          level: 2,
        },
        { type: 'text', value: 'Header' },
        {
          type: 'heading_end',
          level: 2,
        },
      ]);
      assert.deepEqual(parse('### Header'), [
        {
          type: 'heading_start',
          level: 3,
        },
        { type: 'text', value: 'Header' },
        {
          type: 'heading_end',
          level: 3,
        },
      ]);
      assert.deepEqual(parse('#### Header'), [
        {
          type: 'heading_start',
          level: 4,
        },
        { type: 'text', value: 'Header' },
        {
          type: 'heading_end',
          level: 4,
        },
      ]);
      assert.deepEqual(parse('##### Header'), [
        {
          type: 'heading_start',
          level: 5,
        },
        { type: 'text', value: 'Header' },
        {
          type: 'heading_end',
          level: 5,
        },
      ]);
      assert.deepEqual(parse('###### Header'), [
        {
          type: 'heading_start',
          level: 6,
        },
        { type: 'text', value: 'Header' },
        {
          type: 'heading_end',
          level: 6,
        },
      ]);
    });
    it(`ignore spaces in between and at the end`, assert => {
      assert.deepEqual(parse('#  Header '), [
        {
          type: 'heading_start',
          level: 1,
        },
        { type: 'text', value: 'Header' },
        {
          type: 'heading_end',
          level: 1,
        },
      ]);
    });
  });

  describe(`underline heading`, it => {
    it(`require at least one "underline" character`, assert => {
      assert.deepEqual(parse('Header\n='), [
        {
          type: 'heading_start',
          level: 1,
        },
        { type: 'text', value: 'Header' },
        {
          type: 'heading_end',
          level: 1,
        },
      ]);
      assert.deepEqual(parse('Header\n-'), [
        {
          type: 'heading_start',
          level: 2,
        },
        { type: 'text', value: 'Header' },
        {
          type: 'heading_end',
          level: 2,
        },
      ]);
    });
    it(`allow longer underline`, assert => {
      assert.deepEqual(parse('Header\n-------'), [
        {
          type: 'heading_start',
          level: 2,
        },
        { type: 'text', value: 'Header' },
        {
          type: 'heading_end',
          level: 2,
        },
      ]);
    });
    it(`is not a block element`, assert => {
      assert.deepEqual(parse('---\n---'), [
        { type: 'thematic_break' },
        { type: 'thematic_break' },
      ]);
    });
  });

  describe(`code`, it => {
    it(`except 4 space indent and can contain blank lines`, assert => {
      assert.deepEqual(parse('    foo();\n\n    bar();\n'), [
        { type: 'block_code', value: 'foo();\n\nbar();' },
      ]);
    });
  });

  describe(`fenced code`, it => {
    it('treat three ` characters as code marker', assert => {
      assert.deepEqual(parse('```\nfoo();\n\nbar();\n```'), [
        { type: 'block_code', lang: '', value: 'foo();\n\nbar();' },
      ]);
    });
    it('allow language identifier', assert => {
      assert.deepEqual(parse('```js\nfoo();\n```'), [
        { type: 'block_code', lang: 'js', value: 'foo();' },
      ]);
    });
  });

  describe(`paragraph`, it => {
    it(`can contain multiple lines, but no blank lines`, assert => {
      assert.deepEqual(parse('foo\nbar\n'), [
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo\nbar' },
        { type: 'paragraph_end' },
      ]);
      assert.deepEqual(parse('foo\n\nbar\n'), [
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'bar' },
        { type: 'paragraph_end' },
      ]);
    });
  });

  describe(`block quote`, it => {
    it(`treat > as quote marker`, assert => {
      assert.deepEqual(parse('> foo\n> bar\n'), [
        { type: 'block_quote_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo\nbar' },
        { type: 'paragraph_end' },
        { type: 'block_quote_end' },
      ]);
    });
    it(`can contain other blocks`, assert => {
      assert.deepEqual(parse('> # Header\n> Text.\n'), [
        { type: 'block_quote_start' },
        { type: 'heading_start', level: 1 },
        { type: 'text', value: 'Header' },
        { type: 'heading_end', level: 1 },
        { type: 'paragraph_start' },
        { type: 'text', value: 'Text.' },
        { type: 'paragraph_end' },
        { type: 'block_quote_end' },
      ]);
      assert.deepEqual(parse('> > inner\n>\n> outer\n'), [
        { type: 'block_quote_start' },
        { type: 'block_quote_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'inner' },
        { type: 'paragraph_end' },
        { type: 'block_quote_end' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'outer' },
        { type: 'paragraph_end' },
        { type: 'block_quote_end' },
      ]);
    });
    it(`contain continuation lines`, assert => {
      assert.deepEqual(parse('> foo\nbar\n'), [
        { type: 'block_quote_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo\nbar' },
        { type: 'paragraph_end' },
        { type: 'block_quote_end' },
      ]);
      assert.deepEqual(parse('> foo\nbar\n> qux'), [
        { type: 'block_quote_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo\nbar\nqux' },
        { type: 'paragraph_end' },
        { type: 'block_quote_end' },
      ]);
    });
  });
  describe(`bullet list`, it => {
    it(`can contain a single item`, assert => {
      assert.deepEqual(parse('- foo'), [
        { type: 'list_start', style: 'bullet' },
        { type: 'list_item_start' },
        { type: 'text', value: 'foo' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'bullet' },
      ]);
    });
    it(`treat *, + or - as bullet marker`, assert => {
      assert.deepEqual(parse('- foo\n\n  + bar\n\n* qux'), [
        { type: 'list_start', style: 'bullet' }, // - foo
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'list_start', style: 'bullet' }, // ..+ bar
        { type: 'list_item_start' },
        { type: 'text', value: 'bar' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'bullet' },
        { type: 'list_item_end' },
        { type: 'list_item_start' }, // - qux
        { type: 'text', value: 'qux' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'bullet' },
      ]);
    });
    it(`may contain blocks separated by more than one blank line`, assert => {
      assert.deepEqual(parse('- foo\n  bar\n\n- qux\n\nquz'), [
        { type: 'list_start', style: 'bullet' },
        { type: 'list_item_start' },
        { type: 'text', value: 'foo\nbar' },
        { type: 'list_item_end' },
        { type: 'list_item_start' },
        { type: 'text', value: 'qux' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'bullet' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'quz' },
        { type: 'paragraph_end' },
      ]);
    });
    it(`can be terminated by a unindented block`, assert => {
      assert.deepEqual(parse('+ foo\n\n    bar();\n'), [
        { type: 'list_start', style: 'bullet' },
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'bar();' },
        { type: 'paragraph_end' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'bullet' },
      ]);
      assert.deepEqual(parse('+ foo\n\n```\nbar();\n```\n'), [
        { type: 'list_start', style: 'bullet' },
        { type: 'list_item_start' },
        { type: 'text', value: 'foo' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'bullet' },
        { type: 'block_code', lang: '', value: 'bar();' },
      ]);
    });
    it(`may contain other blocks`, assert => {
      assert.deepEqual(parse('+ foo\n\n  ```\n  bar();\n  ```'), [
        { type: 'list_start', style: 'bullet' },
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'block_code', lang: '', value: 'bar();' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'bullet' },
      ]);
      assert.deepEqual(parse('+ foo\n\n  ```\n    bar();\n  ```'), [
        { type: 'list_start', style: 'bullet' },
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'block_code', lang: '', value: '  bar();' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'bullet' },
      ]);
    });
  });
  describe(`ordered list`, it => {
    it(`can contain a single item`, assert => {
      assert.deepEqual(parse('1. foo'), [
        { type: 'list_start', style: 'ordered' },
        { type: 'list_item_start' },
        { type: 'text', value: 'foo' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'ordered' },
      ]);
    });
    it(`treat a number followed by . or ) as bullet marker`, assert => {
      assert.deepEqual(parse('1. foo\n\n   1) bar\n\n2. qux'), [
        { type: 'list_start', style: 'ordered' }, // 1. foo
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'list_start', style: 'ordered' }, // ..1) bar
        { type: 'list_item_start' },
        { type: 'text', value: 'bar' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'ordered' },
        { type: 'list_item_end' },
        { type: 'list_item_start' }, // 2. qux
        { type: 'text', value: 'qux' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'ordered' },
      ]);
    });
    it(`may contain blocks separated by more than one blank line`, assert => {
      assert.deepEqual(parse('1. foo\n   bar\n\n2. qux\n\nquz'), [
        { type: 'list_start', style: 'ordered' },
        { type: 'list_item_start' },
        { type: 'text', value: 'foo\nbar' },
        { type: 'list_item_end' },
        { type: 'list_item_start' },
        { type: 'text', value: 'qux' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'ordered' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'quz' },
        { type: 'paragraph_end' },
      ]);
    });
    it(`can be terminated by a unindented block`, assert => {
      assert.deepEqual(parse('1. foo\n\n    bar();\n'), [
        { type: 'list_start', style: 'ordered' },
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'bar();' },
        { type: 'paragraph_end' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'ordered' },
      ]);
      assert.deepEqual(parse('10. foo\n\n```\nbar();\n```\n'), [
        { type: 'list_start', style: 'ordered' },
        { type: 'list_item_start' },
        { type: 'text', value: 'foo' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'ordered' },
        { type: 'block_code', lang: '', value: 'bar();' },
      ]);
    });
    it(`may contain other blocks`, assert => {
      assert.deepEqual(parse('1. foo\n\n   ```\n   bar();\n   ```'), [
        { type: 'list_start', style: 'ordered' },
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'block_code', lang: '', value: 'bar();' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'ordered' },
      ]);
      assert.deepEqual(parse('1. foo\n\n   ```\n     bar();\n   ```'), [
        { type: 'list_start', style: 'ordered' },
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'block_code', lang: '', value: '  bar();' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'ordered' },
      ]);
    });
  });

  describe(`inline emphasis`, it => {
    it(`treat * and _ as indicators of emphasis`, assert => {
      assert.deepEqual(parse('foo _bar_ quz'), [
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo ' },
        { type: 'em_start' },
        { type: 'text', value: 'bar' },
        { type: 'em_end' },
        { type: 'text', value: ' quz' },
        { type: 'paragraph_end' },
      ]);
      assert.deepEqual(parse('foo *bar* quz'), [
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo ' },
        { type: 'em_start' },
        { type: 'text', value: 'bar' },
        { type: 'em_end' },
        { type: 'text', value: ' quz' },
        { type: 'paragraph_end' },
      ]);
    });
    it(`do not allow _ inside words`, assert => {
      assert.deepEqual(parse('**foo_bar_quz**'), [
        { type: 'paragraph_start' },
        { type: 'strong_start' },
        { type: 'text', value: 'foo_bar_quz' },
        { type: 'strong_end' },
        { type: 'paragraph_end' },
      ]);
    });
    it(`allow * inside words`, assert => {
      assert.deepEqual(parse('__foo*bar*quz__'), [
        { type: 'paragraph_start' },
        { type: 'strong_start' },
        { type: 'text', value: 'foo' },
        { type: 'em_start' },
        { type: 'text', value: 'bar' },
        { type: 'em_end' },
        { type: 'text', value: 'quz' },
        { type: 'strong_end' },
        { type: 'paragraph_end' },
      ]);
    });
  });
  describe(`inline strong emphasis`, it => {
    it(`treat ** and __ as indicators of strong emphasis`, assert => {
      assert.deepEqual(parse('foo __bar__ quz'), [
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo ' },
        { type: 'strong_start' },
        { type: 'text', value: 'bar' },
        { type: 'strong_end' },
        { type: 'text', value: ' quz' },
        { type: 'paragraph_end' },
      ]);
      assert.deepEqual(parse('foo **bar** quz'), [
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo ' },
        { type: 'strong_start' },
        { type: 'text', value: 'bar' },
        { type: 'strong_end' },
        { type: 'text', value: ' quz' },
        { type: 'paragraph_end' },
      ]);
    });
    it(`do not allow __ inside words`, assert => {
      assert.deepEqual(parse('*foo__bar__quz*'), [
        { type: 'paragraph_start' },
        { type: 'em_start' },
        { type: 'text', value: 'foo__bar__quz' },
        { type: 'em_end' },
        { type: 'paragraph_end' },
      ]);
    });
    it(`allow ** inside words`, assert => {
      assert.deepEqual(parse('_foo**bar**quz_'), [
        { type: 'paragraph_start' },
        { type: 'em_start' },
        { type: 'text', value: 'foo' },
        { type: 'strong_start' },
        { type: 'text', value: 'bar' },
        { type: 'strong_end' },
        { type: 'text', value: 'quz' },
        { type: 'em_end' },
        { type: 'paragraph_end' },
      ]);
    });
  });
  describe(`inline code`, it => {
    it('treat one or more backticks as indicator of code span', assert => {
      assert.deepEqual(parse('foo ` bar ` quz'), [
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo ' },
        { type: 'code', value: 'bar' },
        { type: 'text', value: ' quz' },
        { type: 'paragraph_end' },
      ]);
      assert.deepEqual(parse('`` ` ``'), [
        { type: 'paragraph_start' },
        { type: 'code', value: '`' },
        { type: 'paragraph_end' },
      ]);
      assert.deepEqual(parse('` `` `'), [
        { type: 'paragraph_start' },
        { type: 'code', value: '``' },
        { type: 'paragraph_end' },
      ]);
    });
  });
  describe(`link`, it => {
    it('expect text, url and title', assert => {
      assert.deepEqual(parse('[text](url "title")'), [
        { type: 'paragraph_start' },
        { type: 'link_start', href: 'url', title: 'title' },
        { type: 'text', value: 'text' },
        { type: 'link_end' },
        { type: 'paragraph_end' },
      ]);
      assert.deepEqual(parse('Check [this](http://www.example.com) out'), [
        { type: 'paragraph_start' },
        { type: 'text', value: 'Check ' },
        { type: 'link_start', href: 'http://www.example.com', title: '' },
        { type: 'text', value: 'this' },
        { type: 'link_end' },
        { type: 'text', value: ' out' },
        { type: 'paragraph_end' },
      ]);
    });
    it('cannot contain spaces in destination', assert => {
      assert.deepEqual(parse('[text](example .com)'), [
        { type: 'paragraph_start' },
        { type: 'text', value: '[text](example .com)' },
        { type: 'paragraph_end' },
      ]);
    });
    it('allow inline spans inside text', assert => {
      assert.deepEqual(parse('[foo*bar*quz](url)'), [
        { type: 'paragraph_start' },
        { type: 'link_start', href: 'url', title: '' },
        { type: 'text', value: 'foo' },
        { type: 'em_start' },
        { type: 'text', value: 'bar' },
        { type: 'em_end' },
        { type: 'text', value: 'quz' },
        { type: 'link_end' },
        { type: 'paragraph_end' },
      ]);
    });
    it('allow escpaed [ and ] inside text', assert => {
      assert.deepEqual(parse('[\\[\\]](url)'), [
        { type: 'paragraph_start' },
        { type: 'link_start', href: 'url', title: '' },
        { type: 'text', value: '[]' },
        { type: 'link_end' },
        { type: 'paragraph_end' },
      ]);
    });
    it('do not allow inline spans inside text', assert => {
      assert.deepEqual(parse('![foo*bar*quz](url)'), [
        { type: 'paragraph_start' },
        { type: 'image', src: 'url', alt: 'foo*bar*quz', title: '' },
        { type: 'paragraph_end' },
      ]);
    });
  });
  describe(`image`, it => {
    it('expect text, url and title', assert => {
      assert.deepEqual(parse('![text](url "title")'), [
        { type: 'paragraph_start' },
        { type: 'image', src: 'url', alt: 'text', title: 'title' },
        { type: 'paragraph_end' },
      ]);
    });
  });
  describe(`inline comment`, it => {
    it(`treat inline HTML comment as regular comment`, assert => {
      assert.deepEqual(parse('![text](url "title")<!-- comment -->'), [
        { type: 'paragraph_start' },
        { type: 'image', src: 'url', alt: 'text', title: 'title' },
        { type: 'comment', value: 'comment' },
        { type: 'paragraph_end' },
      ]);
    });
  });
  describe(`text`, it => {
    it('convert HTML entities', assert => {
      assert.deepEqual(parse('foo&#160;bar'), [
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo\u00A0bar' },
        { type: 'paragraph_end' },
      ]);
      assert.deepEqual(parse('\\\\'), [
        { type: 'paragraph_start' },
        { type: 'text', value: '\\' },
        { type: 'paragraph_end' },
      ]);
    });
  });
  describe(`escape`, it => {
    it('treat escaped characters as regular characters', assert => {
      assert.deepEqual(parse('\\`foo\\`'), [
        { type: 'paragraph_start' },
        { type: 'text', value: '`foo`' },
        { type: 'paragraph_end' },
      ]);
      assert.deepEqual(parse('\\\\'), [
        { type: 'paragraph_start' },
        { type: 'text', value: '\\' },
        { type: 'paragraph_end' },
      ]);
    });
  });
});
