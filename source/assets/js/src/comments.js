/** @type {(n: number, ...forms: string[]) => string} */
const plural = function (n, ...forms) {
  return forms[n === 1 ? 0 : 1];
};

const el = document.querySelector('[data-issue-id]');
if (el instanceof HTMLElement) {
  const issueId = el.dataset.issueId;
  fetch(`https://api.github.com/repos/eprev/eprev.org/issues/${issueId}`, {
    headers: new Headers({
      Accept: 'application/vnd.github.v3.text+json',
    }),
  }).then((response) => {
    if (response.status === 200) {
      response.json().then((json) => {
        const comments = json.comments;
        if (comments) {
          const html = `There ${plural(comments, 'is', 'are')} <a
                href="https://github.com/eprev/eprev.org/issues/${issueId}"
                data-goatcounter-click="Comments"
                data-goatcounter-referrer="${location.pathname}"
              >${comments} ${plural(
            comments,
            'comment',
            'comments',
          )}</a> on this (visit the post’s issue page on GitHub).`;
          const textEl = el.querySelector('.post-comments__text');
          if (textEl) {
            textEl.innerHTML = html;
          }
        }
      });
    }
  });
}
