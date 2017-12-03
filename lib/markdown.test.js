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
    it(`except 4 space indent`, assert => {
      assert.deepEqual(parse('    foo();\n    bar();\n\n'), [
        { type: 'code_start' },
        { type: 'text', value: 'foo();\nbar();' },
        { type: 'code_end' },
      ]);
    });
  });

  describe(`fenced code`, it => {
    it('require three ` character', assert => {
      assert.deepEqual(parse('```\nfoo();\nbar();\n```'), [
        { type: 'code_start', lang: '' },
        { type: 'text', value: 'foo();\nbar();' },
        { type: 'code_end', lang: '' },
      ]);
    });
    it('allow language identifier', assert => {
      assert.deepEqual(parse('```js\nfoo();```'), [
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
});
