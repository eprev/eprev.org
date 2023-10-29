import { dateFormat } from '@eprev/wsngn';
import assert from 'assert';

/** @param {string} content */
function timeToRead(content) {
  let words = 0;
  const text = content.replace(/<svg.*?<\/svg>/gs, (m) => {
    words += Math.trunc(m.length / 80);
    return '';
  });
  words += text.split(/\s+/).length;
  if (words > 360) {
    return ` ∙ ${Math.trunc(words / 180)} minutes read`;
  } else {
    return '';
  }
}

/** @type {import('@eprev/wsngn').TemplateFunction} */
export default async ({ html, render, post: _post }) => {
  const post = /** @type {import('@eprev/wsngn').Document} */ (_post);
  assert(post.content !== undefined);
  assert(post.date instanceof Date);

  return html`
  <div class="post">
    <h${post.headingLevel || 1} class="post__header">
    ${
      post.headingLink
        ? `<a href="${post.pathname}">${post.title}</a>`
        : post.title
    }
    </h${post.headingLevel || 1}>
    <div class="post__meta">
      ${dateFormat(post.date, '%MM D, YYYY')}
      ${timeToRead(post.content)}
      ${
        Array.isArray(post.tags)
          ? html` ∙
            ${post.tags
              .map((tag) => {
                return `<a href="/tags/${tag}/">${tag}</a>`;
              })
              .join(', ')}`
          : ''
      }
    </div>
    <div class="post__content">
      ${
        post.draft
          ? `<p><strong>Note: This is a draft document. Do not share it, this web address will change.</strong></p>`
          : ''
      }
      ${post.excerpt || post.content}
      ${
        post.excerpt
          ? html` <div class="post__read-more">
              <a
                href="${post.pathname}"
                data-goatcounter-click="Read More"
                data-goatcounter-referrer="${post.pathname}"
                >Continue reading</a
              >
              &rsaquo;
            </div>`
          : ''
      }
    </div>
  </div>`;
};
