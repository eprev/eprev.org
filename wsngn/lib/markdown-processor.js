/** @typedef {import('./markdown.js').Token} Token */

/** @type {(tokens: Token[]) => [{title?: string}, Token[]]} */
export default function processMarkdown(tokens) {
  const info = {};
  // Extract title
  const headingStartIndex = tokens.findIndex((t) => t.type === 'heading_start');
  if (headingStartIndex >= 0) {
    const headingToken = tokens[headingStartIndex + 1];
    if (headingToken.type === 'text') {
      info.title = headingToken.value;
      const headingEndIndex = tokens.findIndex((t) => t.type === 'heading_end');
      tokens = tokens.slice(headingEndIndex + 1);
    }
  }
  return [info, tokens];
}
