import { inspect } from 'util';

const colors = inspect.colors;

/** @type {(text: string, color: string) => string} */
const colorize = process.stdout.isTTY
  ? function colorize(text, color) {
      const codes = colors[color];
      if (codes) {
        const [setCode, resetCode] = codes;
        return `\u001b[${setCode}m${text}\u001b[${resetCode}m`;
      } else {
        return text;
      }
    }
  : (text) => text;

export default colorize;
