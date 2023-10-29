/** @typedef {{
 *   [key: string]: number | boolean | string | string[] | Properties
 * }} Properties
 */
/** @type {(s?: string, options?: {transform?: boolean}) => Properties | undefined } */
export default function properties(s, { transform = false } = {}) {
  return s?.split(/\n+(?=\S|$)/g).reduce(
    /** @param {Properties} acc */
    (acc, line) => {
      if (line) {
        const col = line.indexOf(':');

        let key = line.slice(0, col).replace(/ +$/, '');

        /** @type {Properties[string]} */
        let value = line.slice(col + 1).replace(/^ +/, '');

        // At this point the value can be a list, a dictionary or multi-line text
        if (value.startsWith('\n')) {
          // Check whether the value is a dictionary
          const propMatch = value.match(/\n+( +)\S+:/);
          if (propMatch) {
            const indent = propMatch[1];
            const props = properties(
              value.replace(new RegExp('\n' + indent, 'g'), '\n'),
            );
            if (props !== undefined) {
              value = props;
            }
          } else {
            // At this point the value can be a list or multi-line text
            const values = value.split(/\n+ +- +/);
            if (values.length === 1) {
              // If not a list, then concatenate lines
              value = value.replace(/\n */g, ' ').replace(/^ +/, '');
            } else {
              // Return the list (drop the empty line)
              value = values.slice(1);
            }
          }
        } else {
          if (value === 'true') {
            value = true;
          } else if (value === 'false') {
            value = false;
          } else {
            const n = Number(value);
            if (!isNaN(n)) {
              value = n;
            }
          }
        }
        if (transform) {
          key = key.replace(/-(.)/g, (_, ch) => ch.toUpperCase());
        }
        acc[key] = value;
      }
      return acc;
    },
    {},
  );
}
