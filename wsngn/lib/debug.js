import { Console } from 'console';
import colorize from '../lib/colorize.js';

const minLevel = process.env.DEBUG;

const levels = /** @type {const} */ (['error', 'warn', 'info', 'debug']);
/** @typedef {typeof levels[number]} Level */

const console = new Console({
  stdout: process.stdout,
  inspectOptions: {
    maxStringLength: 80,
    maxArrayLength: 10,
    depth: 3,
  },
});

const emptyFn = () => undefined;

/** @type {{[level in Level]: string}} */
const labels = {
  error: colorize('error', 'red'),
  warn: colorize(' warn', 'yellow'),
  info: colorize(' info', 'blue'),
  debug: colorize('debug', 'grey'),
};

/** @type {{
 *   [level in Level]: (...args: any[]) => void
 *  } & {
 *   level?: Level;
 * }} */
const debug = {
  error: emptyFn,
  warn: emptyFn,
  info: emptyFn,
  debug: emptyFn,
};

if (minLevel) {
  for (const level of levels) {
    debug[level] = (data, ...args) => {
      if (typeof data === 'string') {
        data = labels[level] + ' ' + data;
      } else {
        args.unshift(data);
        data = labels[level];
      }
      console[level](data, ...args);
    };
    debug.level = level;
    if (minLevel === level) break;
  }
}

export default debug;
