import describe from './describe.js';

import dateFormat from './date-format.js';

describe(`date-format`, (it) => {
  const date = new Date(Date.UTC(2000, 0, 2, 3, 4, 5));
  it('expect UTC dates', (assert) => {
    assert.deepEqual(
      dateFormat(date, 'DD.MM.YYYY hh:mm:ss'),
      '02.01.2000 03:04:05',
    );
    assert.deepEqual(dateFormat(date, 'M/D/YYYY h:m:s'), '1/2/2000 3:4:5');
  });
  it('format day of week and month', (assert) => {
    assert.deepEqual(dateFormat(date, '%D, D %M'), 'Sun, 2 Jan');
    assert.deepEqual(dateFormat(date, '%DD, D %MM'), 'Sunday, 2 January');
  });
});
