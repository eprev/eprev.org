import { inspect } from 'util';

// https://nodejs.org/api/util.html#foreground-colors
const colors = inspect.colors;

/** @typedef {"black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" |
 *  "gray" | "grey" | "blackBright" | "redBright" | "greenBright" | "yellowBright" |
 *  "blueBright" | "magentaBright" | "cyanBright" | "whiteBright"} FgColor */

/** @typedef {"bgBlack" | "bgRed" | "bgGreen" | "bgYellow" | "bgBlue" | "bgMagenta" | "bgCyan" |
 * "bgWhite" | "bgGray" | "bgGrey" | "bgBlackBright" | "bgRedBright" | "bgGreenBright" |
 * "bgYellowBright" | "bgBlueBright" | "bgMagentaBright" | "bgCyanBright" | "bgWhiteBright"} BgColor */

/** @type {(text: string, color: FgColor | BgColor) => string} */
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
