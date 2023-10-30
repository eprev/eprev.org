/** @type {import('@eprev/wsngn').TemplateFunction} */
export default ({ html, render, page, read, site: _site }) => {
  /** @typedef {import('../config.js').ConfigSite} ConfigSite */
  const site = /** @type {import('@eprev/wsngn').Site<ConfigSite>} */ (_site);
  const post = /** @type {import('@eprev/wsngn').Document} */ (page);
  return html` ${render('includes/header')}
  ${render('includes/post', {
    post,
  })}
  ${post.ghIssueId
    ? html` <div class="post-comments" data-issue-id="${post.ghIssueId}">
        <span class="post-comments__icon">${read('./icons/comments.svg')}</span>
        <span class="post-comments__text">
          Want to leave a comment on this? Visit
          <a
            href="https://github.com/eprev/eprev.org/issues/${post.ghIssueId}"
            data-goatcounter-click="Comments"
            data-goatcounter-referrer="${post.pathname}"
            >the&#160;post’s&#160;issue&#160;page</a
          >
          on GitHub.
        </span>
      </div>`
    : ''}
  ${site.config.editUrl
    ? html`<div class="post-footer">
        <a
          href="${site.config.editUrl}${post.__name__}"
          data-goatcounter-click="Edit"
          data-goatcounter-referrer="${post.pathname}"
          >Edit</a
        >
        this post on GitHub.
      </div>`
    : ''}
  ${render('includes/footer')}`;
};
