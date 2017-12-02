const suites = [];

const colors = require('util').inspect.colors;
const assert = require('assert');
const failed = [];
let tests = 0;
let skipped = 0;

const colorize = process.stdout.isTTY
  ? (text, color) => {
      if (color in colors) {
        const [setCode, resetCode] = colors[color];
        return `\u001b[${setCode}m${text}\u001b[${resetCode}m`;
      } else {
        return text;
      }
    }
  : text => text;

module.exports = function describe(name, suiteFn) {
  if (suites.length === 0) {
    console.time('Time');
  }
  if (name) {
    suites.push(name);
    suiteFn(it);
    suites.pop();
  } else {
    skipped++;
  }
  if (suites.length === 0) {
    if (tests) {
      process.stdout.write('\n');
    }
    failed.forEach(test => {
      console.log(`
${test.suite} ${test.name}: expected ${JSON.stringify(
        test.error.expected,
      )} but got ${JSON.stringify(test.error.actual)}:
${test.error.stack}`);
    });
    console.log(
      `Tests: ${tests}, Failed: ${failed.length}, Skipped: ${skipped}`,
    );
    console.timeEnd('Time');
  }
};

function it(name, testFn) {
  if (name) {
    tests++;
    try {
      testFn(assert);
      process.stdout.write(colorize('.', 'green'));
    } catch (error) {
      if (error.code === 'ERR_ASSERTION') {
        process.stdout.write(colorize('F', 'red'));
        failed.push({
          suite: suites.join(': '),
          name,
          error,
        });
      } else {
        throw error;
      }
    }
  } else {
    skipped++;
  }
}
