const describe = require("./describe");

describe(`parser`, it => {
  const parse = require("./markdown").parse;

  it(`doesn't returns anything`, assert => {
    assert.equal(parse("hello"), undefined);
  });
});
