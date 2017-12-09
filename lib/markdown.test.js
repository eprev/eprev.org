const describe = require('./describe');

describe(`markdown`, it => {
  const parse = require('./markdown').parse;

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
        { type: 'code_start' },
        { type: 'text', value: 'foo();\n\nbar();' },
        { type: 'code_end' },
      ]);
    });
  });

  describe(`fenced code`, it => {
    it('require three ` character', assert => {
      assert.deepEqual(parse('```\nfoo();\n\nbar();\n```'), [
        { type: 'code_start', lang: '' },
        { type: 'text', value: 'foo();\n\nbar();' },
        { type: 'code_end', lang: '' },
      ]);
    });
    it('allow language identifier', assert => {
      assert.deepEqual(parse('```js\nfoo();\n```'), [
        { type: 'code_start', lang: 'js' },
        { type: 'text', value: 'foo();' },
        { type: 'code_end', lang: 'js' },
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
    it(`require one > character`, assert => {
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
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'bullet' },
      ]);
    });
    it(`take *, + or - as bullet marker`, assert => {
      assert.deepEqual(parse('- foo\n\n  + bar\n\n* qux'), [
        { type: 'list_start', style: 'bullet' }, // - foo
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'list_start', style: 'bullet' }, // ..+ bar
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'bar' },
        { type: 'paragraph_end' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'bullet' },
        { type: 'list_item_end' },
        { type: 'list_item_start' }, // - qux
        { type: 'paragraph_start' },
        { type: 'text', value: 'qux' },
        { type: 'paragraph_end' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'bullet' },
      ]);
    });
    it(`may contain blocks separated by more than one blank line`, assert => {
      assert.deepEqual(parse('- foo\n  bar\n\n- qux\n\nquz'), [
        { type: 'list_start', style: 'bullet' },
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo\nbar' },
        { type: 'paragraph_end' },
        { type: 'list_item_end' },
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'qux' },
        { type: 'paragraph_end' },
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
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'bullet' },
        { type: 'code_start', lang: '' },
        { type: 'text', value: 'bar();' },
        { type: 'code_end', lang: '' },
      ]);
    });
    it(`may contain other blocks`, assert => {
      assert.deepEqual(parse('+ foo\n\n  ```\n  bar();\n  ```'), [
        { type: 'list_start', style: 'bullet' },
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'code_start', lang: '' },
        { type: 'text', value: 'bar();' },
        { type: 'code_end', lang: '' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'bullet' },
      ]);
      assert.deepEqual(parse('+ foo\n\n  ```\n    bar();\n  ```'), [
        { type: 'list_start', style: 'bullet' },
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'code_start', lang: '' },
        { type: 'text', value: '  bar();' },
        { type: 'code_end', lang: '' },
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
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'ordered' },
      ]);
    });
    it(`take a number followed by . or ) as bullet marker`, assert => {
      assert.deepEqual(parse('1. foo\n\n   1) bar\n\n2. qux'), [
        { type: 'list_start', style: 'ordered' }, // 1. foo
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'list_start', style: 'ordered' }, // ..1) bar
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'bar' },
        { type: 'paragraph_end' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'ordered' },
        { type: 'list_item_end' },
        { type: 'list_item_start' }, // 2. qux
        { type: 'paragraph_start' },
        { type: 'text', value: 'qux' },
        { type: 'paragraph_end' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'ordered' },
      ]);
    });
    it(`may contain blocks separated by more than one blank line`, assert => {
      assert.deepEqual(parse('1. foo\n   bar\n\n2. qux\n\nquz'), [
        { type: 'list_start', style: 'ordered' },
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo\nbar' },
        { type: 'paragraph_end' },
        { type: 'list_item_end' },
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'qux' },
        { type: 'paragraph_end' },
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
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'ordered' },
        { type: 'code_start', lang: '' },
        { type: 'text', value: 'bar();' },
        { type: 'code_end', lang: '' },
      ]);
    });
    it(`may contain other blocks`, assert => {
      assert.deepEqual(parse('1. foo\n\n   ```\n   bar();\n   ```'), [
        { type: 'list_start', style: 'ordered' },
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'code_start', lang: '' },
        { type: 'text', value: 'bar();' },
        { type: 'code_end', lang: '' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'ordered' },
      ]);
      assert.deepEqual(parse('1. foo\n\n   ```\n     bar();\n   ```'), [
        { type: 'list_start', style: 'ordered' },
        { type: 'list_item_start' },
        { type: 'paragraph_start' },
        { type: 'text', value: 'foo' },
        { type: 'paragraph_end' },
        { type: 'code_start', lang: '' },
        { type: 'text', value: '  bar();' },
        { type: 'code_end', lang: '' },
        { type: 'list_item_end' },
        { type: 'list_end', style: 'ordered' },
      ]);
    });
  });

  describe(`inline emphasis`, it => {
    it(`treats * and _ as indicators of emphasis`, assert => {
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
    it(`treats ** and __ as indicators of strong emphasis`, assert => {
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
});
