import describe from './describe.js';

import parse from './properties.js';

describe(`properties`, (it) => {
  describe(`dictionary`, (it) => {
    it('treat : as key-value separator', (assert) => {
      assert.deepEqual(parse('foo: bar\neof: true\nquz: 1'), {
        foo: 'bar',
        eof: true,
        quz: 1,
      });
    });
    it('ignore spaces between key and value', (assert) => {
      assert.deepEqual(parse('foo  :  bar'), {
        foo: 'bar',
      });
    });
  });

  describe(`multi-line values`, (it) => {
    it('support multi-line text', (assert) => {
      assert.deepEqual(parse('greeting:\n  hello\n  world\neof: true'), {
        greeting: 'hello world',
        eof: true,
      });
    });
    it('support lists', (assert) => {
      assert.deepEqual(parse('tags:\n  - foo\n  - bar\neof: true'), {
        tags: ['foo', 'bar'],
        eof: true,
      });
    });
    it('support nested structures', (assert) => {
      assert.deepEqual(
        parse(
          'user:\n first-name: Alice\n last-name: Cooper\n byname:\n  - Fox\n  - Wolf\neof: true',
        ),
        {
          user: {
            'first-name': 'Alice',
            'last-name': 'Cooper',
            byname: ['Fox', 'Wolf'],
          },
          eof: true,
        },
      );
    });
  });
});
