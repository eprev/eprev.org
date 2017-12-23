const inspect = require('util').inspect;
const colors = inspect.colors;
module.exports = process.stdout.isTTY
  ? (text, color) => {
      if (color in colors) {
        const [setCode, resetCode] = colors[color];
        return `\u001b[${setCode}m${text}\u001b[${resetCode}m`;
      } else {
        return text;
      }
    }
  : text => text;


