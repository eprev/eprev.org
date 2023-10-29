import { inspect } from 'util';
import assert, { AssertionError } from 'assert';

/** @typedef {typeof assert} AssertFn */
/** @typedef {(name: string, testFn: (assert: AssertFn) => void) => void} TestFn */
/** @typedef {(it: TestFn) => void} SuitFn */

/** @type {string[]} */
const suites = [];

/** @type {{
 *   suite: string,
 *   name: string,
 *   error: AssertionError,
 * }[]}
 */
const failed = [];

let tests = 0;
let skipped = 0;

import colorize from './colorize.js';

/**
 * @param {any} o
 */
function pretty(o) {
  return inspect(o, { colors: true })
    .replace(/^\[ /, '[\n  ')
    .replace(/ \]$/, '\n]');
}

/** @type {(name: string, suiteFn: SuitFn) => void} */
export default function describe(name, suiteFn) {
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
    failed.forEach((test) => {
      console.log(
        test.suite +
          ' ' +
          test.name +
          ': expected ' +
          pretty(test.error.expected) +
          ' but got ' +
          pretty(test.error.actual) +
          '\n' +
          test.error.stack?.replace(test.error.message, '') +
          '\n',
      );
    });
    console.log(
      `Tests: ${tests}, Failed: ${failed.length}, Skipped: ${skipped}`,
    );
    console.timeEnd('Time');
  }
}

/** @type {TestFn} */
function it(name, testFn) {
  if (name) {
    tests++;
    try {
      testFn(assert);
      process.stdout.write(colorize('.', 'green'));
    } catch (error) {
      if (error instanceof AssertionError && error.code === 'ERR_ASSERTION') {
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
